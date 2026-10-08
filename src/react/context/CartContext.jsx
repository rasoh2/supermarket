import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { PriceEngine } from '../../core/price-engine.js';

const CartContext = createContext(null);
const CART_STORAGE_KEY = 'sm_cart_v1';

export function CartProvider({ children }) {
  // Cargar estado inicial desde LocalStorage
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY) || localStorage.getItem('megasuper_cart');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : (parsed.items || []);
      }
      return [];
    } catch {
      return [];
    }
  });

  const [isOpen, setIsOpen] = useState(false);

  // Persistir en LocalStorage en cada cambio de items
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      // Compatibilidad con test runners y storage antiguo
      localStorage.setItem('megasuper_cart', JSON.stringify(items));
    } catch (e) {
      console.error('[CartContext] Error guardando carrito en LocalStorage:', e);
    }
  }, [items]);

  // Cálculos consolidados y reactivos del carrito
  const cartSummary = useMemo(() => {
    return PriceEngine.calculateCartTotals(items);
  }, [items]);

  const addItem = useCallback((product, quantity = 1) => {
    const qty = Math.max(1, parseInt(quantity, 10) || 1);
    setItems(prevItems => {
      const existingIndex = prevItems.findIndex(i => i.sku === product.sku);
      if (existingIndex > -1) {
        const updated = [...prevItems];
        const newQty = updated[existingIndex].cantidad + qty;
        const finalQty = product.stock_actual ? Math.min(newQty, product.stock_actual) : newQty;
        updated[existingIndex] = {
          ...updated[existingIndex],
          cantidad: finalQty,
          tramos: product.tramos || updated[existingIndex].tramos
        };
        return updated;
      } else {
        const finalQty = product.stock_actual ? Math.min(qty, product.stock_actual) : qty;
        return [
          ...prevItems,
          {
            id: product.id || product.id_producto,
            sku: product.sku,
            nombre: product.nombre,
            categoria: product.categoria_tienda || product.categoria,
            imagen_url: product.imagen_url,
            stock: product.stock_actual || product.stock || 999,
            cantidad: finalQty,
            tramos: product.tramos || []
          }
        ];
      }
    });
  }, []);

  const updateQuantity = useCallback((sku, newQuantity) => {
    const qty = parseInt(newQuantity, 10);
    setItems(prevItems => {
      if (isNaN(qty) || qty <= 0) {
        return prevItems.filter(i => i.sku !== sku);
      }
      return prevItems.map(item => {
        if (item.sku === sku) {
          const maxStock = item.stock || 999;
          return { ...item, cantidad: Math.min(qty, maxStock) };
        }
        return item;
      });
    });
  }, []);

  const removeItem = useCallback((sku) => {
    setItems(prevItems => prevItems.filter(i => i.sku !== sku));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const toggleCart = useCallback(() => setIsOpen(prev => !prev), []);

  const value = {
    items: cartSummary.lineas || [],
    rawItems: items,
    subtotalRetail: cartSummary.subtotalRetail,
    totalPagar: cartSummary.totalPagar,
    ahorroTotal: cartSummary.ahorroTotal,
    porcentajeAhorro: cartSummary.porcentajeAhorroGlobal,
    totalUnidades: cartSummary.totalUnidades,
    isOpen,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    openCart,
    closeCart,
    toggleCart,
    formatCLP: PriceEngine.formatCLP
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe ser utilizado dentro de un CartProvider');
  }
  return context;
}
