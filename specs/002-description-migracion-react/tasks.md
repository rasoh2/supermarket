# Tareas de Implementación: Migración a React con Bootstrap 5 (tasks.md)

**Característica:** Migración de Frontend a React con Bootstrap 5  
**Especificación:** [spec.md](file:///c:/Users/sebas/Desktop/megasuper/specs/002-description-migracion-react/spec.md)  
**Plan:** [plan.md](file:///c:/Users/sebas/Desktop/megasuper/specs/002-description-migracion-react/plan.md)  
**Fecha:** Octubre 2026  

---

## Phase 1: Setup (Infraestructura y Dependencias)

**Propósito**: Configurar el entorno de compilación Vite y las dependencias de React con Bootstrap en el proyecto.

- [x] T001 Instalar dependencias de producción y desarrollo (`react`, `react-dom`, `bootstrap`, `bootstrap-icons`, `vite`, `@vitejs/plugin-react`) en package.json
- [x] T002 Crear archivo de configuración de Vite con proxy hacia API backend en vite.config.js
- [x] T003 [P] Configurar estilos base y personalizaciones estéticas de Bootstrap en src/react/styles/custom-bootstrap.css
- [x] T004 [P] Actualizar scripts de compilación y ejecución (`dev`, `build`, `preview`) en package.json
- [x] T005 Actualizar contenedor raíz HTML para montaje del Virtual DOM de React en index.html

---

## Phase 2: Foundational (Prerrequisitos Bloqueantes de Estado y Servicios)

**Propósito**: Crear la capa de servicios de comunicación HTTP y los contextos React que alimentan todas las historias de usuario.

**⚠️ CRÍTICO**: Ninguna vista puede operar sin estos proveedores de estado.

- [x] T006 Implementar cliente unificado de consumo de API REST con manejo de errores en src/react/services/apiClient.js
- [x] T007 [P] Implementar AuthContext y useAuth con soporte de token JWT, roles RBAC y rate-limiting en src/react/context/AuthContext.jsx
- [x] T008 [P] Implementar CatalogContext y useCatalog para sincronización reactiva desde /api/catalog en src/react/context/CatalogContext.jsx
- [x] T009 [P] Implementar CartContext y useCart con motor determinista de tramos y persistencia en LocalStorage en src/react/context/CartContext.jsx
- [x] T010 Crear componente orquestador App con proveedores de contexto y enrutamiento por hash (#catalogo / #admin) en src/react/App.jsx
- [x] T011 Configurar punto de entrada de montaje con ReactDOM.createRoot en src/react/main.jsx

**Punto de Control**: La infraestructura base y los 3 contextos globales de React están listos para ser consumidos por los componentes.

---

## Phase 3: User Story 1 - Catálogo y Precios Mayoristas en React + Bootstrap (Priority: P1) 🎯 MVP

**Objetivo**: Permitir a los usuarios explorar los 17 productos en 4 categorías con visualización instantánea de tramos mayoristas (1-2u, 3-5u, 6+u) mediante componentes Bootstrap 5.

**Criterio de Prueba Independiente**: Navegar al catálogo, filtrar por categoría, cambiar la cantidad de un ítem y comprobar que el precio unitario y el badge de tramo se actualicen de inmediato.

### Implementación User Story 1

- [x] T012 [P] [US1] Crear componente Navbar con logotipo de marca SuperMarket, buscador rápido y badge reactivo de carrito en src/react/components/common/Navbar.jsx
- [x] T013 [P] [US1] Crear componente Footer comercial con información de cobertura en Santiago RM y políticas de precios en src/react/components/common/Footer.jsx
- [x] T014 [P] [US1] Crear selector de categorías con sistema de pills de Bootstrap 5 (Abarrotes, Bebidas, Aseo, Disfraces) en src/react/components/catalog/CategoryNav.jsx
- [x] T015 [P] [US1] Crear barra de búsqueda interactiva con debounce y filtro en tiempo real en src/react/components/catalog/SearchBar.jsx
- [x] T016 [US1] Crear componente ProductCard con badges de categoría y tramos mayoristas, selector de volumen y cálculo de ahorro estimado en src/react/components/catalog/ProductCard.jsx
- [x] T017 [US1] Crear contenedor principal CatalogView integrando la rejilla de tarjetas Bootstrap (row g-4) y paginación en src/react/components/catalog/CatalogView.jsx

**Punto de Control**: El MVP de visualización de catálogo y cálculo de precios mayoristas en React + Bootstrap funciona de manera autónoma.

---

## Phase 4: User Story 2 - Carrito Lateral y Calculadora Determinista de Ahorro (Priority: P1)

**Objetivo**: Proveer un cajón lateral (Offcanvas) interactivo con desglose de ítems, progreso hacia el siguiente tramo mayorista y cálculo transparente del ahorro total en $ CLP.

**Criterio de Prueba Independiente**: Agregar productos al carrito, abrir el Offcanvas, modificar cantidades con los botones +/- y validar que la barra de progreso de tramo y el ahorro en pesos se recalculen instantáneamente y sobrevivan a una recarga de página (F5).

### Implementación User Story 2

- [x] T018 [P] [US2] Crear componente CartItemRow con controles de cantidad (+/-), subtotal y etiqueta de tramo activo en src/react/components/cart/CartItemRow.jsx
- [x] T019 [P] [US2] Crear indicador visual de progreso hacia el siguiente tramo con barra de progreso Bootstrap (progress-bar) en src/react/components/cart/TierProgressIndicator.jsx
- [x] T020 [US2] Crear componente CartDrawer basado en Offcanvas de Bootstrap con resumen financiero (retail vs cobrado vs ahorro) en src/react/components/cart/CartDrawer.jsx
- [x] T021 [US2] Conectar eventos de apertura/cierre del carrito desde el Navbar y botones de producto en src/react/components/cart/CartDrawer.jsx

**Punto de Control**: El flujo completo de carrito de compras con persistencia y beneficios por volumen está 100% operativo en React.

---

## Phase 5: User Story 3 - Checkout Modal y Pasarela WhatsApp Gateway (Priority: P2)

**Objetivo**: Permitir al cliente asentar formalmente su compra mediante un modal responsivo con validación de comunas RM, sanitización WAF y despacho hacia la API y WhatsApp.

**Criterio de Prueba Independiente**: Completar el formulario de despacho, validar que campos vacíos o maliciosos sean bloqueados, enviar la orden y comprobar que la API `POST /api/orders` retorne el código `SM-2026-XXXX` y se lance el enlace de WhatsApp estructurado.

### Implementación User Story 3

- [x] T022 [P] [US3] Implementar componente de validación y sanitización WAF para formularios de cliente en src/react/utils/inputSanitizer.js
- [x] T023 [US3] Crear componente CheckoutModal con formulario Bootstrap validado (Nombre, Teléfono, Comuna RM, Dirección, Pago) en src/react/components/checkout/CheckoutModal.jsx
- [x] T024 [US3] Integrar invocación transaccional a POST /api/orders, limpieza del carrito y lanzamiento del WhatsApp Gateway en src/react/components/checkout/CheckoutModal.jsx

**Punto de Control**: El ciclo de compra desde la selección de artículos hasta el asentamiento del pedido en la base de datos y la pasarela de WhatsApp está completado.

---

## Phase 6: User Story 4 - Backoffice Super Admin CU-13 & Auditoría SIEM CU-12 (Priority: P2)

**Objetivo**: Proporcionar una consola administrativa segura donde el **Super Admin** ejerza con exclusividad sus responsabilidades de gobierno: gestión de cuentas (`CU-13`) y auditoría SIEM (`CU-12`), sin interferencia en áreas operativas de tienda.

**Criterio de Prueba Independiente**: Iniciar sesión con `@superadmin`, confirmar que solo aparecen las pestañas de Usuarios y SIEM, crear un nuevo usuario mediante modal, editar un usuario existente, suspenderlo/reactivarlo y validar que las acciones queden asentadas en la bitácora de seguridad.

### Implementación User Story 4

- [x] T025 [P] [US4] Crear componente LoginForm con protección contra fuerza bruta y feedback de credenciales en src/react/components/admin/LoginForm.jsx
- [x] T026 [US4] Crear contenedor AdminView con segmentación estricta de navegación según rol RBAC en src/react/components/admin/AdminView.jsx
- [x] T027 [P] [US4] Crear componente UsersTab con tabla Bootstrap responsiva de cuentas del sistema y acciones de administración en src/react/components/admin/UsersTab.jsx
- [x] T028 [P] [US4] Crear modal AddUserModal para registro de nuevas cuentas con validación de rol jerárquico en src/react/components/admin/AddUserModal.jsx
- [x] T029 [P] [US4] Crear modal EditUserModal para actualización de nombre, rol, estado y contraseña en src/react/components/admin/EditUserModal.jsx
- [x] T030 [US4] Conectar acciones de suspensión/reactivación inmediata de cuentas con confirmación visual en src/react/components/admin/UsersTab.jsx
- [x] T031 [US4] Crear componente SecurityTab con tabla de bitácora SIEM inmutable y visor de eventos en src/react/components/admin/SecurityTab.jsx

**Punto de Control**: El módulo de gobierno del Super Admin (CU-13 y CU-12) cumple estrictamente el modelo de roles UML en React y Bootstrap.

---

## Phase 7: User Story 5 - Módulos Operativos para Admin Tienda y Despachador (Priority: P3)

**Objetivo**: Brindar interfaces operativas para los roles de Administrador de Tienda (Kardex e indicadores) y Despachador (rutas de entrega y actualización de estados).

**Criterio de Prueba Independiente**: Iniciar sesión como `@admin_tienda` y como `@despachador` verificando que cada uno visualice únicamente sus módulos autorizados.

### Implementación User Story 5

- [x] T032 [P] [US5] Crear componente InventoryTab con tabla Kardex y modal de ajuste manual de stock para Admin Tienda en src/react/components/admin/InventoryTab.jsx
- [x] T033 [P] [US5] Crear componente DispatchTab con tablero de seguimiento y cambio de estado de pedidos para Despachador en src/react/components/admin/DispatchTab.jsx
- [x] T034 [P] [US5] Crear componente MetricsTab con tarjetas KPI comerciales (AOV, Tasa de Conversión, Rotación) para Admin Tienda en src/react/components/admin/MetricsTab.jsx

**Punto de Control**: Todos los roles del sistema cuentan con sus respectivas herramientas operativas desacopladas.

---

## Phase 8: Polish, Servidor de Producción y Verificación

**Propósito**: Integrar el build optimizado de React con el servidor Node.js y verificar la conformidad total con las pruebas de caja negra.

- [x] T035 Adaptar server/server.js para servir estáticos desde la carpeta dist/ cuando exista la compilación de producción en server/server.js
- [x] T036 [P] Ejecutar compilación de producción con Vite (`npm run build`) y verificar tamaño de bundle en dist/
- [x] T037 Ejecutar suite formal de pruebas (`npm test`) y verificar 100% de éxito en CP-01 a CP-13 y validaciones relacionales SQLite
- [x] T038 Ejecutar validación final con los escenarios documentados en specs/002-description-migracion-react/quickstart.md

---

## Dependencias y Orden de Ejecución

```
Phase 1: Setup (T001-T005)
      │
      ▼
Phase 2: Foundational Contexts & Services (T006-T011)
      │
      ├───────────────────────┬───────────────────────┐
      ▼                       ▼                       ▼
Phase 3: US1 Catálogo (P1) Phase 4: US2 Carrito (P1) Phase 6: US4 Super Admin (P2)
      │                       │                       │
      └───────────┬───────────┘                       │
                  ▼                                   ▼
          Phase 5: US3 Checkout (P2)          Phase 7: US5 Ops Tienda (P3)
                  │                                   │
                  └─────────────────┬─────────────────┘
                                    ▼
                         Phase 8: Polish & Build (T035-T038)
```

---

## Resumen de Tareas

- **Total de tareas:** 38 tareas
- **Tareas por fase:**
  - Setup: 5 tareas (T001 - T005)
  - Foundational: 6 tareas (T006 - T011)
  - US1 (Catálogo y Precios): 6 tareas (T012 - T017)
  - US2 (Carrito y Ahorro): 4 tareas (T018 - T021)
  - US3 (Checkout y WhatsApp): 3 tareas (T022 - T024)
  - US4 (Super Admin CU-13 / SIEM): 7 tareas (T025 - T031)
  - US5 (Módulos Operativos Tienda/Despacho): 3 tareas (T032 - T034)
  - Polish & Build: 4 tareas (T035 - T038)
- **Oportunidades de paralelización:** 18 tareas marcadas con `[P]`.
