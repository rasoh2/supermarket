import React, { useState, useEffect } from 'react';
import { useCatalog } from '../../context/CatalogContext.jsx';
import CategoryNav from './CategoryNav.jsx';
import SearchBar from './SearchBar.jsx';
import ProductCard from './ProductCard.jsx';

export default function CatalogView() {
  const { filteredProducts, isLoading, error, refreshCatalog, selectedCategory, searchQuery } = useCatalog();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Reiniciar a la primera página cuando cambie la categoría, búsqueda o lista
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery, filteredProducts.length]);

  const totalProducts = filteredProducts.length;
  const totalPages = Math.ceil(totalProducts / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalProducts);
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    const anchor = document.getElementById('catalog-grid-top');
    if (anchor) {
      anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Generar ventana de páginas visibles (máximo 5 botones numerados)
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let p = start; p <= end; p++) {
      pages.push(p);
    }
    return pages;
  };

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
            Explora nuestro catálogo unificado de <strong>Abarrotes</strong>, <strong>Bebidas</strong>, <strong>Aseo</strong> y <strong>Disfraces</strong> con varios productos. Ahorra automáticamente hasta un <strong>30% de descuento</strong> al llevar por volumen (3 y 6+ unidades). Cobertura garantizada en toda la Región Metropolitana.
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

      {/* Ancla para auto-scroll al paginar */}
      <div id="catalog-grid-top"></div>

      {/* Rejilla de Productos con Paginación */}
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
        <>
          {/* Barra de Información de Paginación Superior */}
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 p-2 px-3 bg-dark bg-opacity-50 rounded-3 border border-secondary border-opacity-25">
            <div className="text-secondary small">
              Mostrando <strong className="text-white">{startIndex + 1} - {endIndex}</strong> de <strong className="text-white">{totalProducts}</strong> productos
              {selectedCategory !== 'TODOS' && (
                <span className="badge bg-primary bg-opacity-25 text-primary ms-2 border border-primary border-opacity-25">
                  {selectedCategory}
                </span>
              )}
            </div>

            <div className="d-flex align-items-center gap-2 small text-secondary">
              <span>Por página:</span>
              <div className="btn-group btn-group-sm" role="group">
                {[12, 24, 48].map(qty => (
                  <button
                    key={qty}
                    type="button"
                    className={`btn ${itemsPerPage === qty ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => {
                      setItemsPerPage(qty);
                      setCurrentPage(1);
                    }}
                  >
                    {qty}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Grilla de Productos de la Página Actual */}
          <div className="row g-4" id="products-grid">
            {currentProducts.map(product => (
              <ProductCard key={product.sku} product={product} />
            ))}
          </div>

          {/* Barra de Controles de Paginación Inferior */}
          {totalPages > 1 && (
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center mt-5 p-3 bg-dark bg-opacity-75 rounded-4 border border-secondary border-opacity-25 shadow-sm gap-3">
              <div className="text-secondary small">
                Página <strong className="text-white">{currentPage}</strong> de <strong className="text-white">{totalPages}</strong>
              </div>

              <nav aria-label="Navegación de páginas del catálogo">
                <ul className="pagination pagination-sm mb-0 flex-wrap justify-content-center">
                  {/* Botón Primera */}
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button 
                      className="page-link bg-dark text-white border-secondary"
                      onClick={() => goToPage(1)}
                      disabled={currentPage === 1}
                      title="Primera página"
                    >
                      <i className="bi bi-chevron-double-left"></i>
                    </button>
                  </li>

                  {/* Botón Anterior */}
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button 
                      className="page-link bg-dark text-white border-secondary"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      title="Página anterior"
                    >
                      <i className="bi bi-chevron-left me-1"></i> Anterior
                    </button>
                  </li>

                  {/* Números de Página */}
                  {getPageNumbers().map(p => (
                    <li key={p} className={`page-item ${currentPage === p ? 'active' : ''}`}>
                      <button 
                        className={`page-link border-secondary ${currentPage === p ? 'bg-primary text-white border-primary fw-bold' : 'bg-dark text-white'}`}
                        onClick={() => goToPage(p)}
                      >
                        {p}
                      </button>
                    </li>
                  ))}

                  {/* Botón Siguiente */}
                  <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button 
                      className="page-link bg-dark text-white border-secondary"
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      title="Página siguiente"
                    >
                      Siguiente <i className="bi bi-chevron-right ms-1"></i>
                    </button>
                  </li>

                  {/* Botón Última */}
                  <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button 
                      className="page-link bg-dark text-white border-secondary"
                      onClick={() => goToPage(totalPages)}
                      disabled={currentPage === totalPages}
                      title="Última página"
                    >
                      <i className="bi bi-chevron-double-right"></i>
                    </button>
                  </li>
                </ul>
              </nav>

              <div className="text-secondary small d-none d-md-block">
                Total: <strong className="text-primary">{totalProducts}</strong> productos
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
