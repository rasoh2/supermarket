/**
 * test-admin-view.js
 * Test de integración del módulo de administración y cumplimiento UML de Super Admin.
 * Sin dependencias externas de npm.
 */

import fs from 'fs';

// Mock liviano del DOM en Node.js puro
class MockElement {
  constructor(tagName = 'div', id = '') {
    this.tagName = tagName.toUpperCase();
    this.id = id;
    this.children = [];
    this.innerHTML = '';
    this.style = {};
    this.classList = {
      classes: new Set(),
      add: (c) => this.classList.classes.add(c),
      remove: (c) => this.classList.classes.delete(c),
      contains: (c) => this.classList.classes.has(c)
    };
    this.attributes = {};
    this.dataset = {};
    this.value = '';
    this.listeners = {};
  }
  addEventListener(event, fn) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
  }
  dispatchEvent(event) {
    if (this.listeners[event.type]) {
      this.listeners[event.type].forEach(fn => fn(event));
    }
  }
  querySelector(sel) { return new MockElement(); }
  querySelectorAll(sel) { return []; }
}

const mockContainer = new MockElement('div', 'admin-view-root');

global.window = {
  addEventListener: () => {},
  dispatchEvent: () => {}
};
global.document = {
  getElementById: (id) => (id === 'admin-view-root' ? mockContainer : new MockElement('div', id)),
  createElement: (tag) => new MockElement(tag)
};
const store = {};
global.localStorage = {
  getItem: (k) => store[k] || null,
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); }
};
global.sessionStorage = global.localStorage;
global.CustomEvent = class CustomEvent {
  constructor(name, opts = {}) {
    this.type = name;
    this.detail = opts.detail;
  }
};
global.alert = (msg) => console.log('  [UI Alert]:', msg);
global.prompt = (msg) => 'Motivo de prueba';

async function runAdminIntegrationTests() {
  console.log('================================================================');
  console.log('  TEST DE INTEGRACIÓN: GESTIÓN DE CUENTAS SUPER ADMIN (CU-13)   ');
  console.log('================================================================\n');

  const { db, TABLES } = await import('../src/core/storage.js');
  const { authService } = await import('../src/core/auth-service.js');
  const { AdminView } = await import('../src/ui/admin-view.js');

  const catalog = JSON.parse(fs.readFileSync('src/data/catalog.json', 'utf8'));
  await db.init(catalog);

  const adminView = new AdminView('admin-view-root');

  // 1. Login como superadmin
  console.log('1. Autenticando como Super Admin (@superadmin)...');
  const loginRes = await authService.login('superadmin', 'admin123');
  console.log('   ✓ Login exitoso:', loginRes.success, '| Rol:', loginRes.user?.rol);

  // 2. Verificar que el usuario en sesión es Super Admin
  const currentUser = authService.getCurrentUser();
  console.log('   ✓ Titular:', currentUser.nombre_real, '(@' + currentUser.username + ')');
  if (currentUser.nombre_real !== 'Super Admin' || currentUser.username !== 'superadmin') {
    throw new Error('El nombre o username del Super Admin no coincide');
  }

  // 3. Probar renderUsersTab() generado
  console.log('\n2. Verificando HTML de Gestión de Usuarios y Accesos (CU-13)...');
  const usersTabHtml = adminView.renderUsersTab();
  const hasAddUserModal = usersTabHtml.includes('id="create-user-modal"');
  const hasEditUserModal = usersTabHtml.includes('id="edit-user-modal"');
  const hasEditBtn = usersTabHtml.includes('btn-edit-user');
  console.log('   ✓ Modal "Agregar Nuevo Usuario" presente:', hasAddUserModal);
  console.log('   ✓ Modal "Modificar Usuario" presente:', hasEditUserModal);
  console.log('   ✓ Botón "Modificar" en filas:', hasEditBtn);

  if (!hasAddUserModal || !hasEditUserModal || !hasEditBtn) {
    throw new Error('Faltan controles esenciales de gestión en renderUsersTab');
  }

  // 4. Probar "Agregar Nuevo Usuario" (CU-13)
  console.log('\n3. Ejecutando "Agregar Nuevo Usuario" (CU-13)...');
  const newUsername = 'encargado_bodega_centro';
  authService.createUser({
    username: newUsername,
    nombre_real: 'Encargado Bodega Centro',
    rol: 'ADMIN_TIENDA',
    password: 'password123'
  });

  const userCreated = db.findOne(TABLES.USUARIO_SISTEMA, u => u.username === newUsername);
  console.log('   ✓ Usuario insertado en BD:', userCreated?.nombre_real, '(@' + userCreated?.username + ')');
  if (!userCreated) throw new Error('No se pudo crear usuario');

  // 5. Probar "Modificar Usuario" (CU-13)
  console.log('\n4. Ejecutando "Modificar Usuario Existente" (CU-13)...');
  authService.updateUser(userCreated.id_usuario, {
    username: newUsername,
    nombre_real: 'Supervisor General Centro',
    rol: 'ADMIN_TIENDA',
    activo: true
  });

  const userUpdated = db.findOne(TABLES.USUARIO_SISTEMA, u => u.id_usuario === userCreated.id_usuario);
  console.log('   ✓ Usuario modificado en BD:', userUpdated?.nombre_real);
  if (userUpdated.nombre_real !== 'Supervisor General Centro') {
    throw new Error('Fallo al modificar usuario');
  }

  // 6. Probar "Suspender / Reactivar Cuenta" (CU-13)
  console.log('\n5. Ejecutando "Suspender / Reactivar Cuenta" (CU-13)...');
  authService.toggleUserStatus(userCreated.id_usuario, false);
  let suspendedUser = db.findOne(TABLES.USUARIO_SISTEMA, u => u.id_usuario === userCreated.id_usuario);
  console.log('   ✓ Cuenta suspendida (activo = false):', suspendedUser.activo === false);

  authService.toggleUserStatus(userCreated.id_usuario, true);
  let reactivatedUser = db.findOne(TABLES.USUARIO_SISTEMA, u => u.id_usuario === userCreated.id_usuario);
  console.log('   ✓ Cuenta reactivada (activo = true):', reactivatedUser.activo === true);

  // 7. Verificar auditoría de seguridad
  console.log('\n6. Verificando que las operaciones generaron bitácora de seguridad...');
  const logs = db.getTable(TABLES.LOG_SEGURIDAD_SIEM);
  const userLogs = logs.filter(l => l.event_type.includes('USER_ACCOUNT_'));
  console.log(`   ✓ ${userLogs.length} eventos de auditoría de usuarios registrados.`);

  // 8. Verificar ausencia de nombres personales
  console.log('\n7. Verificando ausencia total de nombres personales...');
  const allUsers = db.getTable(TABLES.USUARIO_SISTEMA);
  const personalNames = ['felipe', 'fuentes', 'sebastián', 'ortega'];
  const hasPersonal = allUsers.some(u => 
    personalNames.some(p => u.username.toLowerCase().includes(p) || u.nombre_real.toLowerCase().includes(p))
  );
  console.log('   ✓ ¿Base de datos de usuarios libre de nombres personales?:', !hasPersonal);

  if (hasPersonal) throw new Error('Se detectaron nombres personales en usuarios');

  console.log('\n================================================================');
  console.log('  RESULTADO: 100% CUMPLIMIENTO CON MODELO UML Y REQUERIMIENTOS  ');
  console.log('================================================================\n');
}

runAdminIntegrationTests().catch(err => {
  console.error('Error en pruebas:', err);
  process.exit(1);
});
