import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { calculateQuoteTotals, syncQuoteWithCalculations } from '../modules/quote/services/quote-calculator';
import { toProperCase, cleanWhitespace } from '../shared/utils/text-formatter';
import { QuoteData } from '../modules/quote/types/quote.types';

describe('Quote Calculator and Text Normalization', () => {
  test('calculateQuoteTotals calculates tasks mode and AIU accurately', () => {
    const mockQuote: Partial<QuoteData> = {
      pricingMode: 'tasks',
      items: [
        { id: '1', title: 'Tarea 1', description: 'Excavación', subtotal: 1000000 },
        { id: '2', title: 'Tarea 2', description: 'Cimentación', subtotal: 2000000 },
      ],
      adminPct: 10,
      contingencyPct: 5,
      utilityPct: 5,
      ivaPct: 19,
    };

    const totals = calculateQuoteTotals(mockQuote as QuoteData);
    assert.strictEqual(totals.subtotal, 3000000);
    assert.strictEqual(totals.adminAmount, 300000);
    assert.strictEqual(totals.contingencyAmount, 150000);
    assert.strictEqual(totals.utilityAmount, 150000);
    // AIU total = 300k + 150k + 150k = 600,000. IVA 19% on AIU = 114,000
    const aiuTotal = totals.adminAmount + totals.contingencyAmount + totals.utilityAmount;
    assert.strictEqual(aiuTotal, 600000);
    assert.strictEqual(totals.ivaAmount, 114000);
    assert.strictEqual(totals.total, 3714000);
  });

  test('calculateQuoteTotals calculates global pricing mode properly', () => {
    const mockQuote: Partial<QuoteData> = {
      pricingMode: 'global',
      subtotal: 5000000,
      items: [
        { id: '1', title: 'Tarea 1', description: 'Pintura', subtotal: 0 },
      ],
      adminPct: 0,
      contingencyPct: 0,
      utilityPct: 0,
      ivaPct: 0,
    };

    const totals = calculateQuoteTotals(mockQuote as QuoteData);
    assert.strictEqual(totals.subtotal, 5000000);
    assert.strictEqual(totals.total, 5000000);
  });

  test('syncQuoteWithCalculations keeps quote state updated', () => {
    const mockQuote: Partial<QuoteData> = {
      pricingMode: 'tasks',
      items: [{ id: '1', title: 'T1', description: 'Desc', subtotal: 500000 }],
      adminPct: 0,
      contingencyPct: 0,
      utilityPct: 0,
      ivaPct: 0,
    };

    const synced = syncQuoteWithCalculations(mockQuote as QuoteData);
    assert.strictEqual(synced.subtotal, 500000);
    assert.strictEqual(synced.total, 500000);
  });

  test('toProperCase normalizes UTF-8 and respects Colombian acronyms', () => {
    const raw = 'constructora bolivar s.a.s.';
    const formatted = toProperCase(raw);
    assert.strictEqual(formatted, 'Constructora Bolivar S.A.S.');

    const mixed = 'inversiones y proyectos ltda';
    const formattedLtda = toProperCase(mixed);
    assert.strictEqual(formattedLtda, 'Inversiones Y Proyectos LTDA');
  });

  test('cleanWhitespace preserves accent marks in UTF-8 NFC', () => {
    const accented = '  Medellín,   Antioquia  ';
    const formatted = cleanWhitespace(accented);
    assert.strictEqual(formatted, 'Medellín, Antioquia');
  });
});
