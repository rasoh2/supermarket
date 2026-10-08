# 🛒 MEGASUPER.CL — Marketplace Mayorista Inteligente

**MEGASUPER.CL** es una plataforma web de comercio electrónico y administración mayorista para Santiago de Chile. Permite a familias y comerciantes adquirir productos de 4 categorías principales (**Abarrotes**, **Bebidas**, **Aseo** y **Disfraces**) en un solo pedido consolidado con despacho único y descuentos deterministas por volumen.

Desarrollada bajo la metodología **Spec-Driven Development (SDD / GitHub Spec Kit)**, arquitectura limpia desacoplada (**Clean Architecture / DDD**) y **Backend nativo en Node.js con SQLite relacional en Tercera Forma Normal (3FN)**.

---

## 🌟 Características Principales

- **Catálogo Unificado 4 en 1:** Visualización y filtrado en tiempo real sin recarga de página.
- **Motor de Precios por Tramos Mayoristas:**
  - **1 a 2 unidades:** Precio Normal Unitario.
  - **3 a 5 unidades:** Tarifa Mayorista (~15% de descuento).
  - **6 o más unidades:** Precio Distribuidor (~30% de descuento).
- **Calculadora de Ahorro Determinista:** Exhibición inmediata del ahorro en pesos chilenos ($ CLP).
- **Persistencia Híbrida (Offline-First + SQLite):** Almacenamiento rápido en cliente con sincronización a base de datos física SQLite (`data/megasuper.db`).
- **Checkout Rápido & Pasarela WhatsApp:** Generación de órdenes con código único (`MS-2026-XXXX`) y comprobante preformateado.
- **Backoffice Administrativo (RBAC):**
  - **Super Admin (`CU-13`):** Gestión exclusiva de cuentas y accesos (crear, modificar usuarios, asignar roles y suspender/reactivar cuentas) y auditoría de accesos.
  - **Administrador de Tienda (`CU-08`, `CU-09`, `CU-11`):** Catálogo, control de stock Kardex (entradas y salidas) y métricas comerciales.
  - **Despachador Logístico (`CU-10`):** Ciclo de vida de entregas en la Región Metropolitana.
- **Seguridad Perimetral WAF & SIEM:** Inspección de inyecciones (XSS, SQLi), rate-limiting y bitácora de eventos.

---

## 🗄️ Backend y Base de Datos Relacional (3FN)

El sistema integra un backend en Node.js nativo con SQLite (`node:sqlite` sin dependencias externas pesadas) que implementa las **9 tablas en Tercera Forma Normal** descritas en la especificación técnica:

1. `PRODUCTO` — Catálogo maestro con SKU, categoría, existencias y estados.
2. `PRECIO_TRAMO` — Escalonamiento tarifario normalizado por volumen (1, 3, 6+ unidades).
3. `CLIENTE_CRM` — Maestro de clientes identificado por WhatsApp único y recurrencia.
4. `ORDEN_PEDIDO` — Cabecera transaccional con códigos unívocos, totales y método de pago.
5. `DETALLE_ORDEN` — Entidad asociativa que congela el precio histórico al comprar.
6. `DESPACHO` — Trazabilidad logística 1:1 con la orden para rutas en Santiago RM.
7. `INVENTARIO_MOVIMIENTO` — Kardex de entradas, salidas, mermas y auditoría de stock.
8. `USUARIO_SISTEMA` — Cuentas internas con gobernanza RBAC (`SUPER_ADMIN`, `ADMIN_TIENDA`, `DESPACHADOR`).
9. `LOG_SEGURIDAD_SIEM` — Bitácora inmutable de eventos de seguridad y WAF.

---

## 🚀 Puesta en Marcha Local

### Prerrequisitos
- **Node.js v22+** (incluye soporte nativo para `node:sqlite`).

### Ejecución
```bash
# 1. Iniciar servidor Full-Stack (API REST + Frontend estático)
npm start
# O directamente:
node server/server.js
```

