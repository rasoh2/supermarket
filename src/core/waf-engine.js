/**
 * SuperMarket.cl - Motor de Seguridad Perimetral WAF y Rate Limiting
 * Implementa RNF-02, RF-12, RF-19 y directrices OWASP 2025
 */

import { db, TABLES } from './storage.js';

class WAFEngine {
  constructor() {
    this.rateLimitMap = new Map(); // ip/key -> { count, firstAttempt, lockedUntil }
    this.MAX_FAILED_ATTEMPTS = 15;
    this.RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutos
    this.LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutos
  }

  /**
   * Sanitiza un input de texto eliminando etiquetas peligrosas y caracteres de escape maliciosos
   */
  sanitize(input) {
    if (typeof input !== 'string') return input;
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Inspecciona una cadena en busca de patrones de ataque XSS o SQLi
   * @returns {Object} { isClean: boolean, threatType: string|null, pattern: string|null }
   */
  inspectInput(input, fieldName = 'input') {
    if (!input || typeof input !== 'string') return { isClean: true };

    // Patrones XSS
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /onerror\s*=/gi,
      /onload\s*=/gi,
      /onclick\s*=/gi,
      /<iframe\b/gi,
      /eval\s*\(/gi
    ];

    for (const pattern of xssPatterns) {
      if (pattern.test(input)) {
        this.logSecurityIncident('WAF_XSS_ATTEMPT_BLOCKED', 'CRITICAL', {
          field: fieldName,
          sample: input.substring(0, 100),
          pattern: pattern.toString()
        });
        return { isClean: false, threatType: 'XSS', reason: 'Patrón de Cross-Site Scripting detectado por WAF.' };
      }
    }

    // Patrones SQL Injection
    const sqliPatterns = [
      /('|\b)(OR|AND)\b.+?=.+?/gi,
      /UNION(\s+ALL)?\s+SELECT/gi,
      /DROP\s+TABLE/gi,
      /INSERT\s+INTO/gi,
      /DELETE\s+FROM/gi,
      /--\s*$/gm,
      /;\s*SHUTDOWN/gi
    ];

    for (const pattern of sqliPatterns) {
      if (pattern.test(input)) {
        this.logSecurityIncident('WAF_SQLI_ATTEMPT_BLOCKED', 'CRITICAL', {
          field: fieldName,
          sample: input.substring(0, 100),
          pattern: pattern.toString()
        });
        return { isClean: false, threatType: 'SQLi', reason: 'Patrón de Inyección SQL detectado por WAF.' };
      }
    }

    return { isClean: true };
  }

  /**
   * Verifica y controla los intentos fallidos contra fuerza bruta
   */
  checkRateLimit(key = 'client_default') {
    const now = Date.now();
    const record = this.rateLimitMap.get(key) || { count: 0, firstAttempt: now, lockedUntil: 0 };

    if (record.lockedUntil > now) {
      const remainingMinutes = Math.ceil((record.lockedUntil - now) / 60000);
      return {
        allowed: false,
        locked: true,
        remainingMinutes,
        message: `Acceso bloqueado preventivamente por ${remainingMinutes} min debido a múltiples intentos fallidos.`
      };
    }

    // Si la ventana expiró, reiniciar contador
    if (now - record.firstAttempt > this.RATE_LIMIT_WINDOW_MS) {
      record.count = 0;
      record.firstAttempt = now;
      record.lockedUntil = 0;
      this.rateLimitMap.set(key, record);
    }

    return { allowed: true, currentAttempts: record.count, maxAttempts: this.MAX_FAILED_ATTEMPTS };
  }

  recordFailedAttempt(key = 'client_default') {
    const now = Date.now();
    const record = this.rateLimitMap.get(key) || { count: 0, firstAttempt: now, lockedUntil: 0 };

    record.count++;
    if (record.count >= this.MAX_FAILED_ATTEMPTS) {
      record.lockedUntil = now + this.LOCKOUT_DURATION_MS;
      this.logSecurityIncident('AUTH_LOCKOUT_TRIGGERED', 'CRITICAL', {
        key,
        attempts: record.count,
        lockedMinutes: 15
      });
    } else {
      this.logSecurityIncident('AUTH_FAILED_ATTEMPT', 'WARNING', {
        key,
        attemptNumber: record.count,
        remaining: this.MAX_FAILED_ATTEMPTS - record.count
      });
    }

    this.rateLimitMap.set(key, record);
    return record;
  }

  recordSuccessfulAttempt(key = 'client_default') {
    this.rateLimitMap.delete(key);
  }

  logSecurityIncident(eventType, severity, detailsObj) {
    try {
      const logEntry = {
        id_log: db.getNextId(TABLES.LOG_SEGURIDAD_SIEM, 'id_log'),
        timestamp_utc: new Date().toISOString(),
        event_type: eventType,
        severity,
        ip_origen: '190.161.42.18', // Simulación IP Santiago RM
        user_agent: (typeof navigator !== 'undefined' && navigator.userAgent) || 'Mozilla/5.0 SuperMarket Client',
        details_payload: JSON.stringify(detailsObj),
        resuelto: severity === 'INFO'
      };

      db.insert(TABLES.LOG_SEGURIDAD_SIEM, logEntry);
      console.warn(`[SIEM LOG][${severity}] ${eventType}:`, detailsObj);
    } catch (e) {
      console.error('[WAFEngine] Error al asentar log SIEM:', e);
    }
  }
}

export const wafEngine = new WAFEngine();
