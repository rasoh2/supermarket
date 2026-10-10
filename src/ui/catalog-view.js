/**
 * SuperMarket.cl - Catálogo Público de Productos
 * Navegación por departamentos, búsqueda y cálculo de precios mayoristas
 */

import { db, TABLES } from '../core/storage.js';
import { PriceEngine } from '../core/price-engine.js';
import { cartStore } from '../core/cart-store.js';

export class CatalogView {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.currentCategory = 'TODOS';
    this.searchQuery = '';
    this.sortOption = 'destacado';
    this.selectedQuantities = {};
  }

  init() {
    this.render();
    this.attachEvents();

    const handleUpdate = (e) => {
      if (e.detail?.table === TABLES.PRODUCTO || e.detail?.table === TABLES.PRECIO_TRAMO) {
        this.renderProductGrid();
      }
    };
    window.addEventListener('supermarket:db-updated', handleUpdate);
    window.addEventListener('megasuper:db-updated', handleUpdate);
  }

  getFilteredProducts() {
    let products = db.find(TABLES.PRODUCTO, p => p.activo !== false);

    if (this.currentCategory !== 'TODOS') {
      products = products.filter(p => p.categoria_tienda === this.currentCategory);
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      products = products.filter(p =>
        p.nombre.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.categoria_tienda.toLowerCase().includes(q) ||
        (p.descripcion && p.descripcion.toLowerCase().includes(q))
      );
    }

    if (this.sortOption === 'destacado') {
      products.sort((a, b) => (b.destacado ? 1 : 0) - (a.destacado ? 1 : 0));
    } else if (this.sortOption === 'precio-asc') {
      products.sort((a, b) => this.getBasePrice(a.sku) - this.getBasePrice(b.sku));
    } else if (this.sortOption === 'precio-desc') {
      products.sort((a, b) => this.getBasePrice(b.sku) - this.getBasePrice(a.sku));
    }

    return products;
  }

  getBasePrice(sku) {
    const tramo1 = db.findOne(TABLES.PRECIO_TRAMO, t => t.producto_sku === sku && t.tramo_umbral === 1);
    return tramo1 ? tramo1.precio_unitario : 0;
  }

  getTramos(sku) {
    return db.find(TABLES.PRECIO_TRAMO, t => t.producto_sku === sku);
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <!-- Banner Promocional de la Tienda -->
      <section class="hero-banner">
        <div class="hero-content">
          <div class="hero-tag">Santiago de Chile • Despacho a Domicilio</div>
          <h1 class="hero-title">Precios Mayoristas para Todos</h1>
          <p class="hero-subtitle">
            Compra abarrotes, bebidas, aseo y disfraces en un solo pedido.
            El precio baja automáticamente según la cantidad: <strong>1-2 u. Normal, 3-5 u. Mayorista y 6+ u. Súper Mayorista</strong>.
          </p>
          <div class="hero-badges">
            <span class="pill-badge"><i class="badge-icon">🚚</i> 1 Solo Despacho en Santiago</span>
            <span class="pill-badge"><i class="badge-icon">💰</i> Ahorro Inmediato por Cantidad</span>
            <span class="pill-badge"><i class="badge-icon">📲</i> Pedido Rápido por WhatsApp</span>
          </div>
        </div>
      </section>

      <!-- Barra de Departamentos y Búsqueda -->
      <section class="catalog-controls-bar">
        <div class="category-tabs" role="tablist">
          <button class="cat-tab ${this.currentCategory === 'TODOS' ? 'active' : ''}" data-cat="TODOS">
            <span class="tab-icon">🏪</span> Todos los Productos
          </button>
          <button class="cat-tab ${this.currentCategory === 'ABARROTES' ? 'active' : ''}" data-cat="ABARROTES">
            <span class="tab-icon">🍚</span> Abarrotes & Despensa
          </button>
          <button class="cat-tab ${this.currentCategory === 'BEBIDAS' ? 'active' : ''}" data-cat="BEBIDAS">
            <span class="tab-icon">🍾</span> Bebidas & Licores
          </button>
          <button class="cat-tab ${this.currentCategory === 'ASEO' ? 'active' : ''}" data-cat="ASEO">
            <span class="tab-icon">🧼</span> Aseo & Limpieza
          </button>
          <button class="cat-tab ${this.currentCategory === 'DISFRACES' ? 'active' : ''}" data-cat="DISFRACES">
            <span class="tab-icon">🎭</span> Disfraces & Fiestas
          </button>
        </div>

        <div class="search-sort-row">
          <div class="search-input-wrapper">
            <span class="search-icon">🔍</span>
            <input 
              type="text" 
              id="catalog-search-input" 
              class="search-input" 
              placeholder="Buscar por producto o marca (ej. Arroz, Aceite, Detergente)..." 
              value="${this.searchQuery}"
              autocomplete="off"
            />
            ${this.searchQuery ? '<button id="clear-search-btn" class="clear-btn">✕</button>' : ''}
          </div>

          <div class="sort-wrapper">
            <label for="catalog-sort-select" class="sort-label">Ordenar:</label>
            <select id="catalog-sort-select" class="sort-select">
              <option value="destacado" ${this.sortOption === 'destacado' ? 'selected' : ''}>Destacados</option>
              <option value="precio-asc" ${this.sortOption === 'precio-asc' ? 'selected' : ''}>Menor precio</option>
              <option value="precio-desc" ${this.sortOption === 'precio-desc' ? 'selected' : ''}>Mayor precio</option>
            </select>
          </div>
        </div>
      </section>

      <!-- Resumen de resultados -->
      <div class="results-meta">
        <span id="results-count-text"></span>
        <div class="wholesale-legend">
          <span class="tier-badge-pill tier-1">1-2 u. Precio Normal</span>
          <span class="tier-arrow">➔</span>
          <span class="tier-badge-pill tier-2">3-5 u. Mayorista (~15% dto.)</span>
          <span class="tier-arrow">➔</span>
          <span class="tier-badge-pill tier-3">6+ u. Distribuidor (~30% dto.)</span>
        </div>
      </div>

      <!-- Cuadrícula de Productos -->
      <section id="products-grid-container" class="products-grid"></section>
    `;

    this.renderProductGrid();
  }

  renderProductGrid() {
    const gridContainer = document.getElementById('products-grid-container');
    const countText = document.getElementById('results-count-text');
    if (!gridContainer) return;

    const products = this.getFilteredProducts();

    if (countText) {
      countText.innerHTML = `Mostrando <strong>${products.length}</strong> productos disponibles`;
    }

    if (products.length === 0) {
      gridContainer.innerHTML = `
        <div class="no-results-card">
          <div class="no-results-icon">🔎</div>
          <h3>No encontramos productos</h3>
          <p>Prueba buscando con otra palabra o revisa otra categoría.</p>
          <button id="reset-filter-btn" class="btn-primary">Ver todos los productos</button>
        </div>
      `;
      document.getElementById('reset-filter-btn')?.addEventListener('click', () => {
        this.currentCategory = 'TODOS';
        this.searchQuery = '';
        this.render();
      });
      return;
    }

    gridContainer.innerHTML = products.map(product => this.renderProductCard(product)).join('');
  }

  renderProductCard(product) {
    const tramos = this.getTramos(product.sku);
    const selectedQty = this.selectedQuantities[product.sku] || 1;
    const pricing = PriceEngine.calculateItemPricing(selectedQty, tramos);

    const tramo1 = tramos.find(t => t.tramo_umbral === 1) || { precio_unitario: 0 };
    const tramo2 = tramos.find(t => t.tramo_umbral === 3) || { precio_unitario: 0, porcentaje_descuento: 15 };
    const tramo3 = tramos.find(t => t.tramo_umbral === 6) || { precio_unitario: 0, porcentaje_descuento: 30 };

    return `
      <article class="product-card" data-sku="${product.sku}">
        <div class="product-header">
          <span class="category-pill ${product.categoria_tienda.toLowerCase()}">${product.categoria_tienda}</span>
          <span class="sku-badge">SKU: ${product.sku}</span>
          ${product.stock_actual <= 15 ? '<span class="stock-warning">Pocas unidades</span>' : ''}
        </div>

        <div class="product-image-container">
          <img 
            src="${product.imagen_url}" 
            alt="${product.nombre}" 
            class="product-image" 
            loading="lazy"
            onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'400\' height=\'300\' viewBox=\'0 0 400 300\'><rect fill=\'%231a2332\' width=\'400\' height=\'300\'/><text fill=\'%236c757d\' font-family=\'sans-serif\' font-size=\'60\' x=\'50%\' y=\'45%\' text-anchor=\'middle\'>🛒</text><text fill=\'%23adb5bd\' font-family=\'sans-serif\' font-size=\'15\' font-weight=\'bold\' x=\'50%\' y=\'70%\' text-anchor=\'middle\'>SuperMarket.cl</text></svg>'"
          />
        </div>

        <div class="product-body">
          <h2 class="product-title">${product.nombre}</h2>
          <p class="product-desc">${product.descripcion || ''}</p>

          <!-- Tabla de Precios por Tramo -->
          <div class="tier-table">
            <div class="tier-col ${pricing.tramoAplicado === 1 ? 'tier-active' : ''}">
              <span class="tier-label">1-2 u.</span>
              <span class="tier-price">${PriceEngine.formatCLP(tramo1.precio_unitario)}</span>
              <span class="tier-sub">Normal</span>
            </div>
            <div class="tier-col ${pricing.tramoAplicado === 3 ? 'tier-active' : ''}">
              <span class="tier-label">3-5 u.</span>
              <span class="tier-price">${PriceEngine.formatCLP(tramo2.precio_unitario)}</span>
              <span class="tier-discount">-${Math.round(tramo2.porcentaje_descuento)}%</span>
            </div>
            <div class="tier-col ${pricing.tramoAplicado === 6 ? 'tier-active' : ''}">
              <span class="tier-label">6+ u.</span>
              <span class="tier-price">${PriceEngine.formatCLP(tramo3.precio_unitario)}</span>
              <span class="tier-discount">-${Math.round(tramo3.porcentaje_descuento)}%</span>
            </div>
          </div>

          <!-- Selector de Cantidad y Cálculo en Vivo -->
          <div class="qty-pricing-widget">
            <div class="qty-selector-row">
              <span class="qty-label">Cantidad:</span>
              <div class="qty-stepper">
                <button class="step-btn dec-btn" data-sku="${product.sku}" aria-label="Disminuir">-</button>
                <input 
                  type="number" 
                  class="qty-input" 
                  data-sku="${product.sku}" 
                  value="${selectedQty}" 
                  min="1" 
                  max="${product.stock_actual}"
                />
                <button class="step-btn inc-btn" data-sku="${product.sku}" aria-label="Aumentar">+</button>
              </div>
            </div>

            <div class="live-calc-box">
              <div class="calc-row">
                <span class="calc-label">Precio por unidad:</span>
                <span class="calc-value highlight-unit">${PriceEngine.formatCLP(pricing.precioUnitarioCobrado)}</span>
              </div>
              <div class="calc-row">
                <span class="calc-label">Subtotal (${selectedQty} u.):</span>
                <span class="calc-value highlight-subtotal">${PriceEngine.formatCLP(pricing.subtotalCobrado)}</span>
              </div>
              ${pricing.ahorroMonetario > 0 ? `
                <div class="calc-savings-alert">
                  🎉 ¡Ahorras <strong>${PriceEngine.formatCLP(pricing.ahorroMonetario)}</strong> en este producto!
                </div>
              ` : ''}
              ${pricing.siguienteTramo ? `
                <div class="calc-next-incentive">
                  💡 Agrega <strong>${pricing.siguienteTramo.faltanUnidades} u. más</strong> para pagar sólo <strong>${PriceEngine.formatCLP(pricing.siguienteTramo.precioUnitario)}/u</strong>
                </div>
              ` : ''}
            </div>
          </div>
        </div>

        <div class="product-actions">
          <button class="btn-add-cart" data-sku="${product.sku}">
            🛒 Agregar al Carrito
          </button>
          <button class="btn-contact-vendor" data-sku="${product.sku}" title="Cotizar por mayor con un ejecutivo comercial">
            💬 Consultar por Mayor
          </button>
        </div>
      </article>
    `;
  }

  attachEvents() {
    if (!this.container) return;

    this.container.addEventListener('click', (e) => {
      const tab = e.target.closest('.cat-tab');
      if (tab) {
        this.currentCategory = tab.dataset.cat;
        this.render();
      }
    });

    let searchTimeout = null;
    this.container.addEventListener('input', (e) => {
      if (e.target.id === 'catalog-search-input') {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          this.searchQuery = e.target.value;
          this.renderProductGrid();
        }, 150);
      }
    });

    this.container.addEventListener('click', (e) => {
      if (e.target.id === 'clear-search-btn') {
        this.searchQuery = '';
        this.render();
      }
    });

    this.container.addEventListener('change', (e) => {
      if (e.target.id === 'catalog-sort-select') {
        this.sortOption = e.target.value;
        this.renderProductGrid();
      }
    });

    this.container.addEventListener('click', (e) => {
      const decBtn = e.target.closest('.dec-btn');
      const incBtn = e.target.closest('.inc-btn');

      if (decBtn) {
        const sku = decBtn.dataset.sku;
        const current = this.selectedQuantities[sku] || 1;
        if (current > 1) {
          this.selectedQuantities[sku] = current - 1;
          this.updateCardLive(sku);
        }
      }

      if (incBtn) {
        const sku = incBtn.dataset.sku;
        const current = this.selectedQuantities[sku] || 1;
        const prod = db.findOne(TABLES.PRODUCTO, p => p.sku === sku);
        const max = prod ? prod.stock_actual : 999;
        if (current < max) {
          this.selectedQuantities[sku] = current + 1;
          this.updateCardLive(sku);
        }
      }
    });

    this.container.addEventListener('change', (e) => {
      if (e.target.classList.contains('qty-input')) {
        const sku = e.target.dataset.sku;
        const prod = db.findOne(TABLES.PRODUCTO, p => p.sku === sku);
        const max = prod ? prod.stock_actual : 999;
        let val = parseInt(e.target.value, 10);
        if (isNaN(val) || val < 1) val = 1;
        if (val > max) val = max;
        this.selectedQuantities[sku] = val;
        this.updateCardLive(sku);
      }
    });

    this.container.addEventListener('click', (e) => {
      const addBtn = e.target.closest('.btn-add-cart');
      if (addBtn) {
        const sku = addBtn.dataset.sku;
        const qty = this.selectedQuantities[sku] || 1;
        const prod = db.findOne(TABLES.PRODUCTO, p => p.sku === sku);
        if (prod) {
          cartStore.addItem(prod, qty);
          addBtn.classList.add('added');
          addBtn.innerHTML = '✓ ¡Agregado!';
          setTimeout(() => {
            addBtn.classList.remove('added');
            addBtn.innerHTML = '🛒 Agregar al Carrito';
          }, 1200);
        }
      }
    });

    this.container.addEventListener('click', (e) => {
      const vendorBtn = e.target.closest('.btn-contact-vendor');
      if (vendorBtn) {
        const sku = vendorBtn.dataset.sku;
        const qty = this.selectedQuantities[sku] || 1;
        const prod = db.findOne(TABLES.PRODUCTO, p => p.sku === sku);
        if (prod) {
          this.openVendorConsultation(prod, qty);
        }
      }
    });
  }

  updateCardLive(sku) {
    const card = this.container.querySelector(`.product-card[data-sku="${sku}"]`);
    if (!card) return;

    const prod = db.findOne(TABLES.PRODUCTO, p => p.sku === sku);
    if (!prod) return;

    const tramos = this.getTramos(sku);
    const qty = this.selectedQuantities[sku] || 1;
    const pricing = PriceEngine.calculateItemPricing(qty, tramos);

    const input = card.querySelector(`.qty-input[data-sku="${sku}"]`);
    if (input && Number(input.value) !== qty) {
      input.value = qty;
    }

    const cols = card.querySelectorAll('.tier-col');
    cols.forEach(col => col.classList.remove('tier-active'));
    if (pricing.tramoAplicado === 1 && cols[0]) cols[0].classList.add('tier-active');
    if (pricing.tramoAplicado === 3 && cols[1]) cols[1].classList.add('tier-active');
    if (pricing.tramoAplicado === 6 && cols[2]) cols[2].classList.add('tier-active');

    const unitEl = card.querySelector('.highlight-unit');
    if (unitEl) unitEl.textContent = PriceEngine.formatCLP(pricing.precioUnitarioCobrado);

    const subEl = card.querySelector('.highlight-subtotal');
    if (subEl) subEl.textContent = PriceEngine.formatCLP(pricing.subtotalCobrado);

    const liveBox = card.querySelector('.live-calc-box');
    if (liveBox) {
      const existingAlert = liveBox.querySelector('.calc-savings-alert');
      if (existingAlert) existingAlert.remove();

      const existingIncentive = liveBox.querySelector('.calc-next-incentive');
      if (existingIncentive) existingIncentive.remove();

      if (pricing.ahorroMonetario > 0) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'calc-savings-alert';
        alertDiv.innerHTML = `🎉 ¡Ahorras <strong>${PriceEngine.formatCLP(pricing.ahorroMonetario)}</strong> en este producto!`;
        liveBox.appendChild(alertDiv);
      }

      if (pricing.siguienteTramo) {
        const incDiv = document.createElement('div');
        incDiv.className = 'calc-next-incentive';
        incDiv.innerHTML = `💡 Agrega <strong>${pricing.siguienteTramo.faltanUnidades} u. más</strong> para pagar sólo <strong>${PriceEngine.formatCLP(pricing.siguienteTramo.precioUnitario)}/u</strong>`;
        liveBox.appendChild(incDiv);
      }
    }
  }

  openVendorConsultation(product, quantity) {
    const tramos = this.getTramos(product.sku);
    const pricing = PriceEngine.calculateItemPricing(quantity, tramos);
    const msg = `Hola SuperMarket.cl! Quiero consultar por volumen con un vendedor:\n\n` +
      `📦 Producto: ${product.nombre} (SKU: ${product.sku})\n` +
      `🏢 Categoría: ${product.categoria_tienda}\n` +
      `🔢 Cantidad: ${quantity} unidades\n` +
      `💰 Subtotal estimado: ${PriceEngine.formatCLP(pricing.subtotalCobrado)}\n\n` +
      `¿Tienen disponibilidad y factura para entrega en Santiago?`;

    const encoded = encodeURIComponent(msg);
    const whatsappUrl = `https://wa.me/56966753705?text=${encoded}`;
    window.open(whatsappUrl, '_blank');
  }
}
