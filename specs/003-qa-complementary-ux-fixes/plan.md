# Implementation Plan: Correcciones Complementarias de QA

**Feature**: `003-qa-complementary-ux-fixes`  
**Fase**: Planificación Técnica  

---

## 1. Arquitectura de Cambios

```
[src/data/catalog.json] <-------+
                                |--> [server/db.js] --> [data/supermarket.db (PRODUCTO)]
[src/react/context/CatalogContext.jsx]
        ^
        |-- resetFilters() & scroll
[src/react/components/common/Navbar.jsx]

[src/ui/checkout-modal.js] <--- 52 Comunas de la RM
[src/react/utils/inputSanitizer.js] <--- 52 Comunas de la RM
```

---

## 2. Plan de Acción por Componente

### Paso 1: Normalización de Catálogo e Imágenes (Puntos 3.1 y 3.3)
1. Modificar `src/data/catalog.json`:
   - Corregir `BE-003`, `BE-009` y `BE-042` con URLs de Unsplash de botellas/bidones de agua pura.
   - Renombrar productos genéricos a sus nombres comerciales naturales ("Bebida Coca-Cola Original 2.5 L", "Bebida Sprite Lima-Limón 2.5 L", "Bebida Fanta Naranja 2.5 L", "Agua Mineral Cachantun sin Gas 1.5 L", etc.).
2. Crear script de migración/sincronización a SQLite (`data/supermarket.db`) para actualizar la tabla `PRODUCTO` en caliente con los nuevos nombres e imágenes.

### Paso 2: Interactividad del Botón "Catálogo" (Punto 3.2)
1. En `src/react/context/CatalogContext.jsx`:
   - Exportar función `resetFilters()` que limpie `searchQuery` y establezca `selectedCategory` a `'TODOS'`.
2. En `src/react/components/common/Navbar.jsx`:
   - Al pulsar "Catálogo":
     - Llamar a `resetFilters()`.
     - Si la vista actual es `catalog`, hacer scroll al inicio del catálogo (`#catalog-grid-top` o `#catalog-view-root`).
     - Si la vista es distinta, navegar a `catalog`.
3. En `src/app.js` (versión Vanilla):
   - Al pulsar `#nav-btn-catalog`, cambiar a la vista de catálogo y desplazar hacia arriba.

### Paso 3: Cobertura de 52 Comunas RM en Checkout (Punto 3.5)
1. En `src/ui/checkout-modal.js`:
   - Reemplazar el arreglo recortado `COMUNAS_SANTIAGO` (25 comunas) por el listado oficial de las 52 comunas de la RM (incluyendo Melipilla, Talagante, Chacabuco, Maipo, Cordillera).

### Paso 4: Certificación de Seguridad Panel Admin (Punto 3.4)
1. Documentar la eliminación de placeholders en `LoginForm.jsx`.
2. Validar con pruebas automatizadas que el acceso directo sin token JWT retorne HTTP 401 y que el login requiera credenciales válidas.
