import { QuoteData, QuoteItem, QuoteTotals } from '../types/quote.types';

/**
 * Calcula los totales y el desglose de AIU e IVA de una cotización.
 * Fórmula colombiana de construcción:
 * - Subtotal = suma de ítems
 * - Administración = Subtotal * (adminPct / 100)
 * - Imprevistos = Subtotal * (contingencyPct / 100)
 * - Utilidad = Subtotal * (utilityPct / 100)
 * - IVA = (Administración + Imprevistos + Utilidad) * (ivaPct / 100)
 * - Total = Subtotal + AIU + IVA
 */
export function calculateQuoteTotals(quote: Partial<QuoteData>): QuoteTotals {
  const items: QuoteItem[] = quote.items || [];
  const subtotal = items.reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0);

  const adminAmount = subtotal * ((Number(quote.adminPct) || 0) / 100);
  const contingencyAmount = subtotal * ((Number(quote.contingencyPct) || 0) / 100);
  const utilityAmount = subtotal * ((Number(quote.utilityPct) || 0) / 100);

  const aiuSum = adminAmount + contingencyAmount + utilityAmount;
  const ivaAmount = aiuSum * ((Number(quote.ivaPct) || 0) / 100);

  const total = subtotal + aiuSum + ivaAmount;

  return {
    subtotal,
    adminAmount,
    contingencyAmount,
    utilityAmount,
    ivaAmount,
    total,
  };
}

/**
 * Aplica los cálculos a una cotización y devuelve un nuevo objeto QuoteData consistente.
 */
export function syncQuoteWithCalculations(quote: QuoteData): QuoteData {
  const totals = calculateQuoteTotals(quote);
  return {
    ...quote,
    subtotal: totals.subtotal,
    total: totals.total,
  };
}
