/**
 * MEGASUPER.CL - Modal de Checkout sin Registro Obligatorio (Compra Rápida)
 * Captura datos para despacho domiciliario en Santiago y canaliza por WhatsApp
 */

import { cartStore } from '../core/cart-store.js';
import { PriceEngine } from '../core/price-engine.js';
import { OrderService } from '../core/order-service.js';

const COMUNAS_SANTIAGO = [
  'Santiago Centro', 'Providencia', 'Las Condes', 'Ñuñoa', 'La Florida',
  'Maipú', 'Puente Alto', 'San Miguel', 'Macul', 'Peñalolén',
  'La Reina', 'Vitacura', 'Lo Barnechea', 'Independencia', 'Recoleta',
  'Quinta Normal', 'Estación Central', 'Cerrillos', 'Pudahuel', 'Quilicura',
  'San Bernardo', 'Huechuraba', 'Conchalí', 'Renca', 'San Joaquín'
];

export class CheckoutModal {
  constructor() {
    this.modalEl = null;
    this.backdropEl = null;
    this.isOpen = false;
  }

  init() {
    this.createDom();
    this.attachEvents();

    window.addEventListener('megasuper:open-checkout', () => {
      this.open();
    });
  }

  createDom() {
    this.backdropEl = document.createElement('div');
    this.backdropEl.className = 'modal-backdrop';
    this.backdropEl.id = 'checkout-backdrop';
    document.body.appendChild(this.backdropEl);

    this.modalEl = document.createElement('div');
    this.modalEl.className = 'modal-dialog checkout-modal';
    this.modalEl.id = 'checkout-modal';
    this.modalEl.setAttribute('role', 'dialog');
    this.modalEl.setAttribute('aria-modal', 'true');
    document.body.appendChild(this.modalEl);
  }

  open() {
    const items = cartStore.getItems();
    if (items.length === 0) {
      alert('Tu carrito está vacío. Añade productos para finalizar una orden.');
      return;
    }

    this.isOpen = true;
    this.backdropEl.classList.add('open');
    this.modalEl.classList.add('open');
    document.body.style.overflow = 'hidden';
    this.renderForm();
  }

  close() {
    this.isOpen = false;
    this.backdropEl.classList.remove('open');
    this.modalEl.classList.remove('open');
    document.body.style.overflow = '';
  }

  renderForm() {
    const totals = cartStore.getTotals();

    this.modalEl.innerHTML = `
      <div class="modal-header">
        <div>
          <span class="modal-badge">Compra Rápida • Sin Registro Previo</span>
          <h2 class="modal-title">Finalizar tu Pedido</h2>
        </div>
        <button class="modal-close-btn" id="close-checkout-btn">✕</button>
      </div>

      <div class="checkout-grid">
        <!-- Formulario de Despacho -->
        <form id="checkout-form" class="checkout-form">
          <div class="form-section-title">📍 Datos para el Despacho en Santiago</div>

          <div class="form-group">
            <label for="checkout-name" class="form-label">Nombre Completo *</label>
            <input 
              type="text" 
              id="checkout-name" 
              class="form-control" 
              placeholder="Ej. Juan Pérez" 
              required 
            />
          </div>

          <div class="form-group">
            <label for="checkout-phone" class="form-label">Teléfono WhatsApp *</label>
            <div class="phone-input-group">
              <span class="phone-prefix">🇨🇱 +56</span>
              <input 
                type="tel" 
                id="checkout-phone" 
                class="form-control" 
                placeholder="9 1234 5678" 
                required 
              />
            </div>
            <span class="form-hint">Te contactaremos a este número para coordinar la entrega.</span>
          </div>

          <div class="form-row">
            <div class="form-group col-7">
              <label for="checkout-address" class="form-label">Dirección (Calle y Número) *</label>
              <input 
                type="text" 
                id="checkout-address" 
                class="form-control" 
                placeholder="Ej. Av. Providencia 1250, Depto 301" 
                required 
              />
            </div>

            <div class="form-group col-5">
              <label for="checkout-comuna" class="form-label">Comuna RM *</label>
              <select id="checkout-comuna" class="form-control" required>
                <option value="">Selecciona comuna...</option>
                ${COMUNAS_SANTIAGO.map(c => `<option value="${c}">${c}</option>`).join('')}
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Método de Pago Preferido</label>
            <div class="payment-options-grid">
              <label class="payment-card">
                <input type="radio" name="payment_method" value="TRANSFERENCIA" checked />
                <div class="payment-card-content">
                  <span class="pay-icon">🏦</span>
                  <strong>Transferencia Bancaria</strong>
                  <small>Datos al confirmar pedido</small>
                </div>
              </label>
              <label class="payment-card">
                <input type="radio" name="payment_method" value="EFECTIVO" />
                <div class="payment-card-content">
                  <span class="pay-icon">💵</span>
                  <strong>Efectivo contra Entrega</strong>
                  <small>Al recibir tu pedido</small>
                </div>
              </label>
            </div>
          </div>

          <div class="form-group">
            <label for="checkout-notes" class="form-label">Instrucciones de Entrega (Opcional)</label>
            <textarea 
              id="checkout-notes" 
              class="form-control" 
              rows="2" 
              placeholder="Ej. Dejar en conserjería, llamar antes de llegar..."
            ></textarea>
          </div>

          <div id="checkout-error-box" class="form-error-alert" style="display: none;"></div>

          <button type="submit" class="btn-confirm-order" id="submit-order-btn">
            <span>Confirmar Pedido y Abrir WhatsApp</span>
            <span class="confirm-price">${PriceEngine.formatCLP(totals.totalPagar)}</span>
          </button>
        </form>

        <!-- Resumen de Compra -->
        <aside class="checkout-summary-aside">
          <h3 class="summary-aside-title">Resumen de tu Compra</h3>
          
          <div class="checkout-items-mini-list">
            ${totals.lineas.map(l => `
              <div class="mini-item-row">
                <div class="mini-item-qty">${l.cantidad}x</div>
                <div class="mini-item-name">${l.nombre}</div>
                <div class="mini-item-price">${PriceEngine.formatCLP(l.pricing.subtotalCobrado)}</div>
              </div>
            `).join('')}
          </div>

          <div class="aside-calculations">
            <div class="aside-calc-row">
              <span>Subtotal Normal:</span>
              <span class="strikethrough-base">${PriceEngine.formatCLP(totals.subtotalRetail)}</span>
            </div>
            ${totals.ahorroTotal > 0 ? `
              <div class="aside-calc-row savings">
                <span>🎉 Ahorro Mayorista Total:</span>
                <span>-${PriceEngine.formatCLP(totals.ahorroTotal)}</span>
              </div>
            ` : ''}
            <div class="aside-calc-row shipping">
              <span>Despacho Unificado RM:</span>
              <span class="free-shipping">1 Solo Envío</span>
            </div>
            <div class="aside-total-box">
              <span>Total a Pagar:</span>
              <strong class="total-big">${PriceEngine.formatCLP(totals.totalPagar)}</strong>
            </div>
          </div>

          <div class="aside-trust-badges">
            <div class="trust-item">🔒 Compra 100% segura y protegida</div>
            <div class="trust-item">⚡ 1 solo despacho para todas tus compras</div>
            <div class="trust-item">📲 Confirmación directa por WhatsApp</div>
          </div>
        </aside>
      </div>
    `;

    this.attachFormEvents();
  }

