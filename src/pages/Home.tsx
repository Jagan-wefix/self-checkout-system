import { useCart } from '../context/CartContext';
import { QrCode, ShoppingCart, Package } from 'lucide-react';

interface HomeProps {
  onNavigateToScanner: () => void;
  onNavigateToCart: () => void;
}

export const Home = ({ onNavigateToScanner, onNavigateToCart }: HomeProps) => {
  const { cart } = useCart();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black">
      <div className="bg-gray-800 shadow-md">
        <div className="max-w-md mx-auto p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Package size={28} className="text-orange-400" />
            <h1 className="text-xl font-bold text-white">Smart Retail</h1>
          </div>
          <button
            onClick={onNavigateToCart}
            className="relative p-2 hover:bg-gray-700 rounded-full transition"
            aria-label="Shopping cart"
          >
            <ShoppingCart size={24} className="text-gray-300" />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {cart.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto p-6 pt-12">
        <div className="text-center text-white mb-12">
          <h2 className="text-3xl font-bold mb-3">Welcome to Smart Self-Billing</h2>
          <p className="text-gray-300">Scan, shop, and pay instantly</p>
        </div>

        <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 mb-6">
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-orange-700 rounded-full mb-4">
              <QrCode size={48} className="text-orange-600" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Scan Products</h3>
            <p className="text-gray-300">Point your camera at product QR codes to add them to your cart</p>
          </div>

          <button
            onClick={onNavigateToScanner}
            className="button"
          >
            Start Scanning
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-800/40 backdrop-blur-sm rounded-lg p-4 text-center text-white">
            <p className="text-2xl font-bold mb-1">1</p>
            <p className="text-xs">Scan QR</p>
          </div>
          <div className="bg-gray-800/40 backdrop-blur-sm rounded-lg p-4 text-center text-white">
            <p className="text-2xl font-bold mb-1">2</p>
            <p className="text-xs">Add to Cart</p>
          </div>
          <div className="bg-gray-800/40 backdrop-blur-sm rounded-lg p-4 text-center text-white">
            <p className="text-2xl font-bold mb-1">3</p>
            <p className="text-xs">Pay & Go</p>
          </div>
        </div>

        <div className="bg-gray-800/40 backdrop-blur-sm rounded-lg p-4 text-white text-sm">
          <h4 className="font-semibold mb-2">How it works:</h4>
          <ul className="space-y-1 text-orange-50">
            <li>• Scan product QR codes using your camera</li>
            <li>• Products are added to your cart automatically</li>
            <li>• Complete payment securely</li>
            <li>• RFID lock verifies payment and unlocks products</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
