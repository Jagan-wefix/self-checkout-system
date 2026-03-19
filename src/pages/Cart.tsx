import { useCart } from '../context/CartContext';
import { ArrowLeft, Trash2, ShoppingCart } from 'lucide-react';

interface CartProps {
  onBack: () => void;
  onProceedToPayment: () => void;
}

export const Cart = ({ onBack, onProceedToPayment }: CartProps) => {
  const { cart, removeFromCart, getTotalPrice } = useCart();

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="bg-gray-800 text-white p-4 shadow-md">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1 hover:bg-orange-700 rounded">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold">Shopping Cart</h1>
        </div>
      </div>

      <div className="p-4 max-w-md mx-auto">
        {cart.length === 0 ? (
          <div className="bg-gray-800 rounded-lg shadow-md p-8 text-center">
            <ShoppingCart size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-300 mb-2">Your cart is empty</p>
            <p className="text-sm text-gray-400">Scan products to add them to your cart</p>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-4">
              {cart.map((product) => (
                <div key={product.id} className="bg-gray-800 rounded-lg shadow-md p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">{product.name}</h3>
                      <p className="text-sm text-gray-300 mt-1">{product.description}</p>
                      <p className="text-xs text-gray-400 mt-1">ID: {product.id}</p>
                    </div>
                    <button
                      onClick={() => removeFromCart(product.id)}
                      className="ml-4 p-2 text-red-600 hover:bg-red-700 rounded transition"
                      aria-label="Remove from cart"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <p className="text-lg font-bold text-orange-400">${product.price.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gray-800 rounded-lg shadow-md p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-300">Subtotal</span>
                <span className="font-semibold">${getTotalPrice().toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-300">Tax</span>
                <span className="font-semibold">$0.00</span>
              </div>
              <div className="pt-2 border-t border-gray-700">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">Total</span>
                  <span className="text-xl font-bold text-orange-400">${getTotalPrice().toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={onProceedToPayment}
                className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 transition"
              >
                Proceed to Payment
              </button>
              <button
                onClick={onBack}
                className="w-full bg-gray-700 text-gray-200 py-3 rounded-lg font-semibold hover:bg-gray-600 transition"
              >
                Continue Shopping
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
