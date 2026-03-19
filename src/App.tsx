import { useState } from 'react';
import { CartProvider } from './context/CartContext';
import { Home } from './pages/Home';
import { Scanner } from './pages/Scanner';
import { Cart } from './pages/Cart';
import { Payment } from './pages/Payment';

type Page = 'home' | 'scanner' | 'cart' | 'payment';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');

  return (
    <CartProvider>
      <div className="dark">
      {currentPage === 'home' && (
        <Home
          onNavigateToScanner={() => setCurrentPage('scanner')}
          onNavigateToCart={() => setCurrentPage('cart')}
        />
      )}
      {currentPage === 'scanner' && (
        <Scanner onBack={() => setCurrentPage('home')} />
      )}
      {currentPage === 'cart' && (
        <Cart
          onBack={() => setCurrentPage('home')}
          onProceedToPayment={() => setCurrentPage('payment')}
        />
      )}
      {currentPage === 'payment' && (
        <Payment onSuccess={() => setCurrentPage('home')} />
      )}
      </div>
    </CartProvider>
  );
}

export default App;
