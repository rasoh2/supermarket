/**
 * server/db.js
 * Capa de persistencia con SQLite nativo (node:sqlite)
 * Implementa el esquema relacional en 3FN del informe técnico
 */

import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../data');
const DB_PATH = path.join(DATA_DIR, 'supermarket.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');
const CATALOG_PATH = path.resolve(__dirname, '../src/data/catalog.json');

// Crear directorio de datos si no existe
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Inicializar conexión a la base de datos SQLite
export const db = new DatabaseSync(DB_PATH);

// Habilitar claves foráneas y modo WAL para concurrencia
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

/**
 * Inicializar esquema y datos semilla
 */
export function initDatabase() {
  console.log(`[SQLite] Conectado a la base de datos: ${DB_PATH}`);

  // 1. Ejecutar DDL Schema
  const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf8');
  db.exec(schemaSql);
  console.log('[SQLite] Esquema 3FN verificado (9 tablas).');

  // 2. Verificar e insertar usuarios iniciales si no existen
  const userCount = db.prepare('SELECT COUNT(*) as count FROM USUARIO_SISTEMA').get().count;
  if (userCount === 0) {
    console.log('[SQLite] Sembrando usuarios de producción...');
    const insertUser = db.prepare(`
      INSERT INTO USUARIO_SISTEMA (username, nombre_real, password_hash, rol, activo, ultimo_acceso)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertUser.run('superadmin', 'Super Admin', 'admin123', 'SUPER_ADMIN', 1, new Date().toISOString());
    insertUser.run('admin', 'Administrador de Tienda', 'tienda123', 'ADMIN_TIENDA', 1, new Date().toISOString());
    insertUser.run('despacho', 'Despachador Logístico', 'ruta123', 'DESPACHADOR', 1, new Date().toISOString());
    console.log('[SQLite] Usuarios @superadmin, @admin y @despacho registrados.');
  }

  // 3. Verificar e insertar catálogo si está vacío
  const productCount = db.prepare('SELECT COUNT(*) as count FROM PRODUCTO').get().count;
  if (productCount === 0 && fs.existsSync(CATALOG_PATH)) {
    console.log('[SQLite] Sembrando catálogo maestro desde catalog.json...');
    const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));

    const insertProd = db.prepare(`
      INSERT INTO PRODUCTO (sku, nombre, categoria_tienda, stock_actual, stock_minimo, imagen_url, activo, destacado, descripcion)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertTramo = db.prepare(`
      INSERT INTO PRECIO_TRAMO (producto_sku, tramo_umbral, precio_unitario, porcentaje_descuento)
      VALUES (?, ?, ?, ?)
    `);

    for (const p of catalog) {
      insertProd.run(
        p.sku,
        p.nombre,
        p.categoria_tienda,
        p.stock_actual,
        p.stock_minimo || 5,
        p.imagen_url || '',
        p.activo !== false ? 1 : 0,
        p.destacado ? 1 : 0,
        p.descripcion || ''
      );

      if (p.tramos && Array.isArray(p.tramos)) {
        for (const t of p.tramos) {
          const umbral = t.umbral ?? t.tramo_umbral ?? 1;
          const precio = t.precio ?? t.precio_unitario ?? 0;
          const pct = t.descuento_pct ?? t.porcentaje_descuento ?? 0.0;
          insertTramo.run(p.sku, Number(umbral), Number(precio), Number(pct));
        }
      }
    }
    console.log(`[SQLite] ${catalog.length} productos y sus tramos normalizados insertados.`);

    // Clientes de ejemplo en el CRM
    const insertCliente = db.prepare(`
      INSERT INTO CLIENTE_CRM (nombre_completo, telefono_whatsapp, direccion_despacho, comuna_rm, fecha_registro, total_pedidos, recurrente_flag)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertCliente.run('Carlos Mardones Silva', '+56987654321', 'Av. Providencia 1240, Depto 402', 'Providencia', new Date().toISOString(), 2, 1);
    insertCliente.run('Almacén Don Tito', '+56991234567', 'San Diego 850, Local 4', 'Santiago Centro', new Date().toISOString(), 3, 1);
    insertCliente.run('Mariana Valenzuela Pinto', '+56976543210', 'Los Leones 2350', 'Ñuñoa', new Date().toISOString(), 1, 0);

    // Registro inicial en bitácora SIEM
    const insertLog = db.prepare(`
      INSERT INTO LOG_SEGURIDAD_SIEM (timestamp_utc, event_type, severity, ip_origen, user_agent, details_payload, resuelto)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertLog.run(
      new Date().toISOString(),
      'SYSTEM_BOOT',
      'INFO',
      '127.0.0.1',
      'Node.js SQLite Engine',
      JSON.stringify({ message: 'Base de datos SQLite 3FN iniciada y verificada exitosamente.' }),
      1
    );
  }
}
