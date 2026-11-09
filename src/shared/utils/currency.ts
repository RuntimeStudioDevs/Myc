/**
 * Utilidades para formateo, parseo y conversión textual de moneda colombiana (COP) y fechas.
 */

export const formatCurrency = (val: number | undefined | null): string => {
  if (val === undefined || val === null || isNaN(val)) return '$(VALOR)';
  return `$ ${Number(val).toLocaleString('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

/**
 * Formatea un valor numérico en tiempo real con separadores de miles colombianos (COP: 1.000.000).
 */
export const formatCOPInput = (val: number | string | undefined | null): string => {
  if (val === undefined || val === null || val === '') return '';
  const digits = String(val).replace(/\D/g, '');
  if (!digits) return '';
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

export const parseCurrency = (val: string | number): number => {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const clean = val.replace(/[^0-9,-]/g, '').replace(',', '.');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
};

/**
 * Convierte un número de 0 a 999 en palabras en español.
 */
function section3DigitsToWords(n: number): string {
  const units = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
  const teens = [
    'DIEZ',
    'ONCE',
    'DOCE',
    'TRECE',
    'CATORCE',
    'QUINCE',
    'DIECISÉIS',
    'DIECISIETE',
    'DIECIOCHO',
    'DIECINUEVE',
  ];
  const twenties = [
    'VEINTE',
    'VEINTIÚN',
    'VEINTIDÓS',
    'VEINTITRÉS',
    'VEINTICUATRO',
    'VEINTICINCO',
    'VEINTISÉIS',
    'VEINTISIETE',
    'VEINTIOCHO',
    'VEINTINUEVE',
  ];
  const tens = [
    '',
    '',
    'VEINTE',
    'TREINTA',
    'CUARENTA',
    'CINCUENTA',
    'SESENTA',
    'SETENTA',
    'OCHENTA',
    'NOVENTA',
  ];
  const hundreds = [
    '',
    'CIENTO',
    'DOSCIENTOS',
    'TRESCIENTOS',
    'CUATROCIENTOS',
    'QUINIENTOS',
    'SEISCIENTOS',
    'SETECIENTOS',
    'OCHOCIENTOS',
    'NOVECIENTOS',
  ];

  if (n === 0) return '';
  if (n === 100) return 'CIEN';

  let result = '';
  const c = Math.floor(n / 100);
  const d = Math.floor((n % 100) / 10);
  const u = n % 10;

  if (c > 0) {
    result += hundreds[c] + ' ';
  }

  const remainder = n % 100;
  if (remainder >= 10 && remainder <= 19) {
    result += teens[remainder - 10];
  } else if (remainder >= 20 && remainder <= 29) {
    result += twenties[remainder - 20];
  } else {
    if (d > 0) {
      result += tens[d];
      if (u > 0) {
        result += ' Y ' + units[u];
      }
    } else if (u > 0) {
      result += units[u];
    }
  }

  return result.trim();
}

/**
 * Convierte un importe numérico a su representación legal formal en letras
 * en Pesos Colombianos (COP) Moneda Corriente (M/CTE).
 * Ejemplo: 20384000 -> "VEINTE MILLONES TRESCIENTOS OCHENTA Y CUATRO MIL PESOS M/CTE"
 */
export function numberToWordsCOP(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount) || amount === 0) {
    return 'CERO PESOS M/CTE';
  }

  const intVal = Math.floor(Math.abs(amount));
  if (intVal === 0) return 'CERO PESOS M/CTE';

  // Descomposición en grupos de 3 dígitos: unidades, miles, millones, miles de millones, billones
  const billones = Math.floor(intVal / 1000000000000);
  const millones = Math.floor((intVal % 1000000000000) / 1000000);
  const miles = Math.floor((intVal % 1000000) / 1000);
  const unidades = intVal % 1000;

  const parts: string[] = [];

  if (billones > 0) {
    if (billones === 1) {
      parts.push('UN BILLÓN');
    } else {
      parts.push(section3DigitsToWords(billones) + ' BILLONES');
    }
  }

  if (millones > 0) {
    if (millones === 1) {
      parts.push('UN MILLÓN');
    } else {
      parts.push(section3DigitsToWords(millones) + ' MILLONES');
    }
  }

  if (miles > 0) {
    if (miles === 1) {
      parts.push('MIL');
    } else {
      parts.push(section3DigitsToWords(miles) + ' MIL');
    }
  }

  if (unidades > 0) {
    parts.push(section3DigitsToWords(unidades));
  }

  const textWords = parts.join(' ').trim();

  // Si termina exactamente en millones o billones sin miles ni unidades, en español formal va "DE PESOS M/CTE"
  const endsInMillionOrBillion =
    (millones > 0 || billones > 0) && miles === 0 && unidades === 0;

  const currencySuffix = endsInMillionOrBillion ? 'DE PESOS M/CTE' : 'PESOS M/CTE';

  return `${textWords} ${currencySuffix}`;
}

/**
 * Formatea una fecha DD/MM/AAAA o ISO a formato largo epistolar en español.
 * Ejemplo: "27/10/2026" con ciudad "Medellín" -> "Medellín, 27 de Octubre de 2026"
 */
export function formatDateToLongSpanish(
  dateStr?: string,
  city: string = 'Medellín'
): string {
  const monthNames = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];

  let day = 0;
  let monthIndex = 0;
  let year = 0;

  if (dateStr && dateStr.trim() !== '') {
    // Si viene en formato DD/MM/AAAA o D/M/AAAA
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length >= 3) {
        day = parseInt(parts[0], 10);
        monthIndex = parseInt(parts[1], 10) - 1;
        year = parseInt(parts[2], 10);
      }
    } else if (dateStr.includes('-')) {
      // Formato YYYY-MM-DD
      const parts = dateStr.split('-');
      if (parts.length >= 3) {
        year = parseInt(parts[0], 10);
        monthIndex = parseInt(parts[1], 10) - 1;
        day = parseInt(parts[2], 10);
      }
    }
  }

  // Si no se pudo parsear o no venía fecha válida, tomar fecha actual
  if (!day || isNaN(day) || monthIndex < 0 || monthIndex > 11 || !year || isNaN(year)) {
    const now = new Date();
    day = now.getDate();
    monthIndex = now.getMonth();
    year = now.getFullYear();
  }

  const cleanCity = city && city.trim() !== '' ? city.trim() : 'Medellín';
  const monthName = monthNames[monthIndex] || 'Enero';

  return `${cleanCity}, ${day} de ${monthName} de ${year}`;
}

