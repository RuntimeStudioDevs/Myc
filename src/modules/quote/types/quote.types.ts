export interface QuoteItem {
  id: string;
  title?: string;
  description: string;
  subtotal: number;
  mode?: 'simple' | 'detailed';
}

export interface QuoteData {
  code: string;
  quoteNumber: string;
  nit: string;
  date: string;
  clientName: string;
  projectName: string;
  location?: string;
  validityDays?: string;
  items: QuoteItem[];
  subtotal: number;
  adminPct: number;
  contingencyPct: number;
  utilityPct: number;
  ivaPct: number;
  total: number;
  startPct: number;
  endPct: number;
  notes: string;
  representativeName: string;
  representativeRole: string;
  contactPhone: string;
  contactInstagram: string;
  contactEmail: string;
  letterCity?: string;
  letterDateLong?: string;
  letterSummary?: string;
  letterGreeting?: string;
  status?: 'Enviada' | 'Aprobada' | 'Rechazada' | 'En Espera';
}

export interface QuoteTotals {
  subtotal: number;
  adminAmount: number;
  contingencyAmount: number;
  utilityAmount: number;
  ivaAmount: number;
  total: number;
}
