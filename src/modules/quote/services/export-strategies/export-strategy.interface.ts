import { QuoteData } from '../../types/quote.types';

export type ExportStrategyId = 'joint' | 'separated' | 'quote' | 'letter';

export interface ExportContext {
  quote: QuoteData;
  rootContainer: HTMLElement;
  html2canvas: any;
  jsPDF: any;
  onNotification?: (msg: string) => void;
}

export interface ExportResult {
  strategyId: ExportStrategyId;
  filesCount: number;
  filenames: string[];
  message: string;
}

export interface DocumentExportStrategy {
  readonly id: ExportStrategyId;
  readonly label: string;
  readonly shortLabel: string;
  readonly description: string;
  readonly badge?: string;
  execute(context: ExportContext): Promise<ExportResult>;
}

/**
 * Limpia el consecutivo eliminando prefijos tipo "COT-" o "COT"
 * para dejar únicamente el número (ej: "COT-111" -> "111", "135" -> "135").
 */
export function cleanNumericConsecutive(raw?: string): string {
  if (!raw || raw.trim() === '') return '111';
  const cleaned = raw.replace(/^COT-?/i, '').trim();
  return cleaned !== '' ? cleaned : '111';
}

/**
 * Sanitiza texto para nombres de archivo seguros en sistemas operativos.
 */
export function sanitizeClientName(clientName?: string): string {
  if (!clientName || clientName.trim() === '') return '';
  return clientName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quita acentos/tildes
    .replace(/[^a-zA-Z0-9_\-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Construye el nombre de archivo exacto según el contrato de nomenclatura institucional:
 * - Solo Cotización: Cotizacion_[N°].pdf (ej. Cotizacion_111.pdf)
 * - Solo Carta: Carta_de_Presentacion_[N°].pdf (ej. Carta_de_Presentacion_111.pdf)
 * - Juntas: MYC_CC[N°].pdf (ej. MYC_CC111.pdf)
 */
export function buildExportFilename(
  quote: QuoteData,
  docType: 'Cotizacion' | 'Carta_de_Presentacion' | 'MYC_CC'
): string {
  const num = cleanNumericConsecutive(quote.quoteNumber);
  switch (docType) {
    case 'Cotizacion':
      return `Cotizacion_${num}.pdf`;
    case 'Carta_de_Presentacion':
      return `Carta_de_Presentacion_${num}.pdf`;
    case 'MYC_CC':
      return `MYC_CC${num}.pdf`;
  }
}
