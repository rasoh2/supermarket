import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';

export default function Navbar({ currentView, onNavigate }) {
  const { totalUnidades, openCart } = useCart();
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="navbar-custom sticky-top py-2" id="main-site-header">
      <div className="container d-flex justify-content-between align-items-center">
        {/* Logotipo de Marca */}
        <div 
          className="d-flex align-items-center cursor-pointer text-decoration-none" 
          role="button" 
          onClick={() => onNavigate('catalog')}
          id="navbar-brand-btn"
        >
          <div className="brand-badge-logo">SM</div>
          <div className="brand-text">
            <h1>SUPER<span>MARKET</span></h1>
            <span className="brand-subtitle">Supermercado Mayorista Santiago</span>
          </div>
        </div>

        {/* Navegación y Acciones */}
        <nav className="d-flex align-items-center gap-2" aria-label="Navegación principal">
          <button
            id="nav-btn-catalog"
            className={`btn btn-sm ${currentView === 'catalog' ? 'btn-primary' : 'btn-outline-light'}`}
            onClick={() => onNavigate('catalog')}
          >
            <i className="bi bi-shop me-1"></i> Catálogo
          </button>

          <button
            id="nav-btn-admin"
            className={`btn btn-sm ${currentView === 'admin' ? 'btn-primary' : 'btn-outline-light'}`}
            onClick={() => onNavigate('admin')}
          >
            <i className="bi bi-shield-lock me-1"></i>
            {isAuthenticated ? (
              user?.rol === 'SUPER_ADMIN' ? 'Super Admin' : 'Panel de Control'
            ) : (
              'Administración'
            )}
          </button>

          {isAuthenticated && (
            <button 
              className="btn btn-sm btn-outline-danger" 
              onClick={logout} 
              title="Cerrar sesión"
            >
              <i className="bi bi-box-arrow-right"></i>
            </button>
          )}

          {/* Botón de Carrito */}
          <button 
            id="header-open-cart-btn"
            className="btn btn-sm btn-success position-relative ms-2 fw-semibold px-3"
            onClick={openCart}
            aria-label="Abrir carrito de compras"
          >
            <i className="bi bi-cart3 me-1"></i> Mi Carrito
            {totalUnidades > 0 && (
              <span 
                id="cart-badge-count" 
                className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-light"
              >
                {totalUnidades}
              </span>
            )}
          </button>
        </nav>
      </div>
    </header>
  );
}
