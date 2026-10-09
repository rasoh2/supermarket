import json

# Cargar los 17 productos originales para conservarlos intactos
with open('src/data/catalog.json', 'r', encoding='utf-8') as f:
    existing = json.load(f)

# Separar por categoría existente
ab_exist = [p for p in existing if p['categoria_tienda'] == 'ABARROTES']
be_exist = [p for p in existing if p['categoria_tienda'] == 'BEBIDAS']
as_exist = [p for p in existing if p['categoria_tienda'] == 'ASEO']
di_exist = [p for p in existing if p['categoria_tienda'] == 'DISFRACES']

def make_tramos(base_price):
    t3 = round(base_price * 0.86 / 10) * 10
    t6 = round(base_price * 0.75 / 10) * 10
    pct3 = round((1 - t3 / base_price) * 100, 1)
    pct6 = round((1 - t6 / base_price) * 100, 1)
    return [
        {"umbral": 1, "precio": base_price, "descuento_pct": 0},
        {"umbral": 3, "precio": t3, "descuento_pct": pct3},
        {"umbral": 6, "precio": t6, "descuento_pct": pct6}
    ]

# Lista de nuevos Abarrotes (AB-006 a AB-050 = 45 items)
abarrotes_items = [
    ("Harina sin Polvos de Hornear 1kg", "Harina de trigo tradicional para repostería y panadería casera.", 1190, "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80"),
    ("Azúcar Blanca Granulada 1kg", "Azúcar de caña refinada de máxima pureza para endulzar tus recetas.", 1290, "https://images.unsplash.com/photo-1622484216858-a57321e06917?auto=format&fit=crop&w=600&q=80"),
    ("Sal de Mesa Yodada Fina 1kg", "Sal marina purificada y enriquecida con flúor y yodo para cocina.", 590, "https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?auto=format&fit=crop&w=600&q=80"),
    ("Lentejas Grado 1 Seleccionadas 1kg", "Legumbre seca de alto valor proteico y cocción pareja sin remojo prolongado.", 2390, "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=600&q=80"),
    ("Porotos Tórtola Chilenos 1kg", "Porotos nacionales de cosecha fresca, ideales para platos tradicionales.", 2590, "https://images.unsplash.com/photo-1551462147-ff29053bfc14?auto=format&fit=crop&w=600&q=80"),
    ("Garbanzos Selección Extra 1kg", "Garbanzos tiernos de calibre homogéneo para guisos y ensaladas saludables.", 2490, "https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=600&q=80"),
    ("Atún en Lomitos en Agua 160g", "Lomos de atún en conserva al natural, bajo en sodio y sin grasas añadidas.", 1390, "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80"),
    ("Atún en Lomitos en Aceite 160g", "Lomos de atún en aceite vegetal de textura firme y sabor concentrado.", 1490, "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80"),
    ("Jurel al Natural Chileno 425g", "Pescado azul rico en Omega 3 de captura sustentable en las costas de Chile.", 1690, "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80"),
    ("Salsa de Tomates Italiana Tradicional 200g", "Salsa espesa elaborada con tomates madurados al sol y hierbas aromáticas.", 650, "https://images.unsplash.com/photo-1572449043416-55f4685c9bb7?auto=format&fit=crop&w=600&q=80"),
    ("Salsa de Tomates con Carne Bolognesa 200g", "Salsa lista para servir con carne picada seleccionada y especias.", 890, "https://images.unsplash.com/photo-1621996346565-e3d5d6281691?auto=format&fit=crop&w=600&q=80"),
    ("Mayonesa Tradicional Frasco 850g", "Aderezo cremoso emulsionado con huevos pasteurizados y limón.", 2990, "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80"),
    ("Kétchup Clásico Doypack 500g", "Salsa de tomates dulces con vinagre y especias sin conservantes artificiales.", 1590, "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=600&q=80"),
    ("Mostaza Clásica en Pomo 250g", "Condimento elaborado con semillas de mostaza molidas y vinagre suave.", 1190, "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80"),
    ("Café Instantáneo Clásico Frasco 170g", "Café tostado granulado soluble con aroma intenso y cuerpo balanceado.", 4990, "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80"),
    ("Té Negro Ceylán Selección 100 bolsitas", "Té negro fino de hojas seleccionadas para un desayuno reconfortante.", 3290, "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80"),
    ("Té Verde Antioxidante 50 bolsitas", "Infusión de hojas de té verde ricas en polifenoles sin aditivos.", 2190, "https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?auto=format&fit=crop&w=600&q=80"),
    ("Hierbas Surtidas Menta y Manzanilla 40 bolsitas", "Pack relajante de infusiones naturales cosechadas en campos del sur.", 1790, "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=600&q=80"),
    ("Leche Entera Larga Vida UHT 1L", "Leche de vaca 100% natural ultrapasteurizada con calcio y vitamina D.", 1190, "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80"),
    ("Leche Descremada 0% Grasa UHT 1L", "Leche fluida sin grasa fortificada con minerales esenciales.", 1190, "https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=600&q=80"),
    ("Leche Condensada Tradicional Lata 397g", "Leche concentrada azucarada ideal para postres, queques y repostería.", 1690, "https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=600&q=80"),
    ("Manjar Tradicional Chileno Bolsa 1kg", "Dulce de leche artesanal de receta clásica chilena, suave y untable.", 3490, "https://images.unsplash.com/photo-1579372786545-d24232daf58c?auto=format&fit=crop&w=600&q=80"),
    ("Avena Instantánea Integral 800g", "Copos de avena fina precocida con alto contenido de fibra soluble.", 1890, "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80"),
    ("Cereal Hojuelas de Maíz Glaseadas 500g", "Hojuelas de maíz crujientes ligeramente azucaradas para el desayuno.", 2190, "https://images.unsplash.com/photo-1521483451569-e33803c0330c?auto=format&fit=crop&w=600&q=80"),
    ("Mermelada de Frambuesa Sureña 500g", "Mermelada con trozos enteros de frambuesa fresca sin colorantes.", 1990, "https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?auto=format&fit=crop&w=600&q=80"),
    ("Miel de Abejas de Ulmo Pura 500g", "Miel nativa cremosa de aroma floral del bosque templado valdiviano.", 4490, "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=600&q=80"),
    ("Galletas de Soda Familiares Pack 3x140g", "Galletas crocantes y horneadas con un toque justo de sal de mesa.", 1290, "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80"),
    ("Galletas de Agua Clásicas Pack 3x140g", "Galletas tradicionales de masa delgada y liviana sin materias grasas.", 1290, "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80"),
    ("Galletas de Vino Dulces Pack 3x150g", "Galletas crujientes aromatizadas con vainilla y caramelo.", 1390, "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=600&q=80"),
    ("Levadura Seca Instantánea 100g", "Fermento activo deshidratado para leudar masas de pan dulce y salado.", 990, "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80"),
    ("Vinagre de Manzana Puro 500ml", "Vinagre fermentado de sidra de manzana natural para aderezos de ensalada.", 1390, "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=600&q=80"),
    ("Aceite de Oliva Extra Virgen 500ml", "Aceite prensado en frío con acidez menor a 0.2%, frutado suave.", 6990, "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80"),
    ("Sopa Instantánea Cremosa de Verduras Pack 4u", "Caldos concentrados en sobre con trocitos de zanahoria, apio y puerro.", 1090, "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=600&q=80"),
    ("Caldos de Carne Concentrados 12 cubos", "Cubos sazonadores con extracto de carne de res y finas hierbas.", 1290, "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=600&q=80"),
    ("Champiñones Laminados en Conserva 400g", "Hongos de parís fileteados en salmuera suave listos para pizzas.", 1890, "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80"),
    ("Palmitos Enteros en Conserva 400g", "Tallos tiernos de palmito en rodajas gruesas para entradas gourmet.", 2790, "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80"),
    ("Maíz Dulce Choclo Grano Entero 300g", "Choclo tierno desgranado cocido al vapor en lata abre fácil.", 1190, "https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=600&q=80"),
    ("Arvejas Verdes Tiernas en Lata 300g", "Guisantes verdes cosechados en su punto óptimo de frescura.", 990, "https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=600&q=80"),
    ("Sardinas en Salsa de Tomate 425g", "Sardinas enteras seleccionadas en salsa de tomate concentrada.", 1290, "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80"),
    ("Puré de Papas Instantáneo Caja 250g", "Copos de papa natural deshidratada con leche, listo en 3 minutos.", 1490, "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=600&q=80"),
    ("Cacao Amargo en Polvo 100g", "Cacao 100% puro alcalinizado sin azúcar para repostería y chocolate caliente.", 1690, "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=600&q=80"),
    ("Polvos de Hornear Doble Acción 100g", "Impulsor químico para lograr queques y masas esponjosas.", 690, "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80"),
    ("Bicarbonato de Sodio Grado Alimentario 250g", "Compuesto multiuso purificado para cocina y limpieza ecológica.", 890, "https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?auto=format&fit=crop&w=600&q=80"),
    ("Canela Entera en Rama 50g", "Varas de canela aromática de Ceilán para postres tradicionales.", 1190, "https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=600&q=80"),
    ("Orégano Seco Entero del Norte 50g", "Hojas aromáticas cosechadas en precordillera de aroma concentrado.", 990, "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80")
]

