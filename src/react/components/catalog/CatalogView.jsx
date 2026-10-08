import React from 'react';
import { useCatalog } from '../../context/CatalogContext.jsx';
import CategoryNav from './CategoryNav.jsx';
import SearchBar from './SearchBar.jsx';
import ProductCard from './ProductCard.jsx';

export default function CatalogView() {
  const { filteredProducts, isLoading, error, refreshCatalog } = useCatalog();

  return (
    <div className="catalog-view" id="catalog-view-root">
      {/* Hero Banner Comercial */}
      <div 
        className="p-4 p-md-5 mb-4 rounded-4 text-white position-relative overflow-hidden" 
        style={{ 
          background: 'radial-gradient(circle at top right, rgba(13, 110, 253, 0.25), transparent 70%), linear-gradient(135deg, #162032 0%, #0b0f17 100%)',
          border: '1px solid #2a354c'
        }}
      >
        <div className="container-fluid py-2">
          <span className="badge bg-primary px-3 py-2 rounded-pill mb-2 text-uppercase fw-bold">
            <i className="bi bi-tag-fill me-1"></i> Precios Mayoristas para Todos
          </span>
          <h1 className="display-6 fw-extrabold mb-3">
            Cuatro Tiendas en un Solo Pedido y un Único Despacho
          </h1>
          <p className="col-lg-8 fs-6 text-secondary mb-3">
            Explora nuestro catálogo unificado de <strong>Abarrotes</strong>, <strong>Bebidas</strong>, <strong>Aseo</strong> y <strong>Disfraces</strong>. Ahorra automáticamente hasta un <strong>30% de descuento</strong> al llevar por volumen (3 y 6+ unidades). Cobertura garantizada en toda la Región Metropolitana.
          </p>

          <div className="d-flex flex-wrap gap-3 text-secondary small">
            <div><i className="bi bi-check-circle-fill text-success me-1"></i> Sin mínimo de compra</div>
            <div><i className="bi bi-check-circle-fill text-success me-1"></i> Precios transparentes en $ CLP</div>
            <div><i className="bi bi-check-circle-fill text-success me-1"></i> Entrega en 24 a 48 hrs en Santiago</div>
          </div>
        </div>
      </div>

      {/* Selector de Categorías y Buscador */}
      <CategoryNav />
      <SearchBar />

      {/* Rejilla de Productos */}
      {isLoading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando catálogo...</span>
          </div>
          <p className="text-secondary mt-3">Sincronizando productos con la base de datos relacional...</p>
        </div>
      ) : error ? (
        <div className="alert alert-danger text-center p-4">
          <i className="bi bi-exclamation-triangle-fill fs-3 mb-2 d-block"></i>
          <h5>Error al cargar el catálogo</h5>
          <p className="mb-3">{error}</p>
          <button className="btn btn-outline-danger" onClick={refreshCatalog}>
            Reintentar
          </button>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-5 bg-dark rounded-3 border border-secondary p-4">
          <i className="bi bi-search text-secondary display-4 d-block mb-3"></i>
          <h4 className="text-white">No encontramos productos coincidentes</h4>
          <p className="text-secondary">Intenta buscar con otros términos o cambia la categoría seleccionada.</p>
        </div>
      ) : (
        <div className="row g-4" id="products-grid">
          {filteredProducts.map(product => (
            <ProductCard key={product.sku} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
