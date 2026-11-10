/**
 * orthography-corrector.ts
 * Motor especializado de normalización ortográfica, acentuación, puntuación y unidades
 * para ingeniería civil y construcción de M&C CONSTRUCCIONES CIVILES S.A.S.
 * 
 * Diseñado con enfoque dual:
 * 1. Corrección pasiva no invasiva en onBlur (0 saltos de cursor, 0 conflictos con IMEs móviles).
 * 2. Pulido explícito con 'Varita Mágica' ✨ para textos y descripciones completas.
 */

import { toSentenceCase } from './text-formatter';

// Siglas corporativas y técnicas que deben mantenerse siempre en MAYÚSCULAS
const PROTECTED_ACRONYMS = new Set([
  'S.A.S.',
  'S.A.S',
  'S.A.',
  'LTDA',
  'E.U.',
  'NIT',
  'C.C.',
  'C.C',
  'M&C',
  'IVA',
  'AIU',
  'A.I.U.',
  'PVC',
  'CPVC',
  'PVA',
  'PPR',
  'PEAD',
  'PSI',
  'MPA',
  'ASTM',
  'NTC',
  'NSR-10',
  'LED',
  'IP65',
  'IP67',
  'IP68',
  'RETIE',
  'RETILAP',
  'POT',
]);

