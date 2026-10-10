/**
 * tests/test-qa-admin-auth.js
 * Prueba de certificación para el Punto 3.4 del Informe QA
 * Verifica que el acceso al panel / API admin esté protegido estrictamente por autenticación.
 */

async function runAuthTests() {
  const BASE_URL = 'http://localhost:8080';
  console.log('--- TEST DE AUTENTICACIÓN ADMIN (PUNTO 3.4 QA) ---');

  // Caso 1: Acceso sin credenciales / sin token al endpoint administrativo
  console.log('\n[Paso 1] Intentando acceder a /api/orders (GET) sin token...');
  const resNoAuth = await fetch(`${BASE_URL}/api/orders`);
  console.log(`Estado HTTP: ${resNoAuth.status} ${resNoAuth.statusText}`);
  const jsonNoAuth = await resNoAuth.json();
  console.log('Respuesta del servidor:', jsonNoAuth);

  if (resNoAuth.status === 401) {
    console.log('✔ PASS: Acceso denegado correctamente sin token (HTTP 401).');
  } else {
    console.error('❌ FAIL: Se permitió acceso o estado inesperado:', resNoAuth.status);
    process.exit(1);
  }

  // Caso 2: Login con credenciales erróneas
  console.log('\n[Paso 2] Intentando login con credenciales erróneas (superadmin / clave_falsa)...');
  const resBadLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'superadmin', password: 'clave_falsa' })
  });
  console.log(`Estado HTTP: ${resBadLogin.status}`);
  const jsonBadLogin = await resBadLogin.json();
  console.log('Respuesta del servidor:', jsonBadLogin);

  if (resBadLogin.status === 401) {
    console.log('✔ PASS: Login rechazado correctamente ante clave incorrecta (HTTP 401).');
  } else {
    console.error('❌ FAIL: Estado inesperado en login erróneo:', resBadLogin.status);
    process.exit(1);
  }

  // Caso 3: Login con credenciales válidas
  console.log('\n[Paso 3] Intentando login con credenciales válidas (superadmin / admin123)...');
  const resGoodLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'superadmin', password: 'admin123' })
  });
  console.log(`Estado HTTP: ${resGoodLogin.status}`);
  const jsonGoodLogin = await resGoodLogin.json();
  console.log('Usuario autenticado:', jsonGoodLogin.user);

  if (resGoodLogin.status === 200 && jsonGoodLogin.token) {
    console.log('✔ PASS: Token JWT generado exitosamente.');
  } else {
    console.error('❌ FAIL: No se pudo iniciar sesión con credenciales válidas.');
    process.exit(1);
  }

  // Caso 4: Acceso a /api/orders con token Bearer
  console.log('\n[Paso 4] Accediendo a /api/orders (GET) con el token Bearer recibido...');
  const resWithAuth = await fetch(`${BASE_URL}/api/orders`, {
    headers: { 'Authorization': `Bearer ${jsonGoodLogin.token}` }
  });
  console.log(`Estado HTTP: ${resWithAuth.status}`);
  if (resWithAuth.status === 200) {
    console.log('✔ PASS: Endpoint protegido /api/orders accesible con token autenticado.');
  } else {
    console.error('❌ FAIL: No se pudo acceder con token válido:', resWithAuth.status);
    process.exit(1);
  }

  // Caso 5: Acceso a /api/users exclusivo de SUPER_ADMIN con token Bearer
  console.log('\n[Paso 5] Accediendo a /api/users (GET) con token de Super Admin...');
  const resUsers = await fetch(`${BASE_URL}/api/users`, {
    headers: { 'Authorization': `Bearer ${jsonGoodLogin.token}` }
  });
  console.log(`Estado HTTP: ${resUsers.status}`);
  if (resUsers.status === 200) {
    console.log('✔ PASS: Endpoint RBAC /api/users accesible para SUPER_ADMIN.');
  } else {
    console.error('❌ FAIL: Error accediendo a /api/users:', resUsers.status);
    process.exit(1);
  }

  console.log('\n=============================================');
  console.log('✔ CERTIFICACIÓN DE SEGURIDAD 3.4 COMPLETADA AL 100%');
  console.log('=============================================');
}

runAuthTests().catch(err => {
  console.error('Error durante la prueba:', err);
  process.exit(1);
});
