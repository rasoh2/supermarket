# Implementation Plan: Migración de Frontend a React con Bootstrap 5

**Branch**: `002-description-migracion-react` | **Date**: 2026-10-08 | **Spec**: [spec.md](file:///c:/Users/sebas/Desktop/megasuper/specs/002-description-migracion-react/spec.md)

**Input**: Feature specification from `specs/002-description-migracion-react/spec.md`

## Summary

Migrar la capa de presentación de la plataforma **SuperMarket.cl** desde Vanilla JavaScript hacia una arquitectura moderna de **Single Page Application (SPA) basada en React 18/19 y Bootstrap 5.3**. Esta migración preserva íntegramente el backend en Node.js con SQLite 3FN (`server/server.js`, `data/supermarket.db`), el cálculo determinista de tarifas por tramos de volumen (1-2u, 3-5u, 6+u), la calculadora de ahorro en pesos chilenos ($ CLP), la persistencia del carrito en LocalStorage, la pasarela de pedidos hacia WhatsApp Gateway y el estricto cumplimiento del rol del **Super Admin (CU-13)** enfocado exclusivamente en la gestión de cuentas internas y auditoría SIEM (CU-12).

## Technical Context

**Language/Version**: JavaScript ES2024 / Node.js 20+ (con `node:sqlite` nativo) y React 18/19 con JSX.  
**Primary Dependencies**: `react`, `react-dom`, `bootstrap` (5.3.3), `bootstrap-icons` (1.11.3), empaquetador `vite` (^5.4.0) con `@vitejs/plugin-react`.  
**Storage**: SQLite relacional en Tercera Forma Normal (3FN) en `data/supermarket.db` para el backend; `LocalStorage` para el carrito de compras en el frontend.  
**Testing**: Suite automatizada con `tests/cli-test-runner.js`, `tests/test-admin-view.js` y `tests/test-sqlite-api.js` (100% aprobación en CP-01 a CP-13 y pruebas relacionales).  
**Target Platform**: Navegadores modernos (Chrome, Firefox, Safari, Edge) con diseño elástico Mobile-First (320px hasta 4K) y servidor Node.js en Windows / Linux.  
**Project Type**: Full-Stack Web Application (SPA React + REST API Node.js).  
**Performance Goals**: First Contentful Paint (FCP) < 1.2 segundos; cálculo determinista de tramos y ahorro < 1 ms; tiempo de arranque HMR en Vite < 300 ms.  
**Constraints**: 
- Mantener 100% de compatibilidad con los endpoints existentes en `/api/*`.
- Ninguna ruptura en las pruebas de integración existentes.
- Aislamiento estricto del Super Admin (solo gestión de cuentas CU-13 y SIEM CU-12, sin acceso a inventario ni despachos).
- Respetar directrices de accesibilidad WCAG 2.1 AA y sanitización WAF contra XSS/SQLi.  
**Scale/Scope**: 17 productos iniciales, 4 categorías, 51 tramos mayoristas, 4 roles de usuario RBAC.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio Constitucional | Estado | Cumplimiento en el Plan |
| :--- | :--- | :--- |
| **I. Arquitectura Multitienda 4 en 1 Unificada** | **PASS** | Mantiene las 4 categorías (Abarrotes, Bebidas, Aseo, Disfraces) en un catálogo unificado con selector Bootstrap. |
| **II. Precios por Tramo Mayorista Deterministas** | **PASS** | Motor `PriceEngine` y `CartContext` calculan tramos (1-2u, 3-5u, 6+u) y ahorro instantáneo en $ CLP. |
| **III. Guest Browsing y Persistencia Reactiva** | **PASS** | Navegación pública sin registro forzado; `CartContext` sincroniza con `LocalStorage`. |
| **IV. Integridad Relacional Estricta en 3FN** | **PASS** | Backend SQLite (`supermarket.db`) inalterado con sus 9 entidades cardinales; consumo vía API REST. |
| **V. Seguridad en Profundidad, RBAC y SIEM** | **PASS** | Super Admin restringido a CU-13/CU-12; sanitización WAF en inputs; rate-limiting de 15 intentos en login. |
| **VI. Rendimiento, Usabilidad y Accesibilidad** | **PASS** | Sistema de rejilla Bootstrap 5 adaptativo Mobile-First (320px a 4K) con contraste verificado AA. |

## Project Structure

### Documentation (this feature)

```text
specs/002-description-migracion-react/
├── spec.md              # Especificación funcional de la migración
├── plan.md              # Este plan de implementación
├── research.md          # Fase 0: Decisiones tecnológicas (Vite + React + Bootstrap)
├── data-model.md        # Fase 1: Entidades del dominio y modelos de estado React
├── contracts/           # Fase 1: Contratos de interfaz
│   ├── frontend-api-contract.md # Endpoints REST consumidos
│   └── component-contracts.md   # Contratos de componentes React y Contextos
├── quickstart.md        # Fase 1: Guía rápida de validación y despliegue
└── tasks.md             # Fase 2: Tareas atómicas de implementación
```

### Source Code (repository root)

```text
c:\Users\sebas\Desktop\megasuper\
├── data/
│   └── supermarket.db              # Base de datos relacional SQLite (3FN)
├── server/
│   ├── db.js                       # Driver y esquema relacional en node:sqlite
│   └── server.js                   # API REST y servidor de producción (sirve dist/)
├── src/
│   ├── core/                       # Lógica de dominio pura (Clean Architecture)
│   │   ├── price-engine.js         # Motor determinista de tramos mayoristas
│   │   ├── auth-service.js         # Gobernanza de usuarios y roles RBAC
│   │   ├── cart-store.js           # Estado y persistencia del carrito
│   │   ├── waf-engine.js           # Sanitizador de seguridad anti inyecciones
│   │   └── api-sync.js             # Conexión con endpoints REST
│   └── react/                      # Capa de presentación React + Bootstrap
│       ├── main.jsx                # Punto de entrada de React con createRoot
│       ├── App.jsx                 # Orquestador con React Context Providers
│       ├── context/
│       │   ├── CartContext.jsx     # Proveedor de estado global de carrito
│       │   ├── AuthContext.jsx     # Proveedor de autenticación y rol RBAC
│       │   └── CatalogContext.jsx  # Proveedor de catálogo y filtros
│       ├── components/
│       │   ├── common/
│       │   │   ├── Navbar.jsx      # Barra de navegación con badge y toggles
│       │   │   └── Footer.jsx      # Pie de página comercial y cobertura RM
│       │   ├── catalog/
│       │   │   ├── CatalogView.jsx # Vista de catálogo principal
│       │   │   ├── CategoryNav.jsx # Selector de categorías con pills Bootstrap
│       │   │   ├── SearchBar.jsx   # Input de búsqueda interactiva
│       │   │   └── ProductCard.jsx # Tarjeta de producto con tramos y selector
│       │   ├── cart/
│       │   │   ├── CartDrawer.jsx  # Offcanvas lateral con resumen y progreso
│       │   │   └── CartItemRow.jsx # Fila de producto con botones +/-
│       │   ├── checkout/
│       │   │   └── CheckoutModal.jsx # Modal de despacho y WhatsApp Gateway
│       │   └── admin/
│       │       ├── AdminView.jsx   # Enrutador de panel administrativo
│       │       ├── LoginForm.jsx   # Formulario de inicio de sesión con JWT
│       │       ├── UsersTab.jsx    # Super Admin CU-13: Gestión de usuarios
│       │       ├── AddUserModal.jsx # Modal para agregar nuevo usuario
│       │       ├── EditUserModal.jsx # Modal para modificar usuario
│       │       ├── SecurityTab.jsx # CU-12: Bitácora SIEM inmutable
│       │       ├── InventoryTab.jsx # Admin Tienda: Kardex y ajustes
│       │       ├── DispatchTab.jsx # Despachador: Estados de entrega
│       │       └── MetricsTab.jsx  # Admin Tienda: KPIs comerciales (AOV/CR)
│       └── styles/
│           └── custom-bootstrap.css # Personalizaciones estéticas para SuperMarket
├── index.html                      # Contenedor raíz para Vite y React
├── vite.config.js                  # Configuración de compilador Vite y proxy API
├── package.json                    # Dependencias y scripts de npm
└── tests/                          # Suites de validación automatizadas
    ├── cli-test-runner.js
    ├── test-admin-view.js
    └── test-sqlite-api.js
```

**Structure Decision**: Se adopta una arquitectura desacoplada donde el código de React reside en `src/react/` apoyado por el motor de dominio existente en `src/core/`. Vite se encarga de la compilación rápida y HMR durante el desarrollo, empaquetando hacia `dist/`, el cual es servido de forma nativa por `server/server.js` en entornos de producción.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
| :--- | :--- | :--- |
| *Ninguna violación* | N/A | La arquitectura se apega 100% a la constitución y principios del proyecto. |