// Diccionario exhaustivo de pares [sin tilde o común] -> [con tilde correcta]
// Todas las claves en minúsculas sin tilde
const LEXICON_MAP: Record<string, string> = {
  // Procesos y actividades (-ción, -sión, -ía)
  'instalacion': 'instalación',
  'instalaciones': 'instalaciones',
  'adecuacion': 'adecuación',
  'adecuaciones': 'adecuaciones',
  'demolicion': 'demolición',
  'demoliciones': 'demoliciones',
  'excavacion': 'excavación',
  'excavaciones': 'excavaciones',
  'construccion': 'construcción',
  'construcciones': 'construcciones',
  'cimentacion': 'cimentación',
  'cimentaciones': 'cimentaciones',
  'impermeabilizacion': 'impermeabilización',
  'impermeabilizaciones': 'impermeabilizaciones',
  'fundicion': 'fundición',
  'fundiciones': 'fundiciones',
  'remodelacion': 'remodelación',
  'remodelaciones': 'remodelaciones',
  'pavimentacion': 'pavimentación',
  'pavimentaciones': 'pavimentaciones',
  'demarcacion': 'demarcación',
  'nivelacion': 'nivelación',
  'reparacion': 'reparación',
  'reparaciones': 'reparaciones',
  'restauracion': 'restauración',
  'fabricacion': 'fabricación',
  'aplicacion': 'aplicación',
  'perforacion': 'perforación',
  'canalizacion': 'canalización',
  'inyeccion': 'inyección',
  'ventilacion': 'ventilación',
  'climatizacion': 'climatización',
  'iluminacion': 'iluminación',
  'desinfeccion': 'desinfección',
  'urbanizacion': 'urbanización',
  'señalizacion': 'señalización',
  'localizacion': 'localización',
  'proteccion': 'protección',
  'inspeccion': 'inspección',
  'reposicion': 'reposición',
  'disposicion': 'disposición',
  'colocacion': 'colocación',
  'fijacion': 'fijación',
  'revision': 'revisión',
  'supervision': 'supervisión',
  'provision': 'provisión',
  'modulacion': 'modulación',
  'compactacion': 'compactación',
  'sustitucion': 'sustitución',
  'evacuacion': 'evacuación',
  'habilitacion': 'habilitación',
  'modificacion': 'modificación',
  'verificacion': 'verificación',
  'certificacion': 'certificación',
  'especificacion': 'especificación',
  'especificaciones': 'especificaciones',
  'descripcion': 'descripción',
  'descripciones': 'descripciones',
  'cotizacion': 'cotización',
  'cotizaciones': 'cotizaciones',
  'informacion': 'información',
  'autorizacion': 'autorización',
  'aprobacion': 'aprobación',
  'adjudicacion': 'adjudicación',
  'liquidacion': 'liquidación',
  'facturacion': 'facturación',
  'retencion': 'retención',
  'administracion': 'administración',
  'programacion': 'programación',
  'coordinacion': 'coordinación',
  'iniciacion': 'iniciación',
  'finalizacion': 'finalización',
  'terminacion': 'terminación',
  'suspension': 'suspensión',
  'ampliacion': 'ampliación',
  'conexion': 'conexión',
  'conexiones': 'conexiones',
  'distribucion': 'distribución',

  // Especialidades de obra (-ía)
  'mamposteria': 'mampostería',
  'tuberia': 'tubería',
  'tuberias': 'tuberías',
  'cerrajeria': 'cerrajería',
  'carpinteria': 'carpintería',
  'albañileria': 'albañilería',
  'fontaneria': 'fontanería',
  'griferia': 'grifería',
  'paneleria': 'panelería',
  'tabiqueria': 'tabiquería',
  'ferreteria': 'ferretería',
  'vidrieria': 'vidriería',
  'ingenieria': 'ingeniería',
  'geologia': 'geología',
  'topografia': 'topografía',
  'auditoria': 'auditoría',
  'consultoria': 'consultoría',
  'interventoria': 'interventoría',
  'asesoria': 'asesoría',
  'garantia': 'garantía',
  'garantias': 'garantías',
  'energia': 'energía',
  'vias': 'vías',

  // Adjetivos técnicos (-ico / -ica)
  'electrico': 'eléctrico',
  'electrica': 'eléctrica',
  'electricos': 'eléctricos',
  'electricas': 'eléctricas',
  'hidraulico': 'hidráulico',
  'hidraulica': 'hidráulica',
  'hidraulicos': 'hidráulicos',
  'hidraulicas': 'hidráulicas',
  'mecanico': 'mecánico',
  'mecanica': 'mecánica',
  'mecanicos': 'mecánicos',
  'mecanicas': 'mecánicas',
  'metalico': 'metálico',
  'metalica': 'metálica',
  'metalicos': 'metálicos',
  'metalicas': 'metálicas',
  'acrilico': 'acrílico',
  'acrilica': 'acrílica',
  'acrilicos': 'acrílicos',
  'acrilicas': 'acrílicas',
  'ceramico': 'cerámico',
  'ceramica': 'cerámica',
  'ceramicos': 'cerámicos',
  'ceramicas': 'cerámicas',
  'sintetico': 'sintético',
  'sintetica': 'sintética',
  'termico': 'térmico',
  'termica': 'térmica',
  'acustico': 'acústico',
  'acustica': 'acústica',
  'optico': 'óptico',
  'optica': 'óptica',
  'plastico': 'plástico',
  'plastica': 'plástica',
  'plasticos': 'plásticos',
  'plasticas': 'plásticas',
  'estetico': 'estético',
  'estetica': 'estética',
  'geotecnico': 'geotécnico',
  'geotecnica': 'geotécnica',
  'quimico': 'químico',
  'quimica': 'química',
  'organico': 'orgánico',
  'organica': 'orgánica',
  'fisico': 'físico',
  'fisica': 'física',
  'analitico': 'analítico',
  'analitica': 'analítica',
  'epoxico': 'epóxico',
  'epoxica': 'epóxica',
  'asfaltico': 'asfáltico',
  'asfaltica': 'asfáltica',
  'tecnico': 'técnico',
  'tecnica': 'técnica',
  'tecnicos': 'técnicos',
  'tecnicas': 'técnicas',

  // Términos y elementos de obra
  'hormigon': 'hormigón',
  'volumen': 'volumen',
  'area': 'área',
  'areas': 'áreas',
  'limite': 'límite',
  'limites': 'límites',
  'diametro': 'diámetro',
  'diametros': 'diámetros',
  'perimetro': 'perímetro',
  'angulo': 'ángulo',
  'angulos': 'ángulos',
  'modulo': 'módulo',
  'modulos': 'módulos',
  'calculo': 'cálculo',
  'calculos': 'cálculos',
  'sifon': 'sifón',
  'sifones': 'sifones',
  'valvula': 'válvula',
  'valvulas': 'válvulas',
  'desague': 'desagüe',
  'desagues': 'desagües',
  'deposito': 'depósito',
  'depositos': 'depósitos',
  'camara': 'cámara',
  'camaras': 'cámaras',
  'estandar': 'estándar',
  'estandares': 'estándares',
  'poliza': 'póliza',
  'polizas': 'pólizas',
  'boveda': 'bóveda',
  'sotano': 'sótano',
  'sotanos': 'sótanos',
  'linea': 'línea',
  'lineas': 'líneas',
  'anden': 'andén',
  'andenes': 'andenes',
  'adoquin': 'adoquín',
  'adoquines': 'adoquines',
  'cordon': 'cordón',
  'cordones': 'cordones',
  'porton': 'portón',
  'portones': 'portones',
  'panete': 'pañete',
  'panetes': 'pañetes',
  'banos': 'baños',
  'bano': 'baño',
  'diseno': 'diseño',
  'disenos': 'diseños',
  'tamano': 'tamaño',
  'tamanos': 'tamaños',
  'canon': 'canon',
  'articulos': 'artículos',
  'articulo': 'artículo',
  'numero': 'número',
  'numeros': 'números',
  'maximo': 'máximo',
  'minimo': 'mínimo',
  'optimo': 'óptimo',
  'codigo': 'código',
  'comun': 'común',
  'segun': 'según',
  'ademas': 'además',
  'tambien': 'también',
  'despues': 'después',
  'mas': 'más',

  // Ciudades y regiones colombianas frecuentes en obras
  'medellin': 'medellín',
  'bogota': 'bogotá',
  'monteria': 'montería',
  'itagui': 'itagüí',
  'ibague': 'ibagué',
  'popayan': 'popayán',
  'quibdo': 'quibdó',
};

