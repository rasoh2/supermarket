/**
 * SuperMarket.cl - Bootstrap Principal de la Aplicación SPA (app.js)
 * Orquestador modular Clean Architecture
 */

import { db } from './core/storage.js';
import { apiSync } from './core/api-sync.js';
import { cartStore } from './core/cart-store.js';
import { authService } from './core/auth-service.js';
import { wafEngine } from './core/waf-engine.js';
import { InventoryService } from './core/inventory-service.js';
import { OrderService } from './core/order-service.js';
import { PriceEngine } from './core/price-engine.js';

import { CatalogView } from './ui/catalog-view.js';
import { CartDrawer } from './ui/cart-drawer.js';
import { CheckoutModal } from './ui/checkout-modal.js';
import { AdminView } from './ui/admin-view.js';

class App {
  constructor() {
    this.catalogView = null;
    this.adminView = null;
    this.cartDrawer = null;
    this.checkoutModal = null;
    this.currentView = 'catalog';
  }

  async start() {
    console.log('[SuperMarket] Iniciando plataforma bajo estándar GitHub Spec Kit...');

    try {
      // 1. Cargar datos semilla del catálogo
      const response = await fetch('src/data/catalog.json');
      const catalogData = await response.json();

      // 2. Inicializar motor relacional en 3FN
      await db.init(catalogData);

      // 3. Sincronizar con backend SQLite si está disponible
      await apiSync.init();

      // 3. Inicializar vistas y componentes UI
      this.catalogView = new CatalogView('catalog-view-root');
      this.catalogView.init();

      this.adminView = new AdminView('admin-view-root');
      this.adminView.init();

      this.cartDrawer = new CartDrawer();
      this.cartDrawer.init();

      this.checkoutModal = new CheckoutModal();
      this.checkoutModal.init();

      // 4. Configurar navegación entre Catálogo y Panel Administrativo
      this.setupNavigation();

      // 5. Exponer API en ventana para verificación y pruebas automatizadas (CP-01 a CP-13)
      window.SuperMarket = {
        db,
        cartStore,
        authService,
        wafEngine,
        InventoryService,
        OrderService,
        PriceEngine,
        switchView: (view) => this.switchView(view),
        openCart: () => this.cartDrawer.open(),
        openCheckout: () => this.checkoutModal.open()
      };
      window.MEGASUPER = window.SuperMarket; // Compatibilidad de pruebas

      console.log('✓ SuperMarket.cl iniciado correctamente con arquitectura 4 en 1.');
    } catch (err) {
      console.error('[SuperMarket] Error crítico durante el inicio:', err);
    }
  }

  setupNavigation() {
    const btnCatalog = document.getElementById('nav-btn-catalog');
    const btnAdmin = document.getElementById('nav-btn-admin');
    const btnCart = document.getElementById('header-open-cart-btn');

    btnCatalog?.addEventListener('click', () => this.switchView('catalog'));
    btnAdmin?.addEventListener('click', () => this.switchView('admin'));
    btnCart?.addEventListener('click', () => this.cartDrawer.open());

    // Manejar hash inicial de la URL
    window.addEventListener('hashchange', () => this.handleHashChange());
    this.handleHashChange();
  }

  handleHashChange() {
    const hash = window.location.hash.toLowerCase();
    if (hash === '#admin') {
      this.switchView('admin');
    } else {
      this.switchView('catalog');
    }
  }

  switchView(view) {
    this.currentView = view;
    const catalogRoot = document.getElementById('catalog-view-root');
    const adminRoot = document.getElementById('admin-view-root');
    const btnCatalog = document.getElementById('nav-btn-catalog');
    const btnAdmin = document.getElementById('nav-btn-admin');

    if (view === 'catalog') {
      catalogRoot.style.display = 'block';
      adminRoot.style.display = 'none';
      btnCatalog?.classList.add('active');
      btnAdmin?.classList.remove('active');
      window.location.hash = '#catalogo';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (view === 'admin') {
      catalogRoot.style.display = 'none';
      adminRoot.style.display = 'block';
      btnCatalog?.classList.remove('active');
      btnAdmin?.classList.add('active');
      window.location.hash = '#admin';
      this.adminView?.render();
    }
  }
}

const app = new App();
document.addEventListener('DOMContentLoaded', () => {
  app.start();
});
