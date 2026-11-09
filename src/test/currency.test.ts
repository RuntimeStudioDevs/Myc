import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { formatCurrency, formatCOPInput, parseCurrency, numberToWordsCOP } from '../shared/utils/currency';

describe('Currency and COP Utilities', () => {
  test('formatCurrency formats standard amounts with COP symbol and thousands separators', () => {
    assert.strictEqual(formatCurrency(0), '$ 0');
    assert.strictEqual(formatCurrency(1000), '$ 1.000');
    assert.strictEqual(formatCurrency(1500000), '$ 1.500.000');
    assert.strictEqual(formatCurrency(25300450), '$ 25.300.450');
  });

  test('formatCOPInput formats live input typing with dots', () => {
    assert.strictEqual(formatCOPInput(''), '');
    assert.strictEqual(formatCOPInput('0'), '0');
    assert.strictEqual(formatCOPInput('50000'), '50.000');
    assert.strictEqual(formatCOPInput('1250000'), '1.250.000');
    assert.strictEqual(formatCOPInput('abc1250000xyz'), '1.250.000');
  });

  test('parseCurrency extracts pure numeric value from formatted strings', () => {
    assert.strictEqual(parseCurrency(''), 0);
    assert.strictEqual(parseCurrency('1.250.000'), 1250000);
    assert.strictEqual(parseCurrency('$ 3.500.000 COP'), 3500000);
    assert.strictEqual(parseCurrency(0), 0);
  });

  test('numberToWordsCOP converts numeric values to Colombian legal text', () => {
    const lettersZero = numberToWordsCOP(0);
    assert.strictEqual(lettersZero, 'CERO PESOS M/CTE');

    const lettersMillion = numberToWordsCOP(1000000);
    assert.strictEqual(lettersMillion, 'UN MILLÓN DE PESOS M/CTE');

    const lettersCombined = numberToWordsCOP(2500000);
    assert.strictEqual(lettersCombined, 'DOS MILLONES QUINIENTOS MIL PESOS M/CTE');
  });
});
