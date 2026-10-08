# Implementation Plan: Marketplace Inteligente MEGASUPER.CL

**Branch**: `001-marketplace-inteligente` | **Date**: 2026-10-08 | **Spec**: [spec.md](file:///c:/Users/sebas/Desktop/megasuper/specs/001-marketplace-inteligente/spec.md)

---

## 1. Resumen de la Solución Técnica

Implementación de la arquitectura desacoplada **"Integrated 4-in-1 Marketplace Technical Architecture"** para MEGASUPER.CL.  
El sistema se compone de dos frentes integrados:
1. **Frontend Público (B2C / Mayorista):** SPA ultrarrápida con catálogo 4 en 1, filtrado predictivo, cotizador de precios por tramo (1, 3, 6+), carrito persistente en `LocalStorage` con cálculo de ahorro en tiempo real, y Checkout sin fricción conectado a WhatsApp Gateway.
2. **Backoffice Administrativo (B2B / Operativo):** Consola interna protegida por autenticación JWT con control de tasa (rate-limiting), WAF perimetral y bitácora SIEM inmutable. Permite la administración de productos, Kardex de inventario (entradas, salidas, mermas), despacho con trazabilidad de ciclo de vida (Pendiente → Preparación → En Ruta → Entregado), CRM de clientes con recurrencia y tablero de indicadores matemáticos (AOV, CR, ITR).

---

## 2. Contexto Técnico y Estándares

- **Lenguaje y Versión:** JavaScript ES2024 modular / HTML5 Semántico / CSS3 con variables de diseño premium y modo oscuro/claro de alto contraste.
- **Patrón de Arquitectura:** Clean Architecture / Domain-Driven Design (DDD) desacoplado en capas:
  - *Domain / Models:* Entidades de negocio (`Producto`, `PrecioTramo`, `Orden`, `Cliente`, `Kardex`, `Usuario`, `SIEMLog`).
  - *Services / Logic:* `PriceEngine` (tramos y ahorro), `CartStore` (reactivo con persistencia), `OrderService`, `AuthService` (JWT & RBAC), `WAFEngine` (inspección XSS/SQLi y rate-limiting), `InventoryService`.
  - *Presentation / UI:* Vistas responsivas (Catálogo, Modal de Detalle, Carrito Lateral, Checkout, Dashboard Admin, Kardex, Logística, SIEM).
- **Persistencia:** Capa relacional estructurada en 3FN (9 entidades) persistida con réplica local y sincronización de estado, sin sesiones huérfanas en servidor.
- **Seguridad:**
  - Token JWT firmado con HMAC-SHA256 (tiempo de vida 15m con rotación).
  - Rate limiting perimetral: bloqueo automático tras 15 intentos fallidos en 5 minutos.
  - WAF regex sanitizer para prevención de XSS y SQL injection en campos de formulario.
- **Rendimiento:** Carga FCP < 1,2s, LCP < 1,8s, cero dependencias pesadas de terceros para garantizar rendimiento máximo.
- **Accesibilidad:** WCAG 2.1 AA (contraste ≥ 4.5:1, etiquetas ARIA, navegación por teclado).

---

## 3. Verificación de la Constitución (Constitution Check)

| Principio Constitucional | Estado | Evidencia de Cumplimiento en el Plan |
|---|:---:|---|
| **I. Multitienda 4 en 1 Unificada** | Cumple | Catálogo segmentado en Abarrotes, Bebidas, Aseo y Disfraces con un solo carrito y un despacho único. |
| **II. Precios por Tramo y Ahorro** | Cumple | `PriceEngine` aplica descuentos escalonados deterministas a 1-2, 3-5 y 6+ unidades con visualización de ahorro en $ CLP. |
| **III. Guest Browsing & LocalStorage** | Cumple | Navegación y compra sin login previo obligatorio. Carrito persistente ante recargas (F5). |
| **IV. Modelo Relacional 3FN** | Cumple | Implementación de las 9 entidades documentadas en [data-model.md](file:///c:/Users/sebas/Desktop/megasuper/specs/001-marketplace-inteligente/data-model.md). |
| **V. Seguridad RBAC, WAF y SIEM** | Cumple | Matriz de 4 roles, token JWT, WAF con bloqueo anti fuerza bruta y log inmutable de seguridad. |
| **VI. Rendimiento y WCAG AA** | Cumple | Estilos sin bloqueos, UI optimizada mobile-first y contraste cromático auditado. |

---

## 4. Estructura de Componentes y Código Fuente

```text
c:\Users\sebas\Desktop\megasuper\
├── .specify/                         # Configuración y memoria Spec Kit
│   ├── memory/constitution.md
│   ├── templates/
│   └── scripts/
├── specs/001-marketplace-inteligente/ # Especificación formal SDD
│   ├── spec.md                       # Especificación de requisitos RF-01 a RF-19
│   ├── data-model.md                 # DER y Diccionario 3FN
│   ├── plan.md                       # Blueprint técnico
│   └── tasks.md                      # Desglose de tareas y matriz CP-01 a CP-13
├── public/                           # Assets estáticos
│   └── assets/                       # Íconos y mock de productos
├── src/
│   ├── data/
│   │   ├── catalog.json              # Semilla inicial del catálogo maestro 4 en 1
│   │   └── seed-data.js              # Inicializador de datos en 3FN
│   ├── core/
│   │   ├── storage.js                # Adaptador de persistencia 3FN & LocalStorage
│   │   ├── price-engine.js           # Lógica determinista de tramos y ahorro
│   │   ├── cart-store.js             # Estado reactivo del carrito
│   │   ├── order-service.js          # Creación de orden y WhatsApp Gateway
│   │   ├── inventory-service.js      # Kardex (entradas, salidas, mermas y reversión)
│   │   ├── auth-service.js           # JWT, hashing, RBAC y control de sesiones
│   │   ├── waf-engine.js             # Inspección perimetral XSS/SQLi y rate limiting
│   │   └── siem-logger.js            # Bitácora inmutable de seguridad
│   ├── ui/
│   │   ├── catalog-view.js           # Renderizado multitienda y buscador predictivo
│   │   ├── cart-drawer.js            # Carrito lateral interactivo
│   │   ├── checkout-modal.js         # Checkout directo con captura RM
│   │   ├── admin-view.js             # Consola administrativa integrada
│   │   ├── inventory-view.js         # Gestión de Kardex y stock
│   │   ├── dispatch-view.js          # Seguimiento de hoja de ruta y despachos
│   │   ├── crm-view.js               # Vista de clientes y recurrencia
│   │   ├── kpi-dashboard.js          # Tablero de métricas (AOV, CR, ITR)
│   │   └── siem-view.js              # Monitor de eventos SIEM
│   └── app.js                        # Bootstrap y orquestación general
├── index.html                        # Punto de entrada SPA
└── styles.css                        # Sistema de diseño, tokens CSS y WCAG AA
```

---

## 5. Matriz de Cobertura de Pruebas (CP-01 a CP-13)

| Caso de Prueba | Módulo Evaluado | Procedimiento y Criterio de Éxito |
|---|---|---|
| **CP-01** | Catálogo & Búsqueda | Búsqueda por texto predictivo filtra con exactitud en < 1,2s. |
| **CP-02** | Precios por Tramo | Comprobar que en cantidades 2, 3 y 6 el precio unitario se reduce al tramo correspondiente. |
| **CP-03** | Calculadora de Ahorro | Al cambiar cantidades, el ahorro total en $ CLP se recalcula en tiempo real. |
| **CP-04** | Persistencia Carrito | Cargar artículos, recargar con F5 y verificar que no se pierden ítems ni totales. |
| **CP-05** | Emisión Checkout | Completar datos válidos de Santiago y verificar emisión de orden y redirección WhatsApp. |
| **CP-06** | Kardex Inventario | Registrar entrada y merma; confirmar actualización en stock del catálogo y registro en auditoría. |
| **CP-07** | Reversión de Stock | Anular orden pendiente y constatar que las unidades regresan al catálogo (RF-11). |
| **CP-08** | Control de Acceso | Intentar entrar a rutas protegidas sin credenciales válidas; verificar bloqueo y log en SIEM. |
| **CP-09** | Gestión de Cuentas | Super Admin crea y bloquea cuentas internas; verificar aplicación estricta de RBAC. |
| **CP-10** | Filtro WAF | Inyectar `<script>alert(1)</script>` o `' OR 1=1 --` en formularios; confirmar sanitización y alerta SIEM. |
| **CP-11** | Velocidad de Carga | Validar FCP < 1,2s y renderizado total en menos de 1,8s. |
| **CP-12** | Diseño Responsivo | Probar despliegue fluido en anchos de 320 px, 768 px y pantallas 4K. |
| **CP-13** | Indicadores & KPIs | Contrastar cálculo matemático de AOV, CR e ITR con los registros de órdenes de la base de datos. |
