/**
 * SuperMarket.cl - Carrito Lateral Interactivo (Cart Drawer)
 * Implementa RF-04, RF-05, RNF-07, CU-02, CU-03
 */

import { cartStore } from '../core/cart-store.js';
import { PriceEngine } from '../core/price-engine.js';

export class CartDrawer {
  constructor() {
    this.isOpen = false;
    this.drawerEl = null;
    this.backdropEl = null;
  }

  init() {
    this.createDom();
    this.attachEvents();
    this.update();

    const handleCart = () => this.update();
    window.addEventListener('supermarket:cart-changed', handleCart);
    window.addEventListener('megasuper:cart-changed', handleCart);
  }

  createDom() {
    // Backdrop
    this.backdropEl = document.createElement('div');
    this.backdropEl.className = 'cart-backdrop';
    this.backdropEl.id = 'cart-backdrop';
    document.body.appendChild(this.backdropEl);

    // Drawer container
    this.drawerEl = document.createElement('aside');
    this.drawerEl.className = 'cart-drawer';
    this.drawerEl.id = 'cart-drawer';
    this.drawerEl.setAttribute('aria-label', 'Carrito de compras');
    document.body.appendChild(this.drawerEl);
  }

  open() {
    this.isOpen = true;
    this.drawerEl?.classList.add('open');
    this.backdropEl?.classList.add('open');
    document.body.style.overflow = 'hidden';
    this.update();
  }

  close() {
    this.isOpen = false;
    this.drawerEl?.classList.remove('open');
    this.backdropEl?.classList.remove('open');
    document.body.style.overflow = '';
  }

  update() {
    if (!this.drawerEl) return;

    const items = cartStore.getItems();
    const totals = cartStore.getTotals();
    const count = cartStore.getItemCount();

    // Actualizar badge en el header si existe
    const headerBadge = document.getElementById('cart-badge-count');
    if (headerBadge) {
      headerBadge.textContent = count;
      headerBadge.style.display = count > 0 ? 'inline-flex' : 'none';
    }

    if (items.length === 0) {
      this.drawerEl.innerHTML = `
        <div class="cart-header">
          <div class="cart-title-row">
            <h2 class="cart-title">Tu Carrito de Compras</h2>
            <button class="cart-close-btn" id="close-cart-btn" aria-label="Cerrar carrito">✕</button>
          </div>
        </div>
        <div class="cart-empty-state">
          <div class="empty-icon">🛒</div>
          <h3>Tu carrito está vacío</h3>
          <p>Explora nuestras 4 tiendas y aprovecha descuentos mayoristas llevando 3 y 6 o más unidades.</p>
          <button class="btn-primary" id="empty-cart-explore-btn">Ir al Catálogo</button>
        </div>
      `;
      this.drawerEl.querySelector('#close-cart-btn')?.addEventListener('click', () => this.close());
      this.drawerEl.querySelector('#empty-cart-explore-btn')?.addEventListener('click', () => this.close());
      return;
    }

    this.drawerEl.innerHTML = `
      <div class="cart-header">
        <div class="cart-title-row">
          <h2 class="cart-title">Tu Carrito (${count} ítems)</h2>
          <button class="cart-close-btn" id="close-cart-btn" aria-label="Cerrar carrito">✕</button>
        </div>
        <div class="cart-shipping-notice">
          🚚 <strong>1 Solo Despacho</strong> para todos los departamentos
        </div>
      </div>

      <div class="cart-items-list">
        ${totals.lineas.map(line => this.renderItemRow(line)).join('')}
      </div>

      <div class="cart-footer">
        <div class="cart-summary-box">
          <div class="summary-line">
            <span>Subtotal Retail (Base):</span>
            <span class="strikethrough-base">${PriceEngine.formatCLP(totals.subtotalRetail)}</span>
          </div>
          ${totals.ahorroTotal > 0 ? `
            <div class="summary-line savings-line">
              <span>🎉 Ahorro Mayorista Total:</span>
              <span class="savings-amount">-${PriceEngine.formatCLP(totals.ahorroTotal)} (${totals.porcentajeAhorroGlobal}%)</span>
            </div>
          ` : ''}
          <div class="summary-line total-line">
            <span>Total Definitivo:</span>
            <span class="total-amount">${PriceEngine.formatCLP(totals.totalPagar)}</span>
          </div>
        </div>

        <div class="cart-checkout-actions">
          <button class="btn-checkout-primary" id="btn-proceed-checkout">
            <span>Finalizar Compra Directa</span>
            <span class="btn-price">${PriceEngine.formatCLP(totals.totalPagar)}</span>
          </button>
          <button class="btn-clear-cart" id="btn-clear-cart-all">
            Vaciar Carrito
          </button>
        </div>
      </div>
    `;

    this.attachDrawerEvents();
  }

