/**
 * server/crypto-security.js
 * Módulo Criptográfico de Producción para SuperMarket.cl
 * 1. Hashing seguro de contraseñas con scrypt + salt aleatorio + timingSafeEqual
 * 2. Cifrado simétrico de datos sensibles a nivel de campo con AES-256-GCM
 */

import crypto from 'node:crypto';

// Clave maestra para AES-256 (32 bytes = 256 bits)
const MASTER_KEY_SOURCE = process.env.SUPERMARKET_ENCRYPTION_KEY;
if (!MASTER_KEY_SOURCE) throw new Error('SUPERMARKET_ENCRYPTION_KEY missing');
const AES_KEY = crypto.createHash('sha256').update(MASTER_KEY_SOURCE).digest();

/**
 * 1. HASHING SEGURO DE CONTRASEÑAS (scrypt + Salt)
 */

/**
 * Genera un hash irreversible con salt aleatorio de 16 bytes
 * Formato: scrypt$SALT_HEX$DERIVED_KEY_HEX
 */
export function hashPassword(password) {
  if (!password || typeof password !== 'string') return '';
  // Si ya es un hash scrypt, no volver a hashear
  if (password.startsWith('scrypt$')) return password;

  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${derivedKey}`;
}

/**
 * Verifica una contraseña contra el hash almacenado (o texto plano legado)
 * Utiliza comparación de tiempo constante (timingSafeEqual) para mitigar ataques de temporización
 */
export function verifyPassword(password, storedHash) {
  if (!password || !storedHash) return false;

  // Verificación scrypt
  if (typeof storedHash === 'string' && storedHash.startsWith('scrypt$')) {
    const parts = storedHash.split('$');
    if (parts.length !== 3) return false;

    const salt = parts[1];
    const keyHex = parts[2];
    const expectedBuffer = Buffer.from(keyHex, 'hex');

    try {
      const actualBuffer = crypto.scryptSync(password, salt, 64);
      return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
    } catch {
      return false;
    }
  }

  // Fallback de compatibilidad retroactiva para scripts y tests
  return password === storedHash;
}

/**
 * 2. CIFRADO SIMÉTRICO DE DATOS SENSIBLES EN REPOSO (AES-256-GCM)
 */

/**
 * Cifra una cadena usando AES-256-GCM con Vector de Inicialización (IV) único
 * Formato: enc$IV_HEX$AUTHTAG_HEX$CIPHERTEXT_HEX
 */
export function encryptField(plaintext) {
  if (!plaintext || typeof plaintext !== 'string') return plaintext;
  // Evitar doble cifrado
  if (plaintext.startsWith('enc$') || plaintext.startsWith('enc_det$')) return plaintext;

  try {
    const iv = crypto.randomBytes(12); // 96-bit IV para GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', AES_KEY, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    return `enc$${iv.toString('hex')}$${authTag}$${encrypted}`;
  } catch (err) {
    console.error('[Crypto] Error cifrando campo:', err);
    return plaintext;
  }
}

/**
 * Cifrado determinista para campos indexables/únicos (e.g. teléfono_whatsapp)
 * Permite búsquedas directas en WHERE sin exponer el dato en texto claro en disco
 * Formato: enc_det$IV_HEX$AUTHTAG_HEX$CIPHERTEXT_HEX
 */
export function encryptDeterministic(plaintext) {
  if (!plaintext || typeof plaintext !== 'string') return plaintext;
  if (plaintext.startsWith('enc_det$')) return plaintext;

  try {
    const iv = crypto.createHmac('sha256', AES_KEY).update(plaintext).digest().subarray(0, 12);
    const cipher = crypto.createCipheriv('aes-256-gcm', AES_KEY, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    return `enc_det$${iv.toString('hex')}$${authTag}$${encrypted}`;
  } catch (err) {
    console.error('[Crypto] Error en cifrado determinista:', err);
    return plaintext;
  }
}

/**
 * Descifra una cadena previamente cifrada con AES-256-GCM (soporta enc$ y enc_det$)
 */
export function decryptField(ciphertext) {
  if (!ciphertext || typeof ciphertext !== 'string') return ciphertext;
  if (!ciphertext.startsWith('enc$') && !ciphertext.startsWith('enc_det$')) return ciphertext; // Texto plano legado

  try {
    const parts = ciphertext.split('$');
    if (parts.length !== 4) return ciphertext;

    const iv = Buffer.from(parts[1], 'hex');
    const authTag = Buffer.from(parts[2], 'hex');
    const encryptedHex = parts[3];

    const decipher = crypto.createDecipheriv('aes-256-gcm', AES_KEY, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('[Crypto] Error descifrando campo:', err);
    return '[DATO PROTEGIDO]';
  }
}

/**
 * 3. GESTIÓN CRIPTOGRÁFICA DE TOKENS DE SESIÓN (HMAC-SHA256)
 * Cumple con directrices de auditoría SecOps (Gilfoyle Standards):
 * Tokens firmados con tiempo de expiración y verificación timing-safe
 */

/**
 * Genera un token de sesión criptográficamente firmado
 * @param {Object} user 
 * @param {number} expiresInMs 
 * @returns {string} token firmado
 */
export function generateSessionToken(user, expiresInMs = 2 * 60 * 60 * 1000) {
  const payload = {
    id_usuario: user.id_usuario,
    username: user.username,
    rol: user.rol,
    exp: Date.now() + expiresInMs
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const hmac = crypto.createHmac('sha256', AES_KEY);
  hmac.update(payloadB64);
  const signature = hmac.digest('base64url');
  return `sm_sec_${payloadB64}.${signature}`;
}

/**
 * Valida la firma y vigencia de un token de sesión
 * @param {string} token 
 * @returns {Object|null} Payload si es válido, null si expiró o fue adulterado
 */
export function verifySessionToken(token) {
  if (!token || typeof token !== 'string') return null;

  

  if (!token.startsWith('sm_sec_')) return null;

  const raw = token.slice(7);
  const parts = raw.split('.');
  if (parts.length !== 2) return null;

  const [payloadB64, signature] = parts;
  const hmac = crypto.createHmac('sha256', AES_KEY);
  hmac.update(payloadB64);
  const expectedSig = hmac.digest('base64url');

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSig);

  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (Date.now() > payload.exp) return null; // Token expirado
    return payload;
  } catch {
    return null;
  }
}

