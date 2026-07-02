// src/utils/sanitizer.js

/**
 * ============================================================
 * PATRONES DE DETECCIÓN UNIVERSALES (Fuera de archivos .env)
 * ============================================================
 */
const URL_PATTERN = /https?:\/\/[^\s"'<>\[\]{}()]+/gi;
const API_PARAM_PATTERN = /\?[a-zA-Z0-9_]+=[^&\s"'<>]+(&[a-zA-Z0-9_]+=[^&\s"'<>]+)*/gi;
const API_KEY_PATTERN = /\b(api[_-]?key|apikey|token|secret|password|passwd|pwd|auth|authorization|bearer)\s*[:=]\s*["']?([^"'\s,}#]+)["']?/gi;
const JWT_PATTERN = /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g;
const IP_PATTERN = /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g;
const EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
const HASH_PATTERN = /\b[a-fA-F0-9]{32,64}\b/g;
const DB_CONNECTION_PATTERN = /(?:mongodb|mysql|postgresql|redis|database|db|postgres)\s*[:=]\s*["']?(?!(?:image|container_name|ports|volumes|build|environment|restart)\b)([^"'\s,}]+)["']?/gi;
const GETENV_PATTERN = /(?:os\.getenv|os\.environ\.get|process\.env|System\.getenv|getenv|env\.get)\s*\(\s*["']([^"']+)["'](?:\s*,\s*["']([^"']*)["'])?\s*\)/gi;
const CREDENTIALS_PATTERN = /[a-zA-Z0-9._%+-]+:[^@\s]+@/gi;

/**
 * UTILERÍA PARA SEGUIMIENTO DE LÍNEAS ORIGINALES
 */
function getLineNumber(texto, index) {
  return (texto.substring(0, index).match(/\n/g) || []).length + 1;
}

/**
 * ============================================================
 * FUNCIÓN PRINCIPAL CON MÁQUINA DE ESTADOS por ARCHIVO
 * ============================================================
 */
export function sanitizeText(textoOriginal) {
  if (!textoOriginal || typeof textoOriginal !== 'string') {
    return { sanitizedText: '', findings: [], totalFindings: 0, envVars: [] };
  }

  console.time('sanitizeText');
  
  const lineas = textoOriginal.split('\n');
  const allFindings = [];
  const envVarsFound = new Set();
  
  let enArchivoDeEntorno = false;
  let archivoActual = 'unknown';

  // Expresión regular para detectar el encabezado de tus archivos
  // Ej: ARCHIVO: back\services\dispatcher.py o ARCHIVO: .env.production
  const headerPattern = /^ARCHIVO:\s*(.+)$/i;

  const lineasProcesadas = lineas.map((linea, index) => {
    const numLinea = index + 1;
    const lineaTrim = linea.trim();

    // 1. CONTROL DE ESTADO: Detectar cambio de archivo
    if (lineaTrim.startsWith('ARCHIVO:')) {
      const match = headerPattern.exec(lineaTrim.replace(/=/g, '').trim());
      if (match) {
        archivoActual = match[1].trim();
        // Se activa si el archivo contiene ".env" en cualquier parte de su nombre
        enArchivoDeEntorno = archivoActual.toLowerCase().includes('.env');
      }
      return linea; // Los encabezados se dejan intactos
    }

    // Ignorar líneas decorativas de separadores de archivos o comentarios puros
    if (lineaTrim.startsWith('===') || lineaTrim.startsWith('#') || lineaTrim.startsWith('//')) {
      return linea;
    }

    // ============================================================
    // MODO A: Estamos dentro de un archivo de entorno (.env)
    // Regla Absoluta: Reemplazar TODOS los valores de las asignaciones
    // ============================================================
    if (enArchivoDeEntorno) {
      // Estructura clásica CLAVE=valor (ignorando flags case-insensitive para mantener robustez)
      const envMatch = /^([a-zA-Z0-9_]+)\s*=\s*(["']?)(.*?)\2$/.exec(lineaTrim);
      if (envMatch) {
        const varName = envMatch[1];
        const quote = envMatch[2];
        const varValue = envMatch[3];

        // Ignorar controles lógicos obvios que no exponen nada
        if (varValue.match(/^(true|false|none|null|undefined)$/i)) {
          return linea;
        }

        envVarsFound.add(varName);
        const replacement = quote ? `${varName}=${quote}**${varName}**${quote}` : `${varName}=**${varName}**`;

        allFindings.push({
          type: 'envDeclaration',
          original: lineaTrim,
          replacement: replacement,
          line: numLinea,
          varName: varName,
          file: archivoActual
        });
        return replacement;
      }
      return linea;
    }

    // ============================================================
    // MODO B: Estamos en cualquier otro archivo (Código, Docker, etc.)
    // Aplicamos solo sanitizaciones quirúrgicas específicas
    // ============================================================
    let lineaSanitizada = linea;

    // B.1 Manejo de os.getenv / process.env fallbacks en código
    lineaSanitizada = lineaSanitizada.replace(GETENV_PATTERN, (fullMatch, varName, defaultValue) => {
      envVarsFound.add(varName);
      if (defaultValue !== undefined && defaultValue !== '' && !defaultValue.match(/^(true|false|none|null|undefined)$/i)) {
        const replacement = fullMatch.replace(defaultValue, `**${varName}_DEFAULT**`);
        allFindings.push({ type: 'envLoaded', original: fullMatch, replacement: replacement, line: numLinea, varName, file: archivoActual });
        return replacement;
      }
      return fullMatch;
    });

    // B.2 URLs
    lineaSanitizada = lineaSanitizada.replace(URL_PATTERN, (fullMatch) => {
      if (fullMatch.includes('**')) return fullMatch;
      allFindings.push({ type: 'url', original: fullMatch, replacement: '**URL**', line: numLinea, file: archivoActual });
      return '**URL**';
    });

    // B.3 Parámetros de API
    lineaSanitizada = lineaSanitizada.replace(API_PARAM_PATTERN, (fullMatch) => {
      if (fullMatch.includes('**')) return fullMatch;
      allFindings.push({ type: 'apiParam', original: fullMatch, replacement: '**PARAMS**', line: numLinea, file: archivoActual });
      return '**PARAMS**';
    });

    // B.4 Claves explícitas en código (api_key = "...")
    lineaSanitizada = lineaSanitizada.replace(API_KEY_PATTERN, (fullMatch, name, value) => {
      if (fullMatch.includes('**') || value.match(/^(true|false|none|null|undefined)$/i)) return fullMatch;
      const replacement = fullMatch.replace(value, `**${name.toUpperCase()}**`);
      allFindings.push({ type: 'apiKey', original: fullMatch, replacement, line: numLinea, file: archivoActual });
      return replacement;
    });

    // B.5 JWT Tokens
    lineaSanitizada = lineaSanitizada.replace(JWT_PATTERN, (fullMatch) => {
      allFindings.push({ type: 'jwt', original: fullMatch, replacement: '**JWT_TOKEN**', line: numLinea, file: archivoActual });
      return '**JWT_TOKEN**';
    });

    // B.6 IPs
    lineaSanitizada = lineaSanitizada.replace(IP_PATTERN, (fullMatch) => {
      if (fullMatch.match(/^20\d{2}/) || fullMatch.includes('**')) return fullMatch;
      allFindings.push({ type: 'ip', original: fullMatch, replacement: '**IP**', line: numLinea, file: archivoActual });
      return '**IP**';
    });

    // B.7 Emails
    lineaSanitizada = lineaSanitizada.replace(EMAIL_PATTERN, (fullMatch) => {
      if (fullMatch.includes('**')) return fullMatch;
      allFindings.push({ type: 'email', original: fullMatch, replacement: '**EMAIL**', line: numLinea, file: archivoActual });
      return '**EMAIL**';
    });

    // B.8 Hashes complejos
    lineaSanitizada = lineaSanitizada.replace(HASH_PATTERN, (fullMatch) => {
      if (fullMatch.includes('**')) return fullMatch;
      if (fullMatch.match(/^[a-fA-F]{32,64}$/)) {
        const vowels = (fullMatch.match(/[aeiouAEIOU]/g) || []).length;
        if (vowels > 8) return fullMatch;
      }
      allFindings.push({ type: 'hash', original: fullMatch, replacement: '**HASH**', line: numLinea, file: archivoActual });
      return '**HASH**';
    });

    // B.9 Conexiones a DB genéricas (Ignorando infraestructura Docker/YAML)
    lineaSanitizada = lineaSanitizada.replace(DB_CONNECTION_PATTERN, (fullMatch, value) => {
      if (fullMatch.includes('**')) return fullMatch;
      const replacement = fullMatch.replace(value, '**DB_CONNECTION**');
      allFindings.push({ type: 'dbConnection', original: fullMatch, replacement, line: numLinea, file: archivoActual });
      return replacement;
    });

    // B.10 Credenciales explícitas en cadenas de texto (user:pass@)
    lineaSanitizada = lineaSanitizada.replace(CREDENTIALS_PATTERN, (fullMatch) => {
      if (fullMatch.includes('**')) return fullMatch;
      allFindings.push({ type: 'credentials', original: fullMatch, replacement: '**CREDENTIALS**', line: numLinea, file: archivoActual });
      return '**CREDENTIALS**';
    });

    return lineaSanitizada;
  });

  const sanitizedText = lineasProcesadas.join('\n');

  // Filtrar duplicados exactos por línea y archivo
  const uniqueFindings = allFindings.filter((f, index, self) => 
    index === self.findIndex((t) => t.original === f.original && t.line === f.line && t.file === f.file)
  );

  console.timeEnd('sanitizeText');

  return {
    sanitizedText: sanitizedText,
    findings: uniqueFindings,
    totalFindings: uniqueFindings.length,
    envVars: Array.from(envVarsFound)
  };
}

export default sanitizeText;