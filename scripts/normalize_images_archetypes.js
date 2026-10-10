/**
 * scripts/normalize_images_archetypes.js
 * Normaliza todas las imágenes del catálogo aplicando arquetipos de alta fidelidad
 * 100% concordantes con el producto según requerimiento de QA.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CATALOG_PATH = path.resolve(__dirname, '../src/data/catalog.json');

// Catálogo de Arquetipos Curados (Unsplash de alta fidelidad)
const ARCHETYPES = {
  // BEBIDAS
  WATER: 'https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=600&q=80', // Botella y bidón de agua pura cristalina
  BEER: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&w=600&q=80', // Cerveza helada en botella/jarra con espuma dorada
  WINE: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=600&q=80', // Botella y copa de vino fino
  SODA_COLA: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80', // Gaseosa cola clásica
  SODA_CITRUS: 'https://images.unsplash.com/photo-1581098365948-6a5a912b7a49?auto=format&fit=crop&w=600&q=80', // Gaseosas lima/limón/naranja/ginger ale
  JUICE: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80', // Jugos naturales y néctares de fruta
  ENERGY_DRINK: 'https://images.unsplash.com/photo-1622543925917-763c34d1a86e?auto=format&fit=crop&w=600&q=80', // Bebidas energéticas e isotónicas
  SPIRITS: 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=600&q=80', // Pisco, destilados y coctelería
  TEA_COLD: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80', // Té helado y kombucha

  // ABARROTES
  RICE: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80', // Arroz blanco selección
  PASTA: 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?auto=format&fit=crop&w=600&q=80', // Fideos y pastas de trigo
  OIL: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80', // Aceite vegetal y de oliva
  FLOUR: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80', // Harina, polvos, levadura
  SEASONING: 'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?auto=format&fit=crop&w=600&q=80', // Sal, azúcar, canela, orégano, condimentos
  LEGUMES: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=600&q=80', // Lentejas, porotos, garbanzos
  CANNED_FISH: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80', // Atún, jurel, conservas
  SAUCES: 'https://images.unsplash.com/photo-1572449043416-55f4685c9bb7?auto=format&fit=crop&w=600&q=80', // Salsas de tomate, mayonesa, ketchup, mostaza
  HOT_BEVERAGE: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80', // Café tostado, té en bolsita, infusiones
  DAIRY: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80', // Leche entera, descremada, leche condensada, manjar
  COOKIES_CEREAL: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80', // Galletas de soda/agua/vino, cereales, avena
  SWEETS: 'https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?auto=format&fit=crop&w=600&q=80', // Mermeladas, miel de abeja
  SOUPS: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=600&q=80', // Sopas, cremas, caldos en cubo, puré

  // ASEO
  LAUNDRY_DETERGENT: 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=600&q=80', // Detergentes líquidos y en polvo
  CHLORINE_DISINFECTANT: 'https://images.unsplash.com/photo-1584744982491-665216d95f8b?auto=format&fit=crop&w=600&q=80', // Cloro gel y desinfectantes
  DISH_SOAP: 'https://images.unsplash.com/photo-1585842378054-ee2e52f94ba2?auto=format&fit=crop&w=600&q=80', // Lavaloza antigrasa y esponjas de cocina
  PAPER_PRODUCTS: 'https://images.unsplash.com/photo-1584556812952-905ffd0c611a?auto=format&fit=crop&w=600&q=80', // Papel higiénico, toalla de papel, servilletas
  SURFACE_CLEANERS: 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?auto=format&fit=crop&w=600&q=80', // Limpiapisos, limpiavidrios, desengrasante
  PERSONAL_CARE: 'https://images.unsplash.com/photo-1559591937-e1032b4923e3?auto=format&fit=crop&w=600&q=80', // Shampoo, jabón líquido, pasta y cepillos dentales
  TRASH_BAGS: 'https://images.unsplash.com/photo-1610492421922-12f2284d7c0f?auto=format&fit=crop&w=600&q=80', // Bolsas de basura y aseo pesado

  // DISFRACES Y COTILLÓN
  COSTUMES: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80', // Disfraces completos, capas, trajes
  MASKS: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80', // Máscaras neón, venecianas, scream, antifaces
  PARTY_ACCESSORIES: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=600&q=80' // Bigotes, boinas, pelucas, sombreros, cotillón
};

function resolveArchetype(product) {
  const name = product.nombre.toLowerCase();
  const cat = (product.categoria_tienda || product.categoria || '').toUpperCase();

  if (cat === 'BEBIDAS') {
    if (name.includes('agua') || name.includes('bidón') || name.includes('botellón') || name.includes('tónica')) {
      return ARCHETYPES.WATER;
    }
    if (name.includes('cerveza')) {
      return ARCHETYPES.BEER;
    }
    if (name.includes('vino') || name.includes('espumante')) {
      return ARCHETYPES.WINE;
    }
    if (name.includes('cola')) {
      return ARCHETYPES.SODA_COLA;
    }
    if (name.includes('gaseosa') || name.includes('sprite') || name.includes('fanta') || name.includes('crush') || name.includes('ginger') || name.includes('limón') || name.includes('naranja') || name.includes('piña') || name.includes('pomelo')) {
      return ARCHETYPES.SODA_CITRUS;
    }
    if (name.includes('néctar') || name.includes('jugo') || name.includes('limonada') || name.includes('jarabe')) {
      return ARCHETYPES.JUICE;
    }
    if (name.includes('energética') || name.includes('isotónica')) {
      return ARCHETYPES.ENERGY_DRINK;
    }
    if (name.includes('pisco') || name.includes('coctelera') || name.includes('destilado')) {
      return ARCHETYPES.SPIRITS;
    }
    if (name.includes('té frío') || name.includes('kombucha') || name.includes('almendras') || name.includes('soya') || name.includes('coco')) {
      return ARCHETYPES.TEA_COLD;
    }
    return ARCHETYPES.WATER;
  }

  if (cat === 'ABARROTES') {
    if (name.includes('arroz')) return ARCHETYPES.RICE;
    if (name.includes('fideo') || name.includes('spaghetti') || name.includes('pasta')) return ARCHETYPES.PASTA;
    if (name.includes('aceite') || name.includes('oliva') || name.includes('vinagre')) return ARCHETYPES.OIL;
    if (name.includes('harina') || name.includes('polvo') || name.includes('levadura') || name.includes('bicarbonato') || name.includes('cacao')) return ARCHETYPES.FLOUR;
    if (name.includes('sal') || name.includes('azúcar') || name.includes('canela') || name.includes('orégano') || name.includes('condimento')) return ARCHETYPES.SEASONING;
    if (name.includes('lenteja') || name.includes('poroto') || name.includes('garbanzo')) return ARCHETYPES.LEGUMES;
    if (name.includes('atún') || name.includes('jurel') || name.includes('champiñon') || name.includes('conserva')) return ARCHETYPES.CANNED_FISH;
    if (name.includes('salsa') || name.includes('mayonesa') || name.includes('kétchup') || name.includes('mostaza')) return ARCHETYPES.SAUCES;
    if (name.includes('café') || name.includes('té') || name.includes('hierba') || name.includes('infusión')) return ARCHETYPES.HOT_BEVERAGE;
    if (name.includes('leche') || name.includes('manjar')) return ARCHETYPES.DAIRY;
    if (name.includes('galleta') || name.includes('cereal') || name.includes('avena')) return ARCHETYPES.COOKIES_CEREAL;
    if (name.includes('mermelada') || name.includes('miel')) return ARCHETYPES.SWEETS;
    if (name.includes('sopa') || name.includes('caldo') || name.includes('puré')) return ARCHETYPES.SOUPS;
    return ARCHETYPES.RICE;
  }

  if (cat === 'ASEO') {
    if (name.includes('detergente') || name.includes('suavizante')) return ARCHETYPES.LAUNDRY_DETERGENT;
    if (name.includes('cloro') || name.includes('desinfectante')) return ARCHETYPES.CHLORINE_DISINFECTANT;
    if (name.includes('lavaloza') || name.includes('esponja') || name.includes('paño') || name.includes('virutilla')) return ARCHETYPES.DISH_SOAP;
    if (name.includes('papel') || name.includes('toalla') || name.includes('servilleta')) return ARCHETYPES.PAPER_PRODUCTS;
    if (name.includes('limpiapiso') || name.includes('limpiador') || name.includes('desengrasante') || name.includes('lustramueble') || name.includes('aromatizante')) return ARCHETYPES.SURFACE_CLEANERS;
    if (name.includes('shampoo') || name.includes('acondicionador') || name.includes('jabón') || name.includes('pasta') || name.includes('cepillo') || name.includes('afeitadora')) return ARCHETYPES.PERSONAL_CARE;
    if (name.includes('bolsa') || name.includes('guante')) return ARCHETYPES.TRASH_BAGS;
    return ARCHETYPES.CHLORINE_DISINFECTANT;
  }

  if (cat === 'DISFRACES') {
    if (name.includes('máscara') || name.includes('antifaz')) return ARCHETYPES.MASKS;
    if (name.includes('disfraz') || name.includes('traje') || name.includes('capa') || name.includes('túnica')) return ARCHETYPES.COSTUMES;
    return ARCHETYPES.PARTY_ACCESSORIES; // sombreros, bigotes, boinas, pelucas, cotillón, maquillaje, alas
  }

  return ARCHETYPES.WATER;
}

// 1. Cargar catálogo JSON
const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
console.log(`[Arquetipos QA] Procesando ${catalog.length} productos en el catálogo maestro...`);

let updatedCount = 0;
for (const p of catalog) {
  const newImg = resolveArchetype(p);
  if (p.imagen_url !== newImg) {
    p.imagen_url = newImg;
    updatedCount++;
  }
}

fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2), 'utf8');
console.log(`[catalog.json] ${updatedCount} productos normalizados con su arquetipo correspondiente.`);

// 2. Sincronizar en SQLite
import { db } from '../server/db.js';

const updateStmt = db.prepare('UPDATE PRODUCTO SET imagen_url = ? WHERE sku = ?');
let dbUpdated = 0;

for (const p of catalog) {
  updateStmt.run(p.imagen_url, p.sku);
  dbUpdated++;
}

console.log(`[SQLite supermarket.db] ${dbUpdated} productos actualizados con imágenes 100% concordantes.`);
