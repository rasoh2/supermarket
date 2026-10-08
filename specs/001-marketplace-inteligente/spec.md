# Feature Specification: Marketplace Inteligente SuperMarket.cl

**Feature Branch**: `001-marketplace-inteligente`  
**Created**: 2026-10-08  
**Status**: Approved / In-Progress  
**Reference Document**: `INFORME_SuperMarket.docx` (Ingeniería de Software C1)  

---

## 1. Visión y Propósito del Sistema

SuperMarket.cl es una plataforma web de comercio electrónico y administración operativa orientada a la Región Metropolitana (Santiago de Chile). Integra un catálogo unificado de 4 tiendas especializadas (**Abarrotes, Bebidas, Aseo y Disfraces**), una política de descuentos por tramo mayorista en tiempo real (**1-2, 3-5, 6+ unidades**), un carrito de compras interactivo con persistencia reactiva, un proceso de finalización de compra sin fricción (**Guest Browsing & Checkout**) canalizado por WhatsApp Gateway, y un panel administrativo seguro con control de acceso basado en roles (**RBAC**), control de stock (**Kardex**), trazabilidad logística de despachos, CRM y bitácora de seguridad (**SIEM**).

---

## 2. Historias de Usuario Priorizadas (User Stories)

### User Story 1 - Catálogo Multitienda 4 en 1 con Precios Escalonados (Priority: P1)
**Como** comprador mayorista o cliente de hogar en SuperMarket.cl,  
**Quiero** navegar fluidamente por las 4 categorías (Abarrotes, Bebidas, Aseo, Disfraces), buscar productos por texto predictivo y visualizar las tarifas de descuento por tramo (1-2 u., 3-5 u., 6+ u.),  
**Para** armar pedidos combinados y conseguir el mejor precio por volumen con absoluta transparencia.

- **Por qué esta prioridad**: Es la propuesta de valor nuclear del marketplace. Sin catálogo ni algoritmo de precios por tramo no existe transacción comercial.
- **Prueba independiente**: Navegar por las 4 categorías, buscar "Arroz", agregar unidades y verificar que el valor unitario se actualice en pantalla según el tramo alcanzado.
- **Criterios de Aceptación (Gherkin)**:
  1. **Given** un producto con precio base $1.000, tramo 3-5 a $850 y tramo 6+ a $700,  
     **When** el cliente selecciona 2 unidades,  
     **Then** el precio unitario cobrado es $1.000 y el subtotal es $2.000.
  2. **Given** el mismo producto en el catálogo o selector,  
     **When** la cantidad se incrementa a 3 unidades,  
     **Then** el precio unitario baja inmediatamente a $850 y el subtotal es $2.550.
  3. **Given** el mismo producto,  
     **When** la cantidad alcanza 6 unidades,  
     **Then** el precio unitario baja a $700, el subtotal es $4.200 y se resalta el ahorro obtenido.

---

### User Story 2 - Carrito Reactivo y Calculadora de Ahorro en Tiempo Real (Priority: P1)
**Como** cliente comprador,  
**Quiero** agregar productos al carrito, modificar cantidades por tramo, ver el ahorro acumulado en pesos chilenos ($ CLP) y mantener mi carrito intacto si refresco el navegador,  
**Para** no perder mi selección de compras y constatar cuánto dinero ahorro frente al precio minorista.

- **Por qué esta prioridad**: Crítico para evitar abandono de carritos y garantizar la confianza del comprador.
- **Prueba independiente**: Cargar 3 productos de distintas tiendas en el carrito, presionar F5 (recarga de página) y validar que los ítems, cantidades y montos persisten idénticos en pantalla.
- **Criterios de Aceptación (Gherkin)**:
  1. **Given** un carrito con artículos de 2 categorías distintas,  
     **When** el usuario incrementa la cantidad de un ítem hasta calificar en tramo mayorista,  
     **Then** el total a pagar y el widget de "Ahorro Total Acumulado" se recalculan instantáneamente sin recarga de página.
  2. **Given** un carrito con 5 productos y $45.000 de subtotal,  
     **When** el usuario recarga la página (F5) o cierra y abre la pestaña,  
     **Then** el estado del carrito se recupera completamente desde `LocalStorage` sin pérdidas.

