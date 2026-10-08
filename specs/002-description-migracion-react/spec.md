# Especificación de Requerimientos: Migración de Frontend a React con Bootstrap 5

**Identificador de Característica:** `002-migracion-react-bootstrap`  
**Proyecto:** SuperMarket.cl  
**Metodología:** GitHub Spec Kit (Spec-Driven Development / SDD)  
**Fecha:** Octubre 2026  
**Estado:** Planificado (Ready for Implementation)

---

## 1. Resumen Ejecutivo y Motivación

La aplicación **SuperMarket.cl** cuenta actualmente con un backend robusto en **Node.js con SQLite relacional en Tercera Forma Normal (3FN)** y una API REST completa en `/api/...`. Su frontend original en Vanilla JavaScript y CSS personalizado funciona correctamente, pero para escalar el desarrollo, mejorar la mantenibilidad de componentes y estandarizar la interfaz visual, se requiere migrar la capa de presentación a **React (v18/v19)** integrado con **Bootstrap 5 (o React-Bootstrap)**.

Esta migración conserva:
1. El 100% de los requisitos funcionales del negocio (`RF-01` a `RF-19`).
2. El backend existente en Node.js y la base de datos `supermarket.db` (SQLite 3FN).
3. La gobernanza estricta de roles UML: función específica del **Super Admin** para agregar, modificar y suspender usuarios (`CU-13`).
4. Las pruebas de caja negra y compatibilidad técnica.

---

## 2. Requerimientos Funcionales de la Migración

### RF-M01: Modularización en Componentes React
- Dividir la interfaz en componentes funcionales declarativos con Hooks (`useState`, `useEffect`, `useContext`, `useMemo`, `useCallback`).
- Estado global centralizado mediante React Context API:
  - `CartContext`: Estado del carrito, cálculo de tramos mayoristas y persistencia en `LocalStorage`.
  - `AuthContext`: Sesión activa, token JWT, rol de usuario (`SUPER_ADMIN`, `ADMIN_TIENDA`, `DESPACHADOR`) y permisos RBAC.
  - `CatalogContext`: Catálogo de productos y categorías sincronizadas con la API REST `/api/catalog`.

### RF-M02: Estandarización de Diseño con Bootstrap 5
- Utilizar el sistema de rejilla (*Grid System*: `container`, `row`, `col-12 col-md-6 col-lg-4`).
- Utilizar componentes nativos de Bootstrap:
  - `Navbar` responsiva con colapso móvil y badge dinámico de carrito.
  - `Card` para productos con badges de tramos (`bg-primary`, `bg-success`, `bg-warning`).
  - `Offcanvas` para el carrito lateral interactivo (*Cart Drawer*).
  - `Modal` para finalización de compra (*Checkout*) y formularios de Super Admin (*Agregar Usuario* / *Modificar Usuario*).
  - `Nav Tabs` / `Pills` para segmentación por categorías y navegación del Backoffice.
  - `Table` responsiva (`table-hover table-striped`) para usuarios, Kardex, despachos y bitácora SIEM.

### RF-M03: Consumo Reactivo de la API REST
- Conectar todos los componentes directamente a los endpoints del backend SQLite:
  - `GET /api/catalog` (productos y tramos).
  - `POST /api/orders` (asentamiento de pedido y pasarela WhatsApp).
  - `POST /api/auth/login` (autenticación JWT y rate limiting).
  - `GET /api/users`, `POST /api/users`, `PUT /api/users/:id`, `PATCH /api/users/:id/status` (Super Admin CU-13).
  - `GET /api/inventory/movements`, `POST /api/inventory/movements` (Kardex).
  - `GET /api/dispatch`, `PATCH /api/dispatch/:id/status` (Despachos).
  - `GET /api/metrics` (KPIs comerciales).
  - `GET /api/security/logs` (Bitácora SIEM).

### RF-M04: Cumplimiento Estricto del Rol Super Admin (CU-13)
- Cuando el usuario autenticado sea `SUPER_ADMIN`:
  - Se visualizan exclusivamente las pestañas: **Gestión de Cuentas y Accesos** y **Auditoría de Accesos**.
  - No se despliegan pestañas de tienda operativa (Inventario, Despachos, Ventas), las cuales corresponden a `ADMIN_TIENDA` y `DESPACHADOR`.
  - Componente modal funcional para agregar nuevo usuario (username, nombre completo, rol, contraseña).
  - Componente modal funcional para modificar usuario (editar datos, rol, contraseña opcional, estado activo/suspendido).
  - Botón interactivo para alternar suspensión / reactivación de cuentas.

---

## 3. Criterios de Aceptación (Definition of Done)

1. [ ] **Herramienta de Compilación:** Configurado con **Vite** para desarrollo ultrarrápido y Hot Module Replacement (HMR).
2. [ ] **Dependencias:** `react`, `react-dom`, `bootstrap`, `bootstrap-icons` (o `@popperjs/core`).
3. [ ] **Producción:** `npm run build` genera bundle estático en `dist/` servido transparentemente por `server/server.js`.
4. [ ] **Paridad Funcional:** 100% de paridad con la versión actual (cálculo de tramos, calculadora de ahorro, WhatsApp Gateway, Kardex, reversión de stock).
5. [ ] **Pruebas:** Todas las pruebas automatizadas (`npm test`) se mantienen en 100% de aprobación.
