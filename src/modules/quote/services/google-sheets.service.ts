import {
  QuoteData,
  GoogleSheetsQuotePayload,
  CompanyConfig,
  QuoteCatalogResult,
  FetchQuoteResult,
  QuoteSummaryItem,
} from '../types/quote.types';
import { syncQuoteWithCalculations } from './quote-calculator';

export interface SaveQuoteResult {
  success: boolean;
  quoteNumber?: string;
  statusCliente?: string;
  statusVigencia?: string;
  fechaVigencia?: string;
  message?: string;
  error?: string;
  isDuplicate?: boolean;
  isOfflineFallback?: boolean;
}

export interface NextNumberResult {
  success: boolean;
  nextQuoteNumber?: string;
  config?: CompanyConfig;
  status?: string;
  error?: string;
}

export interface ValidateQuoteResult {
  success: boolean;
  isAvailable: boolean;
  isDuplicate: boolean;
  suggestedNumber?: string;
  error?: string;
}

/**
 * Configuración corporativa por defecto (0 ms de latencia inicial).
 */
export const DEFAULT_COMPANY_CONFIG: CompanyConfig = {
  Codigo_Serie_Cotizacion: 'C1',
  Codigo_Serie_CartaPresentacion: 'CP 1',
  Cuidad_CartaPresentacion: 'Medellín',
  Firma_RepresentanteLegal: 'Ever Becerra',
  Firma_CargoInstitucional: 'Representante Legal',
  Firma_NumeroCelular: '311 796 9848',
  Firma_CorreoElectronico: 'mcobracivil@gmail.com',
  Firma_Instagram: 'mcobracivil',
  Firma_WhatsApp: '311 796 9848',
  Firma_NitEmpresa: '901795226-7',
};

/**
 * Caché en memoria para la configuración de la empresa.
 * Se llena en segundo plano y nunca bloquea la interfaz de usuario.
 */
let cachedCompanyConfig: CompanyConfig | null = null;

export function getCachedCompanyConfig(): CompanyConfig {
  return cachedCompanyConfig || DEFAULT_COMPANY_CONFIG;
}

export function setCachedCompanyConfig(cfg: Partial<CompanyConfig>): void {
  cachedCompanyConfig = {
    ...DEFAULT_COMPANY_CONFIG,
    ...cachedCompanyConfig,
    ...cfg,
  };
}

/**
 * Limpieza defensiva de cualquier dato previo en localStorage.
 */
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('myc_sheets_webhook_url');
  } catch (_) {}
}

/**
 * Formatea un número como consecutivo con padding de 3 dígitos (ej: 1 -> "001", 24 -> "024", 101 -> "101")
 */
export function formatConsecutive(num: number | string | undefined | null): string {
  if (num === undefined || num === null) return '101';
  const cleanStr = String(num).trim();
  const parsed = parseInt(cleanStr.replace(/\D/g, ''), 10);
  if (isNaN(parsed) || parsed < 101) {
    return '101';
  }
  return parsed < 1000 ? String(parsed).padStart(3, '0') : String(parsed);
}

/**
 * Calcula si una cotización está Activa o Inactiva según su fecha de vigencia (DD/MM/YYYY).
 */
export function calculateExpirationStatus(fechaVigenciaStr?: string): 'Activa' | 'Inactiva' {
  if (!fechaVigenciaStr) return 'Activa';
  const parts = String(fechaVigenciaStr).trim().split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      const expirationDate = new Date(year, month, day, 23, 59, 59, 999);
      const now = new Date();
      return now.getTime() <= expirationDate.getTime() ? 'Activa' : 'Inactiva';
    }
  }
  return 'Activa';
}

/**
 * Limpia y normaliza cualquier fecha a formato corto puro de texto plano (DD/MM/YYYY).
 * Elimina cualquier rastro de GMT, hora estándar de Colombia o formato ISO.
 */
