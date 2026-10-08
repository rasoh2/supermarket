import React, { useState } from 'react';
import { useCart } from '../../context/CartContext.jsx';
import { apiClient } from '../../services/apiClient.js';
import { SANTIAGO_COMUNAS, inspectAndSanitize } from '../../utils/inputSanitizer.js';

export default function CheckoutModal({ show, onHide }) {
  const { rawItems, subtotalRetail, totalPagar, ahorroTotal, clearCart, formatCLP } = useCart();

  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '+56 9 ',
    direccion: '',
    comuna: 'Santiago Centro',
    paymentMethod: 'TRANSFERENCIA',
    notas: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [orderConfirmed, setOrderConfirmed] = useState(null);

  if (!show) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    // 1. Validaciones básicas
    if (!formData.nombre.trim() || formData.nombre.trim().length < 3) {
      return setErrorMsg('Por favor ingresa tu nombre completo.');
    }
    if (!formData.telefono.trim() || formData.telefono.trim().length < 9) {
      return setErrorMsg('Por favor ingresa un número de teléfono válido.');
    }
    if (!formData.direccion.trim() || formData.direccion.trim().length < 5) {
      return setErrorMsg('Por favor ingresa una dirección de entrega completa.');
    }
    if (!formData.comuna) {
      return setErrorMsg('Por favor selecciona tu comuna en Santiago.');
    }

    // 2. Inspección WAF perimetral
    const nombreCheck = inspectAndSanitize(formData.nombre, 'Nombre');
    if (!nombreCheck.isClean) return setErrorMsg(nombreCheck.error);

    const direccionCheck = inspectAndSanitize(formData.direccion, 'Dirección');
    if (!direccionCheck.isClean) return setErrorMsg(direccionCheck.error);

    const notasCheck = inspectAndSanitize(formData.notas, 'Notas');
    if (!notasCheck.isClean) return setErrorMsg(notasCheck.error);

    // 3. Envío transaccional a la API
    setIsSubmitting(true);
    try {
      const payload = {
        customer: {
          nombre: nombreCheck.sanitized,
          telefono: formData.telefono.trim(),
          direccion: direccionCheck.sanitized,
          comuna: formData.comuna
        },
        items: rawItems.map(i => ({
          sku: i.sku,
          cantidad: i.cantidad
        })),
        paymentMethod: formData.paymentMethod,
        notes: notasCheck.sanitized
      };

      const result = await apiClient.createOrder(payload);

      if (result?.success) {
        setOrderConfirmed(result);
        clearCart();
        // Abrir pasarela de WhatsApp automáticamente si está disponible
        if (result.whatsappUrl) {
          window.open(result.whatsappUrl, '_blank', 'noopener,noreferrer');
        }
      } else {
        throw new Error(result?.error || 'No se pudo procesar la orden.');
      }
    } catch (err) {
      setErrorMsg(err.data?.error || err.message || 'Error de conexión con el servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setOrderConfirmed(null);
    setErrorMsg(null);
    onHide();
  };

  return (
    <>
      {/* Backdrop */}
      <div className="modal-backdrop fade show" style={{ zIndex: 1050 }}></div>

      {/* Modal Dialog */}
      <div 
        className="modal fade show d-block" 
        tabIndex="-1" 
        style={{ zIndex: 1055 }} 
        id="checkout-modal"
        role="dialog"
      >
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content modal-content-dark">
            {/* Cabecera */}
            <div className="modal-header">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-bag-check-fill text-success fs-4"></i>
                <h5 className="modal-title text-white fw-bold mb-0">
                  {orderConfirmed ? '¡Pedido Confirmado con Éxito!' : 'Finalizar Pedido y Despacho'}
                </h5>
              </div>
              <button 
                type="button" 
                className="btn-close btn-close-white" 
                onClick={handleClose} 
                aria-label="Cerrar"
              ></button>
            </div>

            {/* Cuerpo del Modal */}
            <div className="modal-body p-4">
              {orderConfirmed ? (
                /* Estado de Éxito / WhatsApp Gateway */
                <div className="text-center py-4">
                  <div className="mb-3">
                    <i className="bi bi-whatsapp display-1 text-success"></i>
                  </div>
                  <h4 className="text-white fw-bold">¡Tu pedido ha sido registrado!</h4>
                  <p className="lead text-info font-monospace my-2">
                    Código de Pedido: <strong>{orderConfirmed.orderCode}</strong>
                  </p>
                  <p className="text-secondary small mb-4">
                    El inventario ha sido reservado transaccionalmente en la base de datos de SuperMarket.cl. 
                    Haz clic a continuación para enviar el comprobante estructurado directamente a nuestro canal oficial de WhatsApp.
                  </p>

                  <div className="bg-dark p-3 rounded border border-secondary mb-4 text-start small">
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-secondary">Total a Pagar:</span>
                      <strong className="text-white">{formatCLP(orderConfirmed.totalPagar)}</strong>
                    </div>
                    <div className="d-flex justify-content-between text-success">
                      <span>Ahorro Mayorista:</span>
                      <strong>-{formatCLP(orderConfirmed.ahorroTotal)}</strong>
                    </div>
                  </div>

                  <div className="d-flex justify-content-center gap-3">
                    <a
                      href={orderConfirmed.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-success btn-lg fw-bold d-inline-flex align-items-center gap-2 px-4 shadow"
                    >
                      <i className="bi bi-whatsapp fs-5"></i>
                      <span>Abrir WhatsApp Ahora</span>
                    </a>
                    <button className="btn btn-outline-light" onClick={handleClose}>
                      Cerrar
                    </button>
                  </div>
                </div>
              ) : (
                /* Formulario de Checkout */
                <form onSubmit={handleSubmit} id="checkout-form">
                  {errorMsg && (
                    <div className="alert alert-danger d-flex align-items-center gap-2 mb-3" role="alert">
                      <i className="bi bi-exclamation-octagon-fill"></i>
                      <div className="small">{errorMsg}</div>
                    </div>
                  )}

                  <div className="row g-3 mb-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label text-light small fw-bold">Nombre Completo *</label>
                      <input
                        type="text"
                        name="nombre"
                        className="form-control form-control-dark"
                        placeholder="Ej. Juan Pérez"
                        value={formData.nombre}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label text-light small fw-bold">Teléfono WhatsApp *</label>
                      <input
                        type="text"
                        name="telefono"
                        className="form-control form-control-dark"
                        placeholder="+56 9 1234 5678"
                        value={formData.telefono}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="col-12 col-md-8">
                      <label className="form-label text-light small fw-bold">Dirección de Entrega *</label>
                      <input
                        type="text"
                        name="direccion"
                        className="form-control form-control-dark"
                        placeholder="Calle, número, depto o villa"
                        value={formData.direccion}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label text-light small fw-bold">Comuna (Santiago RM) *</label>
                      <select
                        name="comuna"
                        className="form-select form-select-dark"
                        value={formData.comuna}
                        onChange={handleChange}
                        required
                      >
                        {SANTIAGO_COMUNAS.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label text-light small fw-bold">Método de Pago *</label>
                      <select
                        name="paymentMethod"
                        className="form-select form-select-dark"
                        value={formData.paymentMethod}
                        onChange={handleChange}
                      >
                        <option value="TRANSFERENCIA">Transferencia Bancaria Electrónica</option>
                        <option value="EFECTIVO">Efectivo contra Entrega</option>
                      </select>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label text-light small fw-bold">Notas o Referencias (Opcional)</label>
                      <input
                        type="text"
                        name="notas"
                        className="form-control form-control-dark"
                        placeholder="Dejar en conserjería, timbre, etc."
                        value={formData.notas}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  {/* Resumen Final de Compra */}
                  <div className="bg-dark p-3 rounded border border-secondary mb-3">
                    <div className="d-flex justify-content-between text-secondary small mb-1">
                      <span>Subtotal Retail:</span>
                      <span>{formatCLP(subtotalRetail)}</span>
                    </div>
                    <div className="d-flex justify-content-between text-success fw-bold small mb-2">
                      <span>Ahorro Mayorista por Volumen:</span>
                      <span>-{formatCLP(ahorroTotal)}</span>
                    </div>
                    <div className="border-top border-secondary pt-2 d-flex justify-content-between align-items-center">
                      <span className="text-white fw-bold">Total Definitivo:</span>
                      <span className="text-info fw-bold fs-5">{formatCLP(totalPagar)}</span>
                    </div>
                  </div>

                  <div className="d-flex justify-content-end gap-2">
                    <button 
                      type="button" 
                      className="btn btn-outline-secondary" 
                      onClick={handleClose}
                      disabled={isSubmitting}
                    >
                      Volver
                    </button>
                    <button
                      type="submit"
                      id="btn-confirm-order"
                      className="btn btn-success fw-bold px-4 d-flex align-items-center gap-2"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm" role="status"></span>
                          <span>Procesando Pedido...</span>
                        </>
                      ) : (
                        <>
                          <i className="bi bi-whatsapp"></i>
                          <span>Confirmar y Enviar a WhatsApp</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