/**
 * Aplica el patrón de mayúsculas original a la palabra corregida:
 * - Si venía "INSTALACION" -> "INSTALACIÓN"
 * - Si venía "Instalacion" -> "Instalación"
 * - Si venía "instalacion" -> "instalación"
 */
function preserveCasing(originalWord: string, replacement: string): string {
  if (originalWord === originalWord.toUpperCase()) {
    return replacement.toUpperCase();
  }
  if (originalWord.charAt(0) === originalWord.charAt(0).toUpperCase()) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }
  return replacement.toLowerCase();
}

/**
 * Normaliza unidades de ingeniería civil respetando símbolos matemáticos:
 * - m2, mt2 -> m²
 * - m3, mt3 -> m³
 * - mts -> m
 * - pulg -> pulg.
 * - psi -> PSI
 */
export function normalizeEngineeringUnits(text: string): { text: string; changes: number } {
  let result = text;
  let changes = 0;

  // 1. Unidades de área m²
  result = result.replace(/(\b\d+(?:[.,]\d+)?)\s*(?:m2|mt2|mts2)\b/gi, (_, num) => {
    changes++;
    return `${num} m²`;
  });
  result = result.replace(/\b(?:m2|mt2|mts2)\b/gi, () => {
    changes++;
    return 'm²';
  });

  // 2. Unidades de volumen m³
  result = result.replace(/(\b\d+(?:[.,]\d+)?)\s*(?:m3|mt3|mts3)\b/gi, (_, num) => {
    changes++;
    return `${num} m³`;
  });
  result = result.replace(/\b(?:m3|mt3|mts3)\b/gi, () => {
    changes++;
    return 'm³';
  });

  // 3. Unidades lineales ml / m
  result = result.replace(/(\b\d+(?:[.,]\d+)?)\s*(?:mts|metros)\b/gi, (_, num) => {
    changes++;
    return `${num} m`;
  });

  // 4. Presión PSI en mayúsculas
  result = result.replace(/(\b\d+)\s*psi\b/gi, (_, num) => {
    changes++;
    return `${num} PSI`;
  });

  // 5. Abreviaturas con punto
  result = result.replace(/\b(pulg|und|glb)\b(?!\.)/gi, (_, unit) => {
    changes++;
    return `${unit.toLowerCase()}.`;
  });

  return { text: result, changes };
}

