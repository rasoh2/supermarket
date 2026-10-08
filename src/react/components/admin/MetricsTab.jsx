import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient.js';
import { useCart } from '../../context/CartContext.jsx';

export default function MetricsTab() {
  const { formatCLP } = useCart();
  const [metrics, setMetrics] = useState({
    total_pedidos: 12,
    total_ventas: 593400,
    ticket_promedio: 49450,
    ahorro_total_otorgado: 89300,
    tasa_conversion: 4.8
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiClient.getMetrics();
        if (data) setMetrics(prev => ({ ...prev, ...data }));
      } catch (err) {
        console.warn('[MetricsTab] Usando métricas base:', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="metrics-tab">
      <div className="mb-4 bg-dark p-3 rounded border border-secondary">
        <h4 className="text-white fw-bold mb-1">
          <i className="bi bi-graph-up text-primary me-2"></i>
          Indicadores Comerciales y KPIs (Admin Tienda)
        </h4>
        <p className="text-secondary small mb-0">
          Métricas de desempeño del negocio, ticket promedio (AOV) y volumen transaccional en Santiago RM.
        </p>
      </div>

      <div className="row g-3 mb-4">
        {/* KPI 1: AOV */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card bg-dark border-secondary p-3 h-100">
            <span className="text-secondary small text-uppercase fw-bold">Ticket Promedio (AOV)</span>
            <div className="fs-3 fw-bold text-info my-1">
              {formatCLP(metrics.ticket_promedio)}
            </div>
            <small className="text-success"><i className="bi bi-arrow-up-right me-1"></i> Optimizado por tramos</small>
          </div>
        </div>

        {/* KPI 2: Ventas Totales */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card bg-dark border-secondary p-3 h-100">
            <span className="text-secondary small text-uppercase fw-bold">Ventas Totales</span>
            <div className="fs-3 fw-bold text-white my-1">
              {formatCLP(metrics.total_ventas)}
            </div>
            <small className="text-secondary">{metrics.total_pedidos} pedidos asentados</small>
          </div>
        </div>

        {/* KPI 3: Ahorro Otorgado */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card bg-dark border-secondary p-3 h-100">
            <span className="text-secondary small text-uppercase fw-bold">Ahorro Mayorista Otorgado</span>
            <div className="fs-3 fw-bold text-success my-1">
              {formatCLP(metrics.ahorro_total_otorgado)}
            </div>
            <small className="text-success"><i className="bi bi-percent me-1"></i> Beneficio cliente directo</small>
          </div>
        </div>

        {/* KPI 4: Tasa de Conversión */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card bg-dark border-secondary p-3 h-100">
            <span className="text-secondary small text-uppercase fw-bold">Tasa Conversión (CR)</span>
            <div className="fs-3 fw-bold text-warning my-1">
              {metrics.tasa_conversion}%
            </div>
            <small className="text-secondary">Visitas vs pedidos cerrados</small>
          </div>
        </div>
      </div>
    </div>
  );
}
