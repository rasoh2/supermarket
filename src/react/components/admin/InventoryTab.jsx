import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../services/apiClient.js';
import { useCatalog } from '../../context/CatalogContext.jsx';

export default function InventoryTab() {
  const { products, refreshCatalog } = useCatalog();
  const [movements, setMovements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Formulario de ajuste manual
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustData, setAdjustData] = useState({
    sku: '',
    tipo: 'ENTRADA',
    cantidad: 10,
    motivo: 'Recepción de Proveedor'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadMovements = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.getInventoryMovements();
      setMovements(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[InventoryTab] Error cargando Kardex:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMovements();
  }, [loadMovements]);

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!adjustData.sku) return alert('Selecciona un producto.');

    setIsSubmitting(true);
    try {
      await apiClient.createInventoryMovement({
        sku: adjustData.sku,
        tipo: adjustData.tipo,
        cantidad: Number(adjustData.cantidad),
        motivo: adjustData.motivo
      });
      setShowAdjustModal(false);
      loadMovements();
      refreshCatalog();
    } catch (err) {
      alert(`Error en ajuste: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="inventory-kardex-tab">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3 bg-dark p-3 rounded border border-secondary">
        <div>
          <h4 className="text-white fw-bold mb-1">
            <i className="bi bi-boxes text-info me-2"></i>
            Control de Inventario y Kardex (Admin Tienda)
          </h4>
          <p className="text-secondary small mb-0">
            Registro transaccional de entradas, salidas por ventas y ajustes manuales de stock en SQLite 3FN.
          </p>
        </div>

        <button
          className="btn btn-primary fw-bold d-flex align-items-center gap-2"
          onClick={() => {
            if (products.length > 0 && !adjustData.sku) {
              setAdjustData(prev => ({ ...prev, sku: products[0].sku }));
            }
            setShowAdjustModal(true);
          }}
        >
          <i className="bi bi-plus-slash-minus"></i>
          <span>Ajustar Stock Manualmente</span>
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-info" role="status"></div>
        </div>
      ) : (
        <div className="table-responsive bg-dark rounded border border-secondary shadow-sm">
          <table className="table table-dark table-hover table-striped align-middle mb-0 small">
            <thead className="table-secondary text-secondary text-uppercase">
              <tr>
                <th scope="col" style={{ width: '80px' }}>ID</th>
                <th scope="col">Fecha / Hora</th>
                <th scope="col">SKU / Producto</th>
                <th scope="col">Tipo</th>
                <th scope="col" className="text-end">Cantidad</th>
                <th scope="col">Motivo</th>
              </tr>
            </thead>
            <tbody>
              {movements.map(m => (
                <tr key={m.id_movimiento}>
                  <td className="font-monospace text-secondary">#{m.id_movimiento}</td>
                  <td>{new Date(m.fecha_registro).toLocaleString('es-CL')}</td>
                  <td>
                    <span className="font-monospace fw-bold text-white me-2">{m.producto_sku}</span>
                    <span className="text-secondary">{m.producto_nombre}</span>
                  </td>
                  <td>
                    <span className={`badge ${
                      m.tipo_movimiento === 'ENTRADA' 
                        ? 'bg-success' 
                        : m.tipo_movimiento === 'SALIDA' 
                          ? 'bg-warning text-dark' 
                          : 'bg-info text-dark'
                    }`}>
                      {m.tipo_movimiento}
                    </span>
                  </td>
                  <td className="text-end font-monospace fw-bold">
                    {m.tipo_movimiento === 'ENTRADA' ? `+${m.cantidad}` : `-${m.cantidad}`}
                  </td>
                  <td>{m.motivo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Ajuste Manual */}
      {showAdjustModal && (
        <>
          <div className="modal-backdrop fade show" style={{ zIndex: 1060 }}></div>
          <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1065 }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content modal-content-dark">
                <div className="modal-header">
                  <h5 className="modal-title text-white fw-bold">Ajuste Manual de Inventario</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShowAdjustModal(false)}></button>
                </div>
                <form onSubmit={handleAdjustSubmit}>
                  <div className="modal-body p-4">
                    <div className="mb-3">
                      <label className="form-label text-light small fw-bold">Producto *</label>
                      <select
                        className="form-select form-select-dark"
                        value={adjustData.sku}
                        onChange={(e) => setAdjustData({ ...adjustData, sku: e.target.value })}
                        required
                      >
                        {products.map(p => (
                          <option key={p.sku} value={p.sku}>
                            [{p.sku}] {p.nombre} (Stock actual: {p.stock_actual !== undefined ? p.stock_actual : p.stock})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="row g-3 mb-3">
                      <div className="col-6">
                        <label className="form-label text-light small fw-bold">Tipo Movimiento</label>
                        <select
                          className="form-select form-select-dark"
                          value={adjustData.tipo}
                          onChange={(e) => setAdjustData({ ...adjustData, tipo: e.target.value })}
                        >
                          <option value="ENTRADA">ENTRADA (Recepción)</option>
                          <option value="SALIDA">SALIDA (Merma / Retiro)</option>
                        </select>
                      </div>
                      <div className="col-6">
                        <label className="form-label text-light small fw-bold">Cantidad</label>
                        <input
                          type="number"
                          min="1"
                          className="form-control form-control-dark"
                          value={adjustData.cantidad}
                          onChange={(e) => setAdjustData({ ...adjustData, cantidad: Number(e.target.value) })}
                          required
                        />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label text-light small fw-bold">Motivo / Justificación *</label>
                      <input
                        type="text"
                        className="form-control form-control-dark"
                        value={adjustData.motivo}
                        onChange={(e) => setAdjustData({ ...adjustData, motivo: e.target.value })}
                        placeholder="Ej. Ingreso de camión proveedor Carozzi"
                        required
                      />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowAdjustModal(false)}>
                      Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary fw-bold" disabled={isSubmitting}>
                      {isSubmitting ? 'Registrando...' : 'Asentar Movimiento'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
