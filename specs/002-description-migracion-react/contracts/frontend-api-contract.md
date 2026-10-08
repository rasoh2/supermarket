# Contrato de Interfaz API REST (frontend-api-contract.md)

**Consumidor:** Frontend React + Bootstrap 5  
**Servidor:** Node.js + SQLite 3FN (`server/server.js`)  
**Base URL:** `/api`  
**Estatus:** Ratificado  

---

## 1. Endpoints Públicos (Catálogo y Compra)

### 1.1. `GET /api/catalog`
- **Descripción:** Obtiene los 17 productos con sus 51 tramos de precios y stock actualizados en SQLite 3FN.
- **Respuesta (200 OK):**
```json
{
  "total": 17,
  "categorias": ["ABARROTES", "BEBIDAS", "ASEO", "DISFRACES"],
  "productos": [
    {
      "id": 1,
      "sku": "AB-001",
      "nombre": "Arroz Grado 1 Extra Selección 1kg",
      "descripcion": "Grano largo seleccionado calidad premium...",
      "categoria": "ABARROTES",
      "imagen_url": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600",
      "stock": 85,
      "destacado": true,
      "tramos": [
        { "id": 1, "rango_min": 1, "rango_max": 2, "precio_unitario": 1490, "etiqueta": "1-2 u." },
        { "id": 2, "rango_min": 3, "rango_max": 5, "precio_unitario": 1290, "etiqueta": "3-5 u." },
        { "id": 3, "rango_min": 6, "rango_max": null, "precio_unitario": 1100, "etiqueta": "6+ u." }
      ]
    }
  ]
}
```

### 1.2. `POST /api/orders`
- **Descripción:** Asienta una orden de compra transaccional, descuenta el stock de las tablas relacionales y devuelve el enlace estructurado de WhatsApp.
- **Body:**
```json
{
  "cliente": {
    "nombre": "Comprador Santiago",
    "telefono": "+56 9 1234 5678",
    "direccion": "Av. Providencia 1234",
    "comuna": "Providencia",
    "metodo_pago": "TRANSFERENCIA",
    "notas": "Dejar en conserjería"
  },
  "items": [
    { "producto_id": 1, "sku": "AB-001", "cantidad": 6, "precio_unitario": 1100, "subtotal": 6600 }
  ],
  "totales": {
    "subtotal_retail": 8940,
    "ahorro_volumen": 2340,
    "total_final": 6600
  }
}
```
- **Respuesta (201 Created):**
```json
{
  "success": true,
  "codigo_pedido": "SM-2026-4891",
  "whatsapp_url": "https://wa.me/56987654321?text=...",
  "mensaje": "Pedido registrado y stock descontado exitosamente."
}
```

---

## 2. Endpoints Administrativos y Gobernanza RBAC

### 2.1. `POST /api/auth/login`
- **Descripción:** Autentica credenciales administrativas. Protegido por limitador anti fuerza bruta (15 intentos).
- **Body:** `{ "username": "superadmin", "password": "..." }`
- **Respuesta (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "superadmin",
    "nombre_real": "Super Admin",
    "rol": "SUPER_ADMIN"
  }
}
```

### 2.2. Super Admin: Gestión de Cuentas (`CU-13`)
- **`GET /api/users`** (Header: `Authorization: Bearer <token>`):
  - Retorna listado de usuarios de sistema sin contraseñas.
- **`POST /api/users`**:
  - Crea nueva cuenta interna: `{ "username": "...", "nombre_real": "...", "rol": "...", "password": "..." }`.
- **`PUT /api/users/:id`**:
  - Actualiza información de usuario existente y rol.
- **`PATCH /api/users/:id/status`**:
  - Modifica estado: `{ "activo": true | false }`. Suspende o reactiva acceso.

### 2.3. Super Admin: Bitácora SIEM de Seguridad (`CU-12`)
- **`GET /api/security/logs`** (Header: `Authorization: Bearer <token>`):
  - Retorna eventos SIEM inmutables con severidad (`INFO`, `WARNING`, `CRITICAL`), IP de origen y detalle JSON.

### 2.4. Módulos Operativos (Admin Tienda / Despachador)
- **`GET /api/inventory/movements`**: Bitácora Kardex.
- **`POST /api/inventory/movements`**: Ajuste manual de inventario (Entrada/Salida).
- **`GET /api/dispatch`**: Listado de pedidos para logística.
- **`PATCH /api/dispatch/:id/status`**: Actualizar ciclo (`PENDIENTE` -> `EN_TRANSITO` -> `ENTREGADO`).
- **`GET /api/metrics`**: Cálculo de AOV, tasa de conversión y rotación de inventario.
