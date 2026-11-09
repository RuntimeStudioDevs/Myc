/**
 * Utilidades para normalización, ortografía y formateo de texto en campos de entrada.
 */

// Siglas corporativas y comerciales comunes en Colombia que deben preservarse en mayúsculas
const KNOWN_ACRONYMS = new Set([
  'S.A.',
  'S.A.S.',
  'S.A.S',
  'S.A',
  'LTDA',
  'LTDA.',
  'E.U.',
  'E.U',
  'NIT',
  'C.C.',
  'C.C',
  'M&C',
  'I.V.A.',
  'IVA',
  'AIU',
  'A.I.U.',
  'D.C.',
  'D.C',
]);

/**
 * Normaliza una cadena a Unicode NFC y limpia espacios duplicados o en los extremos.
 */
export function cleanWhitespace(str: string | undefined | null): string {
  if (!str) return '';
  return str.normalize('NFC').replace(/\s+/g, ' ').trim();
}

/**
 * Capitaliza la primera letra de cada palabra manteniendo siglas corporativas en mayúsculas y acentos UTF-8.
 * Ideal para: Nombres de clientes, proyectos, ubicaciones, personas, cargos y ciudades.
 * Ejemplo: "constructora bolívar s.a.s." -> "Constructora Bolívar S.A.S."
 */
export function toProperCase(str: string | undefined | null): string {
  const cleaned = cleanWhitespace(str);
  if (!cleaned) return '';

  return cleaned
    .split(' ')
    .map((word) => {
      const upperWord = word.toUpperCase();
      if (KNOWN_ACRONYMS.has(upperWord)) {
        return upperWord;
      }

      // Si la palabra contiene números o símbolos especiales (ej. #, 60x60, 120-10, Carrera 43A)
      if (/^[0-9#\-_]/.test(word)) {
        return word;
      }

      // Capitalizar la primera letra y pasar el resto a minúsculas respetando UTF-8
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

/**
 * Asegura que la primera letra tras el inicio o tras un signo de puntuación (. ! ? \n) esté en mayúscula.
 * Ideal para: Descripciones de actividades, notas comerciales y resúmenes ejecutivos.
 * Ejemplo: "demolición de muros. retiro de escombros." -> "Demolición de muros. Retiro de escombros."
 */
export function toSentenceCase(str: string | undefined | null): string {
  if (!str) return '';

  const normalized = str.normalize('NFC');
  const trimmed = normalized
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .trim();

  if (!trimmed) return '';

  // Regex para detectar el inicio del texto o caracteres tras punto, exclamación, interrogación o salto de línea
  return trimmed.replace(
    /(^\s*|[.!?\n]\s+)([a-záéíóúüñ])/gi,
    (_, prefix, char) => `${prefix}${char.toUpperCase()}`
  );
}
