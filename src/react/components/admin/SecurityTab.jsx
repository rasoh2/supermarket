import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../services/apiClient.js';

export default function SecurityTab() {
  const [logs, setLogs] = useState([]);
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPayload, setSelectedPayload] = useState(null);

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.getSecurityLogs();
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[SecurityTab] Error cargando logs SIEM:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const filteredLogs = logs.filter(log => {
    if (filterSeverity === 'ALL') return true;
    return log.severity === filterSeverity;
  });

  return (
    <div className="security-siem-tab">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3 bg-dark p-3 rounded border border-secondary">
        <div>
          <h4 className="text-white fw-bold mb-1">
            <i className="bi bi-shield-shaded text-warning me-2"></i>
            Bitácora de Seguridad SIEM (CU-12)
          </h4>
          <p className="text-secondary small mb-0">
            Registro inmutable de auditoría: intentos de acceso, bloqueos WAF (XSS/SQLi) y mutaciones críticas.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <select
            className="form-select form-select-sm form-select-dark"
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
          >
            <option value="ALL">Todas las Severidades</option>
            <option value="INFO">Solo INFO</option>
            <option value="WARNING">Solo WARNING</option>
            <option value="CRITICAL">Solo CRITICAL</option>
          </select>

          <button className="btn btn-sm btn-outline-light" onClick={loadLogs} title="Actualizar">
            <i className="bi bi-arrow-clockwise"></i>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-warning" role="status"></div>
          <p className="text-secondary mt-2">Cargando bitácora SIEM...</p>
        </div>
      ) : (
        <div className="table-responsive bg-dark rounded border border-secondary shadow-sm">
          <table className="table table-dark table-hover table-striped align-middle mb-0 small">
            <thead className="table-secondary text-secondary text-uppercase">
              <tr>
                <th scope="col" style={{ width: '80px' }}>ID</th>
                <th scope="col">Fecha / Hora</th>
                <th scope="col">Tipo de Evento</th>
                <th scope="col">Severidad</th>
                <th scope="col">IP Origen</th>
                <th scope="col" className="text-end">Detalles</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(log => (
                <tr key={log.id_log}>
                  <td className="font-monospace text-secondary">#{log.id_log}</td>
                  <td className="text-nowrap">{new Date(log.timestamp_utc).toLocaleString('es-CL')}</td>
                  <td>
                    <span className="font-monospace text-info fw-semibold">{log.event_type}</span>
                  </td>
                  <td>
                    <span className={`badge ${
                      log.severity === 'CRITICAL' 
                        ? 'bg-danger' 
                        : log.severity === 'WARNING' 
                          ? 'bg-warning text-dark' 
                          : 'bg-info text-dark'
                    }`}>
                      {log.severity}
                    </span>
                  </td>
                  <td className="font-monospace text-secondary">{log.ip_origen || '127.0.0.1'}</td>
                  <td className="text-end">
                    <button
                      className="btn btn-outline-secondary btn-sm py-0 px-2"
                      onClick={() => setSelectedPayload(log)}
                    >
                      <i className="bi bi-code-slash me-1"></i> Ver Payload
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Inspector de Payload JSON */}
      {selectedPayload && (
        <>
          <div className="modal-backdrop fade show" style={{ zIndex: 1060 }}></div>
          <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1065 }}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content modal-content-dark">
                <div className="modal-header">
                  <h6 className="modal-title text-white font-monospace">
                    Evento #{selectedPayload.id_log}: {selectedPayload.event_type}
                  </h6>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedPayload(null)}></button>
                </div>
                <div className="modal-body p-3">
                  <pre className="bg-black text-success p-3 rounded small mb-0 overflow-auto" style={{ maxHeight: '350px' }}>
                    {typeof selectedPayload.details_payload === 'string'
                      ? (() => {
                          try {
                            return JSON.stringify(JSON.parse(selectedPayload.details_payload), null, 2);
                          } catch {
                            return selectedPayload.details_payload;
                          }
                        })()
                      : JSON.stringify(selectedPayload.details_payload, null, 2)}
                  </pre>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary btn-sm" onClick={() => setSelectedPayload(null)}>
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
