export interface QuoteItem {
  id: string;
  description: string;
  subtotal: number;
}

export interface QuoteData {
  code: string;
  quoteNumber: string;
  nit: string;
  date: string;
  clientName: string;
  projectName: string;
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
}

export interface ChatMessage {
  id: string;
  sender: 'agent' | 'user';
  text: string;
  timestamp: string;
  detectedFields?: string[];
}
