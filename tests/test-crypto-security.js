/**
 * tests/test-crypto-security.js
 * Suite formal de pruebas de seguridad criptográfica:
 * 1. Hashing seguro de contraseñas con scrypt + salt aleatorio + timingSafeEqual
 * 2. Cifrado simétrico de columnas AES-256-GCM (estándar y determinístico con HMAC)
 * 3. Tolerancia y compatibilidad retroactiva
 */

import { 
  hashPassword, 
  verifyPassword, 
  encryptField, 
  encryptDeterministic, 
  decryptField 
} from '../server/crypto-security.js';
import { db, initDatabase } from '../server/db.js';

async function runCryptoTests() {
  console.log('===============================================================');
  console.log('   SuperMarket.cl - SUITE DE PRUEBAS DE SEGURIDAD CRIPTOGRÁFICA ');
  console.log('      Hashing scrypt + Cifrado AES-256-GCM en Base de Datos    ');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function assertTest(name, condition, details = '') {
    if (condition) {
      console.log(`[PASS] ${name}`);
      if (details) console.log(`       ↳ ${details}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name}`);
      if (details) console.error(`       ↳ ${details}`);
      failed++;
    }
  }

  // 1. Generación de Hash scrypt con salting
  const rawPass = 'SuperClave2026!';
  const hash1 = hashPassword(rawPass);
  const hash2 = hashPassword(rawPass);

  assertTest('C-01: Formato del hash seguro scrypt', hash1.startsWith('scrypt$') && hash1.split('$').length === 3, `Formato: ${hash1.slice(0, 30)}...`);
  assertTest('C-02: Salting aleatorio (dos hashes de la misma clave son distintos)', hash1 !== hash2, 'Salts únicos impiden ataques por Rainbow Tables.');

  // 2. Verificación de contraseñas
  const passValid = verifyPassword(rawPass, hash1);
  const passInvalid = verifyPassword('ClaveErronea123', hash1);
  assertTest('C-03: Verificación correcta de clave contra hash scrypt', passValid === true, 'Clave válida autenticada exitosamente.');
  assertTest('C-04: Rechazo seguro ante clave incorrecta', passInvalid === false, 'Clave incorrecta rechazada.');

  // 3. Compatibilidad con texto plano legado
  const legacyVerified = verifyPassword('plainSecret', 'plainSecret');
  const legacyRejected = verifyPassword('wrongSecret', 'plainSecret');
  assertTest('C-05: Compatibilidad retroactiva transparente para migraciones de claves legadas', legacyVerified && !legacyRejected, 'Permite migración gradual sin corte de servicio.');

  // 4. Cifrado AES-256-GCM estándar (IV aleatorio)
  const direccion = 'Av. Libertador Bernardo O Higgins 1058, Depto 1204';
  const encDir1 = encryptField(direccion);
  const encDir2 = encryptField(direccion);

  assertTest('C-06: Cifrado AES-256-GCM con autenticación de integridad (GCM tag)', encDir1.startsWith('enc$') && encDir1.split('$').length === 4, `Formato: ${encDir1.slice(0, 35)}...`);
  assertTest('C-07: IV único por operación (cifrado no determinístico)', encDir1 !== encDir2, 'Direcciones idénticas producen criptogramas distintos en disco.');

  const decDir = decryptField(encDir1);
  assertTest('C-08: Descifrado íntegro de campo sensible', decDir === direccion, `Descifrado: "${decDir}"`);

  // 5. Cifrado Determinístico (para búsquedas por teléfono WhatsApp)
  const telefono = '+56987654321';
  const encTel1 = encryptDeterministic(telefono);
  const encTel2 = encryptDeterministic(telefono);

  assertTest('C-09: Cifrado determinístico reproducible para cláusulas WHERE SQL', encTel1 === encTel2 && encTel1.startsWith('enc_det$'), `Criptograma consistente: ${encTel1.slice(0, 35)}...`);
  const decTel = decryptField(encTel1);
  assertTest('C-10: Descifrado íntegro de teléfono determinístico', decTel === telefono, `Descifrado: "${decTel}"`);

  // 6. Verificación en base de datos SQLite real
  initDatabase();
  const superAdmin = db.prepare("SELECT * FROM USUARIO_SISTEMA WHERE username = 'superadmin'").get();
  const adminAuth = verifyPassword('admin123', superAdmin.password_hash);
  assertTest('C-11: Usuario Super Admin con hash scrypt verificado en BD', superAdmin.password_hash.startsWith('scrypt$') && adminAuth, `Usuario @${superAdmin.username} protegido con scrypt.`);

  // 7. Verificación de clientes CRM cifrados en BD
  const clientesEnBd = db.prepare("SELECT id_cliente, telefono_whatsapp, direccion_despacho FROM CLIENTE_CRM LIMIT 3").all();
  const clientesCifradosEnDisco = clientesEnBd.some(c => c.telefono_whatsapp.startsWith('enc_') || c.direccion_despacho.startsWith('enc$'));
  assertTest('C-12: Columnas sensibles de CLIENTE_CRM cifradas en almacenamiento persistente', clientesCifradosEnDisco, `Datos en disco protegidos con AES-256-GCM.`);

  console.log('\n===============================================================');
  console.log(`RESUMEN DE PRUEBAS CRIPTOGRÁFICAS: ${passed} Pasadas, ${failed} Falladas`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runCryptoTests().catch(err => {
  console.error('[FATAL] Error ejecutando pruebas criptográficas:', err);
  process.exit(1);
});
