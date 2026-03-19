import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useCart } from '../context/CartContext';
import { ArrowLeft, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { products } from '../../server/products';

interface ScannerProps {
  onBack: () => void;
}

export const Scanner = ({ onBack }: ScannerProps) => {
  const { addToCart } = useCart();
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerInitialized = useRef(false);

  useEffect(() => {
    if (scannerInitialized.current) return;
    scannerInitialized.current = true;

    const qrcodeRegionId = 'qr-reader';
    html5QrCodeRef.current = new Html5Qrcode(qrcodeRegionId);

    return () => {
      if (html5QrCodeRef.current?.isScanning) {
        html5QrCodeRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const startScanning = async () => {
    if (!html5QrCodeRef.current) return;

    try {
      setScanning(true);
      setMessage(null);

      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        async (decodedText) => {
          if (decodedText.startsWith('PROD-')) {
            await handleScan(decodedText);
          } else {
            setMessage({ type: 'error', text: 'Invalid QR code format. Expected PROD-XXXX' });
          }
        },
        () => {
        }
      );
    } catch (err) {
      console.error('Error starting scanner:', err);
      setMessage({ type: 'error', text: 'Failed to access camera' });
      setScanning(false);
    }
  };

  const stopScanning = async () => {
    if (html5QrCodeRef.current?.isScanning) {
      await html5QrCodeRef.current.stop();
      setScanning(false);
    }
  };

  const handleScan = async (productId: string) => {
  setLoading(true);
  setMessage(null);

  try {
    // Find product from local hardcoded array
    const product = products.find((p) => p.id === productId);

    if (!product) {
      setMessage({ type: 'error', text: 'Product not found' });
      setLoading(false);
      return;
    }

    if (product.paid) {
      setMessage({ type: 'error', text: 'This product has already been paid for' });
      setLoading(false);
      return;
    }

    const added = addToCart(product);

    if (added) {
      setMessage({ type: 'success', text: `Added ${product.name} to cart` });
      await stopScanning();
    } else {
      setMessage({ type: 'error', text: 'Product already in cart' });
    }

  } catch (error) {
    console.error('Error processing product:', error);
    setMessage({ type: 'error', text: 'Something went wrong' });
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="bg-gray-800 text-white p-4 shadow-md">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1 hover:bg-gray-700 rounded">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold">Scan Product</h1>
        </div>
      </div>

      <div className="p-4 max-w-md mx-auto">
        {message && (
          <div className={`mb-4 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
          }`}>
            {message.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
            <span>{message.text}</span>
          </div>
        )}

        <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden mb-4">
          <div id="qr-reader" className={scanning ? '' : 'hidden'}></div>
          {!scanning && (
            <div className="aspect-square bg-gray-700 flex items-center justify-center">
              <p className="text-gray-500">Camera preview will appear here</p>
            </div>
          )}
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 mb-4 text-orange-600">
            <Loader2 className="animate-spin" size={20} />
            <span>Processing...</span>
          </div>
        )}

        <div className="space-y-3">
          {!scanning ? (
            <button
              onClick={startScanning}
              className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 transition"
            >
              Start Scanning
            </button>
          ) : (
            <button
              onClick={stopScanning}
              className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition"
            >
              Stop Scanning
            </button>
          )}

          <button
            onClick={onBack}
            className="w-full bg-gray-700 text-gray-200 py-3 rounded-lg font-semibold hover:bg-gray-600 transition"
          >
            Back to Home
          </button>
        </div>

        <div className="mt-6 p-4 bg-gray-800 rounded-lg">
          <h3 className="font-semibold text-orange-300 mb-2">How to use:</h3>
          <ol className="text-sm text-orange-300 space-y-1 list-decimal list-inside">
            <li>Click "Start Scanning"</li>
            <li>Point camera at product QR code</li>
            <li>Product will be added to cart automatically</li>
            <li>QR code format: PROD-XXXX</li>
          </ol>
        </div>
      </div>
    </div>
  );
};