Abrir en el navegador:
- **Tienda Pública:** [http://localhost:8080/index.html](http://localhost:8080/index.html)
- **Panel Administrativo:** [http://localhost:8080/index.html#admin](http://localhost:8080/index.html#admin)
- **Healthcheck API:** [http://localhost:8080/api/health](http://localhost:8080/api/health)

---

## 👥 Credenciales de Acceso al Panel

| Rol | Usuario | Contraseña | Alcance / Permisos |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin` | `admin123` | **CU-13:** Agregar, modificar, suspender cuentas y auditoría |
| **Administrador de Tienda** | `admin` | `tienda123` | **CU-08/09/11:** Kardex, inventario, clientes y ventas |
| **Despachador** | `despacho` | `ruta123` | **CU-10:** Despachos y entregas en Santiago RM |

---

## 🧪 Pruebas Automatizadas

El proyecto incluye suites completas de pruebas automatizadas:

```bash
# Ejecutar todas las suites de prueba:
npm test

# O ejecutar por módulos:
npm run test:cli     # 1. Matriz formal de caja negra (CP-01 a CP-13)
npm run test:admin   # 2. Integración Super Admin (CU-13)
npm run test:sqlite  # 3. Base de datos SQLite y endpoints REST
```

Todas las suites se ejecutan con **100% de éxito y conformidad técnica**.

---

## 📁 Estructura del Proyecto

```text
├── .specify/                # Constitución y memoria metodológica Spec Kit
├── data/
│   └── megasuper.db         # Base de datos SQLite física (auto-generada)
├── server/                  # Backend Node.js
│   ├── db.js                # Conexión, inicialización y migraciones SQLite
│   ├── schema.sql           # Esquema relacional DDL formal en 3FN (9 tablas)
│   └── server.js            # Servidor HTTP y API REST (endpoints /api/...)
├── specs/                   # Especificaciones formales, modelo de datos y tareas
├── src/
│   ├── core/                # Capa de dominio y lógica de negocio
│   │   ├── api-sync.js          # Sincronización bidireccional con SQLite
│   │   ├── auth-service.js      # Autenticación JWT y gobernanza RBAC
│   │   ├── cart-store.js        # Estado reactivo del carrito
│   │   ├── inventory-service.js # Kardex de movimientos y reversión de stock
│   │   ├── order-service.js     # Creación de pedidos y WhatsApp Gateway
│   │   ├── price-engine.js      # Motor determinista de precios y tramos
│   │   ├── storage.js           # Capa de persistencia local relacional
│   │   └── waf-engine.js        # Firewall de aplicación web y bitácora SIEM
│   ├── data/
│   │   └── catalog.json         # Datos semilla del catálogo (4 categorías)
│   ├── ui/                  # Componentes de presentación (Frontend & Backoffice)
│   │   ├── admin-view.js        # Vista administrativa y gestión de cuentas
│   │   ├── cart-drawer.js       # Drawer lateral del carrito
│   │   ├── catalog-view.js      # Catálogo interactivo con filtros y búsqueda
│   │   └── checkout-modal.js    # Modal de finalización de compra
│   └── app.js               # Bootstrap modular de la aplicación
├── tests/                   # Suites de pruebas automatizadas
│   ├── cli-test-runner.js   # Validador de requisitos RF/RNF (CP-01 a CP-13)
│   ├── test-admin-view.js   # Validador de funciones Super Admin (CU-13)
│   └── test-sqlite-api.js   # Validador de base de datos SQLite y API REST
├── package.json             # Manifiesto del proyecto y scripts npm
├── index.html               # Documento principal SPA
├── styles.css               # Sistema de diseño y hojas de estilo elásticas
└── README.md                # Documentación del proyecto
```

---

## 📄 Licencia
© 2026 MEGASUPER.CL. Todos los derechos reservados.
