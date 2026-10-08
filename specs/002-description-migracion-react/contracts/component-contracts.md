# Contratos de Componentes React (component-contracts.md)

**Framework:** React 18 / 19  
**Estilos:** Bootstrap 5.3 + Bootstrap Icons  
**Estatus:** Ratificado  

---

## 1. Contextos y Custom Hooks

### 1.1. `CartContext` & `useCart()`
- **Responsabilidad:** Gestionar el carrito de compras, persistir en `localStorage`, calcular tramos por volumen y ahorro en tiempo real.
- **API expuesta:**
  - `items: CartItem[]`
  - `subtotalRetail: number`
  - `totalPagar: number`
  - `ahorroTotal: number`
  - `porcentajeAhorro: number`
  - `isOpen: boolean`
  - `addItem(product: Product, quantity?: number): void`
  - `updateQuantity(sku: string, quantity: number): void`
  - `removeItem(sku: string): void`
  - `clearCart(): void`
  - `openCart(): void`
  - `closeCart(): void`
  - `toggleCart(): void`

### 1.2. `AuthContext` & `useAuth()`
- **Responsabilidad:** Gestionar la autenticación de usuarios de sistema, token JWT, rol activo y permisos.
- **API expuesta:**
  - `user: SystemUser | null`
  - `token: string | null`
  - `isAuthenticated: boolean`
  - `isSuperAdmin: boolean`
  - `isStoreAdmin: boolean`
  - `isDispatcher: boolean`
  - `login(username: string, password: string): Promise<{ success: boolean; error?: string }>`
  - `logout(): void`

### 1.3. `CatalogContext` & `useCatalog()`
- **Responsabilidad:** Obtener catálogo desde `/api/catalog`, gestionar filtros por categoría y búsqueda textual.
- **API expuesta:**
  - `products: Product[]`
  - `filteredProducts: Product[]`
  - `selectedCategory: string` ('TODOS' | 'ABARROTES' | 'BEBIDAS' | 'ASEO' | 'DISFRACES')
  - `searchQuery: string`
  - `isLoading: boolean`
  - `setCategory(category: string): void`
  - `setSearch(query: string): void`
  - `refreshCatalog(): Promise<void>`

---

## 2. Contratos de Componentes Visuales

### 2.1. Navegación y Encabezado
- **`<Navbar />`**:
  - *Props:* Ninguna (consume `useCart` y `useAuth`).
  - *Elementos Bootstrap:* `navbar navbar-expand-lg navbar-dark bg-dark sticky-top`, `navbar-brand` con logo badge `SM`, badges con `badge rounded-pill bg-danger`, botón Offcanvas toggle.
- **`<Footer />`**:
  - *Elementos Bootstrap:* `footer bg-dark text-light py-5`, `container`, columnas `col-12 col-md-3`. Información institucional, cobertura Santiago RM y política de tramos mayoristas.

### 2.2. Catálogo y Tienda Pública
- **`<CatalogView />`**:
  - *Contenedor principal:* Grid responsivo (`container`, `row g-4`).
  - *Subcomponentes:* `<CategoryFilter />`, `<SearchBar />`, `<SavingsBanner />`, `<ProductGrid />`.
- **`<CategoryFilter />`**:
  - *Elementos Bootstrap:* `nav nav-pills justify-content-center mb-4`, botones con clase `nav-link active` / `btn-outline-primary`.
- **`<ProductCard product={Product} />`**:
  - *Props:* `product: Product` (requerido).
  - *Elementos Bootstrap:* `card h-100 shadow-sm border-0`, badges para categoría y tramos (`bg-primary`, `bg-success`, `bg-warning text-dark`).
  - *Interacciones:* Selector numérico de cantidad con validación contra `product.stock`, botón "Agregar al Carrito" con feedback visual.
  - *Cálculo reactivo:* Muestra el precio unitario resultante y el ahorro estimado según la cantidad seleccionada.

### 2.3. Carrito Lateral (Offcanvas) y Checkout
- **`<CartDrawer />`**:
  - *Elementos Bootstrap:* `offcanvas offcanvas-end`, `offcanvas-header`, `offcanvas-body`, `offcanvas-footer`.
  - *Componentes internos:* `<CartItemRow />` con inputs de cantidad `btn-group-sm`, barra de progreso de siguiente tramo (`progress`, `progress-bar bg-success`), resumen de ahorro con badge `bg-success`.
  - *Acción:* Botón `btn btn-primary w-100 btn-lg` "Finalizar Compra vía WhatsApp" que activa `<CheckoutModal />`.
- **`<CheckoutModal show={boolean} onHide={fn} />`**:
  - *Elementos Bootstrap:* `modal fade show`, `modal-dialog-scrollable`, formulario con validación nativa (`needs-validation`).
  - *Campos:* Nombre, Teléfono (+56 9), Dirección, Selector de Comunas de Santiago RM, Método de Pago, Notas.
  - *Integración WAF:* Sanitización de campos de texto antes de la confirmación.
  - *Resultado:* Emisión de orden transaccional y redirección hacia WhatsApp con desglose de pedido.

### 2.4. Backoffice Administrativo y Super Admin (`CU-13` / `CU-12`)
- **`<AdminView />`**:
  - *Condicional:* Si `!isAuthenticated`, despliega `<LoginForm />`. Si `isAuthenticated`, despliega el panel según rol.
- **`<SuperAdminPanel />` (Exclusivo Super Admin)**:
  - *Pestaña 1:* `<UsersManagementTab />` (`CU-13`):
    - Tabla responsiva `table table-dark table-hover table-bordered`.
    - Columnas: ID, Usuario, Nombre Completo, Rol (`badge`), Estado (`Activo` / `Suspendido`), Último Acceso, Acciones.
    - Botones de acción: "Modificar" (`btn-outline-primary btn-sm`), "Suspender / Reactivar" (`btn-outline-danger / btn-outline-success btn-sm`).
    - Botón superior: "+ Agregar Nuevo Usuario" (`btn-success`).
  - *Pestaña 2:* `<SecurityAuditTab />` (`CU-12`):
    - Tabla con eventos SIEM en tiempo real, filtro por severidad (`INFO`, `WARNING`, `CRITICAL`), paginación y modal de inspección de payload JSON.
- **`<AddUserModal show={boolean} onSave={fn} onHide={fn} />`**:
  - Modal con formulario: `username`, `nombre_real`, `rol` (`SUPER_ADMIN`, `ADMIN_TIENDA`, `DESPACHADOR`), `password`.
- **`<EditUserModal show={boolean} user={SystemUser} onSave={fn} onHide={fn} />`**:
  - Modal con formulario: `nombre_real`, `rol`, `password` (opcional para cambio), `activo`.
