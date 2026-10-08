/**
 * MEGASUPER.CL - Motor Determinista de Precios por Tramo y Calculadora de Ahorro
 * Implementa las reglas de negocio RF-03 y RF-04 según spec.md
 */

export class PriceEngine {
  /**
   * Obtiene la tarifa correspondiente a la cantidad según los tramos configurados.
   * Tramo 1: 1 a 2 unidades (Retail base)
   * Tramo 2: 3 a 5 unidades (Mayorista)
   * Tramo 3: 6 o más unidades (Súper Mayorista)
   * 
   * @param {number} quantity - Unidades seleccionadas
   * @param {Array} tramos - Lista de tramos del producto [{umbral: 1, precio: 1000}, {umbral: 3, precio: 850}, {umbral: 6, precio: 700}]
   * @returns {Object} Desglose detallado del precio, ahorro y próximo tramo
   */
  static calculateItemPricing(quantity, tramos = []) {
    const qty = Math.max(1, parseInt(quantity, 10) || 1);

    // Ordenar tramos por umbral ascendente
    const sortedTramos = [...tramos].sort((a, b) => (a.tramo_umbral || a.umbral) - (b.tramo_umbral || b.umbral));
    
    // El tramo 1 es la tarifa retail base
    const baseTramo = sortedTramos.find(t => (t.tramo_umbral || t.umbral) === 1) || sortedTramos[0] || { precio_unitario: 0, precio: 0 };
    const precioBaseRetail = Number(baseTramo.precio_unitario || baseTramo.precio || 0);

    // Determinar tramo aplicado según la cantidad
    let appliedTramo = baseTramo;
    let tramoId = 1;

    for (const t of sortedTramos) {
      const umbral = Number(t.tramo_umbral || t.umbral);
      if (qty >= umbral) {
        appliedTramo = t;
        tramoId = umbral;
      }
    }

    const precioUnitarioCobrado = Number(appliedTramo.precio_unitario || appliedTramo.precio || precioBaseRetail);
    const subtotalRetail = qty * precioBaseRetail;
    const subtotalCobrado = qty * precioUnitarioCobrado;
    const ahorroMonetario = Math.max(0, subtotalRetail - subtotalCobrado);
    const porcentajeDescuento = subtotalRetail > 0 ? ((ahorroMonetario / subtotalRetail) * 100) : 0;

    // Calcular incentivo del siguiente tramo
    let siguienteTramo = null;
    const nextTier = sortedTramos.find(t => Number(t.tramo_umbral || t.umbral) > qty);
    if (nextTier) {
      const nextUmbral = Number(nextTier.tramo_umbral || nextTier.umbral);
      const nextPrecio = Number(nextTier.precio_unitario || nextTier.precio);
      const faltanUnidades = nextUmbral - qty;
      const ahorroPotencialUnitario = precioBaseRetail - nextPrecio;
      siguienteTramo = {
        umbral: nextUmbral,
        precioUnitario: nextPrecio,
        faltanUnidades,
        ahorroPotencialUnitario
      };
    }

    return {
      cantidad: qty,
      tramoAplicado: tramoId, // 1, 3 o 6
      precioBaseRetail,
      precioUnitarioCobrado,
      subtotalRetail,
      subtotalCobrado,
      ahorroMonetario,
      porcentajeDescuento: Math.round(porcentajeDescuento * 10) / 10,
      siguienteTramo
    };
  }

  /**
   * Calcula los totales consolidados de un carrito de compras
   * @param {Array} items - Elementos del carrito con { sku, cantidad, tramos }
   * @returns {Object} Totales generales
   */
  static calculateCartTotals(items = []) {
    let subtotalRetail = 0;
    let totalPagar = 0;
    let ahorroTotal = 0;
    let totalUnidades = 0;

    const lineasDetalladas = items.map(item => {
      const pricing = this.calculateItemPricing(item.cantidad, item.tramos || []);
      subtotalRetail += pricing.subtotalRetail;
      totalPagar += pricing.subtotalCobrado;
      ahorroTotal += pricing.ahorroMonetario;
      totalUnidades += pricing.cantidad;

      return {
        ...item,
        pricing
      };
    });

    const porcentajeAhorroGlobal = subtotalRetail > 0 ? ((ahorroTotal / subtotalRetail) * 100) : 0;

    return {
      subtotalRetail,
      totalPagar,
      ahorroTotal,
      totalUnidades,
      porcentajeAhorroGlobal: Math.round(porcentajeAhorroGlobal * 10) / 10,
      lineas: lineasDetalladas
    };
  }

  /**
   * Formatea un valor numérico a pesos chilenos ($ CLP) con formato estándar
   * Ej: 12500 -> $12.500
   * @param {number} value
   * @returns {string}
   */
  static formatCLP(value) {
    const val = Math.round(Number(value) || 0);
    return '$' + val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
}
