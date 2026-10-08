/**
 * src/react/services/apiClient.js
 * Cliente HTTP unificado para el frontend React de SuperMarket.cl
 * Conecta directamente con la API REST SQLite 3FN (/api/...)
 */

const BASE_URL = '/api';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('sm_auth_token') || null;
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('sm_auth_token', token);
    } else {
      localStorage.removeItem('sm_auth_token');
    }
  }

  getToken() {
    return this.token || localStorage.getItem('sm_auth_token');
  }

  async request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMsg = data.error || data.message || `Error HTTP ${response.status}`;
        const error = new Error(errorMsg);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (err) {
      console.error(`[ApiClient] Error en ${options.method || 'GET'} ${endpoint}:`, err);
      throw err;
    }
  }

  // 1. Healthcheck
  async getHealth() {
    return this.request('/health');
  }

  // 2. Catálogo de productos
  async getCatalog(category = 'TODOS') {
    const query = category && category !== 'TODOS' ? `?categoria=${encodeURIComponent(category)}` : '';
    return this.request(`/catalog${query}`);
  }

  // 3. Autenticación (RF-12)
  async login(username, password) {
    const res = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    if (res?.token) {
      this.setToken(res.token);
    }
    return res;
  }

  logout() {
    this.setToken(null);
  }

  // 4. Gestión de Usuarios (CU-13 Super Admin)
  async getUsers() {
    return this.request('/users');
  }

  async createUser(userData) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  async updateUser(id, userData) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  }

  async toggleUserStatus(id, activo) {
    return this.request(`/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ activo })
    });
  }

  // 5. Órdenes y Checkout
  async createOrder(orderPayload) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderPayload)
    });
  }

  async getOrders() {
    return this.request('/orders');
  }

  async cancelOrder(id, razon, userId) {
    return this.request(`/orders/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ razon, userId })
    });
  }

  // 6. Inventario Kardex
  async getInventoryMovements() {
    return this.request('/inventory/movements');
  }

  async createInventoryMovement(movementData) {
    return this.request('/inventory/movements', {
      method: 'POST',
      body: JSON.stringify(movementData)
    });
  }

  // 7. Despachos Logísticos
  async getDispatches() {
    return this.request('/dispatch');
  }

  async updateDispatchStatus(id, updateData) {
    return this.request(`/dispatch/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(updateData)
    });
  }

  // 8. Seguridad SIEM (CU-12)
  async getSecurityLogs() {
    return this.request('/security/logs');
  }

  // 9. Métricas comerciales
  async getMetrics() {
    return this.request('/metrics');
  }
}

export const apiClient = new ApiClient();
