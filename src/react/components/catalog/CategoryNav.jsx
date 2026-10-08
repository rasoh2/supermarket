import React from 'react';
import { useCatalog } from '../../context/CatalogContext.jsx';

const CATEGORY_ICONS = {
  TODOS: 'bi-grid-fill',
  ABARROTES: 'bi-basket2-fill',
  BEBIDAS: 'bi-cup-straw',
  ASEO: 'bi-stars',
  DISFRACES: 'bi-emoji-sunglasses-fill'
};

const CATEGORY_LABELS = {
  TODOS: 'Todas las Tiendas',
  ABARROTES: 'Abarrotes',
  BEBIDAS: 'Bebidas y Licores',
  ASEO: 'Aseo y Limpieza',
  DISFRACES: 'Disfraces y Fiestas'
};

export default function CategoryNav() {
  const { categories, selectedCategory, setCategory } = useCatalog();

  return (
    <div className="d-flex flex-wrap justify-content-center gap-2 mb-4" id="category-nav-pills">
      {categories.map(cat => {
        const isActive = selectedCategory === cat;
        const icon = CATEGORY_ICONS[cat] || 'bi-tag-fill';
        const label = CATEGORY_LABELS[cat] || cat;

        return (
          <button
            key={cat}
            type="button"
            className={`btn category-filter-btn d-flex align-items-center gap-2 ${isActive ? 'active' : ''}`}
            onClick={() => setCategory(cat)}
            id={`filter-cat-${cat.toLowerCase()}`}
          >
            <i className={`bi ${icon}`}></i>
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
