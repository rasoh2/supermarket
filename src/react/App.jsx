import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { CatalogProvider } from './context/CatalogContext.jsx';
import { CartProvider } from './context/CartContext.jsx';

import Navbar from './components/common/Navbar.jsx';
import Footer from './components/common/Footer.jsx';
import CatalogView from './components/catalog/CatalogView.jsx';
import AdminView from './components/admin/AdminView.jsx';
import CartDrawer from './components/cart/CartDrawer.jsx';
import CheckoutModal from './components/checkout/CheckoutModal.jsx';

function AppContent() {
  const [currentView, setCurrentView] = useState(() => {
    return window.location.hash.toLowerCase() === '#admin' ? 'admin' : 'catalog';
  });

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#admin') {
        setCurrentView('admin');
      } else {
        setCurrentView('catalog');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (view) => {
    setCurrentView(view);
    window.location.hash = view === 'admin' ? '#admin' : '#catalogo';
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      {/* Barra de Navegación Principal */}
      <Navbar currentView={currentView} onNavigate={navigateTo} />

      {/* Contenedor Principal de Vistas */}
      <main className="container flex-grow-1 py-4" id="app-main-content">
        {currentView === 'catalog' ? (
          <CatalogView />
        ) : (
          <AdminView />
        )}
      </main>

      {/* Cajón Lateral de Carrito (Offcanvas) */}
      <CartDrawer onProceedToCheckout={() => setIsCheckoutOpen(true)} />

      {/* Modal de Finalización de Compra (Checkout) */}
      <CheckoutModal 
        show={isCheckoutOpen} 
        onHide={() => setIsCheckoutOpen(false)} 
      />

      {/* Pie de Página */}
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CatalogProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </CatalogProvider>
    </AuthProvider>
  );
}