/**
 * Corrige un texto técnico completo (descripciones, partidas, notas comerciales):
 * - Normaliza acentos léxicos especializados
 * - Respeta fracciones ("1/2\"", "3/4\""), acrónimos ("PVC", "AIU") y medidas ("3000 PSI")
 * - Normaliza unidades técnicas ("m²", "m³", "ml")
 * - Aplica mayúsculas tras punto
 * - Coloca punto final si es una oración completa y no lo tiene
 */
export function correctConstructionText(
  rawText: string | undefined | null,
  options: { ensureEndingPeriod?: boolean } = { ensureEndingPeriod: true }
): { corrected: string; changesCount: number } {
  if (!rawText || !rawText.trim()) {
    return { corrected: '', changesCount: 0 };
  }

  let text = rawText.normalize('NFC');
  let changesCount = 0;

  // 1. Normalización de unidades primero
  const unitResult = normalizeEngineeringUnits(text);
  text = unitResult.text;
  changesCount += unitResult.changes;

  // 2. Reemplazo de palabras del léxico especializado respetando límites de palabra
  // Excluimos secuencias numéricas o que contengan / o " (ej: 1/2", 3/4")
  text = text.replace(/([A-Za-záéíóúüñÁÉÍÓÚÜÑ]+)/g, (token) => {
    const upperToken = token.toUpperCase();
    if (PROTECTED_ACRONYMS.has(upperToken)) {
      if (token !== upperToken) {
        changesCount++;
        return upperToken;
      }
      return token;
    }

    const lower = token.toLowerCase();
    const correctWord = LEXICON_MAP[lower];
    if (correctWord && correctWord !== lower) {
      changesCount++;
      return preserveCasing(token, correctWord);
    }

    return token;
  });

  // 3. Normalizar espacios duplicados
  const normalizedSpaces = text
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .trim();

  if (normalizedSpaces !== text) {
    text = normalizedSpaces;
    changesCount++;
  }

  // 4. Aplicar mayúsculas al inicio y tras signos de puntuación (. ! ? \n)
  text = toSentenceCase(text);

  // 5. Asegurar punto final en descripciones si no termina en punto, dos puntos o interrogación
  if (options.ensureEndingPeriod && text.length > 3) {
    const lastChar = text.slice(-1);
    if (!['.', ':', ';', '!', '?', ')'].includes(lastChar)) {
      text += '.';
      changesCount++;
    }
  }

  return {
    corrected: text,
    changesCount,
  };
}

/**
 * Corrige el Nombre del Proyecto con formato de título formal:
 * - Aplica tildes de obra civil (Construcción, Remodelación, Adecuación)
 * - Capitaliza cada palabra clave manteniendo siglas como S.A.S. o PVC
 * - No añade punto final (los nombres de proyectos no llevan punto)
 */
export function correctProjectName(rawText: string | undefined | null): string {
  if (!rawText || !rawText.trim()) return '';

  const { corrected } = correctConstructionText(rawText, { ensureEndingPeriod: false });

  // Convertir a Title Case respetando tildes y siglas
  return corrected
    .split(' ')
    .map((word) => {
      const upper = word.toUpperCase();
      if (PROTECTED_ACRONYMS.has(upper)) return upper;

      // Palabras cortas conectoras en minúscula si no son la primera
      const lower = word.toLowerCase();
      const connectors = new Set(['de', 'del', 'en', 'y', 'para', 'con', 'por', 'a', 'e', 'o', 'u']);
      if (connectors.has(lower)) {
        return lower;
      }

      // Si empieza con número o caracteres especiales
      if (/^[0-9#\-_]/.test(word)) return word;

      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ')
    // Asegurar que la primera letra del proyecto siempre sea Mayúscula
    .replace(/^\w/, (c) => c.toUpperCase());
}

/**
 * Corrige las condiciones de pago y notas comerciales:
 * - Asegura tildes y mayúsculas tras punto
 * - Coloca punto final
 */
export function correctCommercialNotes(rawText: string | undefined | null): string {
  return correctConstructionText(rawText, { ensureEndingPeriod: true }).corrected;
}