---

### User Story 3 - Checkout Ágil sin Registro Previo y Emisión WhatsApp (Priority: P1)
**Como** cliente final que desea concretar su compra,  
**Quiero** ingresar mis datos de despacho (Nombre, Teléfono WhatsApp, Dirección y Comuna de la Región Metropolitana) directamente en el Checkout sin obligarme a crear una cuenta previa,  
**Para** emitir mi pedido de manera rápida y recibir mi comprobante estructurado vía WhatsApp Gateway.

- **Por qué esta prioridad**: Reduce a cero la fricción de conversión comercial (Guest Browsing & Checkout).
- **Prueba independiente**: Llenar el formulario de despacho con datos válidos de Santiago, confirmar la orden y verificar que se genera un código único de orden (ej. `ORD-2026-XXXX`) y el enlace/payload estructurado para WhatsApp.
- **Criterios de Aceptación (Gherkin)**:
  1. **Given** un carrito activo y el formulario de Checkout abierto,  
     **When** el cliente ingresa su nombre, WhatsApp, dirección y comuna válida en Santiago,  
     **Then** el sistema valida los datos, genera el identificador persistente de orden, limpia el carrito local y despacha el payload formateado a WhatsApp.
  2. **Given** un cliente en Checkout,  
     **When** omite el número de teléfono o ingresa caracteres inválidos,  
     **Then** el sistema señala el error de validación sin borrar el resto de los campos ya completados.

---

### User Story 4 - Panel Administrativo con RBAC y Autenticación Segura (Priority: P2)
**Como** Administrador de Tienda o Super Admin,  
**Quiero** autenticarme en el panel interno mediante credenciales seguras protegidas con token JWT y control de tasa anti fuerza bruta,  
**Para** gestionar la operativa del negocio según mis privilegios asignados sin poner en riesgo la plataforma.

- **Por qué esta prioridad**: Garantiza la seguridad y la confidencialidad de la información operativa del negocio.
- **Prueba independiente**: Intentar acceder a rutas administrativas sin token (debe redirigir/bloquear) y validar con credenciales de cada rol verificando los permisos permitidos en la matriz RBAC.
- **Criterios de Aceptación (Gherkin)**:
  1. **Given** un usuario no autenticado,  
     **When** intenta ingresar a la consola de administración,  
     **Then** el sistema bloquea el acceso, emite un código de denegación y registra un evento en la bitácora SIEM.
  2. **Given** un actor que ingresa más de 15 contraseñas erróneas en 5 minutos,  
     **When** envía el intento 16,  
     **Then** el sistema activa el bloqueo temporal por tasa (`AUTH_LOCKOUT_TRIGGERED`) y genera un log de severidad WARNING/CRITICAL.

---

### User Story 5 - Control de Inventario Kardex y Reversión de Stock (Priority: P2)
**Como** Administrador de Tienda,  
**Quiero** registrar entradas de reposición, salidas por merma y ajustes manuales de mercadería, así como anular pedidos reintegrando el stock,  
**Para** mantener sincronizadas las existencias físicas con el catálogo disponible en tiempo real.

- **Por qué esta prioridad**: Evita quiebres de stock y ventas de productos no disponibles.
- **Prueba independiente**: Realizar un movimiento de entrada de 50 unidades sobre un SKU y validar el incremento en el catálogo; posteriormente anular una orden y comprobar que las unidades reservadas regresan al stock disponible.
- **Criterios de Aceptación (Gherkin)**:
  1. **Given** un producto con stock 10,  
     **When** el administrador asienta una entrada de 20 unidades con motivo "Reposición proveedor",  
     **Then** el stock disponible sube a 30 y se crea un registro inmutable en `INVENTARIO_MOVIMIENTO`.
  2. **Given** una orden en estado "Pendiente" con 5 unidades de un producto,  
     **When** se cancela la orden,  
     **Then** el estado de la orden cambia a "Cancelado" y las 5 unidades se restituyen de inmediato al stock disponible (RF-11).

