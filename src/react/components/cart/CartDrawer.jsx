import React from 'react';
import { useCart } from '../../context/CartContext.jsx';
import CartItemRow from './CartItemRow.jsx';

export default function CartDrawer({ onProceedToCheckout }) {
  const { 
    items, 
    isOpen, 
    closeCart, 
    clearCart, 
    subtotalRetail, 
    totalPagar, 
    ahorroTotal, 
    porcentajeAhorro, 
    totalUnidades, 
    formatCLP 
  } = useCart();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop oscuro con fade */}
      <div 
        className="modal-backdrop fade show" 
        style={{ zIndex: 1040 }}
        onClick={closeCart}
      ></div>

      {/* Offcanvas Drawer Lateral */}
      <div 
        className="offcanvas offcanvas-end show offcanvas-dark d-flex flex-column" 
        tabIndex="-1" 
        style={{ zIndex: 1045, width: '420px', maxWidth: '90vw' }}
        id="cart-drawer-offcanvas"
        aria-labelledby="cartDrawerLabel"
      >
        {/* Cabecera del Drawer */}
        <div className="offcanvas-header py-3 px-4">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-cart3 fs-4 text-primary"></i>
            <h5 className="offcanvas-title text-white fw-bold mb-0" id="cartDrawerLabel">
              Mi Carrito de Compras
            </h5>
            <span className="badge bg-primary rounded-pill">
              {totalUnidades}
            </span>
          </div>
          <button 
            type="button" 
            className="btn-close btn-close-white" 
            onClick={closeCart} 
            aria-label="Cerrar"
          ></button>
        </div>

        {/* Cuerpo del Carrito */}
        <div className="offcanvas-body p-3 overflow-y-auto flex-grow-1">
          {items.length === 0 ? (
            <div className="text-center py-5 text-secondary">
              <i className="bi bi-cart-x display-1 d-block mb-3 opacity-50"></i>
              <h5 className="text-white">Tu carrito está vacío</h5>
              <p className="small mb-4">
                Agrega productos de Abarrotes, Bebidas, Aseo o Disfraces para disfrutar precios mayoristas con un solo despacho.
              </p>
              <button className="btn btn-outline-primary btn-sm" onClick={closeCart}>
                <i className="bi bi-arrow-left me-1"></i> Explorar Catálogo
              </button>
            </div>
          ) : (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-2 px-1">
                <span className="small text-secondary fw-semibold">
                  {items.length} tipo{items.length > 1 ? 's' : ''} de producto
                </span>
                <button 
                  className="btn btn-link text-danger p-0 small text-decoration-none" 
                  onClick={clearCart}
                >
                  <i className="bi bi-trash3 me-1"></i> Vaciar todo
                </button>
              </div>

              {/* Lista de Filas */}
              {items.map(item => (
                <CartItemRow key={item.sku} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* Footer Financiero con Desglose Determinista de Ahorro */}
        {items.length > 0 && (
          <div className="offcanvas-footer">
            <div className="savings-callout mb-3">
              <div className="d-flex justify-content-between text-secondary small mb-1">
                <span>Subtotal Retail (Base):</span>
                <span>{formatCLP(subtotalRetail)}</span>
              </div>

              <div className="d-flex justify-content-between text-success fw-bold small mb-2">
                <span>
                  <i className="bi bi-tag-fill me-1"></i> Ahorro Mayorista Total ({porcentajeAhorro}%):
                </span>
                <span>-{formatCLP(ahorroTotal)}</span>
              </div>

              <div className="border-top border-secondary pt-2 d-flex justify-content-between align-items-center">
                <span className="text-white fw-bold fs-6">TOTAL A PAGAR:</span>
                <span className="text-info fw-extrabold fs-4">{formatCLP(totalPagar)}</span>
              </div>
            </div>

            <button
              id="btn-proceed-checkout"
              className="btn btn-success w-100 py-3 fw-bold fs-6 d-flex align-items-center justify-content-center gap-2 shadow"
              onClick={() => {
                closeCart();
                if (onProceedToCheckout) onProceedToCheckout();
              }}
            >
              <span>Continuar al Despacho</span>
              <i className="bi bi-arrow-right"></i>
            </button>

            <div className="text-center mt-2">
              <small className="text-secondary" style={{ fontSize: '0.75rem' }}>
                <i className="bi bi-shield-check text-success me-1"></i> Despacho en Santiago RM &bull; Pagas al recibir o transferencia
              </small>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
