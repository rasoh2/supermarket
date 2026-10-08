# MEGASUPER.CL Constitution

## Core Principles

### I. Arquitectura Multitienda 4 en 1 Unificada
La plataforma consolida la oferta de cuatro departamentos independientes (Abarrotes, Bebidas, Aseo, Disfraces) bajo un único punto de compra para Santiago. Cada producto pertenece estrictamente a una categoría, cuenta con SKU único, control de stock y parametrización de visualización. El cliente puede combinar artículos de cualquier categoría en una sola transacción y con un único despacho logístico.

### II. Precios por Tramo Mayorista Deterministas y Ahorro en Tiempo Real
El modelo comercial erradica la opacidad de precios aplicando tarifas decrecientes deterministas según el volumen adquirido:
- **Tramo 1 (Retail):** 1 a 2 unidades (Precio unitario base).
- **Tramo 2 (Mayorista):** 3 a 5 unidades (Descuento intermedio por volumen).
- **Tramo 3 (Súper Mayorista / Distribuidor):** 6 o más unidades (Descuento máximo de distribución).
El sistema debe calcular y exponer al instante el ahorro monetario en pesos chilenos ($ CLP) frente al subtotal retail, garantizando transparencia absoluta.

### III. Guest Browsing y Persistencia Reactiva sin Fricción
El usuario comprador explora el catálogo completo y administra su carrito sin exigencia de autenticación ni registro obligatorio previo. El estado del carrito debe persistir en el navegador del cliente (`LocalStorage`) ante eventos de recarga de página (F5) o navegación entre vistas. La base de datos relacional no almacena sesiones de carritos huérfanos; la persistencia transaccional ocurre exclusivamente en el Checkout al confirmar la orden.

### IV. Integridad Relacional Estricta en Tercera Forma Normal (3FN)
La persistencia de datos debe adherirse a Tercera Forma Normal (3FN) desacoplando la transacción comercial en 9 entidades cardinales (`PRODUCTO`, `PRECIO_TRAMO`, `INVENTARIO_MOVIMIENTO`, `CLIENTE_CRM`, `ORDEN_PEDIDO`, `DETALLE_ORDEN`, `DESPACHO`, `USUARIO_SISTEMA`, `LOG_SEGURIDAD_SIEM`). Se prohíbe la redundancia de tarifas por columna y se congelan los precios aplicados en el momento exacto de la compra dentro de `DETALLE_ORDEN`.

### V. Seguridad en Profundidad, RBAC y Auditoría SIEM
El sistema aplica control de acceso basado en roles jerárquicos (RBAC: Cliente, Super Admin, Administrador de Tienda, Despachador). Los módulos administrativos requieren autenticación criptográfica mediante tokens JWT. La plataforma debe contar con un motor de inspección WAF perimetral (prevención de XSS y SQLi), limitador de tasa anti fuerza bruta (máximo 15 intentos fallidos / 5 min con bloqueo automático) y una bitácora inmutable de eventos de seguridad (SIEM) que audite accesos, fallos y mutaciones de catálogo/stock.

### VI. Rendimiento, Usabilidad y Accesibilidad Universal
La interfaz debe ser completamente adaptativa (*Mobile-First*), compatible con pantallas desde 320 px hasta 4K. El tiempo de primer despliegue de contenido (FCP) debe ser inferior a 1,2 segundos y el tiempo de interacción operativa inferior a 1,8 segundos. Debe cumplir con las directrices de accesibilidad WCAG 2.1 Nivel AA (contraste de texto mínimo 4.5:1, etiquetas semánticas y foco de navegación claro).

## Restricciones y Estándares Técnicos

- **Frontend:** Single Page Application (SPA) responsive, arquitectura desacoplada y limpia (Clean Architecture / Domain-Driven Design).
- **Almacenamiento Local:** `LocalStorage` con sincronización determinista para el estado del carrito.
- **Canal de Emisión de Órdenes:** Integración de pasarela WhatsApp Gateway estructurada con identificador de pedido único [UK], desglose de ítems, totales, ahorros y datos del destinatario en la Región Metropolitana.
- **Validación de Entradas:** Validación y sanitización estricta de todos los formularios de Checkout y Backoffice siguiendo directrices OWASP 2025.

## Gobernanza y Criterios de Aceptación

1. **Prioridad de la Constitución:** Esta constitución es la norma suprema que rige todas las especificaciones (`spec.md`), planes técnicos (`plan.md`) y tareas de implementación (`tasks.md`).
2. **Definición de Terminado (Definition of Done - DoD):** Ninguna funcionalidad se considera completada sin pasar satisfactoriamente la matriz de pruebas funcionales de caja negra (casos CP-01 a CP-13) y la verificación contra los requisitos formales (RF-01 a RF-19).
3. **Control de Modificaciones:** Cualquier enmienda a los principios o arquitectura debe ser ratificada formalmente por el Product Owner y documentada con incremento de versión semántica.

**Version**: 1.0.0 | **Ratified**: 2026-10-06 | **Last Amended**: 2026-10-08
