import React, { useState, useMemo } from 'react';
import { useCart } from '../../context/CartContext.jsx';
import { PriceEngine } from '../../../core/price-engine.js';

const CATEGORY_COLORS = {
  ABARROTES: 'bg-primary',
  BEBIDAS: 'bg-info text-dark',
  ASEO: 'bg-teal text-white',
  DISFRACES: 'bg-purple text-white'
};

export default function ProductCard({ product }) {
  const { addItem, formatCLP } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [addedFeedback, setAddedFeedback] = useState(false);

  const stock = product.stock_actual !== undefined ? product.stock_actual : (product.stock || 0);
  const isOutOfStock = stock <= 0;

  // Cálculo en tiempo real del precio unitario y ahorro según la cantidad elegida
  const pricing = useMemo(() => {
    return PriceEngine.calculateItemPricing(quantity, product.tramos || []);
  }, [quantity, product.tramos]);

  const handleQuantityChange = (delta) => {
    setQuantity(prev => {
      const next = prev + delta;
      if (next < 1) return 1;
      if (next > stock && stock > 0) return stock;
      return next;
    });
  };

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addItem(product, quantity);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 1500);
  };

  return (
    <div className="col-12 col-sm-6 col-lg-4 col-xl-3">
      <div className="product-card" id={`product-card-${product.sku}`}>
        {/* Imagen del Producto con Badges Flotantes */}
        <div className="product-image-wrapper">
          <img
            src={product.imagen_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500'}
            alt={product.nombre}
            loading="lazy"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500';
            }}
          />
          <span className={`category-badge-floating ${CATEGORY_COLORS[product.categoria_tienda || product.categoria] || 'bg-secondary text-white'}`}>
            {product.categoria_tienda || product.categoria}
          </span>
          <span className={`stock-badge-floating ${isOutOfStock ? 'bg-danger text-white' : 'bg-success text-white'}`}>
            {isOutOfStock ? 'Agotado' : `${stock} u. en stock`}
          </span>
        </div>

        {/* Contenido Informativo */}
        <div className="card-body p-3 d-flex flex-column flex-grow-1">
          <div className="d-flex justify-content-between align-items-start mb-1">
            <h5 className="card-title fs-6 fw-bold text-white mb-0 line-clamp-2" title={product.nombre}>
              {product.nombre}
            </h5>
          </div>
          <small className="text-secondary mb-2 font-monospace">SKU: {product.sku}</small>

          <p className="card-text text-secondary small flex-grow-1 mb-2 line-clamp-2">
            {product.descripcion}
          </p>

          {/* Lista de Tramos Mayoristas */}
          <div className="pricing-tiers-list">
            <div className={`tier-item ${pricing.tramoAplicado === 1 ? 'active-tier' : ''}`}>
              <span>1 - 2 u. <span className="text-muted">(Retail)</span></span>
              <span className="fw-semibold">
                {(product.tramos?.[0]?.precio_unitario || product.tramos?.[0]?.precio) ? formatCLP(product.tramos[0].precio_unitario || product.tramos[0].precio) : '$0'}
              </span>
            </div>
            <div className={`tier-item ${pricing.tramoAplicado === 3 ? 'active-tier' : ''}`}>
              <span>3 - 5 u. <span className="text-success fw-bold">(Mayorista)</span></span>
              <span className="fw-semibold text-success">
                {(product.tramos?.[1]?.precio_unitario || product.tramos?.[1]?.precio) ? formatCLP(product.tramos[1].precio_unitario || product.tramos[1].precio) : '$0'}
              </span>
            </div>
            <div className={`tier-item ${pricing.tramoAplicado === 6 ? 'active-tier' : ''}`}>
              <span>6+ u. <span className="text-warning fw-bold">(Distribuidor)</span></span>
              <span className="fw-semibold text-warning">
                {(product.tramos?.[2]?.precio_unitario || product.tramos?.[2]?.precio) ? formatCLP(product.tramos[2].precio_unitario || product.tramos[2].precio) : '$0'}
              </span>
            </div>
          </div>

          {/* Desglose de Selección Actual */}
          <div className="d-flex justify-content-between align-items-center bg-dark p-2 rounded mb-3 border border-secondary">
            <div>
              <span className="small text-secondary d-block">Precio unitario:</span>
              <span className="fw-bold fs-5 text-info">{formatCLP(pricing.precioUnitarioCobrado)}</span>
            </div>
            {pricing.ahorroMonetario > 0 && (
              <div className="text-end">
                <span className="badge bg-success-subtle text-success border border-success d-block mb-1">
                  Ahorras {pricing.porcentajeDescuento}%
                </span>
                <small className="text-success fw-bold">-{formatCLP(pricing.ahorroMonetario)}</small>
              </div>
            )}
          </div>

          {/* Selector de Cantidad y Botón de Compra */}
          <div className="d-flex gap-2">
            <div className="input-group input-group-sm" style={{ width: '110px' }}>
              <button 
                className="btn btn-outline-secondary" 
                type="button" 
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1 || isOutOfStock}
              >
                -
              </button>
              <input 
                type="text" 
                className="form-control text-center bg-dark text-white border-secondary p-0" 
                value={quantity}
                readOnly
              />
              <button 
                className="btn btn-outline-secondary" 
                type="button" 
                onClick={() => handleQuantityChange(1)}
                disabled={quantity >= stock || isOutOfStock}
              >
                +
              </button>
            </div>

            <button
              type="button"
              className={`btn btn-sm flex-grow-1 fw-bold d-flex align-items-center justify-content-center gap-1 ${
                addedFeedback 
                  ? 'btn-success' 
                  : isOutOfStock 
                    ? 'btn-secondary disabled' 
                    : 'btn-primary'
              }`}
              onClick={handleAddToCart}
              disabled={isOutOfStock}
            >
              {addedFeedback ? (
                <>
                  <i className="bi bi-check-circle-fill"></i> ¡Agregado!
                </>
              ) : (
                <>
                  <i className="bi bi-cart-plus"></i> Agregar
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
