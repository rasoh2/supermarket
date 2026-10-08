/**
 * MEGASUPER.CL - Servicio Transaccional de Órdenes y WhatsApp Gateway
 * Implementa RF-06, RF-07, RF-11, CU-04, CU-05 según spec.md
 */

import { db, TABLES } from './storage.js';
import { wafEngine } from './waf-engine.js';
import { cartStore } from './cart-store.js';
import { PriceEngine } from './price-engine.js';

export class OrderService {
  /**
   * Genera un código de pedido público único en formato MS-2026-XXXX
   */
  static generateOrderCode() {
    const random = Math.floor(1000 + Math.random() * 9000);
    return `MS-2026-${random}`;
  }

  /**
   * Procesa la compra completa y crea los registros en 3FN
   * @param {Object} customerData - { nombre, telefono, direccion, comuna, metodoPago, notas }
   * @returns {Object} { success: boolean, order: Object, whatsappUrl: string }
   */
  static async createOrder(customerData) {
    const items = cartStore.getItems();
    if (!items.length) {
      throw new Error('El carrito está vacío. Agregue productos antes de continuar.');
    }

    // 1. Inspección y sanitización WAF de entradas
    const inspNombre = wafEngine.inspectInput(customerData.nombre, 'nombre_cliente');
    if (!inspNombre.isClean) throw new Error(inspNombre.reason);

    const inspTel = wafEngine.inspectInput(customerData.telefono, 'telefono_cliente');
    if (!inspTel.isClean) throw new Error(inspTel.reason);

    const inspDir = wafEngine.inspectInput(customerData.direccion, 'direccion_despacho');
    if (!inspDir.isClean) throw new Error(inspDir.reason);

    const inspComuna = wafEngine.inspectInput(customerData.comuna, 'comuna_rm');
    if (!inspComuna.isClean) throw new Error(inspComuna.reason);

    const sanitizedCustomer = {
      nombre: customerData.nombre.trim(),
      telefono: customerData.telefono.trim().replace(/\s+/g, ''),
      direccion: customerData.direccion.trim(),
      comuna: customerData.comuna.trim(),
      metodoPago: customerData.metodoPago || 'TRANSFERENCIA',
      notas: customerData.notas ? customerData.notas.trim() : ''
    };

    // 2. Validación de stock disponible
    for (const item of items) {
      const prod = db.findOne(TABLES.PRODUCTO, p => p.sku === item.sku);
      if (!prod || prod.stock_actual < item.cantidad) {
        throw new Error(`Stock insuficiente para "${item.nombre}". Disponibles: ${prod ? prod.stock_actual : 0}.`);
      }
    }

    const totals = cartStore.getTotals();
    const orderCode = this.generateOrderCode();

    // 3. Crear o actualizar CLIENTE_CRM
    let cliente = db.findOne(TABLES.CLIENTE_CRM, c => c.telefono_whatsapp === sanitizedCustomer.telefono);
    let idCliente;

    if (cliente) {
      idCliente = cliente.id_cliente;
      db.update(TABLES.CLIENTE_CRM, c => c.id_cliente === idCliente, (prev) => ({
        nombre_completo: sanitizedCustomer.nombre,
        direccion_despacho: sanitizedCustomer.direccion,
        comuna_rm: sanitizedCustomer.comuna,
        total_pedidos: (prev.total_pedidos || 1) + 1,
        recurrente_flag: true
      }));
    } else {
      idCliente = db.getNextId(TABLES.CLIENTE_CRM, 'id_cliente');
      cliente = {
        id_cliente: idCliente,
        nombre_completo: sanitizedCustomer.nombre,
        telefono_whatsapp: sanitizedCustomer.telefono,
        direccion_despacho: sanitizedCustomer.direccion,
        comuna_rm: sanitizedCustomer.comuna,
        fecha_registro: new Date().toISOString(),
        total_pedidos: 1,
        recurrente_flag: false
      };
      db.insert(TABLES.CLIENTE_CRM, cliente);
    }

    // 4. Crear cabecera ORDEN_PEDIDO
    const idOrden = db.getNextId(TABLES.ORDEN_PEDIDO, 'id_orden');
    const orden = {
      id_orden: idOrden,
      codigo_pedido: orderCode,
      id_cliente: idCliente,
      fecha_emision: new Date().toISOString(),
      subtotal_retail: totals.subtotalRetail,
      ahorro_total: totals.ahorroTotal,
      total_pagar: totals.totalPagar,
      estado_pago: 'PENDIENTE',
      metodo_pago: sanitizedCustomer.metodoPago,
      canal_origen: 'WEB_WHATSAPP'
    };
    db.insert(TABLES.ORDEN_PEDIDO, orden);

    // 5. Crear registros en DETALLE_ORDEN y descontar inventario
    let idDetalle = db.getNextId(TABLES.DETALLE_ORDEN, 'id_detalle');
    let idMovimiento = db.getNextId(TABLES.INVENTARIO_MOVIMIENTO, 'id_movimiento');

    totals.lineas.forEach(line => {
      const detalle = {
        id_detalle: idDetalle++,
        id_orden: idOrden,
        producto_sku: line.sku,
        cantidad: line.cantidad,
        tramo_aplicado: line.pricing.tramoAplicado,
        precio_unitario_cobrado: line.pricing.precioUnitarioCobrado,
        subtotal_linea: line.pricing.subtotalCobrado
      };
      db.insert(TABLES.DETALLE_ORDEN, detalle);

      // Descontar inventario físico
      db.update(TABLES.PRODUCTO, p => p.sku === line.sku, (prev) => ({
        stock_actual: Math.max(0, prev.stock_actual - line.cantidad)
      }));

      // Asentar en Kardex
      db.insert(TABLES.INVENTARIO_MOVIMIENTO, {
        id_movimiento: idMovimiento++,
        producto_sku: line.sku,
        tipo_movimiento: 'SALIDA',
        cantidad: line.cantidad,
        motivo: `Venta por Orden ${orderCode}`,
        fecha_registro: new Date().toISOString(),
        id_usuario: 1
      });
    });

    // 6. Crear registro logístico DESPACHO (1:1)
    const idDespacho = db.getNextId(TABLES.DESPACHO, 'id_despacho');
    const despacho = {
      id_despacho: idDespacho,
      id_orden: idOrden,
      estado_despacho: 'PENDIENTE',
      repartidor_responsable: 'Por Asignar',
      fecha_salida: null,
      fecha_entrega: null,
      observaciones: sanitizedCustomer.notas ? `Notas del cliente: ${sanitizedCustomer.notas}` : ''
    };
    db.insert(TABLES.DESPACHO, despacho);

    // 7. Estructurar payload transaccional para WhatsApp Gateway (CU-05)
    const whatsappUrl = this.buildWhatsAppUrl(orderCode, sanitizedCustomer, totals);

    // 8. Limpiar carrito de compras
    cartStore.clear();

    // 9. Registrar evento en bitácora SIEM
    wafEngine.logSecurityIncident('ORDER_CREATED_SUCCESS', 'INFO', {
      codigo_pedido: orderCode,
      total_pagar: totals.totalPagar,
      comuna: sanitizedCustomer.comuna
    });

    return {
      success: true,
      orden,
      orderCode,
      customer: sanitizedCustomer,
      totals,
      whatsappUrl
    };
  }