---

### User Story 6 - Trazabilidad Logística de Despacho en Santiago (Priority: P3)
**Como** Despachador u Operador Logístico,  
**Quiero** visualizar las órdenes pendientes, consultar la hoja de ruta con dirección y comuna, y cambiar los estados (Pendiente → En Preparación → En Ruta → Entregado),  
**Para** cumplir los tiempos de entrega pactados y dejar registro del ciclo de vida del pedido.

- **Criterios de Aceptación (Gherkin)**:
  1. **Given** un pedido registrado por un cliente,  
     **When** el despachador inicia el empaque,  
     **Then** cambia el estado a "En Preparación" asociando su nombre de repartidor.
  2. **Given** una orden entregada en destino,  
     **When** se marca "Entregado" con notas de recepción,  
     **Then** se registra la fecha y hora final de entrega y se cierra la orden logística.

---

### User Story 7 - Módulo CRM y Métricas de Negocio en Tiempo Real (Priority: P3)
**Como** Super Admin o Administrador del Negocio,  
**Quiero** consultar el maestro de clientes con segmentación nuevo vs. recurrente y un panel de KPIs en tiempo real (Ticket Promedio AOV, Tasa de Conversión CR, Rotación ITR y Ahorro Acumulado),  
**Para** tomar decisiones comerciales fundamentadas con datos fidedignos.

- **Criterios de Aceptación (Gherkin)**:
  1. **Given** órdenes registradas en el sistema,  
     **When** el administrador ingresa a la pestaña de Indicadores,  
     **Then** el panel muestra el Ticket Promedio (`AOV = Venta Neta / Órdenes`), Conversión de Carrito y Ahorro total acumulado calculados en tiempo real.
  2. **Given** un cliente que realiza su segunda compra con el mismo WhatsApp,  
     **When** se procesa la orden,  
     **Then** el registro de `CLIENTE_CRM` incrementa su contador de pedidos y activa automáticamente el flag `recurrente_flag = true`.

---

## 3. Catálogo Formal de Requisitos Funcionales (RF-01 a RF-19)

