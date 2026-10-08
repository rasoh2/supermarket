import React from 'react';
import { useCatalog } from '../../context/CatalogContext.jsx';

export default function SearchBar() {
  const { searchQuery, setSearch, filteredProducts } = useCatalog();

  return (
    <div className="row justify-content-center mb-4">
      <div className="col-12 col-md-8 col-lg-6">
        <div className="input-group">
          <span className="input-group-text bg-dark border-secondary text-secondary">
            <i className="bi bi-search"></i>
          </span>
          <input
            id="catalog-search-input"
            type="text"
            className="form-control form-control-dark"
            placeholder="Buscar por producto, marca o código SKU..."
            value={searchQuery}
            onChange={(e) => setSearch(e.target.value)}
          />
          {searchQuery && (
            <button
              className="btn btn-outline-secondary"
              type="button"
              onClick={() => setSearch('')}
              title="Limpiar búsqueda"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          )}
        </div>
        <div className="d-flex justify-content-between align-items-center mt-2 px-1">
          <small className="text-secondary">
            {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''} disponible{filteredProducts.length !== 1 ? 's' : ''}
          </small>
          {searchQuery && (
            <small className="text-info">
              Filtrando por: "{searchQuery}"
            </small>
          )}
        </div>
      </div>
    </div>
  );
}
