/**
 * MEGASUPER.CL - Capa de Persistencia Relacional Normalizada
 * Gestiona almacenamiento en producción para catálogo, inventario, pedidos y usuarios
 */

const STORAGE_KEY_PREFIX = 'megasuper_prod_';

const TABLES = {
  PRODUCTO: 'producto',
  PRECIO_TRAMO: 'precio_tramo',
  INVENTARIO_MOVIMIENTO: 'inventario_movimiento',
  CLIENTE_CRM: 'cliente_crm',
  ORDEN_PEDIDO: 'orden_pedido',
  DETALLE_ORDEN: 'detalle_orden',
  DESPACHO: 'despacho',
  USUARIO_SISTEMA: 'usuario_sistema',
  LOG_SEGURIDAD_SIEM: 'log_seguridad_siem'
};

class StorageEngine {
  constructor() {
    this.tables = TABLES;
    this.initialized = false;
  }

  getKey(table) {
    return `${STORAGE_KEY_PREFIX}${table}`;
  }

  getTable(table) {
    try {
      const data = localStorage.getItem(this.getKey(table));
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error(`Error al leer tabla ${table}:`, e);
      return [];
    }
  }

  setTable(table, rows) {
    try {
      localStorage.setItem(this.getKey(table), JSON.stringify(rows));
      window.dispatchEvent(new CustomEvent('megasuper:db-updated', { detail: { table, count: rows.length } }));
      return true;
    } catch (e) {
      console.error(`Error al guardar tabla ${table}:`, e);
      return false;
    }
  }

  getNextId(table, idField = 'id') {
    const rows = this.getTable(table);
    if (!rows.length) return 1;
    const max = rows.reduce((acc, row) => Math.max(acc, Number(row[idField]) || 0), 0);
    return max + 1;
  }

  insert(table, row) {
    const rows = this.getTable(table);
    rows.push(row);
    this.setTable(table, rows);
    return row;
  }

  update(table, predicate, updateFn) {
    const rows = this.getTable(table);
    let updatedCount = 0;
    const newRows = rows.map(item => {
      if (predicate(item)) {
        updatedCount++;
        return { ...item, ...updateFn(item) };
      }
      return item;
    });
    if (updatedCount > 0) {
      this.setTable(table, newRows);
    }
    return updatedCount;
  }

  find(table, predicate = () => true) {
    return this.getTable(table).filter(predicate);
  }

  findOne(table, predicate) {
    return this.getTable(table).find(predicate) || null;
  }

  delete(table, predicate) {
    const rows = this.getTable(table);
    const filtered = rows.filter(item => !predicate(item));
    this.setTable(table, filtered);
    return rows.length - filtered.length;
  }

