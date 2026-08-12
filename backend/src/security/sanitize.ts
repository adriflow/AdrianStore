// Sanitiza texto plano eliminando cualquier marcado HTML/script.
// Evita XSS almacenado: nada que llegue a la base de datos puede contener HTML.
export function sanitizeText(value: unknown, maxLength = 5000): string {
  let text = String(value ?? '');
  // Elimina bloques completos de script/style (incluyendo su contenido)
  text = text.replace(/<\s*(script|style)\b[\s\S]*?<\s*\/\s*(script|style)\s*>/gi, ' ');
  text = text.replace(/<\s*(script|style)\b[\s\S]*?>/gi, ' ');
  // Elimina cualquier otra etiqueta HTML y caracteres de marcado residuales
  text = text.replace(/<[^>]*>/g, '');
  text = text.replace(/[<>]/g, '');
  // Quita caracteres de control no imprimibles
  text = text.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '');
  // Elimina protocolos peligrosos tipo "javascript:"
  text = text.replace(/\bjavascript\s*:/gi, ' ');
  text = text.trim();
  if (maxLength > 0 && text.length > maxLength) {
    text = text.slice(0, maxLength);
  }
  return text;
}

// Deja solo dígitos y el prefijo "+" en números de teléfono.
export function sanitizePhone(value: unknown): string {
  return String(value ?? '').replace(/[^0-9+]/g, '');
}
