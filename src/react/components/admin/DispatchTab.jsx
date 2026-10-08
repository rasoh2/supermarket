import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../services/apiClient.js';
import { useCart } from '../../context/CartContext.jsx';

export default function DispatchTab() {
  const { formatCLP } = useCart();
  const [dispatches, setDispatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDispatches = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.getDispatches();
      setDispatches(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[DispatchTab] Error cargando despachos:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDispatches();
  }, [loadDispatches]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await apiClient.updateDispatchStatus(id, { estado: newStatus });
      loadDispatches();
    } catch (err) {
      alert(`Error al actualizar estado: ${err.message}`);
    }
  };

  return (
    <div className="dispatch-tab">
      <div className="d-flex justify-content-between align-items-center mb-4 bg-dark p-3 rounded border border-secondary">
        <div>
          <h4 className="text-white fw-bold mb-1">
            <i className="bi bi-truck text-success me-2"></i>
            Módulo de Despachos y Logística (Despachador)
          </h4>
          <p className="text-secondary small mb-0">
            Control de entregas en Santiago RM: estados de ruta, repartidores y confirmación de entrega.
          </p>
        </div>

        <button className="btn btn-sm btn-outline-light" onClick={loadDispatches}>
          <i className="bi bi-arrow-clockwise me-1"></i> Actualizar Rutas
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-success" role="status"></div>
        </div>
      ) : (
        <div className="table-responsive bg-dark rounded border border-secondary shadow-sm">
          <table className="table table-dark table-hover table-striped align-middle mb-0 small">
            <thead className="table-secondary text-secondary text-uppercase">
              <tr>
                <th scope="col">Orden</th>
                <th scope="col">Destinatario</th>
                <th scope="col">Dirección / Comuna</th>
                <th scope="col">Total Pedido</th>
                <th scope="col">Estado Logístico</th>
                <th scope="col" className="text-end">Actualizar Estado</th>
              </tr>
            </thead>
            <tbody>
              {dispatches.map(d => (
                <tr key={d.id_despacho}>
                  <td className="font-monospace fw-bold text-info">{d.codigo_pedido}</td>
                  <td>
                    <div className="fw-semibold text-white">{d.cliente_nombre || 'Cliente Santiago'}</div>
                    <small className="text-secondary">{d.telefono_whatsapp}</small>
                  </td>
                  <td>
                    <div>{d.direccion_despacho}</div>
                    <span className="badge bg-secondary">{d.comuna_rm}</span>
                  </td>
                  <td className="fw-bold">{formatCLP(d.total_pagar)}</td>
                  <td>
                    <span className={`badge ${
                      d.estado_despacho === 'ENTREGADO' 
                        ? 'bg-success' 
                        : d.estado_despacho === 'EN_RUTA' 
                          ? 'bg-primary' 
                          : d.estado_despacho === 'PENDIENTE' 
                            ? 'bg-warning text-dark' 
                            : 'bg-danger'
                    }`}>
                      {d.estado_despacho}
                    </span>
                  </td>
                  <td className="text-end">
                    <select
                      className="form-select form-select-sm form-select-dark d-inline-block w-auto"
                      value={d.estado_despacho}
                      onChange={(e) => handleStatusChange(d.id_despacho, e.target.value)}
                    >
                      <option value="PENDIENTE">PENDIENTE</option>
                      <option value="EN_RUTA">EN_RUTA</option>
                      <option value="ENTREGADO">ENTREGADO</option>
                      <option value="FALLIDO">FALLIDO</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