# Bebidas (BE-005 a BE-050 = 46 items)
bebidas_items = [
    ("Néctar de Naranja 1.5L", "Jugo de fruta pasteurizado con pulpa natural y vitamina C.", 1590, "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80"),
    ("Néctar de Durazno 1.5L", "Bebida de duraznos maduros del valle central con textura sedosa.", 1590, "https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=600&q=80"),
    ("Néctar de Manzana Verde 1.5L", "Sabor refrescante y equilibrado con el toque justo de acidez.", 1590, "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?auto=format&fit=crop&w=600&q=80"),
    ("Agua Mineral con Gas Manantial 1.5L", "Agua mineralizada de vertiente andina con burbuja fina refrescante.", 990, "https://images.unsplash.com/photo-1559839914-ba2a5c5452d7?auto=format&fit=crop&w=600&q=80"),
    ("Agua Purificada sin Gas Botellón 6L", "Bidón familiar de agua purificada por osmosis inversa, bajo en sodio.", 2490, "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=600&q=80"),
    ("Bebida Gaseosa Sabor Limón 2.5L", "Refresco carbonatado sabor lima limón sin azúcar, burbujeante.", 1990, "https://images.unsplash.com/photo-1581098365948-6a5a912b7a49?auto=format&fit=crop&w=600&q=80"),
    ("Bebida Gaseosa Sabor Naranja 2.5L", "Gaseosa clásica con intenso sabor frutal a naranja valenciana.", 1990, "https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=600&q=80"),
    ("Bebida Gaseosa Sabor Piña 2.5L", "Refresco dulce y tropical muy popular en fiestas familiares.", 1990, "https://images.unsplash.com/photo-1534353436294-0dbd4bdac845?auto=format&fit=crop&w=600&q=80"),
    ("Bebida Gaseosa Ginger Ale 1.5L", "Bebida con extracto de jengibre natural, perfecta para coctelería.", 1690, "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80"),
    ("Agua Tónica Premium 1.5L", "Agua con quinina natural y burbuja persistente para tragos largos.", 1690, "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80"),
    ("Cerveza Lager Tradicional Pack 6x330ml", "Cerveza rubia de amargor moderado y final limpio con 4.8° de alcohol.", 4990, "https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&w=600&q=80"),
    ("Cerveza IPA Artesanal Sureña Pack 4x473ml", "Cerveza lupulada de notas cítricas, herbales y final amargo intenso.", 6490, "https://images.unsplash.com/photo-1566633806327-68e152aaf26d?auto=format&fit=crop&w=600&q=80"),
    ("Cerveza Negra Stout de Invierno Pack 4x330ml", "Cerveza con maltas tostadas con notas a café espresso y chocolate.", 5890, "https://images.unsplash.com/photo-1518099074172-bd5730d0db9e?auto=format&fit=crop&w=600&q=80"),
    ("Cerveza Sin Alcohol 0.0% Pack 6x330ml", "Todo el sabor refrescante de la cebada malteada sin contenido alcohólico.", 4490, "https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&w=600&q=80"),
    ("Bebida Energética Taurina y Cafeína 500ml", "Fórmula estimulante enriquecida con vitaminas del complejo B.", 1490, "https://images.unsplash.com/photo-1622543925917-763c34d1a86e?auto=format&fit=crop&w=600&q=80"),
    ("Bebida Energética Sin Azúcar 500ml", "Energía concentrada sin calorías para jornadas deportivas o laborales.", 1490, "https://images.unsplash.com/photo-1622543925917-763c34d1a86e?auto=format&fit=crop&w=600&q=80"),
    ("Bebida Isotónica Sabor Berry Blue 1L", "Bebida hidratante con electrolitos para reponer sodio y potasio.", 1890, "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=600&q=80"),
    ("Bebida Isotónica Sabor Naranja Mandarina 1L", "Fórmula rehidratante para deportistas con sales minerales esenciales.", 1890, "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=600&q=80"),
    ("Té Frío Helado Sabor Durazno 1.5L", "Bebida ligera a base de extracto de té negro con dulce aroma a durazno.", 1590, "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80"),
    ("Té Frío Helado Sabor Limón 1.5L", "Refresco de té verde y jugo de limón para calmar la sed en verano.", 1590, "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80"),
    ("Jugo Natural 100% Exprimido Naranja 1L", "Jugo puro sin agua añadida ni azúcares refinados, refrigerado.", 2990, "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80"),
    ("Jugo Natural de Arándanos Silvestres 1L", "Bebida antioxidante con arándanos cosechados en el sur de Chile.", 3290, "https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=600&q=80"),
    ("Bebida de Almendras Sin Azúcar 1L", "Bebida vegetal alternativa a la leche, enriquecida con calcio y B12.", 2290, "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80"),
    ("Bebida de Soya Vainilla 1L", "Bebida vegetal cremosa con proteína vegetal y extracto de vainilla.", 1990, "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80"),
    ("Agua Purificada con Gas Sabor Manzana 1.5L", "Agua ligeramente gasificada con aroma sutil a manzana verde.", 1190, "https://images.unsplash.com/photo-1559839914-ba2a5c5452d7?auto=format&fit=crop&w=600&q=80"),
    ("Agua Purificada con Gas Sabor Pomelo 1.5L", "Toque cítrico amargo sin calorías para acompañar almuerzos.", 1190, "https://images.unsplash.com/photo-1559839914-ba2a5c5452d7?auto=format&fit=crop&w=600&q=80"),
    ("Vino Tinto Cabernet Sauvignon Reserva 750ml", "Vino del valle de Colchagua con notas a mora, vainilla y roble francés.", 5990, "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=600&q=80"),
    ("Vino Tinto Carménère Valle Central 750ml", "Cepa insignia chilena con taninos sedosos y toques a pimentón asado.", 5490, "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=600&q=80"),
    ("Vino Blanco Sauvignon Blanc Costero 750ml", "Blanco fresco y mineral con aromas a maracuyá y lima del valle de Casablanca.", 4990, "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?auto=format&fit=crop&w=600&q=80"),
    ("Pisco Chileno Especial 35° Botella 1L", "Destilado de uvas moscatel envejecido en cubas de roble.", 6890, "https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=600&q=80"),
    ("Pisco Reservado Transparente 40° 750ml", "Pisco fino doble destilado ideal para pisco sour casero.", 7990, "https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=600&q=80"),
    ("Pack Coctelera Pisco 35° + Bebida Cola 2.5L", "Combinado clásico para celebraciones de fin de semana.", 8490, "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80"),
    ("Espumante Brut Método Charmat 750ml", "Burbujas finas y refrescantes para brindis y celebraciones.", 4990, "https://images.unsplash.com/photo-1568213816046-0ee1c42bd559?auto=format&fit=crop&w=600&q=80"),
    ("Cerveza Artesanal Golden Ale 500ml", "Cerveza rubia maltosa elaborada con agua de deshielo.", 2190, "https://images.unsplash.com/photo-1566633806327-68e152aaf26d?auto=format&fit=crop&w=600&q=80"),
    ("Kombucha Fermentada Jengibre Limón 330ml", "Té probiótico artesanal fermentado naturalmente para la digestión.", 2290, "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80"),
    ("Kombucha Fermentada Frutos Rojos 330ml", "Bebida viva sin pasteurizar con arándano y maqui silvestre.", 2290, "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80"),
    ("Bebida de Coco Sin Azúcar 1L", "Bebida vegetal refrescante y ligera baja en carbohidratos.", 2390, "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80"),
    ("Agua Purificada Bidón 20L Retornable", "Recarga familiar para dispensador de frío y calor.", 3990, "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=600&q=80"),
    ("Limonada Casera con Menta y Jengibre 1L", "Jugo exprimido fresco con hojas de menta orgánica molida.", 2490, "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80"),
    ("Jarabe Concentrado de Frambuesa 1L", "Jarabe dulce para diluir en agua mineral o coctelería.", 2890, "https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=600&q=80"),
    ("Bebida Cola Zero Sin Cafeína 1.5L", "Refresco clásico libre de azúcar y sin estimulantes nocturnos.", 1690, "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80"),
    ("Jugo en Polvo Sabor Naranja Pack 10 sobres", "Polvo concentrado enriquecido con vitamina C para preparar 10L.", 2500, "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80"),
    ("Jugo en Polvo Sabor Frambuesa Pack 10 sobres", "Rinde 1 litro por sobre, sin azúcar añadida.", 2500, "https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=600&q=80"),
    ("Bebida Tónica Zero Calorías 1.5L", "Tónica amarga endulzada con sucralosa sin calorías.", 1690, "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80"),
    ("Cerveza Amber Ale Rojiza Pack 4x473ml", "Cerveza acaramelada con notas a nuez y balance perfecto.", 5990, "https://images.unsplash.com/photo-1566633806327-68e152aaf26d?auto=format&fit=crop&w=600&q=80"),
    ("Bebida Gasificada Sabor Pomelo Rosado 1.5L", "Burbujas intensas y jugo de pomelo rosado natural.", 1590, "https://images.unsplash.com/photo-1559839914-ba2a5c5452d7?auto=format&fit=crop&w=600&q=80")
]