  attachEvents() {
    this.backdropEl?.addEventListener('click', () => this.close());
  }

  attachFormEvents() {
    this.modalEl.querySelector('#close-checkout-btn')?.addEventListener('click', () => this.close());

    const form = this.modalEl.querySelector('#checkout-form');
    const errorBox = this.modalEl.querySelector('#checkout-error-box');

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (errorBox) errorBox.style.display = 'none';

      const nombre = this.modalEl.querySelector('#checkout-name').value;
      let telefono = this.modalEl.querySelector('#checkout-phone').value;
      if (!telefono.startsWith('+56')) {
        telefono = '+56' + telefono.replace(/\D/g, '');
      }
      const direccion = this.modalEl.querySelector('#checkout-address').value;
      const comuna = this.modalEl.querySelector('#checkout-comuna').value;
      const metodoPago = this.modalEl.querySelector('input[name="payment_method"]:checked')?.value || 'TRANSFERENCIA';
      const notas = this.modalEl.querySelector('#checkout-notes').value;

      const submitBtn = this.modalEl.querySelector('#submit-order-btn');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Procesando orden...';
      }

      try {
        const result = await OrderService.createOrder({
          nombre,
          telefono,
          direccion,
          comuna,
          metodoPago,
          notas
        });

        this.renderSuccess(result);
      } catch (err) {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = 'Confirmar Pedido y Abrir WhatsApp';
        }
        if (errorBox) {
          errorBox.textContent = '⚠️ ' + err.message;
          errorBox.style.display = 'block';
        }
      }
    });
  }

  renderSuccess(result) {
    this.modalEl.innerHTML = `
      <div class="checkout-success-container">
        <div class="success-icon-animation">✅</div>
        <span class="success-badge">Pedido Registrado con Éxito</span>
        <h2 class="success-title">¡Gracias por tu compra, ${result.customer.nombre}!</h2>
        <p class="success-subtitle">
          Tu código de orden es <strong class="order-code-highlight">${result.orderCode}</strong>
        </p>

        <div class="success-receipt-card">
          <div class="receipt-row">
            <span>Dirección:</span>
            <strong>${result.customer.direccion}, ${result.customer.comuna}</strong>
          </div>
          <div class="receipt-row">
            <span>Teléfono WhatsApp:</span>
            <strong>${result.customer.telefono}</strong>
          </div>
          <div class="receipt-row">
            <span>Método de pago:</span>
            <strong>${result.customer.metodoPago}</strong>
          </div>
          <div class="receipt-row">
            <span>Total a pagar:</span>
            <strong class="receipt-total">${PriceEngine.formatCLP(result.totals.totalPagar)}</strong>
          </div>
          ${result.totals.ahorroTotal > 0 ? `
            <div class="receipt-savings">
              🎉 ¡Ahorraste ${PriceEngine.formatCLP(result.totals.ahorroTotal)} con precios por volumen!
            </div>
          ` : ''}
        </div>

        <div class="success-actions">
          <a href="${result.whatsappUrl}" target="_blank" rel="noopener noreferrer" class="btn-whatsapp-action" id="open-whatsapp-link">
            📲 Enviar Pedido por WhatsApp Ahora
          </a>
          <button class="btn-secondary" id="finish-checkout-btn">
            Seguir Comprando
          </button>
        </div>
      </div>
    `;

    this.modalEl.querySelector('#finish-checkout-btn')?.addEventListener('click', () => {
      this.close();
    });

    window.open(result.whatsappUrl, '_blank');
  }
}

export const checkoutModal = new CheckoutModal();
