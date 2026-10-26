import { useState, useCallback } from 'react';
import { QuoteData, QuoteItem } from '../types/quote.types';
import { syncQuoteWithCalculations } from '../services/quote-calculator';

export const INITIAL_QUOTE: QuoteData = {
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
  notes: 'El pago se realiza de la siguiente manera el 50% al iniciar y el 50% restante al finalizar el trabajo.',
  representativeName: 'Ever Becerra',
  representativeRole: 'Representante legal',
  contactPhone: '311 796 9848',
  contactInstagram: 'mcobracivil',
  contactEmail: 'mcobracivil@gmail.com',
};

export const SAMPLE_ITEMS: QuoteItem[] = [
  {
    id: '1',
    description: 'Demolición controlada de muros divisorios y retiro de escombros con volqueta a botadero certificado.',
    subtotal: 4500000,
  },
  {
    id: '2',
    description: 'Construcción de mampostería en bloque estructural, pañete liso y aplicación de estuco plástico.',
    subtotal: 7800000,
  },
  {
    id: '3',
    description: 'Suministro e instalación de pisos en porcelanato de alto tráfico 60x60 cm con boquilla epóxica.',
    subtotal: 6200000,
  },
];

export function useQuote(initialData: QuoteData = INITIAL_QUOTE) {
  const [quote, setQuote] = useState<QuoteData>(initialData);

  const updateField = useCallback((field: keyof QuoteData, value: any) => {
    setQuote((prev) => {
      const updated = { ...prev, [field]: value };
      return syncQuoteWithCalculations(updated);
    });
  }, []);

  const setFullQuote = useCallback((newQuote: QuoteData) => {
    setQuote(syncQuoteWithCalculations(newQuote));
  }, []);

  const loadSample = useCallback((): string => {
    const subtotal = SAMPLE_ITEMS.reduce((sum, item) => sum + item.subtotal, 0);
    const sampleQuote: QuoteData = {
      ...INITIAL_QUOTE,
      quoteNumber: 'COT-014',
      clientName: 'Constructora Bolívar S.A.',
      projectName: 'Remodelación y Acabados Sede Empresarial Calle 26',
      items: SAMPLE_ITEMS,
      subtotal,
      total: subtotal,
      startPct: 50,
      endPct: 50,
    };
    setQuote(syncQuoteWithCalculations(sampleQuote));
    return 'Ejemplo institucional cargado correctamente';
  }, []);

  const resetQuote = useCallback((): string => {
    const nextNum = 'COT-' + String(Math.floor(Math.random() * 899 + 100));
    const newQuote: QuoteData = {
      ...INITIAL_QUOTE,
      quoteNumber: nextNum,
      date: new Date().toLocaleDateString('es-CO'),
    };
    setQuote(newQuote);
    return `Nueva cotización ${nextNum} iniciada`;
  }, []);

  return {
    quote,
    setQuote: setFullQuote,
    updateField,
    loadSample,
    resetQuote,
  };
}
