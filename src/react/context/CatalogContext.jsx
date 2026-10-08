import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { apiClient } from '../services/apiClient.js';

const CatalogContext = createContext(null);

export function CatalogProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('TODOS');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCatalog = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.getCatalog('TODOS');
      if (Array.isArray(data)) {
        setProducts(data);
      } else if (data?.productos && Array.isArray(data.productos)) {
        setProducts(data.productos);
      } else {
        // Fallback a catalog.json si el formato difiere
        const fallbackRes = await fetch('/src/data/catalog.json');
        const fallbackData = await fallbackRes.json();
        setProducts(fallbackData.productos || fallbackData || []);
      }
    } catch (err) {
      console.warn('[CatalogContext] Error cargando de API, intentando fallback estático:', err);
      try {
        const fallbackRes = await fetch('/src/data/catalog.json');
        const fallbackData = await fallbackRes.json();
        setProducts(fallbackData.productos || fallbackData || []);
      } catch (fbErr) {
        setError('No se pudo cargar el catálogo de productos.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  const categories = useMemo(() => {
    const set = new Set();
    products.forEach(p => {
      if (p.categoria_tienda) set.add(p.categoria_tienda);
      else if (p.categoria) set.add(p.categoria);
    });
    return ['TODOS', ...Array.from(set)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const cat = product.categoria_tienda || product.categoria;
      const matchesCategory = selectedCategory === 'TODOS' || cat === selectedCategory;

      const q = searchQuery.trim().toLowerCase();
      const matchesSearch = !q ||
        product.nombre?.toLowerCase().includes(q) ||
        product.descripcion?.toLowerCase().includes(q) ||
        product.sku?.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const value = {
    products,
    filteredProducts,
    categories,
    selectedCategory,
    searchQuery,
    isLoading,
    error,
    setCategory: setSelectedCategory,
    setSearch: setSearchQuery,
    refreshCatalog: fetchCatalog
  };

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const context = useContext(CatalogContext);
  if (!context) {
    throw new Error('useCatalog debe ser utilizado dentro de un CatalogProvider');
  }
  return context;
}
