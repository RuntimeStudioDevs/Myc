/**
 * Utilidades para formateo y parseo de moneda colombiana (COP).
 */

export const formatCurrency = (val: number | undefined | null): string => {
  if (val === undefined || val === null || isNaN(val)) return '$(VALOR)';
  return `$ ${Number(val).toLocaleString('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

export const parseCurrency = (val: string | number): number => {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const clean = val.replace(/[^0-9,-]/g, '').replace(',', '.');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
};
