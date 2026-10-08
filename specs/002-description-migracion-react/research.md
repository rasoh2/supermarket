# Phase 0: Investigación Técnica y Decisiones de Arquitectura (research.md)

**Característica:** Migración de Frontend a React con Bootstrap 5  
**Fecha:** Octubre 2026  
**Estatus:** Completado  

---

## 1. Decisiones Técnicas

### Decisión 1: Herramienta de Empaquetado y Entorno de Desarrollo (Vite vs CRA vs Webpack)
- **Decisión:** **Vite 6 / Vite 5** con `@vitejs/plugin-react`.
- **Razón:**
  - Vite ofrece arranque instantáneo del servidor de desarrollo mediante ES Modules nativos.
  - Hot Module Replacement (HMR) ultrarrápido sin recargas de página molestas.
  - Produce una carpeta de distribución optimizada `dist/` con Tree Shaking mediante Rollup.
  - `Create React App (CRA)` está oficialmente deprecada por el equipo de React.
- **Alternativas consideradas:**
  - *Create React App:* Descartada por obsolescencia, dependencias desactualizadas y lentitud en arranque.
  - *Webpack nativo:* Descartado por requerir configuración extensa y compleja de loaders/plugins para este alcance.
  - *React vía CDN (Babel Standalone):* Descartado para producción por impacto en rendimiento inicial (FCP > 2s).

---

### Decisión 2: Integración de Bootstrap 5 en React
- **Decisión:** **Bootstrap 5.3 nativo + Bootstrap Icons** combinado con componentes React idiomáticos (aprovechando utilidades y atributos `data-bs-*` o librerías reactivas como `react-bootstrap` / modales y drawers controlados con estado React).
- **Razón:**
  - Bootstrap 5 no depende de jQuery, usa JavaScript nativo moderno y CSS con variables personalizadas (CSS Custom Properties).
  - Permite control total del estado React en componentes como Offcanvas y Modales sin desincronización entre el DOM y el Virtual DOM.
  - Estilos consistentes con la identidad corporativa de SuperMarket.cl (tema oscuro elegante / componentes de alta legibilidad).
- **Alternativas consideradas:**
  - *TailwindCSS:* No solicitado por el usuario (el usuario solicitó explícitamente "con boostrap").
  - *Material UI (MUI):* Descartado por sobrecarga de bundle (~350KB) y estética divergente de la pauta.

---

### Decisión 3: Gestión del Estado de la Aplicación (State Management)
- **Decisión:** **React Context API + Hooks personalizados (`useCart`, `useAuth`, `useCatalog`)**.
- **Razón:**
  - La complejidad del estado en SuperMarket.cl comprende 3 dominios bien delimitados: Catálogo, Carrito/Tramos y Sesión RBAC.
  - Context API es nativo de React, sin dependencias pesadas como Redux Toolkit o MobX.
  - La persistencia del carrito en `LocalStorage` se maneja limpiamente mediante efectos (`useEffect`) reactivos en `CartContext`.
  - Mantiene el código limpio y desacoplado, facilitando pruebas unitarias.
- **Alternativas consideradas:**
  - *Redux Toolkit:* Descartado por introducir *boilerplate* innecesario para un estado con 3 dominios específicos.
  - *Zustand:* Excelente opción ligera, pero Context API nativo evita añadir dependencias externas adicionales.

---

### Decisión 4: Arquitectura del Backend y Compatibilidad Transaccional
- **Decisión:** Mantener el servidor HTTP nativo existente (`server/server.js`) con la base de datos SQLite relacional 3FN (`data/supermarket.db`).
- **Razón:**
  - La API REST ya se encuentra implementada, probada y en funcionamiento con soporte de CORS y endpoints para Catálogo, Órdenes, Kardex, Usuarios (CU-13), SIEM y Despachos.
  - El servidor `server/server.js` se configura para servir los estáticos generados en `dist/` en producción, permitiendo despliegue en un único puerto (8080).
  - En modo desarrollo, Vite corre en el puerto 5173 con proxy configurado hacia `http://localhost:8080/api`.

---

### Decisión 5: Gobernanza Estricta de Roles UML en la Interfaz (Super Admin CU-13)
- **Decisión:** Componente `AdminView.jsx` con renderizado condicional de pestañas estrictamente según el rol decodificado del JWT:
  - **`SUPER_ADMIN`**: Visualiza únicamente "Gestión de Cuentas y Accesos" (`CU-13`) y "Auditoría SIEM de Accesos" (`CU-12`). No tiene acceso a Inventario, Despachos ni Métricas de ventas.
  - **`ADMIN_TIENDA`**: Visualiza "Inventario Kardex" y "Métricas Comerciales".
  - **`DESPACHADOR`**: Visualiza "Módulo de Despachos" y actualización de estados.
- **Razón:**
  - Cumple estrictamente con el modelo conceptual UML y el requerimiento explícito del cliente de mantener al Super Admin enfocado únicamente en la administración de usuarios del sistema y auditoría de accesos.

---

## 2. Matriz de Dependencias

| Paquete | Versión | Tipo | Propósito |
| :--- | :--- | :--- | :--- |
| `react` | `^18.3.1` (o 19) | Producción | Biblioteca base de componentes de interfaz |
| `react-dom` | `^18.3.1` (o 19) | Producción | Renderizador React en el DOM |
| `bootstrap` | `^5.3.3` | Producción | Framework CSS y componentes visuales |
| `bootstrap-icons` | `^1.11.3` | Producción | Iconografía oficial SVG/webfonts |
| `vite` | `^5.4.0` | Desarrollo | Servidor de desarrollo HMR y empaquetador Rollup |
| `@vitejs/plugin-react` | `^4.3.0` | Desarrollo | Soporte JSX/Fast Refresh para Vite |
