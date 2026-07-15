import { useEffect, useRef, useState } from 'react';
import { useCart } from '../context/CartContext';
import { CheckCircle, Loader2, Smartphone, CreditCard } from 'lucide-react';
import { markProductsAsPaid } from '../lib/firebaseService';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface PaymentProps {
  onSuccess: () => void;
}

interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  key_id: string;
  productIds: string[];
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const Payment = ({ onSuccess }: PaymentProps) => {
  const { cart, getTotalPrice, clearCart } = useCart();
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upiId, setUpiId] = useState<string>('merchant@upi');
  const [paymentInitiated, setPaymentInitiated] = useState(false);
  const [polling, setPolling] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'upi' | null>(null);
  const [razorpayReady, setRazorpayReady] = useState(false);
  const pollingRef = useRef<number | null>(null);

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      setRazorpayReady(true);
    };
    script.onerror = () => {
      console.warn('Failed to load Razorpay script');
    };
    document.head.appendChild(script);

    // Load the merchant UPI ID from config file
    fetch('/config.json')
      .then(res => res.json())
      .then(data => {
        if (data && data.merchant_upi_id) {
          setUpiId(data.merchant_upi_id);
        }
      })
      .catch(err => {
        console.warn('Failed to fetch UPI ID config, using fallback', err);
      });

    return () => {
      if (pollingRef.current !== null) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  const generateUPILink = () => {
    const total = getTotalPrice();
    return `upi://pay?pa=${upiId}&pn=SmartStore&am=${total}&cu=INR`;
  };

  const checkPaymentStatus = async () => {
    if (cart.length === 0) return false;

    try {
      const results = await Promise.all(
        cart.map(async item => {
          if (!item.rfid_uid) return false;

          const res = await fetch(`${API_URL}/api/rfid/check/${encodeURIComponent(item.rfid_uid)}`);
          if (!res.ok) return false;

          const data = await res.json();
          return data.status === 'ALLOW';
        })
      );

      return results.every(Boolean);
    } catch {
      return false;
    }
  };

  const beginPollingPaymentStatus = () => {
    if (pollingRef.current) return;

    setPolling(true);
    pollingRef.current = window.setInterval(async () => {
      const paid = await checkPaymentStatus();
      if (paid) {
        if (pollingRef.current !== null) {
          clearInterval(pollingRef.current);
        }
        setPolling(false);
        
        // Mark products as paid in Firebase
        try {
          const productIds = cart.map(item => item.id);
          await markProductsAsPaid(productIds);
          console.log('Products marked as paid in Firebase');
        } catch (error) {
          console.error('Error marking products as paid:', error);
        }
        
        setSuccess(true);
        clearCart();
        setTimeout(() => onSuccess(), 2000);
      }
    }, 2500);
  };

  const handleUPIPayment = () => {
    const upiLink = generateUPILink();
    window.open(upiLink, '_blank');
    setPaymentInitiated(true);
    beginPollingPaymentStatus();
  };

  const handleRazorpayPayment = async () => {
    if (!window.Razorpay) {
      setError('Razorpay is not available. Please try again later.');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const productIds = cart.map(item => item.id);
      const amount = getTotalPrice();

      // Create order
      const orderResponse = await fetch(`${API_URL}/api/razorpay/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          productIds,
          description: 'Self Billing System Purchase',
        }),
      });

      if (!orderResponse.ok) {
        throw new Error('Failed to create order');
      }

      const orderData: { order: RazorpayOrder } = await orderResponse.json();
      const order = orderData.order;

      const options = {
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: 'Self Billing System',
        description: 'Product Payment',
        order_id: order.id,
        handler: async (response: any) => {
          try {
            // Verify payment
            const verifyResponse = await fetch(`${API_URL}/api/razorpay/verify-payment`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                productIds,
              }),
            });

            if (!verifyResponse.ok) {
              throw new Error('Payment verification failed');
            }

            const verifyData = await verifyResponse.json();
            
            if (verifyData.success) {
              setSuccess(true);
              clearCart();
              setTimeout(() => onSuccess(), 2000);
            }
          } catch (err) {
            console.error('Payment verification error:', err);
            setError('Payment verification failed. Please contact support.');
            setProcessing(false);
          }
        },
        prefill: {
          name: 'Customer',
          email: 'customer@example.com',
          contact: '9999999999',
        },
        theme: {
          color: '#3b82f6',
        },
        modal: {
          ondismiss: () => {
            setProcessing(false);
            setPaymentInitiated(false);
            setPaymentMethod(null);
            setError('Payment cancelled');
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      setProcessing(false);
    } catch (err) {
      console.error('Razorpay error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setProcessing(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (cart.length === 0) {
      setError('Cart is empty');
      return;
    }

    setProcessing(true);
    setError(null);

    const paid = await checkPaymentStatus();

    setProcessing(false);

    if (paid) {
      setSuccess(true);
      clearCart();
      setTimeout(() => onSuccess(), 2000);
      return;
    }

    setError('Payment not confirmed yet. Please complete the payment in your UPI app.');
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="bg-gray-800 text-white p-4 shadow-md">
        <h1 className="text-xl font-bold text-center">Payment</h1>
      </div>

      <div className="p-4 max-w-md mx-auto">
        <div className="bg-gray-800 rounded-lg shadow-md p-6 mb-4">
          <h2 className="text-lg font-bold text-white mb-4">Order Summary</h2>

          <div className="space-y-2 mb-4">
            {cart.map((product) => (
              <div key={product.id} className="flex justify-between text-sm">
                <span className="text-gray-300">{product.name}</span>
              <span className="font-semibold">₹{product.price.toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-gray-700">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold">Total</span>
              <span className="text-2xl font-bold text-orange-400">₹{getTotalPrice().toFixed(2)}</span>
            </div>
          </div>
        </div>

        {!paymentInitiated && !success ? (
          <div className="space-y-4">
            {/* Razorpay Option */}
            {razorpayReady && (
              <div className="bg-gray-800 rounded-lg shadow-md p-6 mb-4">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <CreditCard size={20} />
                  Pay with Razorpay
                </h3>

                <p className="text-sm text-gray-300 mb-4">
                  Fast and secure payment with card, wallet, or UPI
                </p>

                <button
                  onClick={handleRazorpayPayment}
                  disabled={processing}
                  className="w-full bg-blue-500 text-white py-4 rounded-lg font-bold hover:bg-blue-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard size={20} />
                      Pay ₹{getTotalPrice().toFixed(2)} with Razorpay
                    </>
                  )}
                </button>
              </div>
            )}

            {/* UPI Option */}
            <div className="bg-gray-800 rounded-lg shadow-md p-6 mb-4">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Smartphone size={20} />
                Pay with UPI
              </h3>

              <p className="text-sm text-gray-300 mb-4">
                Click the button below to open your UPI app and complete the payment.
              </p>

              <button
                onClick={handleUPIPayment}
                className="w-full bg-green-500 text-white py-4 rounded-lg font-bold hover:bg-green-600 transition flex items-center justify-center gap-2"
              >
                <Smartphone size={20} />
                Pay ₹{getTotalPrice().toFixed(2)} with UPI
              </button>
            </div>
          </div>
        ) : success ? (
          <div className="bg-gray-800 rounded-lg shadow-md p-6 mb-4 text-center">
            <div className="mb-4">
              <CheckCircle size={48} className="mx-auto text-green-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Payment Confirmed!</h3>
            <p className="text-sm text-gray-300">Your products have been marked as PAID</p>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg shadow-md p-6 mb-4">
            <h3 className="font-semibold text-white mb-4">Payment Initiated</h3>

            <p className="text-sm text-gray-300 mb-4">
              Complete the payment in your UPI app, then click the button below to confirm.
            </p>

            <button
              onClick={handleConfirmPayment}
              disabled={processing}
              className="w-full bg-blue-500 text-white py-4 rounded-lg font-bold hover:bg-blue-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Checking payment...
                </>
              ) : polling ? (
                'Checking payment (auto)...'
              ) : (
                'I Have Completed Payment'
              )}
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-900 text-red-300 p-4 rounded-lg mb-4">
            {error}
          </div>
        )}

        <p className="text-xs text-gray-400 text-center mt-4">
          {razorpayReady 
            ? 'Both Razorpay and UPI payment methods are available.'
            : 'UPI payment method is available. Razorpay will be available shortly.'}
        </p>
      </div>
    </div>
  );
};
