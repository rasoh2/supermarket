/**
 * src/react/utils/inputSanitizer.js
 * Utilidades de validación y sanitización WAF para formularios en React
 */

export const SANTIAGO_COMUNAS = [
  'Alhué', 'Buin', 'Calera de Tango', 'Cerrillos', 'Cerro Navia', 'Colina', 'Conchalí', 
  'Curacaví', 'El Bosque', 'El Monte', 'Estación Central', 'Huechuraba', 'Independencia', 
  'Isla de Maipo', 'La Cisterna', 'La Florida', 'La Granja', 'La Pintana', 'La Reina', 
  'Lampa', 'Las Condes', 'Lo Barnechea', 'Lo Espejo', 'Lo Prado', 'Macul', 'Maipú', 
  'María Pinto', 'Melipilla', 'Ñuñoa', 'Padre Hurtado', 'Paine', 'Pedro Aguirre Cerda', 
  'Peñaflor', 'Peñalolén', 'Pirque', 'Providencia', 'Pudahuel', 'Puente Alto', 'Quilicura', 
  'Quinta Normal', 'Recoleta', 'Renca', 'San Bernardo', 'San Joaquín', 'San José de Maipo', 
  'San Miguel', 'San Pedro', 'San Ramón', 'Santiago Centro', 'Talagante', 'Til Til', 'Vitacura'
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
