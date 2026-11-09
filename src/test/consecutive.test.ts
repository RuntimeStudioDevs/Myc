import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { formatConsecutive, calculateExpirationStatus } from '../modules/quote/services/google-sheets.service';
import { cleanNumericConsecutive } from '../modules/quote/services/export-strategies/export-strategy.interface';

describe('Consecutive and Business Rules', () => {
  test('formatConsecutive enforces minimum 101 and proper padding', () => {
    // Nullish or empty values must fall back to 101
    assert.strictEqual(formatConsecutive(undefined), '101');
    assert.strictEqual(formatConsecutive(null), '101');
    assert.strictEqual(formatConsecutive(''), '101');

    // Values <= 100 must be elevated to 101
    assert.strictEqual(formatConsecutive('001'), '101');
    assert.strictEqual(formatConsecutive('1'), '101');
    assert.strictEqual(formatConsecutive('99'), '101');
    assert.strictEqual(formatConsecutive('100'), '101');

    // Values >= 101 must be preserved and padded
    assert.strictEqual(formatConsecutive('101'), '101');
    assert.strictEqual(formatConsecutive(101), '101');
    assert.strictEqual(formatConsecutive(102), '102');
    assert.strictEqual(formatConsecutive(1050), '1050');
  });

  test('cleanNumericConsecutive sanitizes prefixes and ensures minimum 101', () => {
    assert.strictEqual(cleanNumericConsecutive(undefined), '101');
    assert.strictEqual(cleanNumericConsecutive(''), '101');
    assert.strictEqual(cleanNumericConsecutive('COT-001'), '101');
    assert.strictEqual(cleanNumericConsecutive('COT-100'), '101');
    assert.strictEqual(cleanNumericConsecutive('COT-101'), '101');
    assert.strictEqual(cleanNumericConsecutive('COT-105'), '105');
  });

  test('calculateExpirationStatus evaluates date active/inactive correctly', () => {
    // Empty date is active by default
    assert.strictEqual(calculateExpirationStatus(undefined), 'Activa');

    // Future date is Activa
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const day = String(futureDate.getDate()).padStart(2, '0');
    const month = String(futureDate.getMonth() + 1).padStart(2, '0');
    const year = futureDate.getFullYear();
    assert.strictEqual(calculateExpirationStatus(`${day}/${month}/${year}`), 'Activa');

    // Past date is Inactiva
    assert.strictEqual(calculateExpirationStatus('01/01/2020'), 'Inactiva');
  });
});
