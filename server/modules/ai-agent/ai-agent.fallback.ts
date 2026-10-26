import { QuoteData } from './ai-agent.types';

export interface FallbackResult {
  reply: string;
  extractedQuote: QuoteData;
  missingFields: string[];
  isComplete: boolean;
}

/**
 * Extractor heurístico basado en expresiones regulares para funcionar
 * en entornos de desarrollo local o cuando la API Key de Gemini no esté configurada.
 */
export function fallbackExtractor(userMessage: string, current: QuoteData): FallbackResult {
  const updated = { ...current };
  const lower = userMessage.toLowerCase();

  // 1. Extraer nombre del cliente
  const clientMatch =
    userMessage.match(/(?:cliente|para|señor(?:es)?|empresa)\s*:\s*([^,\n]+)/i) ||
    userMessage.match(/(?:para|cliente)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)*)/);
  if (clientMatch && clientMatch[1]) {
    updated.clientName = clientMatch[1].trim();
  }

  // 2. Extraer nombre del proyecto u obra
  const projectMatch = userMessage.match(/(?:proyecto|obra|trabajo)\s*:\s*([^,\n]+)/i);
  if (projectMatch && projectMatch[1]) {
    updated.projectName = projectMatch[1].trim();
  }

  // 3. Extraer valores monetarios
  const moneyMatch =
    userMessage.match(/(?:\$|valor|por|precio|costo)\s*([0-9.,]+)\s*(?:millones?|mil(?:es)?|cop)?/i) ||
    userMessage.match(/([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?)/);

  if (moneyMatch && moneyMatch[1]) {
    const cleanNum = moneyMatch[1].replace(/\./g, '').replace(',', '.');
    let val = parseFloat(cleanNum);
    if (lower.includes('millon') || lower.includes('millones')) {
      if (val < 1000) val = val * 1000000;
    }
    if (!isNaN(val) && val > 0) {
      if (updated.items.length === 0) {
        updated.items = [{ id: '1', description: 'Obra civil y ejecución de proyecto', subtotal: val }];
      } else {
        updated.items[0].subtotal = val;
      }
    }
  }

  // 4. Extraer porcentajes de pago
  const pctMatch = userMessage.match(
    /(\d{1,2})%\s*(?:anticipo|iniciar|inicio)?.*?(\d{1,2})%\s*(?:final|entrega|terminar)?/i
  );
  if (pctMatch) {
    updated.startPct = parseInt(pctMatch[1], 10);
    updated.endPct = parseInt(pctMatch[2], 10);
  }

  // 5. Recalcular subtotales y totales
  const itemsSum = updated.items.reduce((acc, it) => acc + (Number(it.subtotal) || 0), 0);
  updated.subtotal = itemsSum;
  updated.total = itemsSum;

  const missing: string[] = [];
  if (!updated.clientName) missing.push('Nombre del cliente');
  if (!updated.projectName) missing.push('Nombre del proyecto');
  if (updated.items.length === 0 || updated.subtotal === 0) missing.push('Descripción y valor de las tareas');
  if (!updated.startPct || !updated.endPct) missing.push('Porcentajes de pago (inicio y final)');

  let reply = 'He actualizado los datos de la cotización en la plantilla.';
  if (missing.length > 0) {
    reply += ` Para completar el documento oficial, ¿podrías indicarme: ${missing.join(', ')}?`;
  } else {
    reply +=
      ' ¡Excelente! Todos los campos requeridos están listos en la vista previa del documento. Puedes generar el PDF cuando lo desees.';
  }

  return {
    reply,
    extractedQuote: updated,
    missingFields: missing,
    isComplete: missing.length === 0,
  };
}