| ID | Nombre del Requisito | Especificación Técnica y Alcance Operativo |
|---|---|---|
| **RF-01** | Consultar catálogo multitienda 4 en 1 | Presenta el catálogo unificado de productos segmentado por tiendas (Abarrotes, Bebidas, Aseo, Disfraces) con imágenes, disponibilidad y precios base. |
| **RF-02** | Búsqueda y filtrado interactivo | Permite buscar por texto predictivo en tiempo real, filtrar por categoría de tienda y visualización reactiva sin recarga de página. |
| **RF-03** | Cálculo de precios por tramo mayorista | Aplica tarifas de descuento deterministas por volumen: Tramo 1 (Retail, 1-2 unid.), Tramo 2 (Mayorista, 3-5 unid.) y Tramo 3 (Súper Mayorista, 6+ unid.). |
| **RF-04** | Cálculo determinista de ahorro acumulado | Calcula y exhibe al instante el ahorro monetario en pesos chilenos ($ CLP) comparando el subtotal retail frente a la tarifa mayorista alcanzada. |
| **RF-05** | Gestión reactiva de carrito | Permite añadir, incrementar, decrementar por tramo y eliminar productos, sincronizando el estado en memoria y persistencia en LocalStorage. |
| **RF-06** | Identificación y captura de datos en Checkout | Permite al cliente identificarse y suministrar nombre completo, teléfono de contacto, dirección y comuna de entrega en Santiago durante el Checkout, sin exigir registro previo. |
| **RF-07** | Generación y estructuración de orden | Empaqueta la transacción comercial con identificador único, desglose de ítems, precios por tramo, ahorro y datos del cliente, enviando el comprobante vía WhatsApp Gateway. |
| **RF-08** | Canalizar asistencia comercial con Vendedor | Permite al cliente solicitar soporte personalizado, cotización mayorista o asesoría técnica transfiriendo el contexto de su carrito o consulta a la línea de ventas. |
| **RF-09** | Consulta y trazabilidad de pedidos | Permite al cliente consultar el estado de su orden y al personal administrativo visualizar el listado consolidado de pedidos con filtro por estado. |
| **RF-10** | Gestión de ciclo de vida de despacho | Permite al Despachador y Administrador actualizar el estado del pedido: Pendiente → En Preparación → En Ruta → Entregado, registrando notas y responsable. |
| **RF-11** | Cancelación y reversión de inventario | Permite anular una orden no procesada, reintegrando automáticamente las unidades al stock disponible del catálogo. |
| **RF-12** | Autenticación administrativa con JWT | Permite el acceso seguro al panel interno mediante validación de credenciales, rate-limiting anti fuerza bruta, inspección WAF y generación de Access Token JWT. |
| **RF-13** | Creación de cuentas internas (Super Admin) | El Super Admin crea y configura cuentas de personal interno (Administradores de Tienda y Despachadores) asignando roles y credenciales. |
| **RF-14** | Administración jerárquica de permisos (Super Admin) | El Super Admin modifica privilegios, bloquea temporalmente, reactiva y audita las credenciales del personal administrativo. |
| **RF-15** | Administración del catálogo de productos | Permite al Administrador de Tienda crear, editar denominación, precio base, imagen y descripciones de los productos en las 4 tiendas. |
| **RF-16** | Control de stock e inventario (Entradas/Salidas) | Permite registrar formalmente ingresos de mercadería, salidas operativas y mermas, manteniendo actualizado el inventario físico y la disponibilidad. |
| **RF-17** | Módulo de Clientes (CRM) y recurrencia | Registra clientes capturados en checkout, acumulando historial de órdenes, ticket promedio individual y marcando clientes nuevos vs. recurrentes. |
| **RF-18** | Panel de métricas e indicadores (KPIs) | Calcula y presenta en tiempo real Ticket Promedio (AOV), Tasa de Conversión (CR), Rotación de Inventario (ITR) y Ahorro Acumulado por tramo. |
| **RF-19** | Bitácora de seguridad y auditoría SIEM | Registra de forma inmutable eventos de seguridad: accesos exitosos/fallidos, bloqueos por tasa de intentos, alertas WAF y cambios críticos de catálogo y usuarios. |

---

## 4. Requisitos No Funcionales (RNF según ISO/IEC 25010)

| ID | Atributo | Criterio Medible / Métrica |
|---|---|---|
| **RNF-01** | Rapidez y Rendimiento | Despliegue de contenido FCP < 1,2s; plataforma totalmente interactiva en < 1,8s. |
| **RNF-02** | Seguridad en Profundidad | Sanitización estricta de inputs contra XSS y SQLi; Rate-limiting (15 intentos fallidos / 5 min); Bitácora inmutable SIEM. |
| **RNF-03** | Disponibilidad | Operación en arquitectura serverless con objetivo de disponibilidad ≥ 99,9%. |
| **RNF-04** | Adaptabilidad Responsive | Diseño elástico desde 320 px (móviles pequeños) hasta pantallas de escritorio 4K. |
| **RNF-05** | Accesibilidad | Cumplimiento del estándar WCAG 2.1 Nivel AA (contraste mínimo 4.5:1, etiquetas ARIA, navegación por teclado). |
| **RNF-06** | Compatibilidad | Funcionamiento homogéneo en navegadores modernos (Chrome, Firefox, Safari, Edge). |
| **RNF-07** | Persistencia de Carrito | Preservación íntegra de la sesión de compra ante recarga accidental de página (F5) mediante LocalStorage. |
| **RNF-08** | Auditabilidad y Trazabilidad | Registro timestamped en UTC para todas las acciones administrativas y de seguridad. |
| **RNF-09** | Mantenibilidad Modular | Arquitectura desacoplada en capas con Clean Code y separación estricta de responsabilidades. |
| **RNF-10** | Privacidad por Diseño | Minimización de datos: solicitud exclusiva de datos indispensables para la entrega logística. |

