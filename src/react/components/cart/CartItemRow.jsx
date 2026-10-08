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
          src={item.imagen_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=100'}
          alt={item.nombre}
          className="rounded border border-secondary"
          style={{ width: '60px', height: '60px', objectFit: 'cover' }}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=100';
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
