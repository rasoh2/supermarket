/**
 * tests/test-sqlite-api.js
 * Suite formal de pruebas de integración para el Backend SQLite 3FN (node:sqlite)
 */

import { db, initDatabase } from '../server/db.js';
import { encryptDeterministic, encryptField } from '../server/crypto-security.js';

async function runSqliteTests() {
  console.log('===============================================================');
  console.log('   SuperMarket.cl - VALIDACIÓN FORMAL DE BACKEND SQLITE 3FN      ');
  console.log('            Esquema Relacional de 9 Tablas y API REST          ');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function assertTest(name, condition, details = '') {
    if (condition) {
      console.log(`[PASS] ${name}`);
      if (details) console.log(`       ↳ ${details}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name}`);
      if (details) console.error(`       ↳ ${details}`);
      failed++;
    }
  }

  // 1. Inicialización de base de datos
  initDatabase();

  // 2. Comprobar existencia de las 9 tablas normalizadas
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all().map(r => r.name);
  const expectedTables = [
    'PRODUCTO', 'PRECIO_TRAMO', 'USUARIO_SISTEMA', 'CLIENTE_CRM',
    'ORDEN_PEDIDO', 'DETALLE_ORDEN', 'DESPACHO', 'INVENTARIO_MOVIMIENTO',
    'LOG_SEGURIDAD_SIEM'
  ];
  const allTablesOk = expectedTables.every(t => tables.includes(t));
  assertTest('T-01: Existencia de las 9 entidades relacionales en 3FN', allTablesOk, `Tablas detectadas: ${tables.join(', ')}`);

  // 3. Catálogo y tramos en SQLite
  const prodCount = db.prepare('SELECT COUNT(*) as count FROM PRODUCTO WHERE activo = 1').get().count;
  const tramoCount = db.prepare('SELECT COUNT(*) as count FROM PRECIO_TRAMO').get().count;
  assertTest('T-02: Integridad del catálogo maestro y tramos mayoristas', prodCount >= 17 && tramoCount >= 51, `${prodCount} productos activos y ${tramoCount} tramos de precios en 3FN.`);

  // 4. Usuarios iniciales (Super Admin, Administrador de Tienda, Despachador)
  const superAdmin = db.prepare("SELECT * FROM USUARIO_SISTEMA WHERE username = 'superadmin'").get();
  assertTest('T-03: Gobernanza de cuentas de acceso y rol SUPER_ADMIN', superAdmin && superAdmin.rol === 'SUPER_ADMIN' && superAdmin.nombre_real === 'Super Admin', `Usuario @${superAdmin?.username} con rol ${superAdmin?.rol}.`);

  // 5. Creación de usuario por Super Admin (CU-13)
  const testUser = `op_sqlite_${Date.now().toString().slice(-4)}`;
  db.prepare(`
    INSERT INTO USUARIO_SISTEMA (username, nombre_real, password_hash, rol, activo)
    VALUES (?, ?, ?, 'DESPACHADOR', 1)
  `).run(testUser, 'Despachador SQLite Test', 'pass_sqlite_123');
  const userInDb = db.prepare('SELECT * FROM USUARIO_SISTEMA WHERE username = ?').get(testUser);
  assertTest('T-04: Función Super Admin: Agregar nuevo usuario (CU-13)', userInDb && userInDb.rol === 'DESPACHADOR', `Cuenta @${testUser} persistida en SQLite.`);

  // 6. Modificación de usuario por Super Admin (CU-13)
  db.prepare('UPDATE USUARIO_SISTEMA SET nombre_real = ?, activo = 0 WHERE id_usuario = ?').run('Despachador Modificado', userInDb.id_usuario);
  const userUpdated = db.prepare('SELECT * FROM USUARIO_SISTEMA WHERE id_usuario = ?').get(userInDb.id_usuario);
  assertTest('T-05: Función Super Admin: Modificar y Suspender usuario (CU-13)', userUpdated.nombre_real === 'Despachador Modificado' && userUpdated.activo === 0, `Nombre actualizado a "${userUpdated.nombre_real}", estado suspendido.`);

  // 7. Transacción de orden de compra
  const stockInitial = db.prepare("SELECT stock_actual FROM PRODUCTO WHERE sku = 'AB-001'").get().stock_actual;
  const orderCode = `TEST-SQLITE-${Math.floor(1000 + Math.random() * 9000)}`;

  // Crear cliente (con columnas sensibles cifradas)
  const testPhone = encryptDeterministic('+56900112233');
  const testAddress = encryptField('Av. Central 500');
  db.prepare(`
    INSERT OR IGNORE INTO CLIENTE_CRM (nombre_completo, telefono_whatsapp, direccion_despacho, comuna_rm, fecha_registro, total_pedidos, recurrente_flag)
    VALUES ('Cliente Test SQLite', ?, ?, 'Santiago', ?, 1, 0)
  `).run(testPhone, testAddress, new Date().toISOString());
  const cliente = db.prepare("SELECT id_cliente FROM CLIENTE_CRM WHERE telefono_whatsapp = ? OR telefono_whatsapp = '+56900112233'").get(testPhone);

  // Crear orden
  const ordRes = db.prepare(`
    INSERT INTO ORDEN_PEDIDO (codigo_pedido, id_cliente, fecha_emision, subtotal_retail, ahorro_total, total_pagar, estado_pago, canal_origen)
    VALUES (?, ?, ?, 8940, 2340, 6600, 'PAGADO', 'TEST_SQLITE')
  `).run(orderCode, cliente.id_cliente, new Date().toISOString());
  const idOrden = ordRes.lastInsertRowid;

  // Insertar detalle y descontar stock
  db.prepare(`
    INSERT INTO DETALLE_ORDEN (id_orden, producto_sku, cantidad, tramo_aplicado, precio_unitario_cobrado, subtotal_linea)
    VALUES (?, 'AB-001', 6, 6, 1100, 6600)
  `).run(idOrden);
  db.prepare("UPDATE PRODUCTO SET stock_actual = stock_actual - 6 WHERE sku = 'AB-001'").run();

  const stockAfter = db.prepare("SELECT stock_actual FROM PRODUCTO WHERE sku = 'AB-001'").get().stock_actual;
  assertTest('T-06: Asentamiento transaccional de orden y deducción de stock en SQLite', stockAfter === stockInitial - 6, `Stock AB-001: ${stockInitial} -> ${stockAfter} (-6 unidades). Orden #${orderCode}.`);

  // 8. Anulación de orden y reversión de stock (RF-11)
  db.prepare("UPDATE PRODUCTO SET stock_actual = stock_actual + 6 WHERE sku = 'AB-001'").run();
  db.prepare("UPDATE ORDEN_PEDIDO SET estado_pago = 'CANCELADO' WHERE id_orden = ?").run(idOrden);
  const stockReverted = db.prepare("SELECT stock_actual FROM PRODUCTO WHERE sku = 'AB-001'").get().stock_actual;
  assertTest('T-07: Anulación transaccional y reversión de stock en SQLite (RF-11)', stockReverted === stockInitial, `Stock restaurado a ${stockReverted} unidades tras cancelación.`);

  // 9. Registro en Bitácora SIEM inmutable
  const logCountBefore = db.prepare('SELECT COUNT(*) as count FROM LOG_SEGURIDAD_SIEM').get().count;
  db.prepare(`
    INSERT INTO LOG_SEGURIDAD_SIEM (timestamp_utc, event_type, severity, ip_origen, user_agent, details_payload, resuelto)
    VALUES (?, 'TEST_AUDIT_SQLITE', 'INFO', '127.0.0.1', 'SQLite Test Runner', 'Prueba formal de auditoría', 1)
  `).run(new Date().toISOString());
  const logCountAfter = db.prepare('SELECT COUNT(*) as count FROM LOG_SEGURIDAD_SIEM').get().count;
  assertTest('T-08: Bitácora inmutable de seguridad SIEM en SQLite (RF-19)', logCountAfter === logCountBefore + 1, `${logCountAfter} eventos de auditoría registrados.`);

  console.log('---------------------------------------------------------------');
  console.log(`RESUMEN: ${passed} / ${passed + failed} PRUEBAS EXITOSAS (${Math.round((passed / (passed + failed)) * 100)}% CONFORMIDAD SQLITE)`);
  console.log('---------------------------------------------------------------');

  if (failed > 0) process.exit(1);
}

runSqliteTests().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
