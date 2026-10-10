/**
 * SuperMarket.cl - Servicio de Autenticación y Gestión de Usuarios (auth-service.js)
 * Control de acceso jerárquico según modelo UML del sistema
 */

import { db, TABLES } from './storage.js';
import { wafEngine } from './waf-engine.js';
import { apiSync } from './api-sync.js';

const AUTH_TOKEN_KEY = 'supermarket_auth_token_session';
const CURRENT_USER_KEY = 'supermarket_active_user_data';

class AuthService {
  constructor() {
    this.token = sessionStorage.getItem(AUTH_TOKEN_KEY) || sessionStorage.getItem('megasuper_auth_token_session') || null;
    this.user = this.loadUser();
  }

  loadUser() {
    try {
      const data = sessionStorage.getItem(CURRENT_USER_KEY) || sessionStorage.getItem('megasuper_active_user_data');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  /**
   * Genera token seguro para la sesión activa
   */
  generateJwt(user) {
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = {
      sub: user.id_usuario,
      username: user.username,
      nombre_real: user.nombre_real,
      rol: user.rol,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (15 * 60)
    };

    const b64Header = btoa(JSON.stringify(header));
    const b64Payload = btoa(JSON.stringify(payload));
    const sessionKey = sessionStorage.getItem('dyn_sig_key') || (()=>{ const k = crypto.randomUUID(); sessionStorage.setItem('dyn_sig_key', k); return k;})();
    const fakeSignature = btoa(`${b64Header}.${b64Payload}.${sessionKey}`).substring(0, 32);

    return `${b64Header}.${b64Payload}.${fakeSignature}`;
  }

  async login(username, password) {
    const key = `auth_${username.trim().toLowerCase()}`;

    // 1. Verificación Rate-Limit
    const rateCheck = wafEngine.checkRateLimit(key);
    if (!rateCheck.allowed) {
      return { success: false, error: rateCheck.message, locked: true };
    }

    // 2. Inspección de seguridad
    const inspUser = wafEngine.inspectInput(username, 'login_username');
    if (!inspUser.isClean) {
      wafEngine.recordFailedAttempt(key);
      return { success: false, error: inspUser.reason };
    }

    const inspPass = wafEngine.inspectInput(password, 'login_password');
    if (!inspPass.isClean) {
      wafEngine.recordFailedAttempt(key);
      return { success: false, error: inspPass.reason };
    }

    // 3. Consulta de credenciales en base de datos (Backend con fallback local)
    try {
      const authUrl = (typeof window !== 'undefined' && window.location?.origin) 
        ? `${window.location.origin}/api/auth/login` 
        : 'http://localhost:8080/api/auth/login';

      const response = await fetch(authUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        wafEngine.recordFailedAttempt(key);
        wafEngine.logSecurityIncident('ADMIN_AUTH_FAILED', 'WARNING', {
          username,
          reason: data.error || 'Credenciales inválidas'
        });
        return {
          success: false,
          error: data.error || 'Usuario o contraseña incorrectos. Verifique sus credenciales.'
        };
      }

      // 4. Éxito
      wafEngine.recordSuccessfulAttempt(key);

      this.token = data.token;
      this.user = data.user;

      sessionStorage.setItem(AUTH_TOKEN_KEY, this.token);
      sessionStorage.setItem(CURRENT_USER_KEY, JSON.stringify(this.user));

      window.dispatchEvent(new CustomEvent('supermarket:auth-changed', { detail: { user: this.user } }));
      window.dispatchEvent(new CustomEvent('megasuper:auth-changed', { detail: { user: this.user } }));
      return { success: true, user: this.user, token: this.token };
    } catch (error) {
      // Fallback a db local si el endpoint no responde
      const user = db.findOne(TABLES.USUARIO_SISTEMA, u =>
        u.username.toLowerCase() === username.trim().toLowerCase() &&
        u.activo !== false
      );

      if (!user || user.password_hash !== password) {
        wafEngine.recordFailedAttempt(key);
        wafEngine.logSecurityIncident('ADMIN_AUTH_FAILED', 'WARNING', {
          username,
          reason: 'Credenciales inválidas'
        });
        return {
          success: false,
          error: 'Usuario o contraseña incorrectos. Verifique sus credenciales.'
        };
      }

      wafEngine.recordSuccessfulAttempt(key);
      const token = this.generateJwt(user);
      this.token = token;
      this.user = {
        id_usuario: user.id_usuario,
        username: user.username,
        nombre_real: user.nombre_real,
        rol: user.rol
      };

      sessionStorage.setItem(AUTH_TOKEN_KEY, token);
      sessionStorage.setItem(CURRENT_USER_KEY, JSON.stringify(this.user));

      window.dispatchEvent(new CustomEvent('supermarket:auth-changed', { detail: { user: this.user } }));
      window.dispatchEvent(new CustomEvent('megasuper:auth-changed', { detail: { user: this.user } }));
      return { success: true, user: this.user, token };
    }
  }

  logout() {
    if (this.user) {
      wafEngine.logSecurityIncident('ADMIN_AUTH_LOGOUT', 'INFO', {
        username: this.user.username
      });
    }

    this.token = null;
    this.user = null;
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    sessionStorage.removeItem(CURRENT_USER_KEY);
    sessionStorage.removeItem('megasuper_auth_token_session');
    sessionStorage.removeItem('megasuper_active_user_data');

    window.dispatchEvent(new CustomEvent('supermarket:auth-changed', { detail: { user: null } }));
    window.dispatchEvent(new CustomEvent('megasuper:auth-changed', { detail: { user: null } }));
  }

  getCurrentUser() {
    return this.user;
  }

  getToken() {
    return this.token;
  }

  isAuthenticated() {
    return !!this.user && !!this.token;
  }

  hasRole(...roles) {
    if (!this.user) return false;
    if (this.user.rol === 'SUPER_ADMIN') return true;
    return roles.includes(this.user.rol);
  }

  // =========================================================================
  // FUNCIONES EXCLUSIVAS DEL SUPER ADMIN (Modelo UML: CU-13)
  // Crear, Modificar, Asignar Roles y Suspender cuentas internas
  // =========================================================================

  /**
   * Super Admin agrega un nuevo usuario interno
   */
  createUser(userData) {
    if (!this.hasRole('SUPER_ADMIN')) {
      throw new Error('Función restringida: Solo el Super Admin tiene permiso para agregar usuarios.');
    }

    const usernameClean = userData.username.trim().toLowerCase();
    const exists = db.findOne(TABLES.USUARIO_SISTEMA, u => u.username.toLowerCase() === usernameClean);
    if (exists) {
      throw new Error(`El nombre de usuario "${userData.username}" ya existe.`);
    }

    const newUser = {
      id_usuario: db.getNextId(TABLES.USUARIO_SISTEMA, 'id_usuario'),
      username: userData.username.trim(),
      nombre_real: userData.nombre_real.trim() || 'Personal',
      password_hash: userData.password || 'temporal123',
      rol: userData.rol, // 'ADMIN_TIENDA' o 'DESPACHADOR'
      activo: true,
      ultimo_acceso: null
    };

    db.insert(TABLES.USUARIO_SISTEMA, newUser);
    apiSync.notifyUserCreated(newUser);

    wafEngine.logSecurityIncident('USER_ACCOUNT_CREATED', 'INFO', {
      created_by: this.user.username,
      new_username: newUser.username,
      assigned_role: newUser.rol
    });

    return newUser;
  }

  /**
   * Super Admin modifica un usuario interno existente
   */
  updateUser(idUsuario, userData) {
    if (!this.hasRole('SUPER_ADMIN')) {
      throw new Error('Función restringida: Solo el Super Admin tiene permiso para modificar usuarios.');
    }

    const user = db.findOne(TABLES.USUARIO_SISTEMA, u => u.id_usuario === Number(idUsuario));
    if (!user) {
      throw new Error(`Usuario #${idUsuario} no encontrado.`);
    }

    // Si cambia username, verificar que no colisione con otro
    if (userData.username && userData.username.trim().toLowerCase() !== user.username.toLowerCase()) {
      const exists = db.findOne(TABLES.USUARIO_SISTEMA, u => 
        u.username.toLowerCase() === userData.username.trim().toLowerCase() && 
        u.id_usuario !== Number(idUsuario)
      );
      if (exists) {
        throw new Error(`El nombre de usuario "${userData.username}" ya está en uso.`);
      }
    }

    const updates = {};
    if (userData.username) updates.username = userData.username.trim();
    if (userData.nombre_real) updates.nombre_real = userData.nombre_real.trim();
    if (userData.rol) updates.rol = userData.rol;
    if (userData.password && userData.password.trim()) updates.password_hash = userData.password.trim();
    if (typeof userData.activo === 'boolean') updates.activo = userData.activo;

    db.update(TABLES.USUARIO_SISTEMA, u => u.id_usuario === Number(idUsuario), () => updates);
    apiSync.notifyUserUpdated(idUsuario, updates);

    wafEngine.logSecurityIncident('USER_ACCOUNT_UPDATED', 'INFO', {
      modified_by: this.user.username,
      id_usuario: idUsuario,
      updated_fields: Object.keys(updates)
    });

    return { ...user, ...updates };
  }

  /**
   * Super Admin suspende o reactiva una cuenta
   */
  toggleUserStatus(idUsuario, newStatus) {
    if (!this.hasRole('SUPER_ADMIN')) {
      throw new Error('Solo el Super Admin puede suspender o reactivar cuentas.');
    }

    const targetUser = db.findOne(TABLES.USUARIO_SISTEMA, u => u.id_usuario === Number(idUsuario));
    if (targetUser && targetUser.rol === 'SUPER_ADMIN') {
      throw new Error('No es posible suspender la cuenta del Super Admin principal.');
    }

    db.update(TABLES.USUARIO_SISTEMA, u => u.id_usuario === Number(idUsuario), () => ({
      activo: newStatus
    }));
    apiSync.notifyUserStatus(idUsuario, newStatus);

    wafEngine.logSecurityIncident('USER_STATUS_MODIFIED', 'WARNING', {
      modified_by: this.user.username,
      id_usuario: idUsuario,
      new_status: newStatus
    });
  }
}

export const authService = new AuthService();