  renderItemRow(line) {
    const { pricing } = line;
    return `
      <div class="cart-item-card" data-sku="${line.sku}">
        <img src="${line.imagen_url}" alt="${line.nombre}" class="cart-item-img" />
        <div class="cart-item-info">
          <div class="cart-item-top">
            <span class="cart-item-category ${line.categoria_tienda.toLowerCase()}">${line.categoria_tienda}</span>
            <button class="cart-item-remove-btn" data-sku="${line.sku}" title="Eliminar producto">✕</button>
          </div>
          <h3 class="cart-item-title">${line.nombre}</h3>
          
          <div class="cart-item-tier-badge ${pricing.tramoAplicado >= 3 ? 'active' : ''}">
            ${pricing.tramoAplicado === 6 
              ? '👑 Tramo Súper Mayorista (6+ u.)' 
              : pricing.tramoAplicado === 3 
                ? '⭐ Tramo Mayorista (3-5 u.)' 
                : 'Retail (1-2 u.)'}
          </div>

          <div class="cart-item-pricing-row">
            <div class="cart-item-stepper">
              <button class="cart-qty-btn dec" data-sku="${line.sku}">-</button>
              <input type="number" class="cart-qty-input" data-sku="${line.sku}" value="${line.cantidad}" min="1" />
              <button class="cart-qty-btn inc" data-sku="${line.sku}">+</button>
            </div>
            <div class="cart-item-prices">
              <span class="unit-charge">${PriceEngine.formatCLP(pricing.precioUnitarioCobrado)} /u</span>
              <span class="line-subtotal">${PriceEngine.formatCLP(pricing.subtotalCobrado)}</span>
            </div>
          </div>

          ${pricing.siguienteTramo ? `
            <button class="jump-tier-btn" data-sku="${line.sku}">
              ⚡ Sube a ${pricing.siguienteTramo.umbral} u. y paga ${PriceEngine.formatCLP(pricing.siguienteTramo.precioUnitario)}/u
            </button>
          ` : ''}

          ${pricing.ahorroMonetario > 0 ? `
            <div class="line-savings-tag">
              Ahorras ${PriceEngine.formatCLP(pricing.ahorroMonetario)} (-${pricing.porcentajeDescuento}%)
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  attachEvents() {
    this.backdropEl?.addEventListener('click', () => this.close());
  }

  attachDrawerEvents() {
    this.drawerEl.querySelector('#close-cart-btn')?.addEventListener('click', () => this.close());

    // Botones de cantidad
    this.drawerEl.querySelectorAll('.cart-qty-btn.dec').forEach(btn => {
      btn.addEventListener('click', () => {
        const sku = btn.dataset.sku;
        const item = cartStore.getItems().find(i => i.sku === sku);
        if (item) cartStore.updateQuantity(sku, item.cantidad - 1);
      });
    });

    this.drawerEl.querySelectorAll('.cart-qty-btn.inc').forEach(btn => {
      btn.addEventListener('click', () => {
        const sku = btn.dataset.sku;
        const item = cartStore.getItems().find(i => i.sku === sku);
        if (item) cartStore.updateQuantity(sku, item.cantidad + 1);
      });
    });

    this.drawerEl.querySelectorAll('.cart-qty-input').forEach(input => {
      input.addEventListener('change', (e) => {
        const sku = input.dataset.sku;
        cartStore.updateQuantity(sku, e.target.value);
      });
    });

    // Subir de tramo rápido
    this.drawerEl.querySelectorAll('.jump-tier-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const sku = btn.dataset.sku;
        cartStore.jumpToNextTier(sku);
      });
    });

    // Eliminar producto
    this.drawerEl.querySelectorAll('.cart-item-remove-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const sku = btn.dataset.sku;
        cartStore.removeItem(sku);
      });
    });

    // Vaciar carrito
    this.drawerEl.querySelector('#btn-clear-cart-all')?.addEventListener('click', () => {
      if (confirm('¿Deseas vaciar todos los artículos de tu carrito?')) {
        cartStore.clear();
      }
    });

    // Proceder al checkout
    this.drawerEl.querySelector('#btn-proceed-checkout')?.addEventListener('click', () => {
      this.close();
      window.dispatchEvent(new CustomEvent('supermarket:open-checkout'));
      window.dispatchEvent(new CustomEvent('megasuper:open-checkout'));
    });
  }
}

export const cartDrawer = new CartDrawer();
