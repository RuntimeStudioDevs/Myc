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
 * Limpia espacios repetidos y elimina espacios en blanco al inicio o al final.
 */
export function cleanWhitespace(str: string | undefined | null): string {
  if (!str) return '';
  return str.replace(/\s+/g, ' ').trim();
}

/**
 * Capitaliza la primera letra de cada palabra manteniendo siglas corporativas en mayúsculas.
 * Ideal para: Nombres de clientes, proyectos, ubicaciones, personas, cargos y ciudades.
 * Ejemplo: "constructora bolivar s.a." -> "Constructora Bolivar S.A."
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

      // Si la palabra contiene números o símbolos especiales (ej. #, 60x60, 120-10)
      if (/^[0-9#\-_]/.test(word)) {
        return word;
      }

      // Capitalizar la primera letra y pasar el resto a minúsculas
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

/**
 * Asegura que la primera letra tras el inicio o tras un signo de puntuación (. ! ? \n)
 * esté en mayúscula.
 * Ideal para: Descripciones de actividades, notas comerciales y resúmenes ejecutivos.
 * Ejemplo: "demolicion de muros. retiro de escombros." -> "Demolicion de muros. Retiro de escombros."
 */
export function toSentenceCase(str: string | undefined | null): string {
  if (!str) return '';

  // Limpiar espacios pero conservar saltos de línea
  const trimmed = str
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .trim();

  if (!trimmed) return '';

  // Regex para detectar el inicio del texto o caracteres tras punto, exclamación, interrogación o salto de línea
  return trimmed.replace(
    /(^\s*|[.!?\n]\s+)([a-záéíóúüñ])/g,
    (_, prefix, char) => `${prefix}${char.toUpperCase()}`
  );
}
