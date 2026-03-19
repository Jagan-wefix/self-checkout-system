import { useEffect, useRef, useState } from 'react';
import { useCart } from '../context/CartContext';
import { CheckCircle, Loader2, Smartphone } from 'lucide-react';

const API_URL = 'http://localhost:3001';

interface PaymentProps {
  onSuccess: () => void;
}

export const Payment = ({ onSuccess }: PaymentProps) => {
  const { cart, getTotalPrice, clearCart } = useCart();
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upiId, setUpiId] = useState<string>('merchant@upi');
  const [paymentInitiated, setPaymentInitiated] = useState(false);
  const [polling, setPolling] = useState(false);
  const pollingRef = useRef<number | null>(null);

  useEffect(() => {
    // Load the merchant UPI ID from the backend settings (configurable)
    fetch(`${API_URL}/api/settings/merchant-upi`)
      .then(res => res.json())
      .then(data => {
        if (data && data.merchant_upi_id) {
          setUpiId(data.merchant_upi_id);
        }
      })
      .catch(err => {
        console.warn('Failed to fetch merchant UPI ID, using fallback', err);
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

        {!paymentInitiated ? (
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
          This is a prototype UPI payment integration.
        </p>
      </div>
    </div>
  );
};
