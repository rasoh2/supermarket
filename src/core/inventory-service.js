/**
 * MEGASUPER.CL - Servicio de Inventario Kardex y Reversión de Stock
 * Implementa RF-10, RF-11, RF-15, RF-16, CU-09, CU-10 según spec.md
 */

import { db, TABLES } from './storage.js';
import { wafEngine } from './waf-engine.js';
import { apiSync } from './api-sync.js';

export class InventoryService {
  /**
   * Registra un movimiento formal en el Kardex y actualiza las existencias físicas (RF-16)
   */
  static recordMovement({ sku, tipo, cantidad, motivo, userId = 1 }) {
    const qty = parseInt(cantidad, 10);
    if (isNaN(qty) || qty <= 0) {
      throw new Error('La cantidad debe ser un entero positivo mayor a cero.');
    }

    const prod = db.findOne(TABLES.PRODUCTO, p => p.sku === sku);
    if (!prod) {
      throw new Error(`Producto con SKU "${sku}" no existe en el catálogo.`);
    }

    let nuevoStock = prod.stock_actual;

    if (tipo === 'ENTRADA') {
      nuevoStock += qty;
    } else if (tipo === 'SALIDA') {
      if (prod.stock_actual < qty) {
        throw new Error(`Stock insuficiente. Stock actual: ${prod.stock_actual}, Salida solicitada: ${qty}`);
      }
      nuevoStock -= qty;
    } else if (tipo === 'AJUSTE') {
      nuevoStock = qty; // En ajuste, la cantidad representa el recuento físico real
    } else {
      throw new Error(`Tipo de movimiento "${tipo}" no válido. Use ENTRADA, SALIDA o AJUSTE.`);
    }

    // Actualizar producto
    db.update(TABLES.PRODUCTO, p => p.sku === sku, () => ({
      stock_actual: nuevoStock
    }));

    // Insertar en Kardex
    const idMovimiento = db.getNextId(TABLES.INVENTARIO_MOVIMIENTO, 'id_movimiento');
    const movimiento = {
      id_movimiento: idMovimiento,
      producto_sku: sku,
      tipo_movimiento: tipo,
      cantidad: qty,
      motivo: motivo || 'Movimiento operativo de inventario',
      fecha_registro: new Date().toISOString(),
      id_usuario: userId
    };
    db.insert(TABLES.INVENTARIO_MOVIMIENTO, movimiento);
    apiSync.notifyInventoryMovement({ sku, tipo, cantidad: qty, motivo, userId });

    // Auditoría SIEM
    wafEngine.logSecurityIncident('INVENTORY_MANUAL_ADJUSTMENT', 'INFO', {
      sku,
      tipo,
      cantidad: qty,
      stock_anterior: prod.stock_actual,
      stock_nuevo: nuevoStock,
      motivo
    });

    return movimiento;
  }

  /**
   * Anula un pedido y revierte automáticamente las unidades al stock disponible (RF-11)
   */
  static cancelOrder(idOrden, userId = 1, razon = 'Anulación administrativa') {
    const orden = db.findOne(TABLES.ORDEN_PEDIDO, o => o.id_orden === Number(idOrden));
    if (!orden) {
      throw new Error(`Orden #${idOrden} no encontrada.`);
    }

    if (orden.estado_pago === 'CANCELADO') {
      throw new Error('Esta orden ya se encuentra cancelada.');
    }

    // Obtener las líneas de detalle asociadas
    const detalles = db.find(TABLES.DETALLE_ORDEN, d => d.id_orden === Number(idOrden));

    // Reintegrar cada producto al inventario y dejar constancia en Kardex
    let idMovimiento = db.getNextId(TABLES.INVENTARIO_MOVIMIENTO, 'id_movimiento');

    detalles.forEach(d => {
      // Revertir stock en producto
      db.update(TABLES.PRODUCTO, p => p.sku === d.producto_sku, (prev) => ({
        stock_actual: prev.stock_actual + d.cantidad
      }));

      // Registrar movimiento de reintegro en Kardex
      db.insert(TABLES.INVENTARIO_MOVIMIENTO, {
        id_movimiento: idMovimiento++,
        producto_sku: d.producto_sku,
        tipo_movimiento: 'ENTRADA',
        cantidad: d.cantidad,
        motivo: `Reversión automática por anulación orden ${orden.codigo_pedido}: ${razon}`,
        fecha_registro: new Date().toISOString(),
        id_usuario: userId
      });
    });

    // Actualizar estados en BD
    db.update(TABLES.ORDEN_PEDIDO, o => o.id_orden === Number(idOrden), () => ({
      estado_pago: 'CANCELADO'
    }));

    db.update(TABLES.DESPACHO, d => d.id_orden === Number(idOrden), () => ({
      estado_despacho: 'CANCELADO',
      observaciones: `Cancelado: ${razon}`
    }));

    wafEngine.logSecurityIncident('ORDER_CANCELLED_STOCK_REVERTED', 'WARNING', {
      codigo_pedido: orden.codigo_pedido,
      items_revertidos: detalles.length,
      razon
    });

    return { success: true, codigo_pedido: orden.codigo_pedido, itemsRevertidos: detalles.length };
  }

  /**
   * Actualiza el ciclo de vida logístico de despacho en la Región Metropolitana (RF-10, CU-10)
   */
  static updateDispatchStatus(idOrden, nuevoEstado, repartidor = 'Rodrigo Bravo', observaciones = '') {
    const despacho = db.findOne(TABLES.DESPACHO, d => d.id_orden === Number(idOrden));
    if (!despacho) {
      throw new Error(`Registro de despacho para orden #${idOrden} no encontrado.`);
    }

    const updates = {
      estado_despacho: nuevoEstado,
      repartidor_responsable: repartidor
    };

    if (observaciones) {
      updates.observaciones = (despacho.observaciones ? despacho.observaciones + ' | ' : '') + observaciones;
    }

    if (nuevoEstado === 'EN_RUTA' && !despacho.fecha_salida) {
      updates.fecha_salida = new Date().toISOString();
    } else if (nuevoEstado === 'ENTREGADO') {
      updates.fecha_entrega = new Date().toISOString();
    }

    db.update(TABLES.DESPACHO, d => d.id_orden === Number(idOrden), () => updates);

    wafEngine.logSecurityIncident('DISPATCH_STATUS_UPDATED', 'INFO', {
      id_orden: idOrden,
      nuevo_estado: nuevoEstado,
      repartidor
    });

    return updates;
  }
}