export function cleanSimpleDate(val?: string | null): string {
  if (!val) return new Date().toLocaleDateString('es-CO');
  const str = String(val).trim();

  // Si contiene formato largo de Apps Script: "Mon Nov 09 2026 00:00:00 GMT-0500..."
  if (
    str.includes('GMT') ||
    str.includes('hora estándar') ||
    str.includes('Colombia')
  ) {
    const match = str.match(/([A-Za-z]{3})\s+(\d{1,2})\s+(\d{4})/);
    if (match) {
      const monthNames: Record<string, string> = {
        jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
        jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
      };
      const monthKey = match[1].toLowerCase();
      const month = monthNames[monthKey] || '11';
      const day = match[2].padStart(2, '0');
      const year = match[3];
      return `${day}/${month}/${year}`;
    }
  }

  // Si viene en formato ISO tipo "YYYY-MM-DD" o "YYYY-MM-DDT00:00:00"
  if (str.includes('-') && !str.includes('/')) {
    const datePart = str.split('T')[0].split(' ')[0];
    const parts = datePart.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      const year = parts[0];
      const month = parts[1].padStart(2, '0');
      const day = parts[2].padStart(2, '0');
      return `${day}/${month}/${year}`;
    }
  }

  // Si tiene sufijo de hora tipo "09/11/2026 00:00:00"
  if (str.includes(' ')) {
    const firstToken = str.split(' ')[0];
    if (firstToken.includes('/')) {
      return firstToken;
    }
  }

  return str;
}

/**
 * Obtiene la URL configurada del Webhook desde las variables de entorno (.env).
 */
export function getGoogleSheetsWebhookUrl(): string | null {
  const envUrl =
    (import.meta.env as any).GOOGLE_SHEETS_WEBHOOK_URL ||
    import.meta.env.VITE_GOOGLE_SHEETS_WEBHOOK_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim().startsWith('http')) {
    return envUrl.trim();
  }
  return null;
}

export function isGoogleSheetsConfigured(): boolean {
  return getGoogleSheetsWebhookUrl() !== null;
}

export type GoogleSheetsHealthStatus = 'connected' | 'checking' | 'disconnected' | 'unconfigured';

/**
 * Health check liviano que consulta la disponibilidad del Webhook sin bloquear el flujo principal.
 */
export async function checkGoogleSheetsHealth(): Promise<GoogleSheetsHealthStatus> {
  const webhookUrl = getGoogleSheetsWebhookUrl();
  if (!webhookUrl) return 'unconfigured';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(webhookUrl, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      return 'connected';
    }
    return 'disconnected';
  } catch (_) {
    return 'disconnected';
  }
}

/**
 * Consulta el próximo consecutivo autoincrementable y la configuración corporativa en segundo plano.
 */
