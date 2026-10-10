/**
 * scripts/sync_catalog_qa.js
 * Actualiza los nombres genéricos a nombres comerciales familiares
 * y reemplaza las imágenes desalineadas (verduras en bidón de agua)
 * tanto en src/data/catalog.json como en la base de datos SQLite.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CATALOG_PATH = path.resolve(__dirname, '../src/data/catalog.json');

const updates = {
  // 1. Corrección de imágenes y nombres de AGUA — usar imágenes locales
  'BE-003': {
    nombre: 'Agua Mineral Cachantun sin Gas 1.5L',
    imagen_url: '/images/products/BE-003.jpg'
  },
  'BE-009': {
    nombre: 'Agua Purificada Benedicto Botellón 6L',
    imagen_url: '/images/products/BE-009.jpg'
  },

  // 2. Nombres comerciales claros
  'BE-001': { nombre: 'Bebida Coca-Cola Original 2.5 L' },
  'BE-010': { nombre: 'Bebida Sprite Lima-Limón 2.5 L' },
  'BE-011': { nombre: 'Bebida Fanta Naranja 2.5 L' },
  'BE-012': { nombre: 'Bebida Crush Sabor Piña 2.5 L' },
  'BE-013': { nombre: 'Bebida Canada Dry Ginger Ale 1.5 L' },
  'BE-045': { nombre: 'Bebida Coca-Cola Sin Azúcar 1.5 L' },
  'AB-001': { nombre: 'Arroz Tucapel Grado 1 Selección 1kg' },
  'AB-002': { nombre: 'Aceite Belmont 100% Vegetal 900ml' },
  'AB-003': { nombre: 'Fideos Carozzi Spaghetti N°5 400g' },
  'AS-001': { nombre: 'Detergente Líquido Omo Concentrado 3L' },
  'AS-002': { nombre: 'Cloro Gel Clorox Triple Acción 900ml' },
  'AS-003': { nombre: 'Lavaloza Quix Bio Antigrasa Limón 750ml' },
  'AS-004': { nombre: 'Papel Higiénico Elite Doble Hoja Pack 8x25m' }
};

// Aplicar a catalog.json
const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));

let modifiedCount = 0;
for (const prod of catalog) {
  const upd = updates[prod.sku];
  if (upd) {
    prod.nombre = upd.nombre;
    if (upd.imagen_url) {
      prod.imagen_url = upd.imagen_url;
    }
    modifiedCount++;
  }
}

fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2), 'utf8');
console.log(`[catalog.json] Actualizados ${modifiedCount} productos con éxito.`);

// Aplicar a SQLite
import { db } from '../server/db.js';

const updateStmt = db.prepare('UPDATE PRODUCTO SET nombre = ?, imagen_url = ? WHERE sku = ?');
const updateNameStmt = db.prepare('UPDATE PRODUCTO SET nombre = ? WHERE sku = ?');

for (const [sku, info] of Object.entries(updates)) {
  if (info.imagen_url) {
    updateStmt.run(info.nombre, info.imagen_url, sku);
  } else {
    updateNameStmt.run(info.nombre, sku);
  }
}

console.log('[SQLite supermarket.db] Base de datos actualizada con nombres comerciales e imágenes locales.');
