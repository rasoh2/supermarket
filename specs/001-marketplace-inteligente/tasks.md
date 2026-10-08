# Task Breakdown: Marketplace Inteligente SuperMarket.cl

**Feature Branch**: `001-marketplace-inteligente`  
**Spec Reference**: [spec.md](file:///c:/Users/sebas/Desktop/SuperMarket/specs/001-marketplace-inteligente/spec.md) | [plan.md](file:///c:/Users/sebas/Desktop/SuperMarket/specs/001-marketplace-inteligente/plan.md)  
**Total Story Points**: 47 SP | **Sprints**: 4 Sprints  

---

## Sprint 1: Arquitectura, Persistencia 3FN y Catálogo Maestro (SCRUM-1 a SCRUM-5)

- [x] **TASK-001**: Inicialización de repositorio y estructura metodológica GitHub Spec Kit (`.specify/`, `constitution.md`).
- [x] **TASK-002**: Definición del esquema de datos relacional en 3FN (9 entidades) y diccionario formal en `data-model.md`. *(Resp: Rodrigo Bravo - DBA)*
- [x] **TASK-003**: Creación del catálogo maestro unificado JSON con productos iniciales de las 4 tiendas (Abarrotes, Bebidas, Aseo, Disfraces), SKUs y umbrales de precio. *(Resp: Peter Cañarte)*
- [x] **TASK-004**: Implementación de la capa de almacenamiento relacional con réplica en `LocalStorage` (`src/core/storage.js`). *(Resp: Juan Mena)*

---

## Sprint 2: Algoritmo de Precios por Tramo, Carrito y Persistencia (SCRUM-6 a SCRUM-7)

- [x] **TASK-005**: Desarrollo del motor determinista de precios por tramo mayorista (`src/core/price-engine.js`):
  - Tramo 1: 1 a 2 unidades (Tarifa retail base)
  - Tramo 2: 3 a 5 unidades (Tarifa mayorista)
  - Tramo 3: 6+ unidades (Tarifa súper mayorista / distribuidor)
  *(Resp: Peter Cañarte)*
- [x] **TASK-006**: Codificación de la calculadora de ahorro acumulado en tiempo real en $ CLP comparando retail vs tarifa mayorista. *(Resp: Francisco Cárcamo)*
- [x] **TASK-007**: Implementación del gestor de estado reactivo del carrito de compras (`src/core/cart-store.js`) con preservación ante recarga (F5). *(Resp: Juan Mena)*
- [x] **TASK-008**: Maquetación de la interfaz de catálogo multitienda con buscador predictivo en tiempo real y filtrado por departamentos (`src/ui/catalog-view.js`). *(Resp: Peter Cañarte)*

---

## Sprint 3: Checkout, WhatsApp Gateway, Backoffice y Kardex (SCRUM-7 a SCRUM-9)

- [x] **TASK-009**: Implementación del Checkout interactivo de compra rápida sin registro obligatorio (Guest Checkout) con captura de datos de despacho para Santiago (`src/ui/checkout-modal.js`). *(Resp: Juan Mena)*
- [x] **TASK-010**: Integración de la pasarela de formateo transaccional de órdenes para WhatsApp Gateway con código único y desglose (`src/core/order-service.js`). *(Resp: Juan Mena)*
- [x] **TASK-011**: Construcción del motor de seguridad perimetral WAF (sanitización de inputs contra XSS/SQLi) y rate-limiter de 15 intentos fallidos / 5 min (`src/core/waf-engine.js`). *(Resp: Francisco Cárcamo)*
- [x] **TASK-012**: Implementación del servicio de autenticación administrativa con simulación criptográfica de tokens JWT HMAC-SHA256 y control jerárquico RBAC (`src/core/auth-service.js`). *(Resp: Francisco Cárcamo)*
- [x] **TASK-013**: Desarrollo del panel de administración operativo (Backoffice) con módulo Kardex de inventario: entradas, salidas y mermas (`src/ui/inventory-view.js`). *(Resp: Francisco Cárcamo)*
- [x] **TASK-014**: Implementación de la gestión de ciclo de vida de despachos logísticos en Santiago (Pendiente → En Preparación → En Ruta → Entregado) (`src/ui/dispatch-view.js`). *(Resp: Rodrigo Bravo)*
- [x] **TASK-015**: Codificación de la lógica de anulación de pedidos y reversión automática de stock al catálogo (RF-11 / `src/core/inventory-service.js`). *(Resp: Juan Mena)*

---

## Sprint 4: CRM, Tablero de KPIs, Bitácora SIEM y Pruebas CP-01 a CP-13 (SCRUM-10 a SCRUM-12)

- [x] **TASK-016**: Implementación del módulo de clientes CRM con historial de compras y cálculo automático del flag de cliente recurrente (`src/ui/crm-view.js`). *(Resp: Rodrigo Bravo)*
- [x] **TASK-017**: Desarrollo del tablero de métricas e indicadores de negocio en tiempo real (Ticket Promedio AOV, Tasa de Conversión CR, Rotación de Stock ITR, Ahorro total acumulado) (`src/ui/kpi-dashboard.js`). *(Resp: Sebastián Ortega / Francisco Cárcamo)*
- [x] **TASK-018**: Implementación de la bitácora inmutable de seguridad SIEM con visor de eventos, severidad y detalles de incidentes (`src/ui/siem-view.js`). *(Resp: Francisco Cárcamo)*
- [x] **TASK-019**: Pulido de accesibilidad universal WCAG 2.1 AA (contraste ≥ 4.5:1, accesibilidad por teclado, etiquetas semánticas) y responsive design (320 px a 4K) en `styles.css`. *(Resp: Francisco Cárcamo / Peter Cañarte)*
- [x] **TASK-020**: Ejecución y validación formal de los 13 casos de prueba de caja negra (CP-01 a CP-13) con reporte de conformidad técnica. *(Resp: Rodrigo Bravo - QA Lead)*