# Aseo (AS-005 a AS-050 = 46 items)
aseo_items = [
    ("Cloro Gel Desinfectante Triple Acción 900ml", "Fórmula densa que se adhiere a inodoros y superficies eliminando 99.9% de gérmenes.", 1490, "https://images.unsplash.com/photo-1584744982491-665216d95f8b?auto=format&fit=crop&w=600&q=80"),
    ("Jabón Líquido para Manos Antibacterial 1L", "Jabón espumoso con glicerina vegetal y aroma a coco vainilla en botella recargable.", 2190, "https://images.unsplash.com/photo-1608248597359-5b77ff683d7a?auto=format&fit=crop&w=600&q=80"),
    ("Shampoo Familiar Brillo y Suavidad 750ml", "Cuidado capilar diario para toda la familia con extracto de manzanilla.", 2990, "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=600&q=80"),
    ("Acondicionador Reparador Nutritivo 750ml", "Crema de enjuague desenredante con aceite de argán para puntas secas.", 2990, "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=600&q=80"),
    ("Pasta Dental Protección Anticaries 90g", "Crema dental con flúor activo y micropartículas blanqueadoras.", 1290, "https://images.unsplash.com/photo-1559591937-e1032b4923e3?auto=format&fit=crop&w=600&q=80"),
    ("Cepillo Dental Cerdas Medias Pack 3u", "Cabezal ergonómico con limpiador lingual y mango antideslizante.", 1990, "https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&w=600&q=80"),
    ("Papel Higiénico Doble Hoja Premium Pack 12u", "Rollos de papel ultra absorbente y suave con fibras 100% vírgenes.", 4990, "https://images.unsplash.com/photo-1584556812952-905ffd0c611a?auto=format&fit=crop&w=600&q=80"),
    ("Toalla de Papel Absorbente Jumbo 120m", "Rollo gigante de cocina con tecnología de absorción rápida de grasas.", 2790, "https://images.unsplash.com/photo-1584556812952-905ffd0c611a?auto=format&fit=crop&w=600&q=80"),
    ("Bolsas de Basura Resistentes 70x90cm 10u", "Bolsas gruesas con fuelle inferior antigoteo para tachos de cocina y jardín.", 1490, "https://images.unsplash.com/photo-1610492421922-12f2284d7c0f?auto=format&fit=crop&w=600&q=80"),
    ("Esponjas de Cocina Salvaúñas Pack 3u", "Fibra verde abrasiva de alta duración unida a esponja de celulosa suave.", 1190, "https://images.unsplash.com/photo-1584744982491-665216d95f8b?auto=format&fit=crop&w=600&q=80"),
    ("Limpiapisos Lavanda Silvestre 1.8L", "Detergente para pisos lavables con perfume de larga duración.", 1890, "https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?auto=format&fit=crop&w=600&q=80"),
    ("Desengrasante de Cocina Gatillo 500ml", "Disuelve grasa quemada en hornos, campanas y encimeras sin frotar fuerte.", 2190, "https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?auto=format&fit=crop&w=600&q=80"),
    ("Limpiador de Vidrios y Cristales 500ml", "Líquido transparente que elimina marcas dactilares y polvo sin dejar vetas.", 1690, "https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?auto=format&fit=crop&w=600&q=80"),
    ("Detergente en Polvo Matic 3kg", "Poder limpiador con enzimas activas para lavado a máquina en agua fría.", 5990, "https://images.unsplash.com/photo-1584744982491-665216d95f8b?auto=format&fit=crop&w=600&q=80"),
    ("Suavizante de Ropa Concentrado 1L", "Fragancia floral duradera que deja las prendas fáciles de planchar.", 2690, "https://images.unsplash.com/photo-1584744982491-665216d95f8b?auto=format&fit=crop&w=600&q=80"),
    ("Quitamanchas de Ropa Oxígeno Activo 1L", "Gel sin cloro seguro para telas blancas y de color.", 2890, "https://images.unsplash.com/photo-1584744982491-665216d95f8b?auto=format&fit=crop&w=600&q=80"),
    ("Pastillas Cloro para Estanque WC 2u", "Mantiene la taza del baño higienizada y azul en cada descarga.", 1390, "https://images.unsplash.com/photo-1584744982491-665216d95f8b?auto=format&fit=crop&w=600&q=80"),
    ("Lustramuebles Aerosol Aroma Madera 360ml", "Cera protectora que repele el polvo y da brillo a superficies barnizadas.", 2290, "https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?auto=format&fit=crop&w=600&q=80"),
    ("Desodorante Ambiental Lavanda 360ml", "Neutralizador de olores en aerosol para living, dormitorios y baños.", 1490, "https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?auto=format&fit=crop&w=600&q=80"),
    ("Paños de Microfibra Multiuso Pack 4u", "Atrapan el polvo en seco y absorben líquidos sin rayar pantallas ni muebles.", 1990, "https://images.unsplash.com/photo-1584744982491-665216d95f8b?auto=format&fit=crop&w=600&q=80"),
    ("Guantes de Goma para Aseo Talla M", "Guantes de látex con interior afelpado para proteger las manos en el lavado.", 990, "https://images.unsplash.com/photo-1584744982491-665216d95f8b?auto=format&fit=crop&w=600&q=80"),
    ("Escobillón de Cerdas Suaves sin Mango", "Cerdas despuntadas que no rayan pisos flotantes ni cerámicas.", 1590, "https://images.unsplash.com/photo-1584744982491-665216d95f8b?auto=format&fit=crop&w=600&q=80"),
    ("Mango de Metal con Rosca Universal 1.2m", "Mango liviano plastificado adaptable a escobillones y mopas.", 1290, "https://images.unsplash.com/photo-1584744982491-665216d95f8b?auto=format&fit=crop&w=600&q=80"),
    ("Mopa Trapeadora de Algodón Gruesa 250g", "Hilos de algodón absorbente para limpieza profunda de pasillos.", 1890, "https://images.unsplash.com/photo-1584744982491-665216d95f8b?auto=format&fit=crop&w=600&q=80"),
    ("Balde con Escurridor de Mopa 12L", "Balde plástico reforzado con manija ergonómica y prensa escurridora.", 4290, "https://images.unsplash.com/photo-1584744982491-665216d95f8b?auto=format&fit=crop&w=600&q=80"),
    ("Jabón en Barra Blanco Puro 3x120g", "Jabón neutro humectante sin parabenos para piel sensible.", 1690, "https://images.unsplash.com/photo-1608248597359-5b77ff683d7a?auto=format&fit=crop&w=600&q=80"),
    ("Toallitas Húmedas Desinfectantes 40u", "Toallitas antibacteriales listas para desinfectar manillas, llaves y celulares.", 1490, "https://images.unsplash.com/photo-1584556812952-905ffd0c611a?auto=format&fit=crop&w=600&q=80"),
    ("Alcohol Gel Sanitizante de Manos 500ml", "Gel al 70% con aloe vera de secado instantáneo sin sensación pegajosa.", 1990, "https://images.unsplash.com/photo-1584744982491-665216d95f8b?auto=format&fit=crop&w=600&q=80"),
    ("Insecticida en Aerosol Casa y Jardín 400ml", "Eficaz contra moscas, zancudos, hormigas y cucarachas sin olor residual.", 2790, "https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?auto=format&fit=crop&w=600&q=80"),
    ("Tabletas Antisarro para Hervidor Pack 3u", "Elimina incrustaciones de calcio en hervidores eléctricos y cafeteras.", 1290, "https://images.unsplash.com/photo-1584744982491-665216d95f8b?auto=format&fit=crop&w=600&q=80"),
    ("Limpia Tapices y Alfombras en Espuma 400ml", "Espuma activa que levanta manchas y suciedad seca de sofás y alfombras.", 2990, "https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?auto=format&fit=crop&w=600&q=80"),
    ("Virutilla de Acero Fina Pack 4u", "Rollos de viruta metálica para desengrasar ollas y sartenes pesados.", 890, "https://images.unsplash.com/photo-1584744982491-665216d95f8b?auto=format&fit=crop&w=600&q=80"),
    ("Limpia Metales y Bronce en Crema 200ml", "Devuelve el brillo original a cubiertos, candelabros y adornos de cobre.", 2490, "https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?auto=format&fit=crop&w=600&q=80"),
    ("Desincrustante Sarro de Baño Gatillo 500ml", "Disuelve sarro acumulado en griferías y mamparas de ducha.", 2390, "https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?auto=format&fit=crop&w=600&q=80"),
    ("Cera Líquida Autobrillo para Pisos 900ml", "Cera acrílica que no requiere lustradora y deja un sellado impermeable.", 2890, "https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?auto=format&fit=crop&w=600&q=80"),
    ("Removedor de Cera para Pisos 1L", "Elimina capas viejas de cera para preparar el piso antes de renovar.", 2690, "https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?auto=format&fit=crop&w=600&q=80"),
    ("Bolsas de Basura Jardinería 80x120cm 10u", "Bolsas extra resistentes para poda de pasto, hojas y escombros livianos.", 2390, "https://images.unsplash.com/photo-1610492421922-12f2284d7c0f?auto=format&fit=crop&w=600&q=80"),
    ("Dispensador de Jabón Automático con Sensor", "Dispositivo higiénico a pilas que dosifica sin contacto físico.", 6990, "https://images.unsplash.com/photo-1608248597359-5b77ff683d7a?auto=format&fit=crop&w=600&q=80"),
    ("Pastilla Antipolillas para Armarios 100g", "Protege ropa de lana y telas finas de insectos con suave aroma a cedro.", 1190, "https://images.unsplash.com/photo-1584744982491-665216d95f8b?auto=format&fit=crop&w=600&q=80"),
    ("Detergente para Lavavajillas en Tabletas 20u", "Fórmula con sal incorporada que deja copas y vajilla impecables.", 4990, "https://images.unsplash.com/photo-1584744982491-665216d95f8b?auto=format&fit=crop&w=600&q=80"),
    ("Abrillantador para Lavavajillas 500ml", "Acelera el secado y previene manchas de agua en el cristal.", 2690, "https://images.unsplash.com/photo-1584744982491-665216d95f8b?auto=format&fit=crop&w=600&q=80"),
    ("Escobilla Limpiadora de Botellas y Mamaderas", "Cerdas cilíndricas que limpian fondos angostos sin rayar.", 1390, "https://images.unsplash.com/photo-1584744982491-665216d95f8b?auto=format&fit=crop&w=600&q=80"),
    ("Set de Paños de Cocina de Algodón Pack 3u", "Paños secadores de tela nido de abeja de alto gramaje.", 2490, "https://images.unsplash.com/photo-1584744982491-665216d95f8b?auto=format&fit=crop&w=600&q=80"),
    ("Destapacañerías en Gel Ultra Fuerte 1L", "Disuelve grasa, cabellos y restos orgánicos en desagües tapados.", 3290, "https://images.unsplash.com/photo-1584744982491-665216d95f8b?auto=format&fit=crop&w=600&q=80"),
    ("Gel Antibacterial para Inodoro con Aplicador", "Sello de gel que dura hasta 6 semanas perfumando y limpiando la taza.", 2190, "https://images.unsplash.com/photo-1584744982491-665216d95f8b?auto=format&fit=crop&w=600&q=80"),
    ("Esponja Mágica Borradora de Manchas Pack 2u", "Microespuma de melamina que limpia paredes, zapatillas y rodapiés solo con agua.", 1290, "https://images.unsplash.com/photo-1584744982491-665216d95f8b?auto=format&fit=crop&w=600&q=80")
]

