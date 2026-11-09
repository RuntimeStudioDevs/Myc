import { useState, useCallback, useEffect } from 'react';
import { QuoteData, CompanyConfig } from '../types/quote.types';
import { syncQuoteWithCalculations } from '../services/quote-calculator';
import {
  fetchNextQuoteNumber,
  formatConsecutive,
  getCachedCompanyConfig,
  isGoogleSheetsConfigured,
  calculateExpirationStatus,
} from '../services/google-sheets.service';

export const addDaysToDate = (days: number, baseDate?: Date): string => {
  const d = baseDate ? new Date(baseDate) : new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString('es-CO');
};

export const createInitialQuote = (config?: CompanyConfig): QuoteData => {
  const cfg = config || getCachedCompanyConfig();
  const vigencia = addDaysToDate(30);

  return {
    code: cfg.Codigo_Serie_Cotizacion || 'COT1',
    letterCode: cfg.Codigo_Serie_CartaPresentacion || 'CTP1',
    quoteNumber: '101',
    nit: cfg.Firma_NitEmpresa || '901795226-7',
    date: new Date().toLocaleDateString('es-CO'),
    clientName: '',
    projectName: '',
    location: '',
    fechaVigencia: vigencia,
    validityDays: vigencia,
    pricingMode: 'tasks',
    items: [],
    subtotal: 0,
    adminPct: 0,
    contingencyPct: 0,
    utilityPct: 0,
    ivaPct: 0,
    total: 0,
    startPct: 50,
    endPct: 50,
    statusCliente: 'Pendiente',
    statusVigencia: 'Activa',
    isFinalized: false,
    notes: 'El pago se realiza de la siguiente manera el 50% al iniciar y el 50% restante al finalizar el trabajo.',
    representativeName: cfg.Firma_RepresentanteLegal || 'Ever Becerra',
    representativeRole: cfg.Firma_CargoInstitucional || 'Representante Legal',
    contactPhone: cfg.Firma_NumeroCelular || '311 796 9848',
    contactWhatsApp: cfg.Firma_WhatsApp || '311 796 9848',
    contactInstagram: cfg.Firma_Instagram || 'mcobracivil',
    contactEmail: cfg.Firma_CorreoElectronico || 'mcobracivil@gmail.com',
    letterCity: cfg.Cuidad_CartaPresentacion || 'Medellín',
    letterGreeting: 'Cordial saludo,',
  };
};

export function useQuote(initialData?: QuoteData) {
  const [quote, setQuote] = useState<QuoteData>(() => initialData || createInitialQuote());
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);

  // Consulta el próximo consecutivo y la configuración corporativa en segundo plano al iniciar
  useEffect(() => {
    let isMounted = true;
    if (isGoogleSheetsConfigured()) {
      setIsCloudSyncing(true);
      fetchNextQuoteNumber()
        .then((res) => {
          if (isMounted && res.success) {
            setQuote((prev) => {
              const updated = {
                ...prev,
                quoteNumber: res.nextQuoteNumber ? formatConsecutive(res.nextQuoteNumber) : prev.quoteNumber,
              };

              if (res.config) {
                updated.code = res.config.Codigo_Serie_Cotizacion || updated.code;
                updated.letterCode = res.config.Codigo_Serie_CartaPresentacion || updated.letterCode;
                updated.nit = res.config.Firma_NitEmpresa || updated.nit;
                updated.representativeName = res.config.Firma_RepresentanteLegal || updated.representativeName;
                updated.representativeRole = res.config.Firma_CargoInstitucional || updated.representativeRole;
                updated.contactPhone = res.config.Firma_NumeroCelular || updated.contactPhone;
                updated.contactWhatsApp = res.config.Firma_WhatsApp || updated.contactWhatsApp;
                updated.contactInstagram = res.config.Firma_Instagram || updated.contactInstagram;
                updated.contactEmail = res.config.Firma_CorreoElectronico || updated.contactEmail;
                updated.letterCity = res.config.Cuidad_CartaPresentacion || updated.letterCity;
              }

              return syncQuoteWithCalculations(updated);
            });
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
      if (field === 'fechaVigencia') {
        updated.validityDays = value;
        updated.statusVigencia = calculateExpirationStatus(value);
      }
      return syncQuoteWithCalculations(updated);
    });
  }, []);

  const setFullQuote = useCallback((newQuote: QuoteData) => {
    setQuote(syncQuoteWithCalculations(newQuote));
  }, []);

  const setQuoteNumber = useCallback((num: string) => {
    setQuote((prev) => ({ ...prev, quoteNumber: formatConsecutive(num) }));
  }, []);

  const markAsFinalized = useCallback((savedNumber?: string) => {
    setQuote((prev) => ({
      ...prev,
      quoteNumber: savedNumber ? formatConsecutive(savedNumber) : prev.quoteNumber,
      isFinalized: true,
    }));
  }, []);

  const resetQuote = useCallback(async (): Promise<string> => {
    setIsCloudSyncing(true);
    let nextNum = '101';
    let freshConfig: CompanyConfig | undefined;

    if (isGoogleSheetsConfigured()) {
      try {
        const res = await fetchNextQuoteNumber();
        if (res.success && res.nextQuoteNumber) {
          nextNum = formatConsecutive(res.nextQuoteNumber);
          freshConfig = res.config;
        }
      } catch (e) {
        console.warn('Error obteniendo consecutivo al resetear:', e);
      } finally {
        setIsCloudSyncing(false);
      }
    } else {
      setIsCloudSyncing(false);
      const currentClean = parseInt(String(quote.quoteNumber || '100').replace(/\D/g, ''), 10);
      nextNum = formatConsecutive(isNaN(currentClean) || currentClean < 101 ? 101 : currentClean + 1);
    }

    const newQuote = createInitialQuote(freshConfig);
    newQuote.quoteNumber = nextNum;
    newQuote.date = new Date().toLocaleDateString('es-CO');

    setQuote(newQuote);
    return `Nueva cotización N° ${nextNum} iniciada`;
  }, [quote.quoteNumber]);

  return {
    quote,
    setQuote: setFullQuote,
    updateField,
    setQuoteNumber,
    markAsFinalized,
    resetQuote,
    isCloudSyncing,
  };
}
