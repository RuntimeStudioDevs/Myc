import { Request, Response } from 'express';
import { aiAgentService } from './ai-agent.service';
import { QuoteData } from './ai-agent.types';

const DEFAULT_QUOTE: QuoteData = {
  code: 'C1',
  quoteNumber: 'COT-001',
  nit: '901795226-7',
  date: new Date().toLocaleDateString('es-CO'),
  clientName: '',
  projectName: '',
  items: [],
  subtotal: 0,
  adminPct: 0,
  contingencyPct: 0,
  utilityPct: 0,
  ivaPct: 0,
  total: 0,
  startPct: 50,
  endPct: 50,
  notes: 'El pago se realiza de la siguiente manera el {startPct}% al iniciar y el {endPct}% restante al finalizar el trabajo.',
  representativeName: 'Ever Becerra',
  representativeRole: 'Representante legal',
  contactPhone: '311 796 9848',
  contactInstagram: 'mcobracivil',
  contactEmail: 'mcobracivil@gmail.com',
};

export async function handleAgentChat(req: Request, res: Response) {
  try {
    const { message, history, currentQuote } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'El mensaje es requerido' });
    }

    const baseQuote: QuoteData = currentQuote || DEFAULT_QUOTE;
    const result = await aiAgentService.processMessage(message, history, baseQuote);

    return res.json(result);
  } catch (error) {
    console.error('Error no controlado en handleAgentChat:', error);
    return res.status(500).json({ error: 'Error interno del servidor procesando la consulta' });
  }
}
