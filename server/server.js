/**
 * server/server.js
 * Servidor Web y API REST de Producción para SuperMarket.cl
 * Desarrollado con Node.js nativo (node:http + node:sqlite) - Sin dependencias externas
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db, initDatabase } from './db.js';
import { 
  hashPassword, 
  verifyPassword, 
  encryptField, 
  encryptDeterministic, 
  decryptField,
  generateSessionToken,
  verifySessionToken
} from './crypto-security.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const PORT = process.env.PORT || 8080;

// Tipos MIME para el servidor de estáticos
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

// Rate limiting simple en memoria para autenticación
const failedAttempts = new Map();

// Helper para parsear JSON body en peticiones POST/PUT/PATCH
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

// Helper para responder JSON con cabeceras defensivas (SecOps Gilfoyle Standards)
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'https://supermarket.cl',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  });
  res.end(JSON.stringify(data));
}

// Helper para extraer y verificar usuario autenticado desde cabecera Authorization (Bearer)
function getAuthenticatedUser(req) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return null;
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  return verifySessionToken(token);
}

// Helper para registrar log SIEM
function logSiem(eventType, severity, details, ip = '127.0.0.1', ua = 'API Client') {
  try {
    const stmt = db.prepare(`
      INSERT INTO LOG_SEGURIDAD_SIEM (timestamp_utc, event_type, severity, ip_origen, user_agent, details_payload, resuelto)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `);
    stmt.run(new Date().toISOString(), eventType, severity, ip, ua, typeof details === 'string' ? details : JSON.stringify(details));
  } catch (e) {
    console.error('Error insertando log SIEM:', e);
  }
}

// Router API
async function handleApi(req, res, url) {
  const pathname = url.pathname;
  const method = req.method;
  const ip = req.socket.remoteAddress || '127.0.0.1';
  const ua = req.headers['user-agent'] || 'Unknown';

  // Manejar pre-flight CORS
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'https://supermarket.cl',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  // SEC-01 Fix: Verificación de token y RBAC en rutas protegidas
  const publicRoutes = ['/api/health', '/api/auth/login', '/api/catalog'];
  const isPublicRoute = publicRoutes.includes(pathname) || 
                        (pathname === '/api/orders' && method === 'POST'); // Checkout es público
                        
  let user = null;
  if (pathname.startsWith('/api/') && !isPublicRoute) {
    user = getAuthenticatedUser(req);
    if (!user) {
      logSiem('AUTH_REJECTED', 'WARNING', { path: pathname, ip, reason: 'Token inválido o ausente' }, ip, ua);
      return sendJson(res, 401, { error: 'No autorizado. Token inválido o ausente.' });
    }
  }

  // Verificación de Roles (RBAC) para rutas específicas
  if (pathname.startsWith('/api/users') && user && user.rol !== 'SUPER_ADMIN') {
    return sendJson(res, 403, { error: 'Prohibido. Se requiere rol SUPER_ADMIN.' });
  }

  if (pathname.startsWith('/api/security/logs') && user && user.rol !== 'SUPER_ADMIN') {
    return sendJson(res, 403, { error: 'Prohibido. Se requiere rol SUPER_ADMIN para ver bitácora.' });
  }

  if (pathname.startsWith('/api/inventory/movements') && user && !['SUPER_ADMIN', 'ADMIN_TIENDA'].includes(user.rol)) {
    return sendJson(res, 403, { error: 'Prohibido. Se requiere rol ADMIN_TIENDA o superior.' });
  }

  if (pathname.startsWith('/api/dispatch') && user && !['SUPER_ADMIN', 'DESPACHADOR'].includes(user.rol)) {
    return sendJson(res, 403, { error: 'Prohibido. Se requiere rol DESPACHADOR o superior.' });
  }

  if (pathname.startsWith('/api/metrics') && user && !['SUPER_ADMIN', 'ADMIN_TIENDA'].includes(user.rol)) {
    return sendJson(res, 403, { error: 'Prohibido. Se requiere rol ADMIN_TIENDA o superior para métricas.' });
  }
  
  if (pathname.startsWith('/api/customers') && user && !['SUPER_ADMIN', 'ADMIN_TIENDA'].includes(user.rol)) {
    return sendJson(res, 403, { error: 'Prohibido. Se requiere rol ADMIN_TIENDA o superior para clientes.' });
  }

  // 1. Estado y Healthcheck
  if (pathname === '/api/health' && method === 'GET') {
    return sendJson(res, 200, {
      status: 'OK',
      database: 'SQLite 3 (3FN)',
      timestamp: new Date().toISOString()
    });
  }

  // 2. Catálogo de productos con tramos normalizados
  if (pathname === '/api/catalog' && method === 'GET') {
    const category = url.searchParams.get('categoria');
    let sql = 'SELECT * FROM PRODUCTO WHERE activo = 1';
    const params = [];
    if (category && category !== 'TODOS') {
      sql += ' AND categoria_tienda = ?';
      params.push(category);
    }
    sql += ' ORDER BY destacado DESC, nombre ASC';

    const products = db.prepare(sql).all(...params);
    const tramos = db.prepare('SELECT * FROM PRECIO_TRAMO ORDER BY tramo_umbral ASC').all();

    // Asociar tramos a cada producto
    const catalog = products.map(p => ({
      ...p,
      tramos: tramos.filter(t => t.producto_sku === p.sku)
    }));

    return sendJson(res, 200, catalog);
  }

  // 3. Autenticación (RF-12)
  if (pathname === '/api/auth/login' && method === 'POST') {
    const body = await parseBody(req);
    const { username, password } = body;

    const attempts = failedAttempts.get(username) || 0;
    if (attempts >= 15) {
      logSiem('AUTH_RATE_LIMIT_EXCEEDED', 'CRITICAL', { username, attempts }, ip, ua);
      return sendJson(res, 429, { error: 'Demasiados intentos fallidos. Cuenta temporalmente bloqueada.' });
    }

    const user = db.prepare('SELECT * FROM USUARIO_SISTEMA WHERE username = ?').get(username);
    if (!user || !verifyPassword(password, user.password_hash)) {
      failedAttempts.set(username, attempts + 1);
      logSiem('ADMIN_AUTH_FAILED', 'WARNING', { username, reason: 'Credenciales inválidas' }, ip, ua);
      return sendJson(res, 401, { error: 'Usuario o contraseña incorrectos.' });
    }

    if (!user.activo) {
      logSiem('ADMIN_AUTH_BLOCKED', 'WARNING', { username, reason: 'Cuenta suspendida' }, ip, ua);
      return sendJson(res, 403, { error: 'Esta cuenta se encuentra suspendida.' });
    }

    failedAttempts.delete(username);
    db.prepare('UPDATE USUARIO_SISTEMA SET ultimo_acceso = ? WHERE id_usuario = ?').run(new Date().toISOString(), user.id_usuario);
    logSiem('ADMIN_AUTH_SUCCESS', 'INFO', { id_usuario: user.id_usuario, username: user.username, rol: user.rol }, ip, ua);

    // Token firmado criptográficamente con HMAC-SHA256 (SecOps Gilfoyle Standards)
    const token = generateSessionToken(user);
    return sendJson(res, 200, {
      success: true,
      token,
      user: {
        id_usuario: user.id_usuario,
        username: user.username,
        nombre_real: user.nombre_real,
        rol: user.rol
      }
    });
  }

  // 4. Gestión de Usuarios - Módulo Super Admin (CU-13 / RF-13 / RF-14)
  if (pathname === '/api/users' && method === 'GET') {
    const users = db.prepare('SELECT id_usuario, username, nombre_real, rol, activo, ultimo_acceso FROM USUARIO_SISTEMA ORDER BY id_usuario ASC').all();
    return sendJson(res, 200, users);
  }

  if (pathname === '/api/users' && method === 'POST') {
    const body = await parseBody(req);
    const { username, nombre_real, rol, password } = body;

    if (!username || !nombre_real || !rol || !password) {
      return sendJson(res, 400, { error: 'Todos los campos son obligatorios.' });
    }

    try {
      const stmt = db.prepare(`
        INSERT INTO USUARIO_SISTEMA (username, nombre_real, password_hash, rol, activo, ultimo_acceso)
        VALUES (?, ?, ?, ?, 1, NULL)
      `);
      const result = stmt.run(username.trim().toLowerCase(), nombre_real.trim(), hashPassword(password), rol);
      logSiem('USER_ACCOUNT_CREATED', 'INFO', { new_username: username, assigned_role: rol }, ip, ua);
      return sendJson(res, 201, { success: true, id_usuario: result.lastInsertRowid });
    } catch (err) {
      if (err.message?.includes('UNIQUE')) {
        return sendJson(res, 409, { error: `El nombre de usuario "@${username}" ya está registrado.` });
      }
      return sendJson(res, 500, { error: err.message });
    }
  }

  if (pathname.startsWith('/api/users/') && method === 'PUT') {
    const id = Number(pathname.split('/')[3]);
    const body = await parseBody(req);
    const { username, nombre_real, rol, password, activo } = body;

    const existing = db.prepare('SELECT * FROM USUARIO_SISTEMA WHERE id_usuario = ?').get(id);
    if (!existing) return sendJson(res, 404, { error: 'Usuario no encontrado.' });

    let sql = 'UPDATE USUARIO_SISTEMA SET username = ?, nombre_real = ?, rol = ?, activo = ?';
    const params = [username || existing.username, nombre_real || existing.nombre_real, rol || existing.rol, activo !== undefined ? (activo ? 1 : 0) : existing.activo];

    if (password && password.trim()) {
      sql += ', password_hash = ?';
      params.push(hashPassword(password.trim()));
    }
    sql += ' WHERE id_usuario = ?';
    params.push(id);

    db.prepare(sql).run(...params);
    logSiem('USER_ACCOUNT_UPDATED', 'INFO', { id_usuario: id, username }, ip, ua);
    return sendJson(res, 200, { success: true, message: 'Usuario actualizado.' });
  }

  if (pathname.startsWith('/api/users/') && pathname.endsWith('/status') && method === 'PATCH') {
    const id = Number(pathname.split('/')[3]);
    const body = await parseBody(req);
    const { activo } = body;

    const user = db.prepare('SELECT * FROM USUARIO_SISTEMA WHERE id_usuario = ?').get(id);
    if (!user) return sendJson(res, 404, { error: 'Usuario no encontrado.' });
    if (user.rol === 'SUPER_ADMIN') return sendJson(res, 403, { error: 'No se puede desactivar la cuenta del Super Admin principal.' });

    db.prepare('UPDATE USUARIO_SISTEMA SET activo = ? WHERE id_usuario = ?').run(activo ? 1 : 0, id);
    logSiem('USER_STATUS_MODIFIED', 'WARNING', { id_usuario: id, new_status: activo }, ip, ua);
    return sendJson(res, 200, { success: true, activo: !!activo });
  }

  // 5. Creación de Pedido y Transacción en Carrito (CU-04, CU-05 / RF-06, RF-07)
  if (pathname === '/api/orders' && method === 'POST') {
    const body = await parseBody(req);
    const { customer, items, paymentMethod, notes } = body;

    if (!customer || !customer.nombre || !customer.telefono || !customer.direccion || !customer.comuna) {
      return sendJson(res, 400, { error: 'Faltan datos de contacto del cliente.' });
    }
    if (!items || !items.length) {
      return sendJson(res, 400, { error: 'El pedido debe contener al menos un producto.' });
    }

    // Registrar o actualizar cliente en CRM con campos sensibles cifrados (AES-256-GCM)
    const plainTel = customer.telefono.trim();
    const encTel = encryptDeterministic(plainTel);
    const encDir = encryptField(customer.direccion.trim());

    let cliente = db.prepare('SELECT * FROM CLIENTE_CRM WHERE telefono_whatsapp = ? OR telefono_whatsapp = ?').get(encTel, plainTel);
    let id_cliente;
    if (cliente) {
      id_cliente = cliente.id_cliente;
      db.prepare(`
        UPDATE CLIENTE_CRM SET 
          nombre_completo = ?, telefono_whatsapp = ?, direccion_despacho = ?, comuna_rm = ?, 
          total_pedidos = total_pedidos + 1, recurrente_flag = 1 
        WHERE id_cliente = ?
      `).run(customer.nombre.trim(), encTel, encDir, customer.comuna.trim(), id_cliente);
    } else {
      const resC = db.prepare(`
        INSERT INTO CLIENTE_CRM (nombre_completo, telefono_whatsapp, direccion_despacho, comuna_rm, fecha_registro, total_pedidos, recurrente_flag)
        VALUES (?, ?, ?, ?, ?, 1, 0)
      `).run(customer.nombre.trim(), encTel, encDir, customer.comuna.trim(), new Date().toISOString());
      id_cliente = resC.lastInsertRowid;
    }

    // Calcular montos y validar stock
    let subtotalRetail = 0;
    let totalPagar = 0;
    const orderItems = [];

    for (const item of items) {
      const prod = db.prepare('SELECT * FROM PRODUCTO WHERE sku = ?').get(item.sku);
      if (!prod) return sendJson(res, 400, { error: `Producto con SKU ${item.sku} no existe.` });
      if (prod.stock_actual < item.cantidad) {
        return sendJson(res, 400, { error: `Stock insuficiente para ${prod.nombre} (disponible: ${prod.stock_actual}).` });
      }

      const tramos = db.prepare('SELECT * FROM PRECIO_TRAMO WHERE producto_sku = ? ORDER BY tramo_umbral ASC').all(item.sku);
      let appliedPrice = tramos[0]?.precio_unitario || 0;
      let appliedTramo = 1;
      for (const t of tramos) {
        if (item.cantidad >= t.tramo_umbral) {
          appliedPrice = t.precio_unitario;
          appliedTramo = t.tramo_umbral;
        }
      }

      const baseRetail = tramos[0]?.precio_unitario || appliedPrice;
      const subRetail = baseRetail * item.cantidad;
      const subCobrado = appliedPrice * item.cantidad;

      subtotalRetail += subRetail;
      totalPagar += subCobrado;

      orderItems.push({
        sku: prod.sku,
        nombre: prod.nombre,
        cantidad: item.cantidad,
        tramo_aplicado: appliedTramo,
        precio_unitario: appliedPrice,
        subtotal: subCobrado
      });
    }

    const ahorroTotal = Math.max(0, subtotalRetail - totalPagar);
    const orderCode = `MS-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    // Iniciar transacción de orden
    const resO = db.prepare(`
      INSERT INTO ORDEN_PEDIDO (codigo_pedido, id_cliente, fecha_emision, subtotal_retail, ahorro_total, total_pagar, estado_pago, canal_origen, metodo_pago, notas)
      VALUES (?, ?, ?, ?, ?, ?, 'PAGADO', 'WEB_WHATSAPP', ?, ?)
    `).run(orderCode, id_cliente, new Date().toISOString(), subtotalRetail, ahorroTotal, totalPagar, paymentMethod || 'TRANSFERENCIA', notes || '');

    const id_orden = resO.lastInsertRowid;

    // Insertar detalles y descontar stock
    const insertDet = db.prepare(`
      INSERT INTO DETALLE_ORDEN (id_orden, producto_sku, cantidad, tramo_aplicado, precio_unitario_cobrado, subtotal_linea)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const updateStock = db.prepare('UPDATE PRODUCTO SET stock_actual = stock_actual - ? WHERE sku = ?');
    const insertKardex = db.prepare(`
      INSERT INTO INVENTARIO_MOVIMIENTO (producto_sku, tipo_movimiento, cantidad, motivo, fecha_registro, id_usuario)
      VALUES (?, 'SALIDA', ?, ?, ?, NULL)
    `);

    for (const oi of orderItems) {
      insertDet.run(id_orden, oi.sku, oi.cantidad, oi.tramo_aplicado, oi.precio_unitario, oi.subtotal);
      updateStock.run(oi.cantidad, oi.sku);
      insertKardex.run(oi.sku, oi.cantidad, `Venta en orden #${orderCode}`, new Date().toISOString());
    }

    // Crear registro de despacho inicial
    db.prepare(`
      INSERT INTO DESPACHO (id_orden, estado_despacho, repartidor_responsable, fecha_salida, fecha_entrega, observaciones)
      VALUES (?, 'PENDIENTE', 'Despachador Logístico', NULL, NULL, ?)
    `).run(id_orden, `Comuna de destino: ${customer.comuna}`);

    logSiem('ORDER_CREATED_SUCCESS', 'INFO', { codigo_pedido: orderCode, totalPagar, comuna: customer.comuna }, ip, ua);

    // Estructurar comprobante de WhatsApp
    let msg = `🛒 *NUEVO PEDIDO SuperMarket.cl* 🛒\n`;
    msg += `📄 *Código:* ${orderCode}\n`;
    msg += `👤 *Cliente:* ${customer.nombre}\n`;
    msg += `📞 *Teléfono:* ${customer.telefono}\n`;
    msg += `📍 *Despacho:* ${customer.direccion}, ${customer.comuna}\n\n`;
    msg += `📦 *DETALLE DE PRODUCTOS:*\n`;
    orderItems.forEach(i => {
      msg += `• ${i.cantidad}x ${i.nombre} — $${i.subtotal.toLocaleString('es-CL')} ($${i.precio_unitario.toLocaleString('es-CL')} c/u)\n`;
    });
    msg += `\n💰 *Subtotal Retail:* $${subtotalRetail.toLocaleString('es-CL')}`;
    msg += `\n🎁 *Ahorro Mayorista:* $${ahorroTotal.toLocaleString('es-CL')}`;
    msg += `\n💵 *TOTAL DEFINITIVO:* $${totalPagar.toLocaleString('es-CL')}`;
    msg += `\n💳 *Método de Pago:* ${paymentMethod || 'Transferencia'}`;
    if (notes) msg += `\n📝 *Notas:* ${notes}`;

    const whatsappUrl = `https://wa.me/56987654321?text=${encodeURIComponent(msg)}`;

    return sendJson(res, 201, {
      success: true,
      orderCode,
      id_orden,
      totalPagar,
      ahorroTotal,
      whatsappUrl
    });
  }

  // 6. Listado y Anulación de Órdenes (RF-09, RF-11)
  if (pathname === '/api/orders' && method === 'GET') {
    const orders = db.prepare(`
      SELECT o.*, c.nombre_completo as cliente_nombre, c.telefono_whatsapp, c.direccion_despacho, c.comuna_rm,
             d.estado_despacho, d.repartidor_responsable
      FROM ORDEN_PEDIDO o
      LEFT JOIN CLIENTE_CRM c ON o.id_cliente = c.id_cliente
      LEFT JOIN DESPACHO d ON o.id_orden = d.id_orden
      ORDER BY o.id_orden DESC
    `).all();

    const details = db.prepare('SELECT * FROM DETALLE_ORDEN').all();
    const result = orders.map(o => ({
      ...o,
      telefono_whatsapp: decryptField(o.telefono_whatsapp),
      direccion_despacho: decryptField(o.direccion_despacho),
      items: details.filter(d => d.id_orden === o.id_orden)
    }));
    return sendJson(res, 200, result);
  }

  if (pathname.startsWith('/api/orders/') && pathname.endsWith('/cancel') && method === 'POST') {
    const id = Number(pathname.split('/')[3]);
    const body = await parseBody(req);
    const { razon, userId } = body;

    const order = db.prepare('SELECT * FROM ORDEN_PEDIDO WHERE id_orden = ?').get(id);
    if (!order) return sendJson(res, 404, { error: 'Orden no encontrada.' });
    if (order.estado_pago === 'CANCELADO') return sendJson(res, 400, { error: 'La orden ya está cancelada.' });

    const items = db.prepare('SELECT * FROM DETALLE_ORDEN WHERE id_orden = ?').all(id);

    // Revertir stock (RF-11)
    const restock = db.prepare('UPDATE PRODUCTO SET stock_actual = stock_actual + ? WHERE sku = ?');
    const kardexRev = db.prepare(`
      INSERT INTO INVENTARIO_MOVIMIENTO (producto_sku, tipo_movimiento, cantidad, motivo, fecha_registro, id_usuario)
      VALUES (?, 'ENTRADA', ?, ?, ?, ?)
    `);

    for (const it of items) {
      restock.run(it.cantidad, it.producto_sku);
      kardexRev.run(it.producto_sku, it.cantidad, `Reversión por orden anulada #${order.codigo_pedido}: ${razon || 'Sin motivo'}`, new Date().toISOString(), userId || 1);
    }

    db.prepare("UPDATE ORDEN_PEDIDO SET estado_pago = 'CANCELADO' WHERE id_orden = ?").run(id);
    db.prepare("UPDATE DESPACHO SET estado_despacho = 'FALLIDO', observaciones = ? WHERE id_orden = ?").run(`Cancelado: ${razon || 'Anulado'}`, id);

    logSiem('ORDER_CANCELLED_STOCK_REVERTED', 'WARNING', { codigo_pedido: order.codigo_pedido, items_revertidos: items.length, razon }, ip, ua);
    return sendJson(res, 200, { success: true, message: 'Orden cancelada y stock revertido al inventario.' });
  }

  // 7. Inventario Kardex (RF-16 / CU-09)
  if (pathname === '/api/inventory/movements' && method === 'GET') {
    const movs = db.prepare(`
      SELECT m.*, p.nombre as producto_nombre, u.username as usuario_username
      FROM INVENTARIO_MOVIMIENTO m
      LEFT JOIN PRODUCTO p ON m.producto_sku = p.sku
      LEFT JOIN USUARIO_SISTEMA u ON m.id_usuario = u.id_usuario
      ORDER BY m.id_movimiento DESC
      LIMIT 100
    `).all();
    return sendJson(res, 200, movs);
  }

  if (pathname === '/api/inventory/movements' && method === 'POST') {
    const body = await parseBody(req);
    const { sku, tipo, cantidad, motivo, userId } = body;

    const prod = db.prepare('SELECT * FROM PRODUCTO WHERE sku = ?').get(sku);
    if (!prod) return sendJson(res, 404, { error: 'Producto no encontrado.' });

    const delta = (tipo === 'ENTRADA' ? Number(cantidad) : -Number(cantidad));
    const newStock = prod.stock_actual + delta;
    if (newStock < 0) return sendJson(res, 400, { error: 'Stock insuficiente para salida.' });

    db.prepare('UPDATE PRODUCTO SET stock_actual = ? WHERE sku = ?').run(newStock, sku);
    db.prepare(`
      INSERT INTO INVENTARIO_MOVIMIENTO (producto_sku, tipo_movimiento, cantidad, motivo, fecha_registro, id_usuario)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(sku, tipo, Number(cantidad), motivo || 'Ajuste manual', new Date().toISOString(), userId || 1);

    logSiem('INVENTORY_MANUAL_ADJUSTMENT', 'INFO', { sku, tipo, cantidad, stock_anterior: prod.stock_actual, stock_nuevo: newStock, motivo }, ip, ua);
    return sendJson(res, 201, { success: true, nuevo_stock: newStock });
  }

  // 8. Despachos (CU-10 / RF-10)
  if (pathname === '/api/dispatch' && method === 'GET') {
    const list = db.prepare(`
      SELECT d.*, o.codigo_pedido, o.total_pagar, c.nombre_completo as cliente_nombre, c.telefono_whatsapp, c.direccion_despacho, c.comuna_rm
      FROM DESPACHO d
      JOIN ORDEN_PEDIDO o ON d.id_orden = o.id_orden
      JOIN CLIENTE_CRM c ON o.id_cliente = c.id_cliente
      ORDER BY d.id_despacho DESC
    `).all();
    const decryptedList = list.map(d => ({
      ...d,
      telefono_whatsapp: decryptField(d.telefono_whatsapp),
      direccion_despacho: decryptField(d.direccion_despacho)
    }));
    return sendJson(res, 200, decryptedList);
  }

  if (pathname.startsWith('/api/dispatch/') && pathname.endsWith('/status') && method === 'PATCH') {
    const id = Number(pathname.split('/')[3]);
    const body = await parseBody(req);
    const { estado, observaciones, repartidor } = body;

    let sql = 'UPDATE DESPACHO SET estado_despacho = ?';
    const params = [estado];
    if (estado === 'EN_RUTA') {
      sql += ', fecha_salida = ?';
      params.push(new Date().toISOString());
    } else if (estado === 'ENTREGADO') {
      sql += ', fecha_entrega = ?';
      params.push(new Date().toISOString());
    }
    if (observaciones) {
      sql += ', observaciones = ?';
      params.push(observaciones);
    }
    if (repartidor) {
      sql += ', repartidor_responsable = ?';
      params.push(repartidor);
    }
    sql += ' WHERE id_despacho = ?';
    params.push(id);

    db.prepare(sql).run(...params);
    logSiem('DISPATCH_STATUS_UPDATED', 'INFO', { id_despacho: id, nuevo_estado: estado }, ip, ua);
    return sendJson(res, 200, { success: true });
  }

  // 9. Clientes CRM (RF-17 / CU-11)
  if (pathname === '/api/customers' && method === 'GET') {
    const clientes = db.prepare('SELECT * FROM CLIENTE_CRM ORDER BY id_cliente DESC').all();
    const decryptedClientes = clientes.map(c => ({
      ...c,
      telefono_whatsapp: decryptField(c.telefono_whatsapp),
      direccion_despacho: decryptField(c.direccion_despacho)
    }));
    return sendJson(res, 200, decryptedClientes);
  }

  // 10. Métricas Comerciales (RF-18 / CU-11)
  if (pathname === '/api/metrics' && method === 'GET') {
    const ordenes = db.prepare("SELECT * FROM ORDEN_PEDIDO WHERE estado_pago != 'CANCELADO'").all();
    const clientes = db.prepare('SELECT * FROM CLIENTE_CRM').all();

    const ventaNetaTotal = ordenes.reduce((s, o) => s + o.total_pagar, 0);
    const totalOrdenes = ordenes.length || 1;
    const aov = Math.round(ventaNetaTotal / totalOrdenes);

    const ahorroTotal = ordenes.reduce((s, o) => s + o.ahorro_total, 0);
    const subtotalRetail = ordenes.reduce((s, o) => s + o.subtotal_retail, 0);
    const pctAhorro = subtotalRetail > 0 ? ((ahorroTotal / subtotalRetail) * 100).toFixed(1) : '0';

    const recurrentes = clientes.filter(c => c.recurrente_flag || c.total_pedidos >= 2).length;
    const rcr = clientes.length > 0 ? ((recurrentes / clientes.length) * 100).toFixed(1) : '0';

    return sendJson(res, 200, {
      ticketPromedioAOV: aov,
      ventasTotales: ventaNetaTotal,
      totalOrdenes: ordenes.length,
      ahorroPromedioMayorista: pctAhorro,
      ahorroTotalAcumulado: ahorroTotal,
      tasaClientesRecurrentes: rcr,
      totalClientes: clientes.length
    });
  }

  // 11. Bitácora de Seguridad SIEM (RF-19 / CU-12)
  if (pathname === '/api/security/logs' && method === 'GET') {
    const logs = db.prepare('SELECT * FROM LOG_SEGURIDAD_SIEM ORDER BY id_log DESC LIMIT 50').all();
    return sendJson(res, 200, logs);
  }

  return sendJson(res, 404, { error: 'Endpoint no encontrado' });
}

// Router Principal (API o Archivos Estáticos)
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  // Enrutar llamadas API
  if (url.pathname.startsWith('/api/')) {
    try {
      await handleApi(req, res, url);
    } catch (err) {
      console.error('Error procesando API:', err);
      sendJson(res, 500, { error: 'Error interno del servidor', details: err.message });
    }
    return;
  }

  // Servir archivos estáticos del frontend (priorizar dist/ para bundle de React si existe)
  const distDir = path.join(ROOT_DIR, 'dist');
  const baseDir = fs.existsSync(distDir) ? distDir : ROOT_DIR;
  let filePath = path.join(baseDir, url.pathname === '/' ? 'index.html' : url.pathname);

  // Evitar Directory Traversal
  if (!filePath.startsWith(baseDir)) {
    res.writeHead(403);
    return res.end('Acceso denegado');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback a index.html para soportar navegación SPA
      filePath = path.join(baseDir, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    const isMediaOrFont = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.ico', '.woff', '.woff2'].includes(ext);
    const cacheHeader = isMediaOrFont ? 'public, max-age=31536000, immutable' : 'no-cache';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500);
        return res.end('Error al leer el archivo');
      }
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': cacheHeader,
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      });
      res.end(content);
    });
  });
});

// Inicializar base de datos y arrancar servidor
initDatabase();

server.listen(PORT, () => {
  console.log('================================================================');
  console.log(`  🚀 SuperMarket.cl - SERVIDOR FULL-STACK EN EJECUCIÓN           `);
  console.log(`  🌐 Frontend:  http://localhost:${PORT}/index.html            `);
  console.log(`  ⚙️  Backoffice: http://localhost:${PORT}/index.html#admin      `);
  console.log(`  🗄️  Base de Datos: SQLite (3FN en data/supermarket.db)         `);
  console.log('================================================================');
});
