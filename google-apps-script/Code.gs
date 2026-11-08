/**
 * M&C Construcciones Civiles S.A.S.
 * Script de Sincronización y Asignación Atómica de Cotizaciones en Google Sheets
 * 
 * Instrucciones de Implementación:
 * 1. Abre tu hoja de cálculo en Google Sheets (crea una nueva en tu Google Drive).
 * 2. En el menú superior, ve a: Extensiones > Apps Script.
 * 3. Borra todo el código existente y pega este archivo completo.
 * 4. Haz clic en "Guardar" (icono de disquete).
 * 5. Haz clic en el botón azul superior "Implementar" > "Nueva implementación".
 * 6. En el engranaje "Seleccionar tipo", elige "Aplicación web".
 * 7. Configura exactamente:
 *    - Descripción: "M&C Cotizador API"
 *    - Ejecutar como: "Yo (tu_correo@gmail.com)"
 *    - Quién tiene acceso: "Cualquiera" (IMPORTANTE para que Vercel pueda enviar datos sin login complejo).
 * 8. Haz clic en "Implementar", autoriza los permisos con tu cuenta de Google.
 * 9. Copia la "URL de la aplicación web" (termina en /exec) y pégala en tu archivo .env o en Vercel
 *    como: VITE_GOOGLE_SHEETS_WEBHOOK_URL="https://script.google.com/macros/s/.../exec"
 */

const SHEET_NAME = 'Cotizaciones';
const DEFAULT_START_NUMBER = 101; // Consecutivo inicial oficial solicitado

/**
 * Manejador de peticiones POST (Creación y Asignación Atómica de Cotización)
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    // Esperar hasta 10 segundos por el candado atómico para evitar colisiones
    lock.waitLock(10000);

    let contents = {};
    if (e && e.postData && e.postData.contents) {
      try {
        contents = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        contents = {};
      }
    }

    const action = contents.action || 'save_quote';
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      setupHeaders(sheet);
    }

    if (action === 'save_quote') {
      const quote = contents.quote || {};
      const nextNumber = getNextConsecutiveNumber(sheet);
      const totalAmount = parseFloat(quote.total) || 0;

      const rowData = [
        nextNumber,                                          // Col A: Consecutivo
        quote.date || new Date().toLocaleDateString('es-CO'),// Col B: Fecha
        quote.clientName || 'Sin Nombre',                    // Col C: Cliente
        quote.projectName || 'Sin Proyecto',                // Col D: Proyecto
        quote.location || 'Medellín',                        // Col E: Ubicación
        totalAmount,                                         // Col F: Total Cotizado
        quote.startPct || 50,                                // Col G: Anticipo (%)
        quote.endPct || 50,                                  // Col H: Saldo (%)
        quote.status || 'Enviada',                           // Col I: Estado (Enviada, Aprobada, Rechazada)
        quote.contactPhone || '311 796 9848',                // Col J: Teléfono
        quote.contactEmail || 'mcobracivil@gmail.com',       // Col K: Correo
        quote.letterCity || 'Medellín',                      // Col L: Ciudad
        (quote.items && quote.items.length) || 0,            // Col M: N° Ítems
        new Date().toISOString()                             // Col N: Timestamp Creación
      ];

      sheet.appendRow(rowData);
      const lastRow = sheet.getLastRow();

      // Formatear celda de dinero en Columna F
      sheet.getRange(lastRow, 6).setNumberFormat('"$"#,##0');

      return createJsonResponse({
        success: true,
        quoteNumber: String(nextNumber),
        row: lastRow,
        status: quote.status || 'Enviada',
        message: 'Cotización registrada con éxito en Google Sheets'
      });
    }

    return createJsonResponse({
      success: false,
      error: 'Acción no reconocida'
    });

  } catch (error) {
    return createJsonResponse({
      success: false,
      error: error.toString()
    });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Manejador de peticiones GET (Consulta de Próximo Consecutivo y Health Check)
 */
function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
      return createJsonResponse({
        success: true,
        nextQuoteNumber: String(DEFAULT_START_NUMBER),
        status: 'online',
        message: 'Hoja inicializada con base ' + DEFAULT_START_NUMBER
      });
    }

    const nextNumber = getNextConsecutiveNumber(sheet);
    return createJsonResponse({
      success: true,
      nextQuoteNumber: String(nextNumber),
      status: 'online'
    });
  } catch (err) {
    return createJsonResponse({
      success: false,
      error: err.toString()
    });
  }
}

/**
 * Escanea la Columna A para encontrar el número más alto y retornar el siguiente consecutivo atómico.
 */
function getNextConsecutiveNumber(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return DEFAULT_START_NUMBER;
  }

  const values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  let maxNum = DEFAULT_START_NUMBER - 1;

  for (let i = 0; i < values.length; i++) {
    const rawVal = values[i][0];
    const cleanNum = parseInt(String(rawVal).replace(/\D/g, ''), 10);
    if (!isNaN(cleanNum) && cleanNum > maxNum) {
      maxNum = cleanNum;
    }
  }

  return maxNum + 1;
}

/**
 * Configura los encabezados institucionales de la hoja con diseño corporativo M&C (#234794).
 */
function setupHeaders(sheet) {
  const headers = [
    'N° Consecutivo',
    'Fecha',
    'Cliente',
    'Proyecto',
    'Ubicación',
    'Total Cotizado ($)',
    'Anticipo (%)',
    'Saldo (%)',
    'Estado',
    'Teléfono Contacto',
    'Correo Contacto',
    'Ciudad',
    'N° Ítems',
    'Fecha Creación (ISO)'
  ];

  sheet.appendRow(headers);
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#234794');
  headerRange.setFontColor('#FFFFFF');
  sheet.setFrozenRows(1);

  // Auto-ajustar ancho de columnas
  for (let col = 1; col <= headers.length; col++) {
    sheet.autoResizeColumn(col);
  }
}

/**
 * Helper para emitir respuestas JSON estándar con cabeceras CORS
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
