/**
 * src/core/api-sync.js
 * Sincronizador bidireccional entre la interfaz web y el backend SQLite
 * Garantiza persistencia en base de datos real (megasuper.db) y funcionamiento offline-first
 */

import { db, TABLES } from './storage.js';

class ApiSyncService {
  constructor() {
    this.isBackendOnline = false;
  }

  async checkBackend() {
    try {
      const res = await fetch('/api/health', { method: 'GET', headers: { 'Accept': 'application/json' } });
      if (res.ok) {
        const data = await res.json();
        this.isBackendOnline = data.status === 'OK';
        return this.isBackendOnline;
      }
    } catch {
      this.isBackendOnline = false;
    }
    return false;
  }

  async init() {
    const online = await this.checkBackend();
    if (!online) {
      console.log('[ApiSync] Backend no detectado o modo standalone: utilizando almacenamiento local.');
      return false;
    }

    console.log('[ApiSync] ✓ Conectado con Backend SQLite (/api/health). Sincronizando datos...');
    try {
      // 1. Sincronizar catálogo y tramos
      const catRes = await fetch('/api/catalog');
      if (catRes.ok) {
        const catalog = await catRes.json();
        const prods = [];
        const tramos = [];
        let idTramo = 1;

        catalog.forEach(p => {
          prods.push({
            sku: p.sku,
            nombre: p.nombre,
            categoria_tienda: p.categoria_tienda,
            stock_actual: p.stock_actual,
            stock_minimo: p.stock_minimo,
            imagen_url: p.imagen_url,
            activo: p.activo === 1 || p.activo === true,
            destacado: p.destacado === 1 || p.destacado === true,
            descripcion: p.descripcion
          });

          if (p.tramos && Array.isArray(p.tramos)) {
            p.tramos.forEach(t => {
              tramos.push({
                id_tramo: t.id_tramo || idTramo++,
                producto_sku: p.sku,
                tramo_umbral: t.tramo_umbral ?? t.umbral,
                precio_unitario: t.precio_unitario ?? t.precio,
                porcentaje_descuento: t.porcentaje_descuento ?? t.descuento_pct
              });
            });
          }
        });

        db.setTable(TABLES.PRODUCTO, prods);
        db.setTable(TABLES.PRECIO_TRAMO, tramos);
      }

      // 2. Sincronizar usuarios
      const usersRes = await fetch('/api/users');
      if (usersRes.ok) {
        const users = await usersRes.json();
        db.setTable(TABLES.USUARIO_SISTEMA, users);
      }

      // 3. Sincronizar órdenes
      const ordersRes = await fetch('/api/orders');
      if (ordersRes.ok) {
        const orders = await ordersRes.json();
        db.setTable(TABLES.ORDEN_PEDIDO, orders);
      }

      // 4. Sincronizar clientes
      const custRes = await fetch('/api/customers');
      if (custRes.ok) {
        const customers = await custRes.json();
        db.setTable(TABLES.CLIENTE_CRM, customers);
      }

      // 5. Sincronizar logs
      const logRes = await fetch('/api/security/logs');
      if (logRes.ok) {
        const logs = await logRes.json();
        db.setTable(TABLES.LOG_SEGURIDAD_SIEM, logs);
      }

      console.log('[ApiSync] ✓ Sincronización con SQLite completada exitosamente.');
      return true;
    } catch (err) {
      console.warn('[ApiSync] Error durante la sincronización:', err);
      return false;
    }
  }

  // Notificar al backend sobre nuevas órdenes
  async notifyOrderCreated(orderData) {
    if (!this.isBackendOnline) return;
    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
    } catch (e) {
      console.warn('[ApiSync] No se pudo replicar orden en SQLite:', e);
    }
  }

  // Notificar al backend sobre usuarios creados o modificados
  async notifyUserCreated(userData) {
    if (!this.isBackendOnline) return;
    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
    } catch (e) {
      console.warn('[ApiSync] No se pudo replicar usuario en SQLite:', e);
    }
  }

  async notifyUserUpdated(idUsuario, userData) {
    if (!this.isBackendOnline) return;
    try {
      await fetch(`/api/users/${idUsuario}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
    } catch (e) {
      console.warn('[ApiSync] No se pudo replicar actualización en SQLite:', e);
    }
  }

  async notifyUserStatus(idUsuario, status) {
    if (!this.isBackendOnline) return;
    try {
      await fetch(`/api/users/${idUsuario}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: status })
      });
    } catch (e) {
      console.warn('[ApiSync] No se pudo replicar estado en SQLite:', e);
    }
  }

  // Notificar movimiento de inventario
  async notifyInventoryMovement(movementData) {
    if (!this.isBackendOnline) return;
    try {
      await fetch('/api/inventory/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(movementData)
      });
    } catch (e) {
      console.warn('[ApiSync] No se pudo replicar movimiento en SQLite:', e);
    }
  }
}

export const apiSync = new ApiSyncService();