  async init(catalogData = []) {
    const existingProducts = this.getTable(TABLES.PRODUCTO);
    if (existingProducts.length > 0) {
      this.initialized = true;
      return;
    }

    console.log('[StorageEngine] Inicializando base de datos de producción...');
    const productos = [];
    const preciosTramo = [];
    let idTramo = 1;

    catalogData.forEach(item => {
      productos.push({
        sku: item.sku,
        nombre: item.nombre,
        descripcion: item.descripcion,
        categoria_tienda: item.categoria_tienda,
        stock_actual: item.stock_actual,
        stock_minimo: item.stock_minimo,
        imagen_url: item.imagen_url,
        activo: item.activo ?? true,
        destacado: item.destacado ?? false
      });

      if (item.tramos && Array.isArray(item.tramos)) {
        item.tramos.forEach(t => {
          preciosTramo.push({
            id_tramo: idTramo++,
            producto_sku: item.sku,
            tramo_umbral: t.umbral,
            precio_unitario: t.precio,
            porcentaje_descuento: t.descuento_pct
          });
        });
      }
    });

    this.setTable(TABLES.PRODUCTO, productos);
    this.setTable(TABLES.PRECIO_TRAMO, preciosTramo);

    // Usuarios del sistema (Roles limpios para producción, sin nombres personales)
    const usuarios = [
      {
        id_usuario: 1,
        username: 'superadmin',
        nombre_real: 'Super Admin',
        password_hash: 'admin123',
        rol: 'SUPER_ADMIN',
        activo: true,
        ultimo_acceso: new Date().toISOString()
      },
      {
        id_usuario: 2,
        username: 'admin',
        nombre_real: 'Administrador de Tienda',
        password_hash: 'tienda123',
        rol: 'ADMIN_TIENDA',
        activo: true,
        ultimo_acceso: new Date().toISOString()
      },
      {
        id_usuario: 3,
        username: 'despacho',
        nombre_real: 'Despachador Logístico',
        password_hash: 'ruta123',
        rol: 'DESPACHADOR',
        activo: true,
        ultimo_acceso: new Date().toISOString()
      }
    ];
    this.setTable(TABLES.USUARIO_SISTEMA, usuarios);

    // Clientes iniciales para el CRM
    const clientes = [
      {
        id_cliente: 1,
        nombre_completo: 'Carlos Mardones Silva',
        telefono_whatsapp: '+56987654321',
        direccion_despacho: 'Av. Providencia 1240, Depto 402',
        comuna_rm: 'Providencia',
        fecha_registro: '2026-09-12T14:20:00Z',
        total_pedidos: 2,
        recurrente_flag: true
      },
      {
        id_cliente: 2,
        nombre_completo: 'Almacén Don Tito',
        telefono_whatsapp: '+56991234567',
        direccion_despacho: 'San Diego 850, Local 4',
        comuna_rm: 'Santiago Centro',
        fecha_registro: '2026-09-15T10:15:00Z',
        total_pedidos: 3,
        recurrente_flag: true
      },
      {
        id_cliente: 3,
        nombre_completo: 'Mariana Valenzuela Pinto',
        telefono_whatsapp: '+56976543210',
        direccion_despacho: 'Los Leones 2350',
        comuna_rm: 'Ñuñoa',
        fecha_registro: '2026-09-28T18:45:00Z',
        total_pedidos: 1,
        recurrente_flag: false
      }
    ];
    this.setTable(TABLES.CLIENTE_CRM, clientes);

    // Órdenes iniciales
    const ordenes = [
      {
        id_orden: 1,
        codigo_pedido: 'MS-2026-1001',
        id_cliente: 1,
        fecha_emision: '2026-09-25T11:30:00Z',
        subtotal_retail: 38940,
        ahorro_total: 6540,
        total_pagar: 32400,
        estado_pago: 'PAGADO',
        canal_origen: 'WEB_WHATSAPP'
      },
      {
        id_orden: 2,
        codigo_pedido: 'MS-2026-1002',
        id_cliente: 2,
        fecha_emision: '2026-10-02T09:15:00Z',
        subtotal_retail: 85900,
        ahorro_total: 19400,
        total_pagar: 66500,
        estado_pago: 'PAGADO',
        canal_origen: 'WEB_WHATSAPP'
      }
    ];
    this.setTable(TABLES.ORDEN_PEDIDO, ordenes);

    // Despachos
    const despachos = [
      {
        id_despacho: 1,
        id_orden: 1,
        estado_despacho: 'ENTREGADO',
        repartidor_responsable: 'Despachador Logístico',
        fecha_salida: '2026-09-25T14:00:00Z',
        fecha_entrega: '2026-09-25T16:30:00Z',
        observaciones: 'Entregado en conserjería sin observaciones.'
      },
      {
        id_despacho: 2,
        id_orden: 2,
        estado_despacho: 'EN_RUTA',
        repartidor_responsable: 'Despachador Logístico',
        fecha_salida: '2026-10-02T11:00:00Z',
        fecha_entrega: null,
        observaciones: 'En furgón logístico ruta Centro.'
      }
    ];
    this.setTable(TABLES.DESPACHO, despachos);

    // Movimientos iniciales
    const movimientos = [
      {
        id_movimiento: 1,
        producto_sku: 'AB-001',
        tipo_movimiento: 'ENTRADA',
        cantidad: 100,
        motivo: 'Recepción inicial proveedor',
        fecha_registro: '2026-09-08T08:00:00Z',
        id_usuario: 1
      },
      {
        id_movimiento: 2,
        producto_sku: 'BE-001',
        tipo_movimiento: 'ENTRADA',
        cantidad: 120,
        motivo: 'Llegada reposición bebidas',
        fecha_registro: '2026-09-08T09:30:00Z',
        id_usuario: 2
      }
    ];
    this.setTable(TABLES.INVENTARIO_MOVIMIENTO, movimientos);

    // Logs iniciales de seguridad
    const logs = [
      {
        id_log: 1,
        timestamp_utc: new Date(Date.now() - 3600000).toISOString(),
        event_type: 'SYSTEM_BOOT',
        severity: 'INFO',
        ip_origen: '190.161.42.18',
        user_agent: 'MEGASUPER Production System',
        details_payload: JSON.stringify({ message: 'Sistema de producción inicializado con éxito.' }),
        resuelto: true
      }
    ];
    this.setTable(TABLES.LOG_SEGURIDAD_SIEM, logs);

    this.initialized = true;
    console.log('[StorageEngine] Sistema de producción inicializado.');
  }

  resetAll(catalogData = []) {
    Object.values(TABLES).forEach(tbl => {
      localStorage.removeItem(this.getKey(tbl));
    });
    return this.init(catalogData);
  }
}

export const db = new StorageEngine();
export { TABLES };
