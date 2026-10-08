# Guía Rápida de Validación y Despliegue (quickstart.md)

**Característica:** Migración de Frontend a React con Bootstrap 5  
**Fecha:** Octubre 2026  
**Estatus:** Completado  

---

## 1. Prerrequisitos

- Node.js v20.x o superior con soporte de `node:sqlite`.
- npm v9.x o superior.
- Base de datos relacional inicializada en `data/supermarket.db`.

---

## 2. Comandos de Ejecución

### 2.1. Instalación de Dependencias
```bash
npm install
```
*(Instala dependencias de React, Bootstrap, Bootstrap Icons y Vite).*

### 2.2. Modo Desarrollo con Hot Module Replacement (HMR)
```bash
# Terminal 1: Iniciar API Backend y SQLite en puerto 8080
npm run server

# Terminal 2: Iniciar servidor de desarrollo Vite en puerto 5173
npm run dev
```
- La aplicación cliente se abre en `http://localhost:5173`.
- Las peticiones `/api/*` son redirigidas por el proxy de Vite a `http://localhost:8080`.

### 2.3. Compilación para Producción y Servidor Unificado
```bash
# Compilar bundle optimizado de React a dist/
npm run build

# Iniciar servidor Node.js de producción (sirve API + dist/ en puerto 8080)
npm start
```
- Acceso público: `http://localhost:8080`.
- Acceso backoffice: `http://localhost:8080/#admin`.

---

## 3. Escenarios de Validación End-to-End

### Escenario 1: Catálogo y Precios Escalonados
1. Ingresar a `http://localhost:5173` (o `http://localhost:8080`).
2. Verificar que se desplieguen las 4 categorías: *Abarrotes*, *Bebidas*, *Aseo*, *Disfraces*.
3. En cualquier producto (e.g. *Arroz Grado 1*), cambiar la cantidad:
   - 1 unidad: Precio $1.490 CLP.
   - 3 unidades: Precio $1.290 CLP/u. (Insignia Mayorista activa).
   - 6 unidades: Precio $1.100 CLP/u. (Insignia Distribuidor activa).
4. Hacer clic en "Agregar al Carrito".

### Escenario 2: Carrito Lateral Offcanvas y Ahorro Determinista
1. Abrir el carrito haciendo clic en "Mi Carrito" en el Navbar.
2. Confirmar que el componente `Offcanvas` de Bootstrap se despliega desde la derecha con animación fluida.
3. Verificar que se muestre:
   - Subtotal Retail.
   - Total Cobrado.
   - Ahorro Total en $ CLP y porcentaje destacado en verde.
4. Recargar la página (F5) y comprobar que el estado del carrito persiste intacto vía `LocalStorage`.

### Escenario 3: Checkout Modal y Pasarela WhatsApp
1. En el carrito, hacer clic en "Finalizar Compra".
2. Completar los campos requeridos (Nombre, Teléfono, Dirección, Comuna RM).
3. Confirmar pedido.
4. Verificar que se genera el código `SM-2026-XXXX`, se descuenta el stock en SQLite y se abre la URL estructurada de WhatsApp.

### Escenario 4: Super Admin - Gestión de Cuentas (CU-13) y Bitácora SIEM (CU-12)
1. Navegar a `#admin`.
2. Iniciar sesión con usuario `superadmin` y contraseña `admin123`.
3. Confirmar que **únicamente** se muestran las pestañas de **Gestión de Cuentas y Accesos** y **Auditoría de Accesos**.
4. En Gestión de Usuarios:
   - Clic en "+ Agregar Nuevo Usuario": Completar formulario y guardar.
   - Clic en "Modificar" en cualquier usuario: Editar datos y guardar.
   - Clic en "Suspender": Verificar que el estado cambie a suspendido con badge rojo.
5. En Auditoría SIEM:
   - Verificar que todas las operaciones anteriores generaron registros inmutables con timestamp e IP.

---

## 4. Ejecución de Pruebas Automatizadas
```bash
npm test
```
- Debe mantener 100% de aprobación en los 13 casos de caja negra (`tests/cli-test-runner.js`), la prueba de integración de Super Admin (`tests/test-admin-view.js`) y las validaciones de SQLite 3FN (`tests/test-sqlite-api.js`).