---

## 5. Matriz de Roles y Permisos (RBAC)

| Módulo / Funcionalidad | Cliente (Comprador) | Administrador de Tienda | Despachador / Logística | Super Admin |
|---|:---:|:---:|:---:|:---:|
| Navegación libre por catálogo multitienda 4 en 1 | Sí (Sin registro) | Sí | Sí | Sí |
| Cálculo automático de precios por tramo (1, 3, 6+) y ahorro | Sí | Sí | Sí | Sí |
| Gestión de carrito interactivo (LocalStorage) | Sí | Sí | No | Sí (Auditoría) |
| Identificación y captura en Checkout (Sin registro previo) | Sí | No | No | No |
| Canalización de asistencia comercial con Vendedor | Sí (Solicita) | Sí (Recepción) | No | Sí (Supervisión) |
| Generación y emisión de orden de venta | Sí | Sí | No | Sí |
| Gestión del catálogo de productos y precios mayoristas | No | Sí | No | Sí |
| Control de inventario (Entradas, salidas y mermas) | No | Sí | No | Sí |
| Seguimiento y actualización de estado de despacho | Solo su pedido | Sí (Integral) | Sí (Actualiza ruta) | Sí (Integral) |
| Módulo de Clientes (CRM) y recurrencia | No | Sí (Operativo) | Solo datos entrega | Sí (Estratégico) |
| Panel de KPIs e indicadores de negocio | No | Sí (Ventas y Stock) | No | Sí (Integral) |
| Bitácora de seguridad y auditoría SIEM | No | No | No | Sí (Exclusivo) |
| Creación y administración de cuentas internas | No | No | No | Sí (Exclusivo) |

---

## 6. Modelado de Casos de Uso Críticos (UML 2.5)

### CU-04: Concretar Orden e Identificación en Checkout
- **Actor:** Cliente (Consumidor Final).
- **Precondiciones:** Carrito con al menos un ítem. Mecanismo *Guest Browsing* activo (no requiere login).
- **Postcondiciones:** Generación de la orden persistente en `ORDEN_PEDIDO`, deducción de stock y creación del despacho.
- **Relación `<<include>>`:** Incluye obligatoriamente **CU-05 (Canalizar orden transaccional)** hacia WhatsApp Gateway.
- **Flujo Principal:**
  1. Cliente accede al Checkout desde el carrito.
  2. Sistema expone desglose: subtotal retail, descuento por volumen, ahorro y total definitivo.
  3. Cliente ingresa: Nombre, WhatsApp, Dirección y Comuna de Santiago.
  4. Cliente confirma la compra.
  5. Sistema valida entradas, asienta la orden, limpia el carrito local y redirige al comprobante de WhatsApp.

### CU-06: Canalizar Asistencia Comercial con Vendedor
- **Actores:** Cliente y Vendedor (Ejecutivo Comercial).
- **Precondiciones:** Cliente explorando catálogo o cotizando compras por volumen institucional.
- **Flujo Principal:** Cliente acciona botón de asesoría comercial; el sistema empaqueta los productos consultados y abre chat contextualizado con el área comercial.

### CU-10: Gestionar Despacho y Trazabilidad de Pedidos
- **Actores:** Despachador y Administrador.
- **Precondiciones:** Usuario interno autenticado con rol logístico. Existen órdenes en estado "Pendiente".
- **Flujo Principal:** Despachador toma orden → Cambia a "En Preparación" → Cambia a "En Ruta" → Marca "Entregado".
- **Relación `<<extend>>`:** Si ocurre cancelación o devolución, extiende **RF-11 (Reversión de Inventario)** devolviendo las unidades al stock disponible.
