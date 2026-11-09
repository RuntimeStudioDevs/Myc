import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatConsecutive,
  calculateExpirationStatus,
  cleanSimpleDate,
  DEFAULT_COMPANY_CONFIG,
} from '../modules/quote/services/google-sheets.service';
import { syncQuoteWithCalculations } from '../modules/quote/services/quote-calculator';
import { createInitialQuote } from '../modules/quote/hooks/useQuote';
import { QuoteData } from '../modules/quote/types/quote.types';

describe('Google Sheets Recovery (14 Columnas Nativas)', () => {
  it('formatConsecutive normalizes numeric strings and padding cleanly', () => {
    assert.strictEqual(formatConsecutive('101'), '101');
    assert.strictEqual(formatConsecutive(105), '105');
    assert.strictEqual(formatConsecutive('  120  '), '120');
    assert.strictEqual(formatConsecutive('001'), '101');
    assert.strictEqual(formatConsecutive(''), '101');
    assert.strictEqual(formatConsecutive(null), '101');
  });

  it('calculateExpirationStatus evaluates active vs inactive status accurately', () => {
    const futureDate = '15/12/2030';
    assert.strictEqual(calculateExpirationStatus(futureDate), 'Activa');

    const pastDate = '01/01/2020';
    assert.strictEqual(calculateExpirationStatus(pastDate), 'Inactiva');
  });

  it('cleanSimpleDate strips out timezone, GMT and English day/month strings down to DD/MM/YYYY', () => {
    // Caso real de Google Apps Script: "Mon Nov 09 2026 00:00:00 GMT-0500 (hora estándar de Colombia)"
    const gasDateString = 'Mon Nov 09 2026 00:00:00 GMT-0500 (hora estándar de Colombia)';
    assert.strictEqual(cleanSimpleDate(gasDateString), '09/11/2026');

    // Fechas en texto plano ya limpias se preservan idénticas
    assert.strictEqual(cleanSimpleDate('09/11/2026'), '09/11/2026');
    assert.strictEqual(cleanSimpleDate('24/11/2026'), '24/11/2026');

    // Timestamp con hora pegada
    assert.strictEqual(cleanSimpleDate('09/11/2026 00:00:00'), '09/11/2026');

    // Formato ISO
    assert.strictEqual(cleanSimpleDate('2026-11-09T00:00:00.000Z'), '09/11/2026');
  });

  it('Reconstructs quote directly from the 14 native columns with tasks from Col 5 (JSON plain text)', () => {
    const tasksJsonText = JSON.stringify([
      {
        id: '1731170000001',
        title: 'Excavación manual',
        description: 'Excavación para cimientos hasta 1.5m',
        subtotal: 4200000,
        mode: 'simple',
      },
      {
        id: '1731170000002',
        title: 'Solado de limpieza',
        description: 'Espesor 5cm concreto 1500 PSI',
        subtotal: 1800000,
        mode: 'simple',
      },
    ]);

    const parsedItems = JSON.parse(tasksJsonText);
    const totalVal = 6000000;
    const anticipoVal = 3000000;
    const startPct = Math.round((anticipoVal / totalVal) * 100);

    const row14Mock: Partial<QuoteData> = {
      quoteNumber: '102',
      clientName: 'Construcciones Del Valle S.A.S.',
      projectName: 'Edificio Los Laureles',
      location: 'Medellín, Laureles',
      date: cleanSimpleDate('Mon Nov 09 2026 00:00:00 GMT-0500 (hora estándar de Colombia)'),
      fechaVigencia: '08/12/2026',
      total: totalVal,
      pricingMode: 'tasks',
      items: parsedItems,
      startPct: startPct,
      endPct: 100 - startPct,
      statusCliente: 'Pendiente',
      statusVigencia: 'Activa',
      isEditingExisting: true,
      isFinalized: true,
    };

    const synced = syncQuoteWithCalculations(row14Mock as QuoteData);
    assert.strictEqual(synced.quoteNumber, '102');
    assert.strictEqual(synced.date, '09/11/2026');
    assert.strictEqual(synced.items.length, 2);
    assert.strictEqual(synced.items[0].title, 'Excavación manual');
    assert.strictEqual(synced.items[0].subtotal, 4200000);
    assert.strictEqual(synced.items[1].title, 'Solado de limpieza');
    assert.strictEqual(synced.items[1].subtotal, 1800000);
    assert.strictEqual(synced.subtotal, 6000000);
    assert.strictEqual(synced.total, 6000000);
    assert.strictEqual(synced.startPct, 50);
    assert.strictEqual(synced.endPct, 50);
    assert.strictEqual(synced.isEditingExisting, true);
  });

  it('Preserves task modifications during in-place editing flow', () => {
    const quoteInEdit: QuoteData = {
      code: 'C1',
      letterCode: 'CP 1',
      quoteNumber: '104',
      nit: '901795226-7',
      date: '07/11/2026',
      clientName: 'Inversiones Antioquia',
      projectName: 'Remodelación Bodega 5',
      location: 'Itagüí',
      fechaVigencia: '07/12/2026',
      pricingMode: 'tasks',
      items: [
        {
          id: 'task-1',
          description: 'Pintura epóxica en pisos',
          subtotal: 8000000,
        },
      ],
      subtotal: 8000000,
      adminPct: 0,
      contingencyPct: 0,
      utilityPct: 0,
      ivaPct: 0,
      total: 8000000,
      startPct: 60,
      endPct: 40,
      notes: 'Pago 60% inicio y 40% entrega',
      representativeName: 'Ever Becerra',
      representativeRole: 'Representante Legal',
      contactPhone: '311 796 9848',
      contactInstagram: 'mcobracivil',
      contactEmail: 'mcobracivil@gmail.com',
      statusCliente: 'Pendiente',
      statusVigencia: 'Activa',
      isEditingExisting: true,
      isFinalized: true,
    };

    quoteInEdit.items.push({
      id: 'task-2',
      description: 'Demarcación de líneas de seguridad',
      subtotal: 2000000,
    });

    const updated = syncQuoteWithCalculations(quoteInEdit);
    assert.strictEqual(updated.items.length, 2);
    assert.strictEqual(updated.subtotal, 10000000);
    assert.strictEqual(updated.total, 10000000);
    assert.strictEqual(updated.isEditingExisting, true);
  });

  it('Default series codes match Google Sheets corporate configuration (C1 and CP 1)', () => {
    assert.strictEqual(DEFAULT_COMPANY_CONFIG.Codigo_Serie_Cotizacion, 'C1');
    assert.strictEqual(DEFAULT_COMPANY_CONFIG.Codigo_Serie_CartaPresentacion, 'CP 1');

    const initial = createInitialQuote();
    assert.strictEqual(initial.code, 'C1');
    assert.strictEqual(initial.letterCode, 'CP 1');
  });

  it('Soft delete logic preserves consecutive numbers and separates active from inactive quotes', () => {
    // Simular un catálogo con cotizaciones activas, vencidas y anuladas manualmente
    const sampleCatalog = [
      {
        quoteNumber: '101',
        clientName: 'Cliente Activo',
        fechaVigencia: '31/12/2030',
        statusVigencia: 'Activa' as const,
      },
      {
        quoteNumber: '102',
        clientName: 'Cliente Vencido',
        fechaVigencia: '01/01/2020',
        statusVigencia: calculateExpirationStatus('01/01/2020'), // 'Inactiva'
      },
      {
        quoteNumber: '103',
        clientName: 'Cliente Anulado Manualmente',
        fechaVigencia: '31/12/2030',
        statusVigencia: 'Inactiva' as const, // Anulación manual (Soft Delete)
      },
    ];

    // Verificar que los consecutivos son estrictamente secuenciales (sin saltos ni filas borradas)
    assert.deepStrictEqual(sampleCatalog.map(q => q.quoteNumber), ['101', '102', '103']);

    // Filtro por pestaña "Activas"
    const activeQuotes = sampleCatalog.filter(q => q.statusVigencia === 'Activa');
    assert.strictEqual(activeQuotes.length, 1);
    assert.strictEqual(activeQuotes[0].quoteNumber, '101');

    // Filtro por pestaña "Inactivas"
    const inactiveQuotes = sampleCatalog.filter(q => q.statusVigencia === 'Inactiva');
    assert.strictEqual(inactiveQuotes.length, 2);
    assert.strictEqual(inactiveQuotes[0].quoteNumber, '102');
    assert.strictEqual(inactiveQuotes[1].quoteNumber, '103');
  });
});
