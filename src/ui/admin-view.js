/**
 * SuperMarket.cl - Panel de Administración y Control Operativo (admin-view.js)
 * Respeta la separación de funciones del modelo UML del sistema
 */

import { db, TABLES } from '../core/storage.js';
import { authService } from '../core/auth-service.js';
import { InventoryService } from '../core/inventory-service.js';
import { PriceEngine } from '../core/price-engine.js';
import { wafEngine } from '../core/waf-engine.js';

export class AdminView {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.activeTab = 'USUARIOS'; // Para Super Admin la vista por defecto es Gestión de Usuarios
    this.editingUserId = null;
  }

  init() {
    this.render();
    const handleAuth = (e) => {
      const user = e.detail?.user;
      if (user) {
        // Asignar pestaña principal según rol UML
        if (user.rol === 'SUPER_ADMIN') this.activeTab = 'USUARIOS';
        else if (user.rol === 'DESPACHADOR') this.activeTab = 'DESPACHOS';
        else this.activeTab = 'INVENTARIO';
      }
      this.render();
    };
    window.addEventListener('supermarket:auth-changed', handleAuth);
    window.addEventListener('megasuper:auth-changed', handleAuth);

    const handleDbUpdate = () => {
      if (authService.isAuthenticated()) {
        this.renderTabContent();
      }
    };
    window.addEventListener('supermarket:db-updated', handleDbUpdate);
    window.addEventListener('megasuper:db-updated', handleDbUpdate);
  }

  render() {
    if (!this.container) return;

    if (!authService.isAuthenticated()) {
      this.renderLoginForm();
      return;
    }

    const currentUser = authService.getCurrentUser();
    const isSuperAdmin = currentUser.rol === 'SUPER_ADMIN';
    const isDespachador = currentUser.rol === 'DESPACHADOR';

    this.container.innerHTML = `
      <div class="admin-wrapper">
        <!-- Barra de Estado Administrativa -->
        <header class="admin-top-bar">
          <div class="admin-top-left">
            <span class="admin-badge-role ${currentUser.rol.toLowerCase()}">
              ${currentUser.rol === 'SUPER_ADMIN' ? 'Super Admin' :
                currentUser.rol === 'ADMIN_TIENDA' ? 'Administrador de Tienda' : 'Despachador Logístico'}
            </span>
            <div class="admin-user-title">
              <strong>${currentUser.nombre_real}</strong>
              <small>Usuario: @${currentUser.username} • Sesión Activa</small>
            </div>
          </div>
          <div class="admin-top-actions">
            <button id="admin-logout-btn" class="btn-logout">
              Cerrar Sesión
            </button>
          </div>
        </header>

        <!-- Navegación por Módulos según Rol UML -->
        <nav class="admin-nav-tabs" role="tablist">
          ${isSuperAdmin ? `
            <button class="adm-tab ${this.activeTab === 'USUARIOS' ? 'active' : ''}" data-tab="USUARIOS">
              👥 Gestión de Cuentas y Accesos
            </button>
            <button class="adm-tab ${this.activeTab === 'SEGURIDAD' ? 'active' : ''}" data-tab="SEGURIDAD">
              🛡️ Auditoría de Accesos
            </button>
          ` : currentUser.rol === 'ADMIN_TIENDA' ? `
            <button class="adm-tab ${this.activeTab === 'INVENTARIO' ? 'active' : ''}" data-tab="INVENTARIO">
              📦 Control de Inventario
            </button>
            <button class="adm-tab ${this.activeTab === 'DESPACHOS' ? 'active' : ''}" data-tab="DESPACHOS">
              🚚 Despachos y Entregas
            </button>
            <button class="adm-tab ${this.activeTab === 'CLIENTES' ? 'active' : ''}" data-tab="CLIENTES">
              📋 Clientes Registrados
            </button>
            <button class="adm-tab ${this.activeTab === 'VENTAS' ? 'active' : ''}" data-tab="VENTAS">
              📊 Indicadores Comerciales
            </button>
          ` : `
            <button class="adm-tab ${this.activeTab === 'DESPACHOS' ? 'active' : ''}" data-tab="DESPACHOS">
              🚚 Despachos y Entregas RM
            </button>
          `}
        </nav>

        <!-- Contenedor dinámico de pestaña -->
        <main id="admin-tab-content-area" class="admin-tab-viewport"></main>
      </div>
    `;

    this.attachNavEvents();
    this.renderTabContent();
  }

  renderLoginForm() {
    this.container.innerHTML = `
      <div class="admin-login-card">
        <div class="login-header">
          <span class="login-shield-icon">🔐</span>
          <h2>Panel de Administración</h2>
          <p>Ingresa con tus credenciales de acceso para gestionar el sistema.</p>
        </div>

        <form id="admin-login-form" class="login-form">
          <div class="form-group">
            <label for="login-username" class="form-label">Usuario</label>
            <input 
              type="text" 
              id="login-username" 
              class="form-control" 
              placeholder="Nombre de usuario" 
              required 
            />
          </div>

          <div class="form-group">
            <label for="login-password" class="form-label">Contraseña</label>
            <input 
              type="password" 
              id="login-password" 
              class="form-control" 
              placeholder="Contraseña" 
              required 
            />
          </div>

          <div id="login-error-alert" class="login-error-msg" style="display: none;"></div>

          <button type="submit" id="login-submit-btn" class="btn-primary btn-block">
            Ingresar al Panel
          </button>
        </form>

        <div class="quick-roles-helper">
          <div class="quick-title">Cuentas disponibles:</div>
          <div class="quick-buttons-row">
            <button class="btn-demo-fill" data-u="superadmin" data-p="admin123">
              👑 Super Admin (superadmin)
            </button>
            <button class="btn-demo-fill" data-u="admin" data-p="tienda123">
              🏪 Administrador de Tienda (admin)
            </button>
            <button class="btn-demo-fill" data-u="despacho" data-p="ruta123">
              🚚 Despachador (despacho)
            </button>
          </div>
        </div>
      </div>
    `;

    this.attachLoginEvents();
  }

  attachLoginEvents() {
    const form = this.container.querySelector('#admin-login-form');
    const errorAlert = this.container.querySelector('#login-error-alert');

    this.container.querySelectorAll('.btn-demo-fill').forEach(btn => {
      btn.addEventListener('click', () => {
        const u = btn.dataset.u;
        const p = btn.dataset.p;
        const userInp = this.container.querySelector('#login-username');
        const passInp = this.container.querySelector('#login-password');
        if (userInp) userInp.value = u;
        if (passInp) passInp.value = p;
      });
    });

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (errorAlert) errorAlert.style.display = 'none';

      const username = this.container.querySelector('#login-username').value;
      const password = this.container.querySelector('#login-password').value;

      const res = await authService.login(username, password);
      if (!res.success) {
        if (errorAlert) {
          errorAlert.textContent = '⚠️ ' + res.error;
          errorAlert.style.display = 'block';
        }
      }
    });
  }

  attachNavEvents() {
    this.container.querySelector('#admin-logout-btn')?.addEventListener('click', () => {
      authService.logout();
    });

    this.container.querySelectorAll('.adm-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.activeTab = tab.dataset.tab;
        this.container.querySelectorAll('.adm-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.renderTabContent();
      });
    });
  }

  renderTabContent() {
    const viewport = document.getElementById('admin-tab-content-area');
    if (!viewport) return;

    switch (this.activeTab) {
      case 'USUARIOS':
        viewport.innerHTML = this.renderUsersTab();
        this.attachUsersEvents(viewport);
        break;
      case 'SEGURIDAD':
        viewport.innerHTML = this.renderSecurityTab();
        this.attachSecurityEvents(viewport);
        break;
      case 'INVENTARIO':
        viewport.innerHTML = this.renderInventoryTab();
        this.attachInventoryEvents(viewport);
        break;
      case 'DESPACHOS':
        viewport.innerHTML = this.renderDispatchTab();
        this.attachDispatchEvents(viewport);
        break;
      case 'CLIENTES':
        viewport.innerHTML = this.renderClientsTab();
        break;
      case 'VENTAS':
        viewport.innerHTML = this.renderSalesTab();
        break;
      default:
        viewport.innerHTML = this.renderUsersTab();
        this.attachUsersEvents(viewport);
    }
  }

  // =========================================================================
  // MÓDULO EXCLUSIVO DEL SUPER ADMIN: GESTIÓN DE USUARIOS (AGREGAR Y MODIFICAR)
  // =========================================================================
  renderUsersTab() {
    const usuarios = db.getTable(TABLES.USUARIO_SISTEMA);

    return `
      <div class="tab-pane-container">
        <div class="pane-header-row">
          <div>
            <h2>Gestión de Cuentas y Accesos</h2>
            <p>Control exclusivo de Super Admin: Agregar nuevos usuarios, modificar cuentas existentes, cambiar roles y contraseñas.</p>
          </div>
          <button id="btn-open-create-user-modal" class="btn-primary">
            ➕ Agregar Nuevo Usuario
          </button>
        </div>

        <div class="table-responsive">
          <table class="admin-data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Usuario</th>
                <th>Nombre del Titular</th>
                <th>Rol del Sistema</th>
                <th>Estado</th>
                <th>Último Acceso</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${usuarios.map(u => `
                <tr>
                  <td>#${u.id_usuario}</td>
                  <td><strong>@${u.username}</strong></td>
                  <td>${u.nombre_real}</td>
                  <td>
                    <span class="admin-badge-role ${u.rol.toLowerCase()}">
                      ${u.rol === 'SUPER_ADMIN' ? 'Super Admin' :
                        u.rol === 'ADMIN_TIENDA' ? 'Administrador de Tienda' : 'Despachador'}
                    </span>
                  </td>
                  <td>
                    ${u.activo ? '<span class="status-pill green">Activo</span>' : '<span class="status-pill red">Suspendido</span>'}
                  </td>
                  <td><small>${u.ultimo_acceso ? new Date(u.ultimo_acceso).toLocaleDateString() + ' ' + new Date(u.ultimo_acceso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sin registros'}</small></td>
                  <td>
                    <div class="action-btn-group">
                      <button class="btn-edit-user btn-primary" data-id="${u.id_usuario}" title="Modificar usuario">
                        ✏️ Modificar
                      </button>
                      ${u.rol !== 'SUPER_ADMIN' ? `
                        <button class="btn-toggle-user ${u.activo ? 'btn-danger' : 'btn-success'}" data-id="${u.id_usuario}" data-status="${!u.activo}">
                          ${u.activo ? '🔒 Suspender' : '🔓 Reactivar'}
                        </button>
                      ` : '<span class="badge-locked">Principal</span>'}
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- MODAL 1: AGREGAR NUEVO USUARIO -->
        <div id="create-user-modal" class="mini-modal" style="display: none;">
          <div class="mini-modal-content">
            <h3>Agregar Nuevo Usuario</h3>
            <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 1rem;">
              Crea una nueva cuenta de acceso para el personal administrativo o logístico.
            </p>
            <form id="create-user-form">
              <div class="form-group">
                <label class="form-label">Nombre de Usuario (Login)</label>
                <input type="text" id="new-user-username" class="form-control" placeholder="Ej. bodega_norte" required />
              </div>
              <div class="form-group">
                <label class="form-label">Nombre Completo del Titular</label>
                <input type="text" id="new-user-fullname" class="form-control" placeholder="Ej. Encargado de Bodega" required />
              </div>
              <div class="form-group">
                <label class="form-label">Rol y Permisos</label>
                <select id="new-user-role" class="form-control" required>
                  <option value="ADMIN_TIENDA">Administrador de Tienda (Catálogo, Stock y Pedidos)</option>
                  <option value="DESPACHADOR">Despachador Logístico (Rutas y Entregas)</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Contraseña de Acceso</label>
                <input type="password" id="new-user-password" class="form-control" placeholder="Mínimo 6 caracteres" required />
              </div>
              <div class="modal-buttons">
                <button type="submit" class="btn-primary">Guardar Usuario</button>
                <button type="button" id="btn-close-create-user" class="btn-secondary">Cancelar</button>
              </div>
            </form>
          </div>
        </div>

        <!-- MODAL 2: MODIFICAR USUARIO EXISTENTE -->
        <div id="edit-user-modal" class="mini-modal" style="display: none;">
          <div class="mini-modal-content">
            <h3>Modificar Usuario</h3>
            <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 1rem;">
              Actualiza los datos, rol o contraseña de la cuenta seleccionada.
            </p>
            <form id="edit-user-form">
              <input type="hidden" id="edit-user-id" />
              <div class="form-group">
                <label class="form-label">Nombre de Usuario</label>
                <input type="text" id="edit-user-username" class="form-control" required />
              </div>
              <div class="form-group">
                <label class="form-label">Nombre del Titular</label>
                <input type="text" id="edit-user-fullname" class="form-control" required />
              </div>
              <div class="form-group">
                <label class="form-label">Rol del Sistema</label>
                <select id="edit-user-role" class="form-control" required>
                  <option value="SUPER_ADMIN">Super Admin (Control Total)</option>
                  <option value="ADMIN_TIENDA">Administrador de Tienda</option>
                  <option value="DESPACHADOR">Despachador Logístico</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Nueva Contraseña (dejar en blanco para no cambiar)</label>
                <input type="password" id="edit-user-password" class="form-control" placeholder="••••••••" />
              </div>
              <div class="form-group">
                <label class="form-label">Estado de la Cuenta</label>
                <select id="edit-user-status" class="form-control">
                  <option value="true">Activo</option>
                  <option value="false">Suspendido</option>
                </select>
              </div>
              <div class="modal-buttons">
                <button type="submit" class="btn-primary">Guardar Cambios</button>
                <button type="button" id="btn-close-edit-user" class="btn-secondary">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
  }

  attachUsersEvents(viewport) {
    // Modal Agregar Usuario
    const createModal = viewport.querySelector('#create-user-modal');
    viewport.querySelector('#btn-open-create-user-modal')?.addEventListener('click', () => {
      if (createModal) createModal.style.display = 'flex';
    });
    viewport.querySelector('#btn-close-create-user')?.addEventListener('click', () => {
      if (createModal) createModal.style.display = 'none';
    });

    const createForm = viewport.querySelector('#create-user-form');
    createForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = viewport.querySelector('#new-user-username').value;
      const nombre_real = viewport.querySelector('#new-user-fullname').value;
      const rol = viewport.querySelector('#new-user-role').value;
      const password = viewport.querySelector('#new-user-password').value;

      try {
        authService.createUser({ username, nombre_real, rol, password });
        alert(`✓ Usuario "@${username}" agregado exitosamente.`);
        if (createModal) createModal.style.display = 'none';
        this.renderTabContent();
      } catch (err) {
        alert('Error: ' + err.message);
      }
    });

    // Modal Modificar Usuario
    const editModal = viewport.querySelector('#edit-user-modal');
    viewport.querySelector('#btn-close-edit-user')?.addEventListener('click', () => {
      if (editModal) editModal.style.display = 'none';
    });

    viewport.querySelectorAll('.btn-edit-user').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = Number(btn.dataset.id);
        const user = db.findOne(TABLES.USUARIO_SISTEMA, u => u.id_usuario === id);
        if (!user) return;

        viewport.querySelector('#edit-user-id').value = user.id_usuario;
        viewport.querySelector('#edit-user-username').value = user.username;
        viewport.querySelector('#edit-user-fullname').value = user.nombre_real;
        viewport.querySelector('#edit-user-role').value = user.rol;
        viewport.querySelector('#edit-user-password').value = '';
        viewport.querySelector('#edit-user-status').value = String(user.activo !== false);

        if (editModal) editModal.style.display = 'flex';
      });
    });

    const editForm = viewport.querySelector('#edit-user-form');
    editForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = viewport.querySelector('#edit-user-id').value;
      const username = viewport.querySelector('#edit-user-username').value;
      const nombre_real = viewport.querySelector('#edit-user-fullname').value;
      const rol = viewport.querySelector('#edit-user-role').value;
      const password = viewport.querySelector('#edit-user-password').value;
      const activo = viewport.querySelector('#edit-user-status').value === 'true';

      try {
        authService.updateUser(id, {
          username,
          nombre_real,
          rol,
          password: password || undefined,
          activo
        });
        alert(`✓ Usuario "@${username}" modificado exitosamente.`);
        if (editModal) editModal.style.display = 'none';
        this.renderTabContent();
      } catch (err) {
        alert('Error: ' + err.message);
      }
    });

    // Suspender / Reactivar
    viewport.querySelectorAll('.btn-toggle-user').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const newStatus = btn.dataset.status === 'true';
        try {
          authService.toggleUserStatus(id, newStatus);
          this.renderTabContent();
        } catch (err) {
          alert('Error: ' + err.message);
        }
      });
    });
  }

  // =========================================================================
  // MÓDULO: REGISTRO DE SEGURIDAD (SUPER ADMIN)
  // =========================================================================
  renderSecurityTab() {
    const logs = db.getTable(TABLES.LOG_SEGURIDAD_SIEM).slice(-25).reverse();

    return `
      <div class="tab-pane-container">
        <div class="pane-header-row">
          <div>
            <h2>Registro de Seguridad y Accesos</h2>
            <p>Monitoreo continuo de eventos, intentos de acceso y bloqueos preventivos.</p>
          </div>
        </div>

        <div class="table-responsive">
          <table class="admin-data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Fecha y Hora</th>
                <th>Evento</th>
                <th>Severidad</th>
                <th>IP</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              ${logs.map(l => `
                <tr>
                  <td>#${l.id_log}</td>
                  <td><small>${new Date(l.timestamp_utc).toLocaleString()}</small></td>
                  <td><strong>${l.event_type}</strong></td>
                  <td>
                    <span class="severity-tag ${l.severity.toLowerCase()}">${l.severity}</span>
                  </td>
                  <td><code>${l.ip_origen}</code></td>
                  <td><small>${l.details_payload}</small></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  attachSecurityEvents(viewport) {}

  // =========================================================================
  // MÓDULO: CONTROL DE INVENTARIO (ADMIN DE TIENDA)
  // =========================================================================
  renderInventoryTab() {
    const products = db.getTable(TABLES.PRODUCTO);
    const movimientos = db.getTable(TABLES.INVENTARIO_MOVIMIENTO).slice(-15).reverse();

    return `
      <div class="tab-pane-container">
        <div class="pane-header-row">
          <div>
            <h2>Control de Inventario y Existencias</h2>
            <p>Registro de movimientos de mercadería (Entradas, Salidas y Ajustes) y disponibilidad física en bodega.</p>
          </div>
          <button id="btn-open-kardex-modal" class="btn-primary">
            ➕ Registrar Movimiento de Stock
          </button>
        </div>

        <div class="kardex-grid-two-col">
          <div class="panel-box">
            <h3 class="panel-title">Disponibilidad en Catálogo</h3>
            <div class="table-responsive">
              <table class="admin-data-table">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th>Stock</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  ${products.map(p => `
                    <tr>
                      <td><code>${p.sku}</code></td>
                      <td><strong>${p.nombre}</strong></td>
                      <td><span class="category-pill ${p.categoria_tienda.toLowerCase()}">${p.categoria_tienda}</span></td>
                      <td>
                        <strong class="${p.stock_actual <= p.stock_minimo ? 'stock-critical' : 'stock-ok'}">
                          ${p.stock_actual} u.
                        </strong>
                      </td>
                      <td>
                        ${p.stock_actual === 0 ? '<span class="status-pill red">Agotado</span>' :
                          p.stock_actual <= p.stock_minimo ? '<span class="status-pill orange">Bajo Stock</span>' :
                          '<span class="status-pill green">Disponible</span>'}
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <div class="panel-box">
            <h3 class="panel-title">Últimos Movimientos de Stock</h3>
            <div class="table-responsive">
              <table class="admin-data-table">
                <thead>
                  <tr>
                    <th>Hora</th>
                    <th>SKU</th>
                    <th>Tipo</th>
                    <th>Cantidad</th>
                    <th>Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  ${movimientos.map(m => `
                    <tr>
                      <td><small>${new Date(m.fecha_registro).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small></td>
                      <td><code>${m.producto_sku}</code></td>
                      <td>
                        <span class="mov-badge ${m.tipo_movimiento.toLowerCase()}">${m.tipo_movimiento}</span>
                      </td>
                      <td><strong>${m.tipo_movimiento === 'ENTRADA' ? '+' : '-'}${m.cantidad}</strong></td>
                      <td><small>${m.motivo}</small></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Modal para nuevo movimiento -->
        <div id="kardex-form-modal" class="mini-modal" style="display: none;">
          <div class="mini-modal-content">
            <h3>Registrar Movimiento de Mercadería</h3>
            <form id="kardex-form">
              <div class="form-group">
                <label class="form-label">Producto</label>
                <select id="kardex-sku" class="form-control" required>
                  ${products.map(p => `<option value="${p.sku}">[${p.sku}] ${p.nombre} (Stock actual: ${p.stock_actual})</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Tipo de Movimiento</label>
                <select id="kardex-tipo" class="form-control" required>
                  <option value="ENTRADA">ENTRADA (Recepción de proveedor)</option>
                  <option value="SALIDA">SALIDA (Merma o retiro)</option>
                  <option value="AJUSTE">AJUSTE (Conteo físico en bodega)</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Cantidad</label>
                <input type="number" id="kardex-cantidad" class="form-control" min="1" required />
              </div>
              <div class="form-group">
                <label class="form-label">Motivo u Observación</label>
                <input type="text" id="kardex-motivo" class="form-control" placeholder="Ej. Recepción proveedor Carozzi, reposición..." required />
              </div>
              <div class="modal-buttons">
                <button type="submit" class="btn-primary">Registrar Movimiento</button>
                <button type="button" id="btn-close-kardex" class="btn-secondary">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
  }

  attachInventoryEvents(viewport) {
    const modal = viewport.querySelector('#kardex-form-modal');
    viewport.querySelector('#btn-open-kardex-modal')?.addEventListener('click', () => {
      if (modal) modal.style.display = 'flex';
    });
    viewport.querySelector('#btn-close-kardex')?.addEventListener('click', () => {
      if (modal) modal.style.display = 'none';
    });

    const form = viewport.querySelector('#kardex-form');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const sku = viewport.querySelector('#kardex-sku').value;
      const tipo = viewport.querySelector('#kardex-tipo').value;
      const cantidad = viewport.querySelector('#kardex-cantidad').value;
      const motivo = viewport.querySelector('#kardex-motivo').value;

      try {
        InventoryService.recordMovement({
          sku,
          tipo,
          cantidad,
          motivo,
          userId: authService.getCurrentUser()?.id_usuario || 1
        });
        alert('✓ Movimiento asentado con éxito.');
        if (modal) modal.style.display = 'none';
        this.renderTabContent();
      } catch (err) {
        alert('Error: ' + err.message);
      }
    });
  }

  // =========================================================================
  // MÓDULO: DESPACHOS Y ENTREGAS (DESPACHADOR & ADMIN TIENDA)
  // =========================================================================
  renderDispatchTab() {
    const ordenes = db.getTable(TABLES.ORDEN_PEDIDO).slice().reverse();
    const despachos = db.getTable(TABLES.DESPACHO);
    const clientes = db.getTable(TABLES.CLIENTE_CRM);

    return `
      <div class="tab-pane-container">
        <div class="pane-header-row">
          <div>
            <h2>Despachos y Entregas en Santiago</h2>
            <p>Control de entregas domiciliarias en la Región Metropolitana: Pendiente → En Preparación → En Ruta → Entregado.</p>
          </div>
        </div>

        <div class="table-responsive">
          <table class="admin-data-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Cliente</th>
                <th>Comuna RM</th>
                <th>Total a Pagar</th>
                <th>Estado de Entrega</th>
                <th>Repartidor</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${ordenes.map(ord => {
                const desp = despachos.find(d => d.id_orden === ord.id_orden) || {};
                const cli = clientes.find(c => c.id_cliente === ord.id_cliente) || {};
                const estado = desp.estado_despacho || 'PENDIENTE';

                return `
                  <tr>
                    <td><strong>${ord.codigo_pedido}</strong><br><small>${new Date(ord.fecha_emision).toLocaleDateString()}</small></td>
                    <td>${cli.nombre_completo || 'Cliente'}<br><small>${cli.telefono_whatsapp}</small></td>
                    <td><strong>${cli.comuna_rm || 'Santiago'}</strong><br><small>${cli.direccion_despacho || ''}</small></td>
                    <td><strong class="price-val">${PriceEngine.formatCLP(ord.total_pagar)}</strong></td>
                    <td>
                      <span class="status-badge-dispatch status-${estado.toLowerCase()}">${estado}</span>
                    </td>
                    <td><small>${desp.repartidor_responsable || 'Por Asignar'}</small></td>
                    <td>
                      <div class="action-btn-group">
                        ${estado === 'PENDIENTE' ? `
                          <button class="btn-action-status" data-id="${ord.id_orden}" data-status="EN_PREPARACION">
                            📦 Preparar
                          </button>
                        ` : ''}
                        ${estado === 'EN_PREPARACION' ? `
                          <button class="btn-action-status" data-id="${ord.id_orden}" data-status="EN_RUTA">
                            🚚 Despachar
                          </button>
                        ` : ''}
                        ${estado === 'EN_RUTA' ? `
                          <button class="btn-action-status success" data-id="${ord.id_orden}" data-status="ENTREGADO">
                            ✅ Entregado
                          </button>
                        ` : ''}
                        ${estado !== 'CANCELADO' && estado !== 'ENTREGADO' ? `
                          <button class="btn-action-cancel" data-id="${ord.id_orden}" title="Anular pedido y revertir stock">
                            ⛔ Anular
                          </button>
                        ` : ''}
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  attachDispatchEvents(viewport) {
    viewport.querySelectorAll('.btn-action-status').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const status = btn.dataset.status;
        InventoryService.updateDispatchStatus(id, status, 'Despachador Logístico');
        this.renderTabContent();
      });
    });

    viewport.querySelectorAll('.btn-action-cancel').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const razon = prompt('Indique el motivo de la anulación del pedido:');
        if (razon) {
          try {
            InventoryService.cancelOrder(id, authService.getCurrentUser()?.id_usuario || 1, razon);
            alert('✓ Pedido anulado. El stock ha sido devuelto al inventario disponible.');
            this.renderTabContent();
          } catch (e) {
            alert('Error: ' + e.message);
          }
        }
      });
    });
  }

  // =========================================================================
  // MÓDULO: CLIENTES REGISTRADOS (ADMIN TIENDA)
  // =========================================================================
  renderClientsTab() {
    const clientes = db.getTable(TABLES.CLIENTE_CRM);

    return `
      <div class="tab-pane-container">
        <div class="pane-header-row">
          <div>
            <h2>Clientes Registrados</h2>
            <p>Registro de compradores que han completado pedidos en la plataforma.</p>
          </div>
        </div>

        <div class="table-responsive">
          <table class="admin-data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Teléfono WhatsApp</th>
                <th>Dirección y Comuna RM</th>
                <th>Total Pedidos</th>
                <th>Tipo de Cliente</th>
                <th>Fecha de Registro</th>
              </tr>
            </thead>
            <tbody>
              ${clientes.map(c => `
                <tr>
                  <td>#${c.id_cliente}</td>
                  <td><strong>${c.nombre_completo}</strong></td>
                  <td><code>${c.telefono_whatsapp}</code></td>
                  <td>${c.direccion_despacho}, ${c.comuna_rm}</td>
                  <td><strong>${c.total_pedidos || 1}</strong></td>
                  <td>
                    ${c.recurrente_flag || (c.total_pedidos >= 2) ?
                      '<span class="crm-badge recurring">🌟 Recurrente</span>' :
                      '<span class="crm-badge new">🌱 Nuevo</span>'}
                  </td>
                  <td><small>${new Date(c.fecha_registro).toLocaleDateString()}</small></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // MÓDULO: INDICADORES COMERCIALES (ADMIN TIENDA)
  // =========================================================================
  renderSalesTab() {
    const ordenes = db.getTable(TABLES.ORDEN_PEDIDO).filter(o => o.estado_pago !== 'CANCELADO');
    const clientes = db.getTable(TABLES.CLIENTE_CRM);

    const ventaNetaTotal = ordenes.reduce((sum, o) => sum + (o.total_pagar || 0), 0);
    const totalOrdenes = ordenes.length || 1;
    const aov = Math.round(ventaNetaTotal / totalOrdenes);

    const ahorroTotalAcumulado = ordenes.reduce((sum, o) => sum + (o.ahorro_total || 0), 0);
    const subtotalRetailAcumulado = ordenes.reduce((sum, o) => sum + (o.subtotal_retail || 0), 0);
    const pctAhorroMayorista = subtotalRetailAcumulado > 0 ? ((ahorroTotalAcumulado / subtotalRetailAcumulado) * 100).toFixed(1) : '0';

    const clientesRecurrentes = clientes.filter(c => c.recurrente_flag || c.total_pedidos >= 2).length;
    const totalClientes = clientes.length || 1;
    const rcr = ((clientesRecurrentes / totalClientes) * 100).toFixed(1);

    return `
      <div class="tab-pane-container">
        <div class="pane-header-row">
          <div>
            <h2>Indicadores Comerciales</h2>
            <p>Métricas de ventas y rendimiento en tiempo real.</p>
          </div>
        </div>

        <div class="kpi-cards-grid">
          <div class="kpi-card">
            <div class="kpi-top">
              <span class="kpi-label">Ticket Promedio por Compra</span>
              <span class="kpi-icon">💰</span>
            </div>
            <div class="kpi-val">${PriceEngine.formatCLP(aov)}</div>
            <div class="kpi-meta">Venta Total / Total de Órdenes Concretadas</div>
          </div>

          <div class="kpi-card">
            <div class="kpi-top">
              <span class="kpi-label">Ventas Totales</span>
              <span class="kpi-icon">📈</span>
            </div>
            <div class="kpi-val">${PriceEngine.formatCLP(ventaNetaTotal)}</div>
            <div class="kpi-meta">${totalOrdenes} órdenes facturadas</div>
          </div>

          <div class="kpi-card">
            <div class="kpi-top">
              <span class="kpi-label">Ahorro Promedio Mayorista</span>
              <span class="kpi-icon">🎁</span>
            </div>
            <div class="kpi-val">${pctAhorroMayorista}%</div>
            <div class="kpi-meta">Total transferido: ${PriceEngine.formatCLP(ahorroTotalAcumulado)}</div>
          </div>

          <div class="kpi-card">
            <div class="kpi-top">
              <span class="kpi-label">Tasa de Clientes Recurrentes</span>
              <span class="kpi-icon">🔁</span>
            </div>
            <div class="kpi-val">${rcr}%</div>
            <div class="kpi-meta">${clientesRecurrentes} de ${totalClientes} clientes con recompra</div>
          </div>
        </div>
      </div>
    `;
  }
}
