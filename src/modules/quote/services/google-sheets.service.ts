import { QuoteData } from '../types/quote.types';

export interface SaveQuoteResult {
  success: boolean;
  quoteNumber?: string;
  status?: string;
  message?: string;
  error?: string;
  isOfflineFallback?: boolean;
}

export interface NextNumberResult {
  success: boolean;
  nextQuoteNumber?: string;
  status?: string;
  error?: string;
}

/**
 * Obtiene la URL configurada del Webhook de Google Apps Script.
 * Prioriza la variable de entorno de Vercel/Vite y permite override en localStorage.
 */
export function getGoogleSheetsWebhookUrl(): string | null {
  const envUrl = import.meta.env.VITE_GOOGLE_SHEETS_WEBHOOK_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim().startsWith('http')) {
    return envUrl.trim();
  }

  if (typeof window !== 'undefined') {
    const localUrl = localStorage.getItem('myc_sheets_webhook_url');
    if (localUrl && localUrl.trim().startsWith('http')) {
      return localUrl.trim();
    }
  }

  return null;
}

/**
 * Verifica si Google Sheets está configurado como base de datos en la nube.
 */
export function isGoogleSheetsConfigured(): boolean {
  return getGoogleSheetsWebhookUrl() !== null;
}

/**
 * Permite configurar o actualizar la URL del Webhook manualmente desde el navegador.
 */
export function setCustomGoogleSheetsUrl(url: string): void {
  if (typeof window !== 'undefined') {
    if (!url || url.trim() === '') {
      localStorage.removeItem('myc_sheets_webhook_url');
    } else {
      localStorage.setItem('myc_sheets_webhook_url', url.trim());
    }
  }
}

/**
 * Consulta el próximo consecutivo asignable disponible en Google Sheets.
 */
export async function fetchNextQuoteNumber(): Promise<NextNumberResult> {
  const webhookUrl = getGoogleSheetsWebhookUrl();
  if (!webhookUrl) {
    return {
      success: false,
      error: 'Google Sheets no configurado (modo local)',
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(webhookUrl, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: !!data.success,
      nextQuoteNumber: data.nextQuoteNumber ? String(data.nextQuoteNumber) : undefined,
      status: data.status,
    };
  } catch (err: any) {
    const errMsg = err.name === 'AbortError' ? 'Tiempo de espera agotado (timeout)' : err.message;
    console.warn('[GoogleSheetsService] No se pudo consultar próximo consecutivo:', errMsg);
    return {
      success: false,
      error: errMsg,
    };
  }
}

/**
 * Guarda los datos del cliente y la cotización en Google Sheets con bloqueo atómico.
 * Retorna el número de consecutivo oficial asignado por la hoja.
 */
export async function saveQuoteToGoogleSheets(
  quote: QuoteData
): Promise<SaveQuoteResult> {
  const webhookUrl = getGoogleSheetsWebhookUrl();
  if (!webhookUrl) {
    return {
      success: false,
      isOfflineFallback: true,
      error: 'No hay webhook de Google Sheets configurado. Operando en modo local.',
    };
  }

  const payload = {
    action: 'save_quote',
    quote: {
      date: quote.date,
      clientName: quote.clientName,
      projectName: quote.projectName,
      location: quote.location,
      total: quote.total,
      startPct: quote.startPct,
      endPct: quote.endPct,
      status: quote.status || 'Enviada',
      contactPhone: quote.contactPhone,
      contactEmail: quote.contactEmail,
      letterCity: quote.letterCity,
      items: (quote.items || []).map((it) => ({
        title: it.title,
        description: it.description,
        subtotal: it.subtotal,
      })),
    },
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    // Google Apps Script requiere text/plain para evitar bloqueos por preflight OPTIONS
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Error desconocido retornado por Google Sheets');
    }

    return {
      success: true,
      quoteNumber: String(result.quoteNumber),
      status: result.status,
      message: result.message || 'Cotización registrada con éxito en Google Sheets',
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
