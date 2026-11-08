import { useState, useCallback, useEffect } from 'react';
import { QuoteData, QuoteItem } from '../types/quote.types';
import { syncQuoteWithCalculations } from '../services/quote-calculator';
import {
  fetchNextQuoteNumber,
  isGoogleSheetsConfigured,
} from '../services/google-sheets.service';

export const addDaysToDate = (days: number, baseDate?: Date): string => {
  const d = baseDate ? new Date(baseDate) : new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString('es-CO');
};

export const INITIAL_QUOTE: QuoteData = {
  code: 'C1',
  quoteNumber: '101', // Consecutivo base oficial solicitado
  nit: '901795226-7',
  date: new Date().toLocaleDateString('es-CO'),
  clientName: '',
  projectName: '',
  location: '',
  validityDays: addDaysToDate(30),
  items: [],
  subtotal: 0,
  adminPct: 0,
  contingencyPct: 0,
  utilityPct: 0,
  ivaPct: 0,
  total: 0,
  startPct: 50,
  endPct: 50,
  status: 'Enviada',
  notes: 'El pago se realiza de la siguiente manera el 50% al iniciar y el 50% restante al finalizar el trabajo.',
  representativeName: 'Ever Becerra',
  representativeRole: 'Representante legal',
  contactPhone: '311 796 9848',
  contactInstagram: 'mcobracivil',
  contactEmail: 'mcobracivil@gmail.com',
  letterCity: 'Medellín',
  letterGreeting: 'Cordial saludo,',
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
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);

  // Consulta el próximo consecutivo disponible en Google Sheets al iniciar
  useEffect(() => {
    let isMounted = true;
    if (isGoogleSheetsConfigured()) {
      setIsCloudSyncing(true);
      fetchNextQuoteNumber()
        .then((res) => {
          if (isMounted && res.success && res.nextQuoteNumber) {
            setQuote((prev) => ({
              ...prev,
              quoteNumber: res.nextQuoteNumber!,
            }));
          }
        })
        .finally(() => {
          if (isMounted) setIsCloudSyncing(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, []);

  const updateField = useCallback((field: keyof QuoteData, value: any) => {
    setQuote((prev) => {
      const updated = { ...prev, [field]: value };
      return syncQuoteWithCalculations(updated);
    });
  }, []);

  const setFullQuote = useCallback((newQuote: QuoteData) => {
    setQuote(syncQuoteWithCalculations(newQuote));
  }, []);

  const setQuoteNumber = useCallback((num: string) => {
    setQuote((prev) => ({ ...prev, quoteNumber: num }));
  }, []);

  const loadSample = useCallback((): string => {
    const subtotal = SAMPLE_ITEMS.reduce((sum, item) => sum + item.subtotal, 0);
    const sampleQuote: QuoteData = {
      ...INITIAL_QUOTE,
      quoteNumber: quote.quoteNumber || '101',
      clientName: 'Constructora Bolívar S.A.',
      projectName: 'Remodelación y Acabados Sede Empresarial Calle 26',
      location: 'Bogotá D.C. - Carrera 7 # 120-10',
      validityDays: addDaysToDate(30),
      items: SAMPLE_ITEMS,
      subtotal,
      total: subtotal,
      startPct: 50,
      endPct: 50,
      status: 'Enviada',
    };
    setQuote(syncQuoteWithCalculations(sampleQuote));
    return 'Ejemplo institucional cargado correctamente';
  }, [quote.quoteNumber]);

  const resetQuote = useCallback((): string => {
    // Si Google Sheets está configurado, consultar el próximo número
    if (isGoogleSheetsConfigured()) {
      fetchNextQuoteNumber().then((res) => {
        if (res.success && res.nextQuoteNumber) {
          setQuote((prev) => ({
            ...prev,
            quoteNumber: res.nextQuoteNumber!,
          }));
        }
      });
    }

    const nextLocalNum = String(parseInt(quote.quoteNumber || '100', 10) + 1);
    const newQuote: QuoteData = {
      ...INITIAL_QUOTE,
      quoteNumber: nextLocalNum,
      date: new Date().toLocaleDateString('es-CO'),
      validityDays: addDaysToDate(30),
    };
    setQuote(newQuote);
    return `Nueva cotización N° ${nextLocalNum} iniciada`;
  }, [quote.quoteNumber]);

  return {
    quote,
    setQuote: setFullQuote,
    updateField,
    setQuoteNumber,
    loadSample,
    resetQuote,
    isCloudSyncing,
  };
}