  /**
   * Construye el mensaje estructurado para WhatsApp Gateway
   */
  static buildWhatsAppUrl(orderCode, customer, totals) {
    let msg = `🛒 *NUEVA ORDEN DE VENTA - MEGASUPER.CL*\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `📋 *Código de Pedido:* \`${orderCode}\`\n`;
    msg += `👤 *Cliente:* ${customer.nombre}\n`;
    msg += `📞 *Teléfono:* ${customer.telefono}\n`;
    msg += `📍 *Dirección:* ${customer.direccion}, ${customer.comuna} (RM)\n`;
    msg += `💳 *Método de Pago:* ${customer.metodoPago}\n`;
    if (customer.notas) msg += `📝 *Observaciones:* ${customer.notas}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `📦 *DETALLE DE PRODUCTOS:*\n`;

    totals.lineas.forEach(l => {
      const tierLabel = l.pricing.tramoAplicado === 6 ? ' (Distribuidor 6+)' : l.pricing.tramoAplicado === 3 ? ' (Mayorista 3-5)' : '';
      msg += `• *${l.cantidad}x* ${l.nombre}${tierLabel} -> ${PriceEngine.formatCLP(l.pricing.subtotalCobrado)}\n`;
    });

    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `Subtotal Retail: ${PriceEngine.formatCLP(totals.subtotalRetail)}\n`;
    if (totals.ahorroTotal > 0) {
      msg += `🎉 *Ahorro Mayorista Total:* -${PriceEngine.formatCLP(totals.ahorroTotal)} (${totals.porcentajeAhorroGlobal}%)\n`;
    }
    msg += `💰 *TOTAL A PAGAR: ${PriceEngine.formatCLP(totals.totalPagar)}*\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `Por favor coordinar horario de entrega para Santiago. ¡Muchas gracias!`;

    const encoded = encodeURIComponent(msg);
    // Número oficial de la central logística de MEGASUPER.CL
    return `https://wa.me/56987654321?text=${encoded}`;
  }
}
