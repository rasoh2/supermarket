-- ========================================================================
-- MEGASUPER.CL - Esquema Relacional de Base de Datos en Tercera Forma Normal (3FN)
-- Conforme al Diccionario de Datos Formal (Tabla 5, INFORME_MEGASUPER.docx)
-- Motor: SQLite 3 (node:sqlite / standalone)
-- ========================================================================

PRAGMA foreign_keys = ON;

-- 1. Catálogo Maestro de Productos (PRODUCTO)
CREATE TABLE IF NOT EXISTS PRODUCTO (
    sku VARCHAR(50) PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    categoria_tienda VARCHAR(50) NOT NULL CHECK (categoria_tienda IN ('ABARROTES', 'BEBIDAS', 'ASEO', 'DISFRACES')),
    stock_actual INT NOT NULL CHECK (stock_actual >= 0),
    stock_minimo INT NOT NULL DEFAULT 5,
    imagen_url VARCHAR(500),
    activo BOOLEAN NOT NULL DEFAULT 1,
    destacado BOOLEAN NOT NULL DEFAULT 0,
    descripcion TEXT
);

-- 2. Tramos de Descuento por Volumen (PRECIO_TRAMO - 3FN)
CREATE TABLE IF NOT EXISTS PRECIO_TRAMO (
    id_tramo INTEGER PRIMARY KEY AUTOINCREMENT,
    producto_sku VARCHAR(50) NOT NULL,
    tramo_umbral INT NOT NULL CHECK (tramo_umbral IN (1, 3, 6)),
    precio_unitario INT NOT NULL CHECK (precio_unitario >= 0),
    porcentaje_descuento REAL NOT NULL DEFAULT 0.0,
    FOREIGN KEY (producto_sku) REFERENCES PRODUCTO(sku) ON DELETE CASCADE,
    UNIQUE (producto_sku, tramo_umbral)
);

-- 3. Usuarios del Sistema y Roles RBAC (USUARIO_SISTEMA)
CREATE TABLE IF NOT EXISTS USUARIO_SISTEMA (
    id_usuario INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    nombre_real VARCHAR(150) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(30) NOT NULL CHECK (rol IN ('SUPER_ADMIN', 'ADMIN_TIENDA', 'DESPACHADOR')),
    activo BOOLEAN NOT NULL DEFAULT 1,
    ultimo_acceso TEXT
);

-- 4. Maestro de Clientes (CLIENTE_CRM)
CREATE TABLE IF NOT EXISTS CLIENTE_CRM (
    id_cliente INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre_completo VARCHAR(150) NOT NULL,
    telefono_whatsapp VARCHAR(30) UNIQUE NOT NULL,
    direccion_despacho VARCHAR(255) NOT NULL,
    comuna_rm VARCHAR(100) NOT NULL,
    fecha_registro TEXT NOT NULL,
    total_pedidos INT NOT NULL DEFAULT 1,
    recurrente_flag BOOLEAN NOT NULL DEFAULT 0
);

-- 5. Cabecera Transaccional de Pedidos (ORDEN_PEDIDO)
CREATE TABLE IF NOT EXISTS ORDEN_PEDIDO (
    id_orden INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo_pedido VARCHAR(50) UNIQUE NOT NULL,
    id_cliente INT NOT NULL,
    fecha_emision TEXT NOT NULL,
    subtotal_retail INT NOT NULL,
    ahorro_total INT NOT NULL,
    total_pagar INT NOT NULL CHECK (total_pagar > 0),
    estado_pago VARCHAR(20) NOT NULL DEFAULT 'PAGADO' CHECK (estado_pago IN ('PENDIENTE', 'PAGADO', 'CANCELADO')),
    canal_origen VARCHAR(50) NOT NULL DEFAULT 'WEB_WHATSAPP',
    metodo_pago VARCHAR(50) NOT NULL DEFAULT 'TRANSFERENCIA',
    notas TEXT,
    FOREIGN KEY (id_cliente) REFERENCES CLIENTE_CRM(id_cliente)
);

-- 6. Detalle Asociativo de la Orden (DETALLE_ORDEN - N:M congelando precio histórico)
CREATE TABLE IF NOT EXISTS DETALLE_ORDEN (
    id_detalle INTEGER PRIMARY KEY AUTOINCREMENT,
    id_orden INT NOT NULL,
    producto_sku VARCHAR(50) NOT NULL,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    tramo_aplicado INT NOT NULL,
    precio_unitario_cobrado INT NOT NULL,
    subtotal_linea INT NOT NULL,
    FOREIGN KEY (id_orden) REFERENCES ORDEN_PEDIDO(id_orden) ON DELETE CASCADE,
    FOREIGN KEY (producto_sku) REFERENCES PRODUCTO(sku)
);

-- 7. Seguimiento Logístico de Despacho (DESPACHO - 1:1 con Orden)
CREATE TABLE IF NOT EXISTS DESPACHO (
    id_despacho INTEGER PRIMARY KEY AUTOINCREMENT,
    id_orden INT UNIQUE NOT NULL,
    estado_despacho VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE' CHECK (estado_despacho IN ('PENDIENTE', 'EN_PREPARACION', 'EN_RUTA', 'ENTREGADO', 'FALLIDO')),
    repartidor_responsable VARCHAR(100),
    fecha_salida TEXT,
    fecha_entrega TEXT,
    observaciones TEXT,
    FOREIGN KEY (id_orden) REFERENCES ORDEN_PEDIDO(id_orden) ON DELETE CASCADE
);

-- 8. Auditoría Kardex de Movimientos de Inventario (INVENTARIO_MOVIMIENTO)
CREATE TABLE IF NOT EXISTS INVENTARIO_MOVIMIENTO (
    id_movimiento INTEGER PRIMARY KEY AUTOINCREMENT,
    producto_sku VARCHAR(50) NOT NULL,
    tipo_movimiento VARCHAR(20) NOT NULL CHECK (tipo_movimiento IN ('ENTRADA', 'SALIDA', 'AJUSTE', 'MERMA')),
    cantidad INT NOT NULL,
    motivo VARCHAR(255),
    fecha_registro TEXT NOT NULL,
    id_usuario INT,
    FOREIGN KEY (producto_sku) REFERENCES PRODUCTO(sku),
    FOREIGN KEY (id_usuario) REFERENCES USUARIO_SISTEMA(id_usuario)
);

-- 9. Bitácora Inmutable de Seguridad y Auditoría (LOG_SEGURIDAD_SIEM)
CREATE TABLE IF NOT EXISTS LOG_SEGURIDAD_SIEM (
    id_log INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp_utc TEXT NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('INFO', 'WARNING', 'CRITICAL')),
    ip_origen VARCHAR(45),
    user_agent VARCHAR(255),
    details_payload TEXT,
    resuelto BOOLEAN NOT NULL DEFAULT 1
);

-- Índices para optimización de consultas
CREATE INDEX IF NOT EXISTS idx_producto_categoria ON PRODUCTO(categoria_tienda);
CREATE INDEX IF NOT EXISTS idx_precio_tramo_sku ON PRECIO_TRAMO(producto_sku);
CREATE INDEX IF NOT EXISTS idx_orden_cliente ON ORDEN_PEDIDO(id_cliente);
CREATE INDEX IF NOT EXISTS idx_despacho_orden ON DESPACHO(id_orden);
CREATE INDEX IF NOT EXISTS idx_kardex_sku ON INVENTARIO_MOVIMIENTO(producto_sku);
CREATE INDEX IF NOT EXISTS idx_siem_timestamp ON LOG_SEGURIDAD_SIEM(timestamp_utc);