# Disfraces (DI-005 a DI-050 = 46 items)
disfraces_items = [
    ("Máscara Scream Clásica de Terror", "Máscara de vinilo flexible con capucha de tela negra para fiestas de Halloween.", 3990, "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80"),
    ("Disfraz de Bruja Hechicera de la Noche Talla M", "Vestido largo negro con tul brillante y sombrero puntiagudo incluido.", 14990, "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80"),
    ("Disfraz de Pirata del Caribe con Accesorios Talla L", "Incluye camisa renacentista, chaleco símil cuero, cinturón y parche.", 16990, "https://images.unsplash.com/photo-1514533450685-4493e01d1fdc?auto=format&fit=crop&w=600&q=80"),
    ("Capa de Vampiro Doble Faz Negro y Rojo 140cm", "Capa satinada con cuello alto estructurado reversible para eventos nocturnos.", 7990, "https://images.unsplash.com/photo-1514533450685-4493e01d1fdc?auto=format&fit=crop&w=600&q=80"),
    ("Peluca Afro Gigante Fiesta Disco Multicolor", "Peluca sintética voluminosa de fibras rizadas para fiestas de disfraces.", 4490, "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80"),
    ("Antifaz Veneciano Dorado con Plumas Elegantes", "Máscara decorativa con detalles de filigrana metálica y lazo de ajuste.", 3490, "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80"),
    ("Sombrero Cowboy Vaquero Gamuzado Café", "Sombrero clásico del viejo oeste con ribete reforzado y correa ajustable.", 5990, "https://images.unsplash.com/photo-1514533450685-4493e01d1fdc?auto=format&fit=crop&w=600&q=80"),
    ("Alas de Ángel Blancas de Plumas 60x45cm", "Alas elaboradas con plumas naturales y elásticos cómodos para los brazos.", 6990, "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80"),
    ("Disfraz de Superhéroe Murciélago Nocturno", "Enterito elastizado con músculos termoformados y capa desmontable.", 18990, "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80"),
    ("Diadema con Cuernos de Diabla Iluminados LED", "Cintillo con cuernos rojos brillantes con baterías incluidas.", 2990, "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80"),
    ("Set de Pintura Facial Artística 6 Colores con Pincel", "Maquillaje al agua hipoalergénico no tóxico fácil de remover.", 3990, "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80"),
    ("Sangre Falsa Teatral Espesa 60ml", "Líquido de efectos especiales realista para heridas de maquillaje.", 1990, "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80"),
    ("Dientes de Vampiro con Adhesivo Termoplástico", "Colmillos realistas reutilizables que se amoldan a la dentadura.", 2490, "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80"),
    ("Disfraz Inflable de Dinosaurio T-Rex Adulto", "Traje inflable con turbina a pilas integrada de rápida hinchada.", 28990, "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80"),
    ("Disfraz de Esqueleto Fosforescente Enterito", "Mono de cuerpo entero que brilla en la oscuridad bajo luz ultravioleta.", 12990, "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80"),
    ("Máscara Veneciana Plateada Phantom Fantasma", "Media máscara rígida de ópera con cinta de satén.", 3290, "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80"),
    ("Gafas Retro Hippie Años 60 Cristales Redondos", "Lentes redondos con marco metálico dorado y lunas de colores.", 2190, "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80"),
    ("Set Hawaiano Collar, Corona y Pulseras de Flores", "Juego de 4 piezas con pétalos multicolores para fiestas de verano.", 2790, "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80"),
    ("Disfraz de Científico Loco Bata Blanca y Gafas", "Bata de laboratorio con manchas estampadas y gafas de protección.", 13990, "https://images.unsplash.com/photo-1514533450685-4493e01d1fdc?auto=format&fit=crop&w=600&q=80"),
    ("Peluca Rubia Ondulada Larga Glamour", "Fibras sintéticas de aspecto natural para personajes de fantasía.", 6990, "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80"),
    ("Peluca de Payaso Rizada Roja Clásica", "Peluca multicolor esponjosa para animación de cumpleaños y shows.", 3990, "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80"),
    ("Nariz de Payaso de Espuma Suave Pack 3u", "Nariz esférica con ranura para calzar cómodo en la nariz.", 990, "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80"),
    ("Espada de Pirata Sable Curvo Infantil", "Arma de juguete segura en plástico liviano con empuñadura dorada.", 2990, "https://images.unsplash.com/photo-1514533450685-4493e01d1fdc?auto=format&fit=crop&w=600&q=80"),
    ("Varita Mágica de Hechicero con Luces y Sonido", "Varita inspirada en escuelas de magia con punta LED interactiva.", 3990, "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80"),
    ("Sombrero Chistera Copa Alta Satinado Negro", "Sombrero victoriano para magos, caballeros antiguos y cabaret.", 4990, "https://images.unsplash.com/photo-1514533450685-4493e01d1fdc?auto=format&fit=crop&w=600&q=80"),
    ("Tirantes Elásticos y Humita de Fiesta Rojo", "Conjunto de gala divertido ajustable con clips de acero.", 3490, "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80"),
    ("Máscara de Payaso Diabólico con Pelo Sintético", "Látex de alto detalle para caracterizaciones de terror espeluznantes.", 8990, "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80"),
    ("Disfraz de Policía Infantil Camisa y Placa", "Incluye camisa oficial azul marino con insignia, gorro y esposas de plástico.", 15990, "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80"),
    ("Gorro de Marinero Blanco con Ancla Bordada", "Gorra clásica de capitán de barco para celebraciones temáticas.", 3290, "https://images.unsplash.com/photo-1514533450685-4493e01d1fdc?auto=format&fit=crop&w=600&q=80"),
    ("Parche de Pirata con Calavera Pack 2u", "Parche acolchado con elástico suave para el ojo.", 1290, "https://images.unsplash.com/photo-1514533450685-4493e01d1fdc?auto=format&fit=crop&w=600&q=80"),
    ("Bigotes Postizos Autoadhesivos Set 6 Estilos", "Variedad de bigotes postizos divertidos de fácil pegado y retiro.", 1990, "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80"),
    ("Corona de Rey Dorada con Pedrería Fantasía", "Corona metálica regulable con terciopelo rojo central.", 4490, "https://images.unsplash.com/photo-1514533450685-4493e01d1fdc?auto=format&fit=crop&w=600&q=80"),
    ("Tiara de Princesa Plateada con Cristales", "Diadema brillante para cumpleaños y disfraces de cuentos de hadas.", 2990, "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80"),
    ("Disfraz de Prisionero Rayas Blanco y Negro", "Remera y pantalón a rayas con número de convicto estampado.", 11990, "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80"),
    ("Guantes Blancos de Algodón para Mimo o Mago", "Guantes finos elásticos de muñeca cerrada.", 1890, "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80"),
    ("Boina Negra Francesa de Fieltro Clásica", "Boina tradicional para disfraces de pintor, artista o mimo.", 3490, "https://images.unsplash.com/photo-1514533450685-4493e01d1fdc?auto=format&fit=crop&w=600&q=80"),
    ("Capa de Superhéroe Infantil con Antifaz", "Capa de raso brillante con cierre de velcro en el cuello.", 4990, "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80"),
    ("Máscara de Lobo Hombre con Piel Falsa", "Careta aterradora con dientes afilados y pelaje tupido.", 7990, "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80"),
    ("Gorra de Graduado Birrete Universitario Negro", "Birrete tradicional con borla dorada para eventos de licenciatura.", 3990, "https://images.unsplash.com/photo-1514533450685-4493e01d1fdc?auto=format&fit=crop&w=600&q=80"),
    ("Disfraz de Ninja Sombra con Pasamontañas", "Traje completo negro con cintas rojas cruzadas y máscara facial.", 15990, "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80"),
    ("Guadaña de la Muerte Desarmable en 4 Piezas", "Accesorio plástico de 1 metro de largo liviano y seguro.", 3290, "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80"),
    ("Tridente de Diablo Rojo Desarmable", "Horquilla infernal de 1.1m en plástico desmontable.", 2990, "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80"),
    ("Antifaz de Gatita Negra con Encaje y Orejas", "Diseño misterioso con antifaz calado y orejitas erguidas.", 2890, "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80"),
    ("Disfraz Inflable de Extraterrestre Alien Verde", "El traje simula que un extraterrestre te lleva en brazos.", 29990, "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80"),
    ("Máscara de Animal Látex Cabeza de Caballo", "Máscara viral cómica de cabeza entera con crin sintética.", 9990, "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80"),
    ("Disfraz de Astronauta Mameluco Espacial Blanco", "Enterito con parches bordados de misión espacial y cinturones.", 19990, "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80")
]

