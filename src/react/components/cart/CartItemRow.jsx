import React from 'react';
import { useCart } from '../../context/CartContext.jsx';
import TierProgressIndicator from './TierProgressIndicator.jsx';

export default function CartItemRow({ item }) {
  const { updateQuantity, removeItem, formatCLP } = useCart();
  const { pricing } = item;

  const handleIncrement = () => {
    updateQuantity(item.sku, item.cantidad + 1);
  };

  const handleDecrement = () => {
    updateQuantity(item.sku, item.cantidad - 1);
  };

  return (
    <div className="cart-item-card" id={`cart-item-${item.sku}`}>
      <div className="d-flex gap-3 align-items-start">
        {/* Miniatura */}
        <img
          src={item.imagen_url || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect fill="%231a2332" width="100" height="100"/><text fill="%236c757d" font-family="sans-serif" font-size="35" x="50%" y="60%" text-anchor="middle">🛒</text></svg>`}
          alt={item.nombre}
          className="rounded border border-secondary"
          style={{ width: '60px', height: '60px', objectFit: 'contain', backgroundColor: '#ffffff' }}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect fill="%231a2332" width="100" height="100"/><text fill="%236c757d" font-family="sans-serif" font-size="35" x="50%" y="60%" text-anchor="middle">🛒</text></svg>`;
          }}
        />

        {/* Información del Ítem */}
        <div className="flex-grow-1 min-w-0">
          <div className="d-flex justify-content-between align-items-start">
            <h6 className="text-white mb-0 text-truncate" title={item.nombre} style={{ maxWidth: '200px' }}>
              {item.nombre}
            </h6>
            <button
              className="btn btn-sm btn-link text-danger p-0 ms-2"
              onClick={() => removeItem(item.sku)}
              title="Eliminar del carrito"
            >
              <i className="bi bi-trash"></i>
            </button>
          </div>

          <small className="text-secondary d-block font-monospace mb-1">SKU: {item.sku}</small>

          {/* Precio y Controles */}
          <div className="d-flex justify-content-between align-items-center mt-2">
            <div className="input-group input-group-sm" style={{ width: '100px' }}>
              <button
                className="btn btn-outline-secondary"
                type="button"
                onClick={handleDecrement}
              >
                -
              </button>
              <input
                type="text"
                className="form-control text-center bg-dark text-white border-secondary p-0"
                value={item.cantidad}
                readOnly
              />
              <button
                className="btn btn-outline-secondary"
                type="button"
                onClick={handleIncrement}
                disabled={item.stock && item.cantidad >= item.stock}
              >
                +
              </button>
            </div>

            <div className="text-end">
              <span className="fw-bold text-white d-block">
                {pricing ? formatCLP(pricing.subtotalCobrado) : '$0'}
              </span>
              {pricing && pricing.ahorroMonetario > 0 && (
                <small className="text-success fw-bold d-block">
                  Ahorras {formatCLP(pricing.ahorroMonetario)}
                </small>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Indicador de Tramos y Progreso */}
      <TierProgressIndicator pricing={pricing} />
    </div>
  );
}