export async function fetchNextQuoteNumber(): Promise<NextNumberResult> {
  const webhookUrl = getGoogleSheetsWebhookUrl();
  if (!webhookUrl) {
    return {
      success: false,
      nextQuoteNumber: '101',
      config: getCachedCompanyConfig(),
      error: 'Google Sheets no configurado (modo local)',
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(webhookUrl, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const rawText = await response.text();
    let data: any = {};
    try {
      data = JSON.parse(rawText);
    } catch (_) {
      throw new Error(`Respuesta no válida de Google Sheets: ${rawText.slice(0, 100)}`);
    }

    if (data.config && typeof data.config === 'object') {
      setCachedCompanyConfig(data.config);
    }

    return {
      success: !!data.success,
      nextQuoteNumber: data.nextQuoteNumber ? formatConsecutive(data.nextQuoteNumber) : '101',
      config: data.config ? { ...DEFAULT_COMPANY_CONFIG, ...data.config } : getCachedCompanyConfig(),
      status: data.status,
    };
  } catch (err: any) {
    const errMsg = err.name === 'AbortError' ? 'Tiempo de espera agotado al consultar consecutivo' : err.message;
    console.warn('[GoogleSheetsService] No se pudo consultar próximo consecutivo:', errMsg);
    return {
      success: false,
      nextQuoteNumber: '101',
      config: getCachedCompanyConfig(),
      error: errMsg,
    };
  }
}

/**
 * Consulta el catálogo de cotizaciones para alimentar el buscador a 0 ms de latencia en cliente.
 */
export async function fetchQuoteCatalog(): Promise<QuoteCatalogResult> {
  const webhookUrl = getGoogleSheetsWebhookUrl();
  if (!webhookUrl) {
    return {
      success: false,
      catalog: [],
      error: 'Google Sheets no configurado.',
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const separator = webhookUrl.includes('?') ? '&' : '?';
    const queryUrl = `${webhookUrl}${separator}action=get_catalog`;

    const response = await fetch(queryUrl, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const rawText = await response.text();
    let result: any = {};
    try {
      result = JSON.parse(rawText);
    } catch (_) {
      throw new Error(`Respuesta inválida al consultar catálogo: ${rawText.slice(0, 100)}`);
    }

    if (!result.success || !Array.isArray(result.catalog)) {
      return {
        success: false,
        catalog: [],
        error: result.error || 'No se pudo obtener el catálogo de cotizaciones.',
      };
    }

    if (result.config) {
      setCachedCompanyConfig(result.config);
    }

    const defaultCode = result.config?.Codigo_Serie_Cotizacion || getCachedCompanyConfig().Codigo_Serie_Cotizacion || 'C1';

    const normalizedCatalog: QuoteSummaryItem[] = result.catalog.map((item: any) => ({
      quoteNumber: formatConsecutive(item.quoteNumber),
      code: item.code || defaultCode,
      clientName: String(item.clientName || 'Sin Nombre').trim(),
      projectName: String(item.projectName || 'Sin Proyecto').trim(),
      location: String(item.location || '').trim(),
      date: cleanSimpleDate(item.date),
      updatedAt: cleanSimpleDate(item.updatedAt || item.date),
      total: Number(item.total) || 0,
      statusCliente: item.statusCliente || 'Pendiente',
      statusVigencia: item.statusVigencia || 'Activa',
      fechaVigencia: cleanSimpleDate(item.fechaVigencia),
    }));

    return {
      success: true,
      catalog: normalizedCatalog,
    };
  } catch (err: any) {
    const errMsg = err.name === 'AbortError' ? 'Tiempo de espera agotado al consultar catálogo' : err.message;
    console.error('[GoogleSheetsService] Error consultando catálogo:', err);
    return {
      success: false,
      catalog: [],
      error: errMsg,
    };
  }
}

/**
 * Recupera una cotización completa por su número de consecutivo desde Google Sheets.
 */
export async function fetchQuoteByNumber(quoteNumber: string): Promise<FetchQuoteResult> {
  const webhookUrl = getGoogleSheetsWebhookUrl();
  const cleanTarget = formatConsecutive(quoteNumber);

  if (!webhookUrl) {
    return {
      success: false,
      error: 'Google Sheets no configurado.',
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const separator = webhookUrl.includes('?') ? '&' : '?';
    const queryUrl = `${webhookUrl}${separator}action=get_quote&quoteNumber=${encodeURIComponent(cleanTarget)}`;

    const response = await fetch(queryUrl, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const rawText = await response.text();
    let result: any = {};
    try {
      result = JSON.parse(rawText);
    } catch (_) {
      throw new Error(`Respuesta inválida al recuperar cotización: ${rawText.slice(0, 120)}`);
    }

    if (!result.success || !result.quote) {
      return {
        success: false,
        error: result.error || `Cotización N° ${cleanTarget} no encontrada.`,
      };
    }

    if (result.config) {
      setCachedCompanyConfig(result.config);
    }

    const rawQuote = result.quote;
    const cleanDate = cleanSimpleDate(rawQuote.date);
    const cleanVigencia = cleanSimpleDate(rawQuote.fechaVigencia);
    const resolvedCode = rawQuote.code || result.config?.Codigo_Serie_Cotizacion || getCachedCompanyConfig().Codigo_Serie_Cotizacion || 'C1';
    const resolvedLetterCode = rawQuote.letterCode || result.config?.Codigo_Serie_CartaPresentacion || getCachedCompanyConfig().Codigo_Serie_CartaPresentacion || 'CP 1';

    // Asegurar que quote tenga todos los campos sincronizados y normalizados en texto plano
    const normalizedQuote: QuoteData = syncQuoteWithCalculations({
      ...rawQuote,
      code: resolvedCode,
      letterCode: resolvedLetterCode,
      quoteNumber: cleanTarget,
      date: cleanDate,
      fechaVigencia: cleanVigencia,
      validityDays: cleanVigencia,
      clientName: String(rawQuote.clientName || '').trim(),
      projectName: String(rawQuote.projectName || '').trim(),
      location: String(rawQuote.location || '').trim(),
      isEditingExisting: true,
      isFinalized: true,
      items: Array.isArray(rawQuote.items) ? rawQuote.items : [],
    });

    return {
      success: true,
      quote: normalizedQuote,
      isLegacyFallback: !!result.isLegacyFallback,
    };
  } catch (err: any) {
    const errMsg = err.name === 'AbortError' ? 'Tiempo de espera agotado al recuperar cotización' : err.message;
    console.error(`[GoogleSheetsService] Error recuperando cotización N° ${cleanTarget}:`, err);
    return {
      success: false,
      error: errMsg,
    };
  }
}

/**
 * Construye el payload común para guardar o actualizar en Google Sheets.
 */
function buildQuotePayload(quote: QuoteData): GoogleSheetsQuotePayload {
  const items = quote.items || [];
  const totalAmount = parseFloat(String(quote.total)) || 0;
  const startPct = parseFloat(String(quote.startPct)) || 50;
  const valorAnticipo = Math.round(totalAmount * (startPct / 100));
  const valorSaldo = totalAmount - valorAnticipo;
  const fechaVigencia = quote.fechaVigencia || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('es-CO');
  const statusVigencia = calculateExpirationStatus(fechaVigencia);

  return {
    quoteNumber: formatConsecutive(quote.quoteNumber),
    clientName: (quote.clientName || '').trim() || 'Sin Nombre',
    projectName: (quote.projectName || '').trim() || 'Sin Proyecto',
    location: (quote.location || '').trim() || 'Medellín',
    items,
    tasksJson: JSON.stringify(items),
    numeroTareas: items.length,
    valorAnticipo,
    valorSaldo,
    total: totalAmount,
    statusCliente: quote.statusCliente || 'Pendiente',
    statusVigencia,
    fechaVigencia,
    startPct,
    endPct: parseFloat(String(quote.endPct)) || (100 - startPct),
  };
}

/**
 * Guarda formalmente una nueva cotización en Google Sheets (CotizacionesMYC).
 */
export async function saveQuoteToGoogleSheets(quote: QuoteData): Promise<SaveQuoteResult> {
  const webhookUrl = getGoogleSheetsWebhookUrl();
  if (!webhookUrl) {
    return {
      success: true,
      isOfflineFallback: true,
      quoteNumber: formatConsecutive(quote.quoteNumber),
      message: 'Cotización guardada en modo local (sin webhook configurado).',
    };
  }

  const quotePayload = buildQuotePayload(quote);
  const payload = {
    action: 'save_quote',
    quote: quotePayload,
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const rawText = await response.text();
    let result: any = {};
    try {
      result = JSON.parse(rawText);
    } catch (_) {
      throw new Error(`Google Sheets devolvió una respuesta no válida: ${rawText.slice(0, 120)}`);
    }

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Error al guardar la cotización en Google Sheets',
        isDuplicate: !!result.isDuplicate,
      };
    }

    return {
      success: true,
      quoteNumber: formatConsecutive(result.quoteNumber || quote.quoteNumber),
      statusCliente: result.statusCliente || quote.statusCliente || 'Pendiente',
      statusVigencia: result.statusVigencia || quotePayload.statusVigencia,
      fechaVigencia: quotePayload.fechaVigencia,
      message: result.message || `Cotización N° ${formatConsecutive(result.quoteNumber)} registrada con éxito`,
    };
  } catch (err: any) {
    const errMsg = err.name === 'AbortError' ? 'Tiempo de espera agotado al conectar con Google Sheets' : err.message;
    console.error('[GoogleSheetsService] Error guardando cotización:', err);
    return {
      success: false,
      error: errMsg,
      isOfflineFallback: true,
    };
  }
}

/**
 * Actualiza in-place una cotización existente en Google Sheets sin alterar consecutivos.
 */
export async function updateQuoteInGoogleSheets(quote: QuoteData): Promise<SaveQuoteResult> {
  const webhookUrl = getGoogleSheetsWebhookUrl();
  const cleanTarget = formatConsecutive(quote.quoteNumber);

  if (!webhookUrl) {
    return {
      success: true,
      isOfflineFallback: true,
      quoteNumber: cleanTarget,
      message: `Cotización N° ${cleanTarget} actualizada en modo local.`,
    };
  }

  const quotePayload = buildQuotePayload(quote);
  quotePayload.isUpdate = true;

  const payload = {
    action: 'update_quote',
    quote: quotePayload,
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const rawText = await response.text();
    let result: any = {};
    try {
      result = JSON.parse(rawText);
    } catch (_) {
      throw new Error(`Google Sheets devolvió una respuesta no válida al actualizar: ${rawText.slice(0, 120)}`);
    }

    if (!result.success) {
      return {
        success: false,
        error: result.error || `Error al actualizar la cotización N° ${cleanTarget} en Google Sheets`,
      };
    }

    return {
      success: true,
      quoteNumber: cleanTarget,
      statusCliente: result.statusCliente || quote.statusCliente,
      statusVigencia: result.statusVigencia || quotePayload.statusVigencia,
      fechaVigencia: quotePayload.fechaVigencia,
      message: result.message || `Cotización N° ${cleanTarget} actualizada exitosamente`,
    };
  } catch (err: any) {
    const errMsg = err.name === 'AbortError' ? 'Tiempo de espera agotado al actualizar en Google Sheets' : err.message;
    console.error(`[GoogleSheetsService] Error actualizando cotización N° ${cleanTarget}:`, err);
    return {
      success: false,
      error: errMsg,
    };
  }
}

/* =========================================================================
 * RESGUARDO DE BORRADOR DE EMERGENCIA (Local Storage)
 * ========================================================================= */
const DRAFT_STORAGE_KEY = 'myc_emergency_draft_v1';

/**
 * Guarda en segundo plano el borrador actual en localStorage con marca temporal.
 */
export function saveEmergencyDraft(quote: QuoteData): void {
  if (typeof window === 'undefined') return;
  try {
    const payload = {
      timestamp: Date.now(),
      quote,
    };
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
  } catch (_) {}
}

/**
 * Recupera el borrador de emergencia si existe y no es obsoleto (< 7 días).
 */
export function getEmergencyDraft(): { quote: QuoteData; timestamp: number } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.quote && typeof parsed.quote === 'object') {
      // Máximo 7 días de retención
      const ageHours = (Date.now() - (parsed.timestamp || 0)) / (1000 * 60 * 60);
      if (ageHours < 168) {
        return {
          quote: syncQuoteWithCalculations(parsed.quote),
          timestamp: parsed.timestamp || Date.now(),
        };
      }
    }
  } catch (_) {}
  return null;
}

/**
 * Limpia el borrador de emergencia cuando una cotización se guarda o se resetea formalmente.
 */
export function clearEmergencyDraft(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch (_) {}
}
