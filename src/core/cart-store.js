/**
 * SuperMarket.cl - Gestor de Estado Reactivo del Carrito de Compras
 * Implementa persistencia en LocalStorage y reactividad según RF-05 y RNF-07
 */

import { PriceEngine } from './price-engine.js';
import { db, TABLES } from './storage.js';

const CART_STORAGE_KEY = 'supermarket_cart_state_v1';

class CartStore {
  constructor() {
    this.items = this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      const data = localStorage.getItem(CART_STORAGE_KEY) || localStorage.getItem('megasuper_cart_state_v1');
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('[CartStore] Error al cargar carrito de LocalStorage:', e);
      return [];
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(this.items));
      this.notify();
    } catch (e) {
      console.error('[CartStore] Error al guardar carrito en LocalStorage:', e);
    }
  }

  notify() {
    const totals = this.getTotals();
    window.dispatchEvent(new CustomEvent('supermarket:cart-changed', {
      detail: {
        items: this.items,
        totals
      }
    }));
    window.dispatchEvent(new CustomEvent('megasuper:cart-changed', {
      detail: {
        items: this.items,
        totals
      }
    }));
  }

  /**
   * Obtiene los tramos actuales de un producto desde la base de datos
   */
  getProductTramos(sku) {
    return db.find(TABLES.PRECIO_TRAMO, t => t.producto_sku === sku);
  }

  /**
   * Agrega un producto al carrito
   */
  addItem(product, quantity = 1) {
    const qty = Math.max(1, parseInt(quantity, 10) || 1);
    const existingIndex = this.items.findIndex(i => i.sku === product.sku);
    const tramos = this.getProductTramos(product.sku);

    if (existingIndex >= 0) {
      this.items[existingIndex].cantidad += qty;
      this.items[existingIndex].tramos = tramos;
    } else {
      this.items.push({
        sku: product.sku,
        nombre: product.nombre,
        categoria_tienda: product.categoria_tienda,
        imagen_url: product.imagen_url,
        stock_actual: product.stock_actual,
        cantidad: qty,
        tramos: tramos.length ? tramos : (product.tramos || [])
      });
    }

    this.saveToStorage();
    return this.getTotals();
  }

  /**
   * Actualiza la cantidad exacta de un producto
   */
  updateQuantity(sku, quantity) {
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      return this.removeItem(sku);
    }

    const item = this.items.find(i => i.sku === sku);
    if (item) {
      // Validar contra stock disponible
      const maxStock = item.stock_actual || 999;
      item.cantidad = Math.min(qty, maxStock);
      // Actualizar tramos por si variaron en BD
      item.tramos = this.getProductTramos(sku);
      this.saveToStorage();
    }
    return this.getTotals();
  }

  /**
   * Sube la cantidad al siguiente umbral mayorista para aprovechar el descuento
   */
  jumpToNextTier(sku) {
    const item = this.items.find(i => i.sku === sku);
    if (!item) return;

    if (item.cantidad < 3) {
      item.cantidad = 3;
    } else if (item.cantidad < 6) {
      item.cantidad = 6;
    } else {
      item.cantidad += 6;
    }

    this.saveToStorage();
    return this.getTotals();
  }

  /**
   * Elimina un producto del carrito
   */
  removeItem(sku) {
    this.items = this.items.filter(i => i.sku !== sku);
    this.saveToStorage();
    return this.getTotals();
  }

  /**
   * Vacía el carrito completamente (p.ej. al completar Checkout)
   */
  clear() {
    this.items = [];
    this.saveToStorage();
  }

  /**
   * Retorna los ítems actuales
   */
  getItems() {
    return this.items;
  }

  /**
   * Retorna los totales calculados mediante PriceEngine
   */
  getTotals() {
    // Asegurar que cada ítem tiene sus tramos actualizados
    const enrichedItems = this.items.map(item => {
      const tramos = this.getProductTramos(item.sku);
      return {
        ...item,
        tramos: tramos.length ? tramos : (item.tramos || [])
      };
    });

    return PriceEngine.calculateCartTotals(enrichedItems);
  }

  /**
   * Conteo total de artículos
   */
  getItemCount() {
    return this.items.reduce((sum, item) => sum + item.cantidad, 0);
  }
}

export const cartStore = new CartStore();
