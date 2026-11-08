import { QuoteData } from './ai-agent.types';
import { fallbackExtractor, FallbackResult } from './ai-agent.fallback';

/**
 * Servicio local para el procesamiento de cotizaciones y extracción de variables.
 * Funciona de manera 100% autónoma y offline sin requerir API Keys de terceros.
 */
class AiAgentService {
  public async processMessage(
    message: string,
    _history: any[] = [],
    baseQuote: QuoteData
  ): Promise<FallbackResult> {
    return fallbackExtractor(message, baseQuote);
  }
}

export const aiAgentService = new AiAgentService();
