import { GoogleGenAI } from '@google/genai';
import { config } from '../../config/env.config';
import { QuoteData } from './ai-agent.types';
import { fallbackExtractor, FallbackResult } from './ai-agent.fallback';
import { AI_SYSTEM_INSTRUCTION, AI_RESPONSE_SCHEMA } from './ai-agent.schema';

class AiAgentService {
  private client: GoogleGenAI | null = null;

  constructor() {
    if (config.hasValidGeminiKey) {
      this.client = new GoogleGenAI({
        apiKey: config.geminiApiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
  }

  public async processMessage(
    message: string,
    history: any[] = [],
    baseQuote: QuoteData
  ): Promise<FallbackResult> {
    if (!this.client) {
      return fallbackExtractor(message, baseQuote);
    }

    try {
      const prompt = `
Estado actual de la cotización:
${JSON.stringify(baseQuote, null, 2)}

Mensaje del usuario:
"${message}"

Historial reciente:
${JSON.stringify(history?.slice(-4) || [])}

Analiza el mensaje, extrae las variables, actualiza el objeto de cotización y responde en formato JSON según el esquema.
`;

      const genPromise = this.client.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: AI_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: AI_RESPONSE_SCHEMA,
        },
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout de consulta Gemini')), 7000)
      );

      const response = (await Promise.race([genPromise, timeoutPromise])) as any;
      const parsed = JSON.parse(response.text || '{}');

      if (parsed.extractedQuote && Array.isArray(parsed.extractedQuote.items)) {
        parsed.extractedQuote.items = parsed.extractedQuote.items.map((item: any, idx: number) => ({
          id: item.id || String(idx + 1),
          description: item.description || '',
          subtotal: Number(item.subtotal) || 0,
        }));

        const calcSubtotal = parsed.extractedQuote.items.reduce(
          (sum: number, it: any) => sum + (it.subtotal || 0),
          0
        );
        parsed.extractedQuote.subtotal = calcSubtotal;

        const adminVal = calcSubtotal * ((parsed.extractedQuote.adminPct || 0) / 100);
        const contVal = calcSubtotal * ((parsed.extractedQuote.contingencyPct || 0) / 100);
        const utilVal = calcSubtotal * ((parsed.extractedQuote.utilityPct || 0) / 100);
        const ivaVal = (adminVal + contVal + utilVal) * ((parsed.extractedQuote.ivaPct || 0) / 100);
        parsed.extractedQuote.total = calcSubtotal + adminVal + contVal + utilVal + ivaVal;

        // Mantener valores predeterminados de la empresa si faltan
        parsed.extractedQuote.code = parsed.extractedQuote.code || baseQuote.code || 'C1';
        parsed.extractedQuote.quoteNumber =
          parsed.extractedQuote.quoteNumber || baseQuote.quoteNumber || 'COT-001';
        parsed.extractedQuote.nit = parsed.extractedQuote.nit || baseQuote.nit || '901795226-7';
        parsed.extractedQuote.date =
          parsed.extractedQuote.date || baseQuote.date || new Date().toLocaleDateString('es-CO');
        parsed.extractedQuote.representativeName =
          parsed.extractedQuote.representativeName || 'Ever Becerra';
        parsed.extractedQuote.representativeRole =
          parsed.extractedQuote.representativeRole || 'Representante legal';
        parsed.extractedQuote.contactPhone =
          parsed.extractedQuote.contactPhone || '311 796 9848';
        parsed.extractedQuote.contactInstagram =
          parsed.extractedQuote.contactInstagram || 'mcobracivil';
        parsed.extractedQuote.contactEmail =
          parsed.extractedQuote.contactEmail || 'mcobracivil@gmail.com';
      }

      return parsed;
    } catch (err) {
      console.error('Error en AiAgentService:', err);
      const fallback = fallbackExtractor(message, baseQuote);
      fallback.reply = `(Procesado localmente) ${fallback.reply}`;
      return fallback;
    }
  }
}

export const aiAgentService = new AiAgentService();
