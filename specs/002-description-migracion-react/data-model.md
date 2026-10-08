# Phase 1: Modelo de Datos y Estado de la Aplicación (data-model.md)

**Característica:** Migración de Frontend a React con Bootstrap 5  
**Fecha:** Octubre 2026  
**Estatus:** Completado  

---

## 1. Entidades del Dominio y Tipos en React

### 1.1. Producto y Tramos Mayoristas (`Product` & `PriceTier`)

Representa la información sincronizada desde `GET /api/catalog`.

```typescript
interface PriceTier {
  id: number;
  producto_id: number;
  rango_min: number;
  rango_max: number | null; // null representa infinito (e.g. 6+)
  precio_unitario: number;
  etiqueta: string; // "1-2 u.", "3-5 u.", "6+ u."
}

interface Product {
  id: number;
  sku: string; // Único, e.g. "AB-001"
  nombre: string;
  descripcion: string;
  categoria: 'ABARROTES' | 'BEBIDAS' | 'ASEO' | 'DISFRACES';
  imagen_url: string;
  stock: number;
  destacado: boolean;
  tramos: PriceTier[];
}
```

### 1.2. Carrito de Compras (`CartItem` & `CartState`)

Estado local administrado por `CartContext` y sincronizado en `LocalStorage`.

```typescript
interface CartItem {
  id: number;
  sku: string;
  nombre: string;
  categoria: string;
  imagen_url: string;
  stock: number;
  cantidad: number;
  precio_base: number; // Precio unitario de tramo 1
  precio_unitario_aplicado: number; // Precio según volumen
  tramo_actual: string; // "Tramo 1 (Retail)" | "Tramo 2 (Mayorista)" | "Tramo 3 (Distribuidor)"
  subtotal_retail: number; // cantidad * precio_base
  subtotal_cobrado: number; // cantidad * precio_unitario_aplicado
  ahorro_item: number; // subtotal_retail - subtotal_cobrado
  proximo_tramo: {
    unidades_faltantes: number;
    nuevo_precio: number;
    ahorro_adicional: number;
  } | null;
}

interface CartState {
  items: CartItem[];
  subtotalRetail: number;
  totalPagar: number;
  ahorroTotal: number;
  porcentajeAhorro: number;
  totalUnidades: number;
  isOpen: boolean;
}
```

### 1.3. Sesión y Autenticación RBAC (`AuthState`)

Administrado por `AuthContext` tras invocar `POST /api/auth/login`.

```typescript
type UserRole = 'SUPER_ADMIN' | 'ADMIN_TIENDA' | 'DESPACHADOR';

interface SystemUser {
  id: number;
  username: string; // ej. "superadmin", "operador_bodega"
  nombre_real: string; // e.g. "Super Admin" (sin nombres personales ajenos al cargo)
  rol: UserRole;
  activo: boolean;
  ultimo_acceso?: string;
  creado_el?: string;
}

interface AuthState {
  user: SystemUser | null;
  token: string | null;
  isAuthenticated: boolean;
  role: UserRole | null;
  isLoading: boolean;
}
```

### 1.4. Orden de Pedido y Checkout (`OrderSubmission`)

Modelo enviado a `POST /api/orders` y codificado para WhatsApp Gateway.

```typescript
interface CustomerData {
  nombre: string;
  telefono: string;
  direccion: string;
  comuna: string; // Comuna de Santiago RM
  metodo_pago: 'TRANSFERENCIA' | 'EFECTIVO_CONTRA_ENTREGA';
  notas?: string;
}

interface OrderSubmission {
  cliente: CustomerData;
  items: Array<{
    producto_id: number;
    sku: string;
    nombre: string;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
  }>;
  totales: {
    subtotal_retail: number;
    ahorro_volumen: number;
    total_final: number;
  };
}

interface OrderConfirmation {
  codigo_pedido: string; // Formato: SM-2026-XXXX
  timestamp: string;
  whatsapp_url: string;
  despacho_estimado: string;
}
```

### 1.5. Módulos de Backoffice

```typescript
interface SiemSecurityLog {
  id: number;
  timestamp_utc: string;
  event_type: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  ip_origen: string;
  user_agent: string;
  details_payload: any;
  resuelto: boolean;
}

interface InventoryKardex {
  id: number;
  timestamp_utc: string;
  sku: string;
  tipo: 'ENTRADA' | 'SALIDA' | 'AJUSTE' | 'REVERSION';
  cantidad: number;
  stock_anterior: number;
  stock_nuevo: number;
  motivo: string;
}

interface DispatchRecord {
  id: number;
  codigo_pedido: string;
  estado: 'PENDIENTE' | 'EN_TRANSITO' | 'ENTREGADO' | 'CANCELADO';
  comuna: string;
  destinatario: string;
  total: number;
  fecha: string;
}
```

---

## 2. Diagrama de Transición de Estados

### 2.1. Ciclo de Vida del Carrito en React
```
[VACÍO] 
  │
  ├── onClick(Agregar Producto)
  ▼
[ACTIVO CON ÍTEMS] ◄───► [ACTUALIZACIÓN DE TRAMO] (Recalcular determinista)
  │                              ▲
  ├── onChange(Modificar Cantidad)│
  ├── LocalStorage.setItem()
  │
  ├── onClick(Iniciar Compra)
  ▼
[MODAL CHECKOUT ABIERTO]
  │
  ├── onSubmit(Confirmar Orden)
  ▼
[POST /api/orders] ───► [ORDEN ASENTADA SM-2026-XXXX]
                              │
                              ├── Redirección WhatsApp Gateway
                              └── Carrito Vacío & Reset LocalStorage
```

### 2.2. Gobernanza de Vistas de Backoffice según Rol
```
[LOGIN EXITOSO]
       │
       ├─► rol === 'SUPER_ADMIN' ───► [Pestañas: Gestión de Cuentas (CU-13) + Auditoría SIEM (CU-12)]
       ├─► rol === 'ADMIN_TIENDA' ──► [Pestañas: Inventario Kardex + Métricas Comerciales]
       └─► rol === 'DESPACHADOR' ───► [Pestaña: Módulo de Despachos]
```
