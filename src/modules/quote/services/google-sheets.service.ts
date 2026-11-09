import { QuoteData, GoogleSheetsQuotePayload, CompanyConfig } from '../types/quote.types';

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
  Codigo_Serie_Cotizacion: 'COT1',
  Codigo_Serie_CartaPresentacion: 'CTP1',
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
 * Obtiene la URL configurada del Webhook exclusivamente desde las variables de entorno (.env).
 */
export function getGoogleSheetsWebhookUrl(): string | null {
  const envUrl = import.meta.env.VITE_GOOGLE_SHEETS_WEBHOOK_URL;
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
 * Guarda formalmente la cotización en Google Sheets (CotizacionesMYC) con las 14 columnas.
 */
export async function saveQuoteToGoogleSheets(
  quote: QuoteData
): Promise<SaveQuoteResult> {
  const webhookUrl = getGoogleSheetsWebhookUrl();
  if (!webhookUrl) {
    return {
      success: true,
      isOfflineFallback: true,
      quoteNumber: formatConsecutive(quote.quoteNumber),
      message: 'Cotización guardada en modo local (sin webhook configurado).',
    };
  }

  const items = quote.items || [];
  const totalAmount = parseFloat(String(quote.total)) || 0;
  const startPct = parseFloat(String(quote.startPct)) || 50;
  const valorAnticipo = Math.round(totalAmount * (startPct / 100));
  const valorSaldo = totalAmount - valorAnticipo;
  const fechaVigencia = quote.fechaVigencia || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('es-CO');
  const statusVigencia = calculateExpirationStatus(fechaVigencia);

  const quotePayload: GoogleSheetsQuotePayload = {
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
      statusVigencia: result.statusVigencia || statusVigencia,
      fechaVigencia,
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
