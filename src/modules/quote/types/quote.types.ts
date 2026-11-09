export interface QuoteItem {
  id: string;
  title?: string;
  description: string;
  subtotal: number;
  mode?: 'simple' | 'detailed';
}

export type EstadoCotizacionCliente = 'Pendiente' | 'Confirmada' | 'Rechazada';
export type EstadoCotizacion = 'Activa' | 'Inactiva';
export type PricingMode = 'tasks' | 'global';

export interface CompanyConfig {
  Codigo_Serie_Cotizacion: string;
  Codigo_Serie_CartaPresentacion: string;
  Cuidad_CartaPresentacion: string;
  Firma_RepresentanteLegal: string;
  Firma_CargoInstitucional: string;
  Firma_NumeroCelular: string;
  Firma_CorreoElectronico: string;
  Firma_Instagram: string;
  Firma_WhatsApp: string;
  Firma_NitEmpresa: string;
}

export interface QuoteData {
  code: string;
  letterCode?: string;
  quoteNumber: string;
  nit: string;
  date: string;
  clientName: string;
  projectName: string;
  location?: string;
  fechaVigencia: string; // Fecha límite de validez (DD/MM/YYYY)
  validityDays?: string; // Compatibilidad con vistas previas
  pricingMode?: PricingMode; // 'tasks': Suma de partidas | 'global': Valor global total
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
  contactWhatsApp?: string;
  letterCity?: string;
  letterDateLong?: string;
  letterSummary?: string;
  letterGreeting?: string;
  statusCliente: EstadoCotizacionCliente;
  statusVigencia: EstadoCotizacion;
  isFinalized?: boolean;
}

export interface QuoteTotals {
  subtotal: number;
  adminAmount: number;
  contingencyAmount: number;
  utilityAmount: number;
  ivaAmount: number;
  total: number;
}

export interface GoogleSheetsQuotePayload {
  quoteNumber: string;
  clientName: string;
  projectName: string;
  location: string;
  items: QuoteItem[];
  tasksJson?: string;
  numeroTareas: number;
  valorAnticipo: number;
  valorSaldo: number;
  total: number;
  statusCliente: EstadoCotizacionCliente;
  statusVigencia: EstadoCotizacion;
  fechaVigencia: string;
  startPct: number;
  endPct: number;
}