# Construir los productos finales
new_catalog = []

# 1. Abarrotes (50 items)
new_catalog.extend(ab_exist)
for i, item in enumerate(abarrotes_items, start=len(ab_exist) + 1):
    sku = f"AB-{i:03d}"
    new_catalog.append({
        "sku": sku,
        "nombre": item[0],
        "descripcion": item[1],
        "categoria_tienda": "ABARROTES",
        "stock_actual": 50 + (i * 3) % 40,
        "stock_minimo": 10,
        "imagen_url": item[3],
        "activo": True,
        "destacado": i % 7 == 0,
        "tramos": make_tramos(item[2])
    })

# 2. Bebidas (50 items)
new_catalog.extend(be_exist)
for i, item in enumerate(bebidas_items, start=len(be_exist) + 1):
    sku = f"BE-{i:03d}"
    new_catalog.append({
        "sku": sku,
        "nombre": item[0],
        "descripcion": item[1],
        "categoria_tienda": "BEBIDAS",
        "stock_actual": 40 + (i * 4) % 45,
        "stock_minimo": 10,
        "imagen_url": item[3],
        "activo": True,
        "destacado": i % 6 == 0,
        "tramos": make_tramos(item[2])
    })

# 3. Aseo (50 items)
new_catalog.extend(as_exist)
for i, item in enumerate(aseo_items, start=len(as_exist) + 1):
    sku = f"AS-{i:03d}"
    new_catalog.append({
        "sku": sku,
        "nombre": item[0],
        "descripcion": item[1],
        "categoria_tienda": "ASEO",
        "stock_actual": 45 + (i * 2) % 35,
        "stock_minimo": 10,
        "imagen_url": item[3],
        "activo": True,
        "destacado": i % 8 == 0,
        "tramos": make_tramos(item[2])
    })

# 4. Disfraces (50 items)
new_catalog.extend(di_exist)
for i, item in enumerate(disfraces_items, start=len(di_exist) + 1):
    sku = f"DI-{i:03d}"
    new_catalog.append({
        "sku": sku,
        "nombre": item[0],
        "descripcion": item[1],
        "categoria_tienda": "DISFRACES",
        "stock_actual": 25 + (i * 5) % 30,
        "stock_minimo": 5,
        "imagen_url": item[3],
        "activo": True,
        "destacado": i % 5 == 0,
        "tramos": make_tramos(item[2])
    })

with open('src/data/catalog.json', 'w', encoding='utf-8') as f:
    json.dump(new_catalog, f, ensure_ascii=False, indent=2)

print(f"Catalogo generado con exito: {len(new_catalog)} productos.")
cats = {}
for p in new_catalog:
    cats[p['categoria_tienda']] = cats.get(p['categoria_tienda'], 0) + 1
print("Por categoria:", cats)
