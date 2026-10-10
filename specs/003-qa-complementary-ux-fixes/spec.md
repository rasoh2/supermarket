# Feature Specification: Correcciones Complementarias de QA (Informe Peter Cañarte)

**ID**: `003-qa-complementary-ux-fixes`  
**Autor**: Equipo de Desarrollo & QA SuperMarket  
**Fecha**: Octubre 2026  
**Estado**: EN IMPLEMENTACIÓN  

---

## 1. Contexto y Objetivos

A raíz del **Informe Complementario de Control de Calidad (QA)** emitido por el integrante Peter Cañarte, se identificaron 5 observaciones prioritarias relativas a la consistencia visual del catálogo, navegación interactiva, claridad comercial de productos, validación de autenticación administrativa y cobertura completa de despacho en la Región Metropolitana.

El objetivo de esta especificación es resolver integralmente los 5 hallazgos garantizando la coherencia entre el frontend (React y Vanilla), los datos semilla (`catalog.json`) y la base de datos SQLite relacional (`supermarket.db`).

---

## 2. Requerimientos Funcionales y de UX

### RF-01: Corrección de Imágenes Desalineadas en el Catálogo
- **Problema**: Productos como el "Bidón de agua" (`BE-003`, `BE-009`, `BE-042`) enlazaban a una imagen de verduras/lechugas de Unsplash (`photo-1548839140-29a749e1bc4e`).
- **Criterio de Aceptación**: Todos los productos de la categoría Bebidas/Agua deben contar con imágenes fotográficas de alta resolución correspondientes a botellas de agua mineral y botellones/bidones de agua purificada cristalina.

### RF-02: Navegación y Acción Visible del Botón "Catálogo"
- **Problema**: Al presionar "Catálogo", los usuarios en la vista principal no percibían ninguna respuesta visual interactiva.
- **Criterio de Aceptación**:
  1. Si el usuario está en el Panel de Administración u otra vista, redirigir inmediatamente a la vista del catálogo.
  2. Si el usuario ya está en el catálogo, resetear los filtros de búsqueda y categoría (volver a "TODOS" y limpiar campo de búsqueda) y hacer un scroll suave (`smooth scroll`) hacia la grilla de productos (`#catalog-grid-top`).
  3. Proveer feedback activo en el botón y barra de navegación.

### RF-03: Nombres Comerciales Claros y Naturales en Productos
- **Problema**: Varios productos presentaban nombres descriptivos genéricos como "Bebida Gaseosa Cola 2.5 Litros", poco familiares para los compradores de supermercado.
- **Criterio de Aceptación**: Actualizar los nombres en el catálogo y base de datos con denominaciones comerciales reconocidas y formatos precisos (ej. "Bebida Coca-Cola Original 2.5 L", "Bebida Sprite Lima-Limón 2.5 L", "Bebida Fanta Naranja 2.5 L", "Arroz Tucapel Grado 1 1 kg", etc.), manteniendo siempre las características técnicas verificadas.

### RF-04: Verificación Formal de Seguridad y Autenticación del Panel Admin
- **Problema**: Sospecha de ingreso sin contraseña o retención de sesión.
- **Criterio de Aceptación**:
  1. Eliminar placeholders confusos que imiten contraseñas pre-escritas.
  2. Verificar que en modo incógnito/sesión limpia, toda ruta interna y endpoint `/api/admin/*` requiera autenticación obligatoria (HTTP 401).
  3. Documentar y certificar las pruebas de autenticación.

### RF-05: Cobertura Completa de 52 Comunas RM en Formulario de Despacho
- **Problema**: El checkout de la versión HTML vanilla solo incluía 25 comunas urbanas, omitiendo comunas rurales y periurbanas de las provincias de Melipilla, Talagante, Chacabuco, Maipo y Cordillera, a pesar de anunciar cobertura en toda la RM.
- **Criterio de Aceptación**:
  1. Integrar el listado oficial completo de las 52 comunas de la Región Metropolitana tanto en React (`inputSanitizer.js`) como en la interfaz HTML vanilla (`checkout-modal.js`).
  2. Ordenar alfabéticamente el selector para facilitar la selección al usuario.
