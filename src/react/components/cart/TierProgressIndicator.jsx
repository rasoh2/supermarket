import React from 'react';
import { useCart } from '../../context/CartContext.jsx';

export default function TierProgressIndicator({ pricing }) {
  const { formatCLP } = useCart();
  if (!pricing) return null;

  const { tramoAplicado, siguienteTramo, cantidad } = pricing;

  // Si está en el tramo máximo (6 o más unidades)
  if (!siguienteTramo) {
    return (
      <div className="bg-warning-subtle text-warning border border-warning rounded p-2 small mt-2">
        <i className="bi bi-trophy-fill me-1"></i>
        <strong>¡Máximo descuento de Distribuidor alcanzado! (~30% OFF)</strong>
      </div>
    );
  }

  // Progreso hacia el siguiente umbral
  const currentThreshold = tramoAplicado === 3 ? 3 : 1;
  const nextThreshold = siguienteTramo.umbral; // 3 o 6
  const progressPercent = Math.min(100, Math.round(((cantidad - currentThreshold) / (nextThreshold - currentThreshold)) * 100));

  return (
    <div className="tier-progress-box bg-dark p-2 rounded border border-secondary mt-2 small">
      <div className="d-flex justify-content-between align-items-center mb-1">
        <span className="text-secondary">
          Tramo: <strong className="text-info">{tramoAplicado === 1 ? 'Retail (1-2 u.)' : 'Mayorista (3-5 u.)'}</strong>
        </span>
        <span className="text-success fw-bold">
          +{siguienteTramo.faltanUnidades} u. para {formatCLP(siguienteTramo.precioUnitario)}
        </span>
      </div>

      <div className="progress" style={{ height: '6px' }} role="progressbar" aria-valuenow={progressPercent} aria-valuemin="0" aria-valuemax="100">
        <div 
          className="progress-bar bg-success progress-bar-striped progress-bar-animated" 
          style={{ width: `${Math.max(10, progressPercent)}%` }}
        ></div>
      </div>

      <div className="text-end mt-1 text-secondary" style={{ fontSize: '0.75rem' }}>
        Ahorro adicional: <strong className="text-success">-{formatCLP(siguienteTramo.ahorroPotencialUnitario * siguienteTramo.umbral)}</strong>
      </div>
    </div>
  );
}
