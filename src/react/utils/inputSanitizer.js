/**
 * src/react/utils/inputSanitizer.js
 * Utilidades de validación y sanitización WAF para formularios en React
 */

export const SANTIAGO_COMUNAS = [
  'Santiago Centro', 'Cerrillos', 'Cerro Navia', 'Conchalí', 'El Bosque',
  'Estación Central', 'Huechuraba', 'Independencia', 'La Cisterna', 'La Florida',
  'La Granja', 'La Pintana', 'La Reina', 'Las Condes', 'Lo Barnechea',
  'Lo Espejo', 'Lo Prado', 'Macul', 'Maipú', 'Ñuñoa', 'Pedro Aguirre Cerda',
  'Peñalolén', 'Providencia', 'Pudahuel', 'Quilicura', 'Quinta Normal',
  'Recoleta', 'Renca', 'San Joaquín', 'San Miguel', 'San Ramón', 'Vitacura',
  'Puente Alto', 'San Bernardo', 'Padre Hurtado', 'Lampa', 'Colina'
].sort();

export function inspectAndSanitize(input, fieldName = 'campo') {
  if (typeof input !== 'string') return { isClean: true, sanitized: input };

  const trimmed = input.trim();

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
    if (pattern.test(trimmed)) {
      return {
        isClean: false,
        error: `El campo ${fieldName} contiene caracteres o scripts no autorizados (XSS).`,
        sanitized: ''
      };
    }
  }

  // Patrones SQL Injection
  const sqliPatterns = [
    /('|\b)(OR|AND)\b.+?=.+?/gi,
    /UNION\s+(ALL\s+)?SELECT/gi,
    /DROP\s+TABLE/gi,
    /INSERT\s+INTO/gi,
    /--/g,
    /;\s*$/g
  ];

  for (const pattern of sqliPatterns) {
    if (pattern.test(trimmed)) {
      return {
        isClean: false,
        error: `El campo ${fieldName} contiene patrones no permitidos (SQLi).`,
        sanitized: ''
      };
    }
  }

  // Sanitización de caracteres html
  const sanitized = trimmed
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');

  return { isClean: true, sanitized };
}
