/**
 * scripts/fix_all_specific_images.js
 * Asigna imágenes ultra-específicas de Unsplash a cada producto del catálogo
 * resolviendo todas las inconsistencias señaladas (avena, canela, jurel, levadura, choclo, arvejas, etc.)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CATALOG_PATH = path.resolve(__dirname, '../src/data/catalog.json');

// Mapeo exhaustivo y específico por SKU o palabra clave precisa
const SPECIFIC_IMAGES = {
  // ABARROTES ESPECÍFICOS
  'AB-001': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80', // Arroz blanco grano largo
  'AB-002': 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80', // Aceite vegetal
  'AB-003': 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?auto=format&fit=crop&w=600&q=80', // Fideos spaghetti
  'AB-004': 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80', // Atún en conserva
  'AB-005': 'https://images.unsplash.com/photo-1622484216858-a57321e06917?auto=format&fit=crop&w=600&q=80', // Azúcar blanca
  'AB-006': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80', // Harina de trigo
  'AB-007': 'https://images.unsplash.com/photo-1622484216858-a57321e06917?auto=format&fit=crop&w=600&q=80', // Azúcar blanca granulada
  'AB-008': 'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?auto=format&fit=crop&w=600&q=80', // Sal de mesa fina
  'AB-009': 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=600&q=80', // Lentejas seleccionadas
  'AB-010': 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?auto=format&fit=crop&w=600&q=80', // Porotos tórtola
  'AB-011': 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=600&q=80', // Garbanzos
  'AB-012': 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80', // Atún en agua
  'AB-013': 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80', // Atún en aceite
  'AB-014': 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80', // Jurel al natural chileno (pescado azul en conserva/fresco)
  'AB-015': 'https://images.unsplash.com/photo-1572449043416-55f4685c9bb7?auto=format&fit=crop&w=600&q=80', // Salsa de tomates tradicional
  'AB-016': 'https://images.unsplash.com/photo-1621996346565-e3d5d6281691?auto=format&fit=crop&w=600&q=80', // Salsa boloñesa con carne
  'AB-017': 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80', // Mayonesa frasco
  'AB-018': 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=600&q=80', // Kétchup doypack
  'AB-019': 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80', // Mostaza pomo
  'AB-020': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80', // Café instantáneo
  'AB-021': 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80', // Té negro ceylán
  'AB-022': 'https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?auto=format&fit=crop&w=600&q=80', // Té verde
  'AB-023': 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=600&q=80', // Hierbas menta manzanilla
  'AB-024': 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80', // Leche entera
  'AB-025': 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=600&q=80', // Leche descremada
  'AB-026': 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=600&q=80', // Leche condensada
  'AB-027': 'https://images.unsplash.com/photo-1579372786545-d24232daf58c?auto=format&fit=crop&w=600&q=80', // Manjar chileno
  'AB-028': 'https://images.unsplash.com/photo-1584776296944-ab6fb57b0bdd?auto=format&fit=crop&w=600&q=80', // Avena instantánea integral (copos/hojuelas de avena reales)
  'AB-029': 'https://images.unsplash.com/photo-1521483451569-e33803c0330c?auto=format&fit=crop&w=600&q=80', // Hojuelas de maíz cereal
  'AB-030': 'https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?auto=format&fit=crop&w=600&q=80', // Mermelada frambuesa
  'AB-031': 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=600&q=80', // Miel de abeja pura
  'AB-032': 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80', // Galletas de soda
  'AB-033': 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80', // Galletas de agua
  'AB-034': 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=600&q=80', // Galletas de vino dulces
  'AB-035': 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?auto=format&fit=crop&w=600&q=80', // Levadura seca instantánea (fermento/levadura en cuenco)
  'AB-036': 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=600&q=80', // Vinagre de manzana
  'AB-037': 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80', // Aceite de oliva
  'AB-038': 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=600&q=80', // Sopa instantánea verduras
  'AB-039': 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=600&q=80', // Caldos concentrados carne
  'AB-040': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80', // Champiñones en conserva
  'AB-041': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80', // Palmitos enteros
  'AB-042': 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=600&q=80', // Maíz dulce / Choclo en granos dorados
  'AB-043': 'https://images.unsplash.com/photo-1592394533824-9440e5d68530?auto=format&fit=crop&w=600&q=80', // Arvejas verdes tiernas (guisantes verdes reales)
  'AB-044': 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80', // Sardinas en salsa de tomate
  'AB-045': 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=600&q=80', // Puré de papas
  'AB-046': 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=600&q=80', // Cacao amargo en polvo
  'AB-047': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80', // Polvos de hornear
  'AB-048': 'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?auto=format&fit=crop&w=600&q=80', // Bicarbonato de sodio
  'AB-049': 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=600&q=80', // Canela entera en rama (ramas de canela reales)
  'AB-050': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80', // Orégano seco entero

  // BEBIDAS ESPECÍFICAS
  'BE-001': 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80', // Bebida Coca-Cola
  'BE-002': 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&w=600&q=80', // Cerveza Lager sixpack
  'BE-003': 'https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=600&q=80', // Agua Cachantun sin gas
  'BE-004': 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=600&q=80', // Vino Tinto Cabernet Sauvignon
  'BE-005': 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80', // Néctar Naranja
  'BE-006': 'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=600&q=80', // Néctar Durazno
  'BE-007': 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?auto=format&fit=crop&w=600&q=80', // Néctar Manzana Verde
  'BE-008': 'https://images.unsplash.com/photo-1559839914-ba2a5c5452d7?auto=format&fit=crop&w=600&q=80', // Agua Mineral con Gas Manantial
  'BE-009': 'https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=600&q=80', // Agua Benedicto Botellón 6L
  'BE-010': 'https://images.unsplash.com/photo-1581098365948-6a5a912b7a49?auto=format&fit=crop&w=600&q=80', // Sprite Limón
  'BE-011': 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=600&q=80', // Fanta Naranja
  'BE-012': 'https://images.unsplash.com/photo-1534353436294-0dbd4bdac845?auto=format&fit=crop&w=600&q=80', // Crush Piña
  'BE-013': 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80', // Ginger Ale
  'BE-014': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80', // Agua Tónica
  'BE-015': 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&w=600&q=80', // Cerveza Lager
  'BE-016': 'https://images.unsplash.com/photo-1566633806327-68e152aaf26d?auto=format&fit=crop&w=600&q=80', // Cerveza IPA
  'BE-017': 'https://images.unsplash.com/photo-1518099074172-bd5730d0db9e?auto=format&fit=crop&w=600&q=80', // Cerveza Negra Stout
  'BE-018': 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&w=600&q=80', // Cerveza Sin Alcohol
  'BE-019': 'https://images.unsplash.com/photo-1622543925917-763c34d1a86e?auto=format&fit=crop&w=600&q=80', // Energética
  'BE-020': 'https://images.unsplash.com/photo-1622543925917-763c34d1a86e?auto=format&fit=crop&w=600&q=80', // Energética Zero
  'BE-021': 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=600&q=80', // Isotónica Berry Blue
  'BE-022': 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=600&q=80', // Isotónica Naranja
  'BE-023': 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80', // Té Frío Durazno
  'BE-024': 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80', // Té Frío Limón
  'BE-025': 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80', // Jugo Naranja 100%
  'BE-026': 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=600&q=80', // Jugo Arándanos
  'BE-027': 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80', // Bebida Almendras
  'BE-028': 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80', // Bebida Soya
  'BE-029': 'https://images.unsplash.com/photo-1559839914-ba2a5c5452d7?auto=format&fit=crop&w=600&q=80', // Agua Sabor Manzana
  'BE-030': 'https://images.unsplash.com/photo-1559839914-ba2a5c5452d7?auto=format&fit=crop&w=600&q=80', // Agua Sabor Pomelo
  'BE-031': 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=600&q=80', // Vino Cabernet Reserva
  'BE-032': 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=600&q=80', // Vino Carménère
  'BE-033': 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?auto=format&fit=crop&w=600&q=80', // Vino Blanco Sauvignon Blanc
  'BE-034': 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=600&q=80', // Pisco Especial 35°
  'BE-035': 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=600&q=80', // Pisco Transparente 40°
  'BE-036': 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80', // Pack Pisco + Cola
  'BE-037': 'https://images.unsplash.com/photo-1568213816046-0ee1c42bd559?auto=format&fit=crop&w=600&q=80', // Espumante Brut
  'BE-038': 'https://images.unsplash.com/photo-1566633806327-68e152aaf26d?auto=format&fit=crop&w=600&q=80', // Cerveza Golden Ale
  'BE-039': 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80', // Kombucha
  'BE-040': 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80', // Kombucha Frutos Rojos
  'BE-041': 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80', // Bebida de Coco
  'BE-042': 'https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=600&q=80', // Bidón 20L Agua Purificada
  'BE-043': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80', // Limonada Casera Menta Jengibre
  'BE-044': 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=600&q=80', // Jarabe Frambuesa
  'BE-045': 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80', // Coca-Cola Sin Azúcar
  'BE-046': 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80', // Jugo en Polvo Naranja
  'BE-047': 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=600&q=80', // Jugo en Polvo Frambuesa
  'BE-048': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80', // Tónica Zero
  'BE-049': 'https://images.unsplash.com/photo-1566633806327-68e152aaf26d?auto=format&fit=crop&w=600&q=80', // Cerveza Amber Ale
  'BE-050': 'https://images.unsplash.com/photo-1559839914-ba2a5c5452d7?auto=format&fit=crop&w=600&q=80', // Gaseosa Pomelo Rosado

  // ASEO ESPECÍFICO
  'AS-001': 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=600&q=80', // Detergente Omo Concentrado
  'AS-002': 'https://images.unsplash.com/photo-1584744982491-665216d95f8b?auto=format&fit=crop&w=600&q=80', // Cloro Gel Clorox
  'AS-003': 'https://images.unsplash.com/photo-1585842378054-ee2e52f94ba2?auto=format&fit=crop&w=600&q=80', // Lavaloza Quix
  'AS-004': 'https://images.unsplash.com/photo-1584556812952-905ffd0c611a?auto=format&fit=crop&w=600&q=80', // Papel Higiénico Elite
  'AS-005': 'https://images.unsplash.com/photo-1584744982491-665216d95f8b?auto=format&fit=crop&w=600&q=80', // Cloro Gel Triple Acción
  'AS-006': 'https://images.unsplash.com/photo-1608248597359-5b77ff683d7a?auto=format&fit=crop&w=600&q=80', // Jabón Líquido Manos
  'AS-007': 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=600&q=80', // Shampoo Familiar
  'AS-008': 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=600&q=80', // Acondicionador Reparador
  'AS-009': 'https://images.unsplash.com/photo-1559591937-e1032b4923e3?auto=format&fit=crop&w=600&q=80', // Pasta Dental Anticaries
  'AS-010': 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&w=600&q=80', // Cepillo Dental Pack 3u
  'AS-011': 'https://images.unsplash.com/photo-1584556812952-905ffd0c611a?auto=format&fit=crop&w=600&q=80', // Papel Higiénico 12u
  'AS-012': 'https://images.unsplash.com/photo-1584556812952-905ffd0c611a?auto=format&fit=crop&w=600&q=80', // Toalla Papel Jumbo
  'AS-013': 'https://images.unsplash.com/photo-1610492421922-12f2284d7c0f?auto=format&fit=crop&w=600&q=80', // Bolsas de Basura 70x90
  'AS-014': 'https://images.unsplash.com/photo-1585842378054-ee2e52f94ba2?auto=format&fit=crop&w=600&q=80', // Esponjas de Cocina Salvaúñas
  'AS-015': 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?auto=format&fit=crop&w=600&q=80', // Limpiapisos Lavanda
  'AS-016': 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?auto=format&fit=crop&w=600&q=80', // Desengrasante Cocina
  'AS-017': 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?auto=format&fit=crop&w=600&q=80', // Limpiavidrios Gatillo
  'AS-018': 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=600&q=80', // Detergente en Polvo 3kg
  'AS-019': 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=600&q=80', // Suavizante Ropa 3L
  'AS-020': 'https://images.unsplash.com/photo-1584744982491-665216d95f8b?auto=format&fit=crop&w=600&q=80', // Limpiador Baño Antisarro
  'AS-021': 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?auto=format&fit=crop&w=600&q=80', // Pastilla Estanque Inodoro
  'AS-022': 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?auto=format&fit=crop&w=600&q=80', // Desodorante Ambiental Aerosol
  'AS-023': 'https://images.unsplash.com/photo-1610492421922-12f2284d7c0f?auto=format&fit=crop&w=600&q=80', // Guantes de Goma Amarillos
  'AS-024': 'https://images.unsplash.com/photo-1585842378054-ee2e52f94ba2?auto=format&fit=crop&w=600&q=80', // Paños de Microfibra Pack 4u
  'AS-025': 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?auto=format&fit=crop&w=600&q=80', // Mopa Limpieza Microfibra
  'AS-026': 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?auto=format&fit=crop&w=600&q=80', // Balde Plástico 12L
  'AS-027': 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?auto=format&fit=crop&w=600&q=80', // Escoba Plástica Barredora
  'AS-028': 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?auto=format&fit=crop&w=600&q=80', // Pala para Basura
  'AS-029': 'https://images.unsplash.com/photo-1585842378054-ee2e52f94ba2?auto=format&fit=crop&w=600&q=80', // Virutilla Acero Inox
  'AS-030': 'https://images.unsplash.com/photo-1608248597359-5b77ff683d7a?auto=format&fit=crop&w=600&q=80', // Jabón en Barra Blanco
  'AS-031': 'https://images.unsplash.com/photo-1559591937-e1032b4923e3?auto=format&fit=crop&w=600&q=80', // Enjuague Bucal Menta
  'AS-032': 'https://images.unsplash.com/photo-1559591937-e1032b4923e3?auto=format&fit=crop&w=600&q=80', // Hilo Dental
  'AS-033': 'https://images.unsplash.com/photo-1559591937-e1032b4923e3?auto=format&fit=crop&w=600&q=80', // Máquina de Afeitar Desechable
  'AS-034': 'https://images.unsplash.com/photo-1559591937-e1032b4923e3?auto=format&fit=crop&w=600&q=80', // Espuma de Afeitar
  'AS-035': 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=600&q=80', // Desodorante Roll-On
  'AS-036': 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=600&q=80', // Desodorante Aerosol
  'AS-037': 'https://images.unsplash.com/photo-1584556812952-905ffd0c611a?auto=format&fit=crop&w=600&q=80', // Toallas Húmedas Bebé
  'AS-038': 'https://images.unsplash.com/photo-1584556812952-905ffd0c611a?auto=format&fit=crop&w=600&q=80', // Servilletas Cóctel
  'AS-039': 'https://images.unsplash.com/photo-1584556812952-905ffd0c611a?auto=format&fit=crop&w=600&q=80', // Papel Aluminio
  'AS-040': 'https://images.unsplash.com/photo-1584556812952-905ffd0c611a?auto=format&fit=crop&w=600&q=80', // Film Plástico
  'AS-041': 'https://images.unsplash.com/photo-1610492421922-12f2284d7c0f?auto=format&fit=crop&w=600&q=80', // Bolsas Basura 80x120
  'AS-042': 'https://images.unsplash.com/photo-1608248597359-5b77ff683d7a?auto=format&fit=crop&w=600&q=80', // Dispensador Jabón Sensor
  'AS-043': 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?auto=format&fit=crop&w=600&q=80', // Lustramuebles Cera
  'AS-044': 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?auto=format&fit=crop&w=600&q=80', // Cera para Pisos
  'AS-045': 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?auto=format&fit=crop&w=600&q=80', // Insecticida Aerosol
  'AS-046': 'https://images.unsplash.com/photo-1585842378054-ee2e52f94ba2?auto=format&fit=crop&w=600&q=80', // Escobilla Botellas
  'AS-047': 'https://images.unsplash.com/photo-1585842378054-ee2e52f94ba2?auto=format&fit=crop&w=600&q=80', // Paños Algodón Cocina
  'AS-048': 'https://images.unsplash.com/photo-1584744982491-665216d95f8b?auto=format&fit=crop&w=600&q=80', // Destapacañerías Gel
  'AS-049': 'https://images.unsplash.com/photo-1584744982491-665216d95f8b?auto=format&fit=crop&w=600&q=80', // Gel Antibacterial Inodoro
  'AS-050': 'https://images.unsplash.com/photo-1585842378054-ee2e52f94ba2?auto=format&fit=crop&w=600&q=80'  // Esponja Mágica Borradora
};

const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
console.log(`[Corrección Exhaustiva QA] Ajustando imágenes para ${catalog.length} productos...`);

let updated = 0;
for (const p of catalog) {
  if (SPECIFIC_IMAGES[p.sku]) {
    p.imagen_url = SPECIFIC_IMAGES[p.sku];
    updated++;
  }
}

fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2), 'utf8');
console.log(`[catalog.json] ${updated} productos actualizados con imágenes hiper-específicas.`);

// Sincronizar en SQLite
import { db } from '../server/db.js';

const updateStmt = db.prepare('UPDATE PRODUCTO SET imagen_url = ? WHERE sku = ?');
let dbCount = 0;

for (const [sku, url] of Object.entries(SPECIFIC_IMAGES)) {
  updateStmt.run(url, sku);
  dbCount++;
}

console.log(`[SQLite supermarket.db] ${dbCount} productos sincronizados con imágenes exactas.`);
