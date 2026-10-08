# 🛒 MEGASUPER.CL — Marketplace Mayorista Inteligente

**MEGASUPER.CL** es una plataforma web de comercio electrónico y administración mayorista para Santiago de Chile. Permite a familias y comerciantes adquirir productos de 4 categorías principales (**Abarrotes**, **Bebidas**, **Aseo** y **Disfraces**) en un solo pedido consolidado con despacho único y descuentos deterministas por volumen.

Desarrollada bajo la metodología **Spec-Driven Development (SDD / GitHub Spec Kit)** y arquitectura limpia desacoplada.

---

## 🌟 Características Principales

- **Catálogo Unificado 4 en 1:** Visualización y filtrado en tiempo real sin recarga.
- **Motor de Precios por Tramos Mayoristas:**
  - **1 a 2 unidades:** Precio Normal Unitario.
  - **3 a 5 unidades:** Tarifa Mayorista (~15% de descuento).
  - **6 o más unidades:** Precio Distribuidor (~30% de descuento).
- **Calculadora de Ahorro Determinista:** Exhibición inmediata del ahorro en pesos chilenos ($ CLP).
- **Persistencia Reactiva del Carrito:** Almacenamiento local persistente (`LocalStorage`).
- **Checkout Rápido & Pasarela WhatsApp:** Generación de órdenes con código único y comprobante preformateado.
- **Backoffice Administrativo (RBAC):**
  - **Super Admin (`CU-13`):** Gestión exclusiva de cuentas y accesos (crear, modificar usuarios, asignar roles y suspender/reactivar cuentas) y auditoría de accesos.
  - **Administrador de Tienda (`CU-08`, `CU-09`, `CU-11`):** Catálogo, control de stock Kardex (entradas y salidas) y métricas comerciales.
  - **Despachador Logístico (`CU-10`):** Ciclo de vida de entregas en la Región Metropolitana.
- **Seguridad Perimetral WAF & SIEM:** Inspección de inyecciones (XSS, SQLi), rate-limiting y bitácora de eventos.

---

## 🚀 Puesta en Marcha Local

### Prerrequisitos
- Navegador web moderno (Chrome, Firefox, Edge, Safari).
- Python 3.x o Node.js para servir estáticos.

### Ejecución
```bash
# Opción 1: Servidor HTTP con Python
python -m http.server 8080

# Opción 2: Servidor con Node.js
npx serve -l 8080
```

Abrir en el navegador:
- **Tienda Pública:** `http://localhost:8080/index.html`
- **Panel Administrativo:** `http://localhost:8080/index.html#admin`

---

## 👥 Credenciales de Acceso al Panel

| Rol | Usuario | Contraseña | Alcance / Permisos |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin` | `admin123` | **CU-13:** Agregar, modificar, suspender cuentas y auditoría |
| **Administrador de Tienda** | `admin` | `tienda123` | **CU-08/09/11:** Kardex, inventario, clientes y ventas |
| **Despachador** | `despacho` | `ruta123` | **CU-10:** Despachos y entregas en Santiago RM |

---

## 🧪 Pruebas Automatizadas

El proyecto incluye dos suites de pruebas automatizadas:

```bash
# 1. Matriz formal de pruebas de caja negra (CP-01 a CP-13)
node tests/cli-test-runner.js

# 2. Pruebas de integración del módulo Super Admin (CU-13)
node tests/test-admin-view.js
```

Ambas suites se ejecutan con 100% de conformidad técnica.

---

## 📁 Estructura del Proyecto

```text
├── .specify/                # Constitución y memoria metodológica Spec Kit
├── specs/                   # Especificaciones formales, modelo de datos y tareas
├── src/
│   ├── core/                # Capa de dominio y lógica de negocio
│   │   ├── auth-service.js      # Autenticación JWT y gobernanza RBAC
│   │   ├── cart-store.js        # Estado reactivo del carrito
│   │   ├── inventory-service.js # Kardex de movimientos y reversión de stock
│   │   ├── order-service.js     # Creación de pedidos y WhatsApp Gateway
│   │   ├── price-engine.js      # Motor determinista de precios y tramos
│   │   ├── storage.js           # Base de datos relacional simulada (3FN)
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
│   ├── cli-test-runner.js   # Validador de requisitos RF/RNF
│   └── test-admin-view.js   # Validador de funciones Super Admin
├── index.html               # Documento principal SPA
├── styles.css               # Sistema de diseño y hojas de estilo elásticas
└── README.md                # Documentación del proyecto
```

---

## 📄 Licencia
© 2026 MEGASUPER.CL. Todos los derechos reservados.
