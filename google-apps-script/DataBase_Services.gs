/**
 * M&C Construcciones Civiles S.A.S.
 * Módulo: DataBase_Services
 * 
 * Script de base de datos serverless en Google Sheets para:
 * 1. Hoja 'CotizacionesMYC' (14 Columnas): Registro atómico, estados cliente y vigencia.
 * 2. Hoja 'ConfiguracionMYC': Parámetros corporativos centralizados (series, firmas, contacto).
 * 
 * Estructura de Columnas CotizacionesMYC (14):
 * 1. Numero Cotizacion          (ej: "001", "002")
 * 2. Cliente Proyecto           (Nombre del cliente o razón social)
 * 3. Nombre Proyecto            (Obra o proyecto civil)
 * 4. Ubicacion Proyecto         (Dirección o municipio)
 * 5. Tareas Proyecto            (JSON estructurado de tareas para reconstrucción limpia)
 * 6. Numero Tareas Proyecto     (Cantidad entera de tareas)
 * 7. Valor Anticipo             (Monto calculado en dinero COP $)
 * 8. Valor Saldo                (Monto calculado en dinero COP $)
 * 9. Total Cotizado             (Monto total en dinero COP $)
 * 10. Estado Cotizacion Cliente ("Pendiente", "Confirmada", "Rechazada")
 * 11. Estado Cotizacion         ("Activa", "Inactiva" - según Fecha Vigencia)
 * 12. Fecha Vigencia            (DD/MM/YYYY)
 * 13. Creado El                 (DD/MM/YYYY)
 * 14. Actualizado El             (DD/MM/YYYY)
 */

const SHEET_NAME_QUOTES = 'CotizacionesMYC';
const SHEET_NAME_CONFIG = 'ConfiguracionMYC';
const DEFAULT_START_NUMBER = 101; // Base inicial: 101 (inicia en 100, primera cotización 101)

const DEFAULT_CONFIG_ENTRIES = [
  ['Codigo_Serie_Cotizacion', 'COT1'],
  ['Codigo_Serie_CartaPresentacion', 'CTP1'],
  ['Cuidad_CartaPresentacion', 'Medellín'],
  ['Firma_RepresentanteLegal', 'Ever Becerra'],
  ['Firma_CargoInstitucional', 'Representante Legal'],
  ['Firma_NumeroCelular', '311 796 9848'],
  ['Firma_CorreoElectronico', 'mcobracivil@gmail.com'],
  ['Firma_Instagram', 'mcobracivil'],
  ['Firma_WhatsApp', '311 796 9848'],
  ['Firma_NitEmpresa', '901795226-7']
];

/**
 * Formatea un número como consecutivo con padding de 3 dígitos (ej: 1 -> "001", 25 -> "025", 101 -> "101")
 */
function formatConsecutiveNumber(num) {
  const parsed = parseInt(num, 10);
  if (isNaN(parsed) || parsed < 101) {
    return '101';
  }
  return parsed < 1000 ? String(parsed).padStart(3, '0') : String(parsed);
}

/**
 * Obtiene la fecha actual en formato local legible (DD/MM/YYYY) sin hora
 */
function getLocalDateString(baseDate) {
  const d = baseDate || new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Parsea una fecha en formato DD/MM/YYYY o ISO a un objeto Date a medianoche (00:00:00)
 */
function parseDateOnly(dateStr) {
  if (!dateStr) return null;
  const str = String(dateStr).trim();

  // Formato DD/MM/YYYY
  const parts = str.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      return new Date(year, month, day, 23, 59, 59, 999);
    }
  }

  // Fallback ISO
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    d.setHours(23, 59, 59, 999);
    return d;
  }
  return null;
}

/**
 * Determina si una cotización está "Activa" o "Inactiva" según su fecha de vigencia.
 * Si hoy es 8/11/2026 y la fecha de vigencia es 8/11/2026, sigue Activa hasta las 23:59:59.
 * Mañana 9/11/2026 pasará a Inactiva.
 */
function calculateExpirationStatus(fechaVigenciaStr) {
  const vigenciaDate = parseDateOnly(fechaVigenciaStr);
  if (!vigenciaDate) return 'Activa';

  const now = new Date();
  return now.getTime() <= vigenciaDate.getTime() ? 'Activa' : 'Inactiva';
}

/**
 * Lee la pestaña ConfiguracionMYC y retorna un mapa clave-valor
 */
function getCompanyConfig(ss) {
  let sheet = ss.getSheetByName(SHEET_NAME_CONFIG);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME_CONFIG);
    setupConfigSheet(sheet);
  }

  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    setupConfigSheet(sheet);
  }

  const values = sheet.getRange(2, 1, Math.max(1, sheet.getLastRow() - 1), 2).getValues();
  const config = {};

  for (let i = 0; i < values.length; i++) {
    const key = String(values[i][0]).trim();
    const val = String(values[i][1]).trim();
    if (key) {
      config[key] = val;
    }
  }

  // Rellenar con defaults si alguna clave falta
  for (let j = 0; j < DEFAULT_CONFIG_ENTRIES.length; j++) {
    const defKey = DEFAULT_CONFIG_ENTRIES[j][0];
    const defVal = DEFAULT_CONFIG_ENTRIES[j][1];
    if (!config[defKey]) {
      config[defKey] = defVal;
    }
  }

  return config;
}

/**
 * Inicializa la pestaña ConfiguracionMYC con estilo corporativo
 */
function setupConfigSheet(sheet) {
  sheet.clear();
  sheet.appendRow(['Configuracion', 'Valor']);
  const headerRange = sheet.getRange(1, 1, 1, 2);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#234794');
  headerRange.setFontColor('#FFFFFF');

  for (let i = 0; i < DEFAULT_CONFIG_ENTRIES.length; i++) {
    sheet.appendRow(DEFAULT_CONFIG_ENTRIES[i]);
  }

  sheet.setFrozenRows(1);
  sheet.autoResizeColumn(1);
  sheet.autoResizeColumn(2);
}

/**
 * Manejador GET: Consulta de consecutivo disponible y configuración corporativa en un solo viaje
 */
function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let quoteSheet = ss.getSheetByName(SHEET_NAME_QUOTES);

    if (!quoteSheet) {
      quoteSheet = ss.insertSheet(SHEET_NAME_QUOTES);
      setupQuoteHeaders(quoteSheet);
    }

    const nextNumber = getNextConsecutiveNumber(quoteSheet);
    const config = getCompanyConfig(ss);

    return createJsonResponse({
      success: true,
      nextQuoteNumber: formatConsecutiveNumber(nextNumber),
      config: config,
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
 * Manejador POST: Guardado Atómico de Cotizaciones (14 Columnas)
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    // Esperar hasta 10 segundos por el candado atómico
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
    let quoteSheet = ss.getSheetByName(SHEET_NAME_QUOTES);

    if (!quoteSheet) {
      quoteSheet = ss.insertSheet(SHEET_NAME_QUOTES);
      setupQuoteHeaders(quoteSheet);
    }

    // ACCIÓN 1: Validar disponibilidad y no duplicidad
    if (action === 'validate_quote') {
      const quote = contents.quote || {};
      const validation = validateQuoteData(quoteSheet, quote);
      return createJsonResponse(validation);
    }

    // ACCIÓN 2: Guardar nueva cotización (14 Columnas)
    if (action === 'save_quote') {
      const quote = contents.quote || {};

      // 1. Validar duplicidad
      const duplicateCheck = checkDuplicateQuote(quoteSheet, quote);
      if (duplicateCheck.isDuplicate) {
        return createJsonResponse({
          success: false,
          error: `Ya existe una cotización idéntica (N° ${duplicateCheck.existingNumber}) para el cliente "${quote.clientName}" y proyecto "${quote.projectName}".`,
          existingNumber: duplicateCheck.existingNumber,
          isDuplicate: true
        });
      }

      // 2. Determinar número consecutivo atómico libre
      let quoteNumberRaw = quote.quoteNumber ? parseInt(quote.quoteNumber, 10) : null;
      const nextAvailableNumber = getNextConsecutiveNumber(quoteSheet);

      if (!quoteNumberRaw || isNumberAlreadyTaken(quoteSheet, quoteNumberRaw)) {
        quoteNumberRaw = nextAvailableNumber;
      }

      const formattedNumber = formatConsecutiveNumber(quoteNumberRaw);

      // 3. Preparar valores de las 14 columnas oficiales
      const clientName = (quote.clientName || '').trim() || 'Sin Nombre';
      const projectName = (quote.projectName || '').trim() || 'Sin Proyecto';
      const location = (quote.location || '').trim() || 'Medellín';

      let tareasJson = '[]';
      let numeroTareas = 0;
      if (Array.isArray(quote.items)) {
        tareasJson = JSON.stringify(quote.items);
        numeroTareas = quote.items.length;
      } else if (typeof quote.tasksJson === 'string') {
        tareasJson = quote.tasksJson;
        try {
          const parsed = JSON.parse(quote.tasksJson);
          numeroTareas = Array.isArray(parsed) ? parsed.length : 0;
        } catch (_) {
          numeroTareas = 0;
        }
      }

      const totalAmount = parseFloat(quote.total) || 0;
      const valorAnticipo = parseFloat(quote.valorAnticipo) || Math.round(totalAmount * ((parseFloat(quote.startPct) || 50) / 100));
      const valorSaldo = parseFloat(quote.valorSaldo) || (totalAmount - valorAnticipo);

      // ENUMS oficiales
      const estadoCliente = quote.statusCliente || 'Pendiente'; // "Pendiente", "Confirmada", "Rechazada"
      const fechaVigencia = quote.fechaVigencia || getLocalDateString(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
      const estadoVigencia = calculateExpirationStatus(fechaVigencia); // "Activa" o "Inactiva"
      const fechaActual = getLocalDateString();

      const rowData = [
        formattedNumber,    // Col 1: Numero Cotizacion
        clientName,         // Col 2: Cliente Proyecto
        projectName,        // Col 3: Nombre Proyecto
        location,           // Col 4: Ubicacion Proyecto
        tareasJson,         // Col 5: Tareas Proyecto (JSON estructurado)
        numeroTareas,       // Col 6: Numero Tareas Proyecto
        valorAnticipo,      // Col 7: Valor Anticipo ($)
        valorSaldo,         // Col 8: Valor Saldo ($)
        totalAmount,        // Col 9: Total Cotizado ($)
        estadoCliente,      // Col 10: Estado Cotizacion Cliente
        estadoVigencia,     // Col 11: Estado Cotizacion
        fechaVigencia,      // Col 12: Fecha Vigencia
        fechaActual,        // Col 13: Creado El
        fechaActual         // Col 14: Actualizado El
      ];

      quoteSheet.appendRow(rowData);
      const lastRow = quoteSheet.getLastRow();

      // Formatear columnas de moneda (Col 7: Anticipo, Col 8: Saldo, Col 9: Total)
      quoteSheet.getRange(lastRow, 7).setNumberFormat('"$"#,##0');
      quoteSheet.getRange(lastRow, 8).setNumberFormat('"$"#,##0');
      quoteSheet.getRange(lastRow, 9).setNumberFormat('"$"#,##0');

      // Forzar texto para columnas de código y fecha
      quoteSheet.getRange(lastRow, 1).setNumberFormat('@');
      quoteSheet.getRange(lastRow, 12).setNumberFormat('@');

      return createJsonResponse({
        success: true,
        quoteNumber: formattedNumber,
        row: lastRow,
        statusCliente: estadoCliente,
        statusVigencia: estadoVigencia,
        fechaVigencia: fechaVigencia,
        message: `Cotización N° ${formattedNumber} registrada exitosamente en CotizacionesMYC`
      });
    }

    return createJsonResponse({
      success: false,
      error: `Acción '${action}' no reconocida`
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
 * Valida si un número de cotización ya está tomado en la Columna 1
 */
function isNumberAlreadyTaken(sheet, targetNumber) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return false;

  const targetParsed = parseInt(targetNumber, 10);
  const values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();

  for (let i = 0; i < values.length; i++) {
    const rawVal = values[i][0];
    const cleanNum = parseInt(String(rawVal).replace(/\D/g, ''), 10);
    if (!isNaN(cleanNum) && cleanNum === targetParsed) {
      return true;
    }
  }
  return false;
}

/**
 * Valida si ya existe una cotización idéntica (mismo cliente, proyecto y total)
 */
function checkDuplicateQuote(sheet, quote) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { isDuplicate: false };

  const targetClient = (quote.clientName || '').trim().toLowerCase();
  const targetProject = (quote.projectName || '').trim().toLowerCase();
  const targetTotal = parseFloat(quote.total) || 0;

  if (!targetClient && !targetProject) {
    return { isDuplicate: false };
  }

  const data = sheet.getRange(2, 1, lastRow - 1, 9).getValues();

  for (let i = 0; i < data.length; i++) {
    const existingNum = String(data[i][0]);
    const existingClient = String(data[i][1]).trim().toLowerCase();
    const existingProject = String(data[i][2]).trim().toLowerCase();
    const existingTotal = parseFloat(data[i][8]) || 0;

    if (
      targetClient &&
      targetProject &&
      existingClient === targetClient &&
      existingProject === targetProject &&
      Math.abs(existingTotal - targetTotal) < 1
    ) {
      return {
        isDuplicate: true,
        existingNumber: existingNum
      };
    }
  }

  return { isDuplicate: false };
}

/**
 * Valida los datos antes de proceder a guardarla
 */
function validateQuoteData(sheet, quote) {
  const num = quote.quoteNumber ? parseInt(quote.quoteNumber, 10) : null;
  const isTaken = num ? isNumberAlreadyTaken(sheet, num) : false;
  const dupCheck = checkDuplicateQuote(sheet, quote);

  if (dupCheck.isDuplicate) {
    return {
      success: false,
      isAvailable: false,
      isDuplicate: true,
      error: `Ya existe una cotización idéntica (N° ${dupCheck.existingNumber}) para el cliente "${quote.clientName}" y proyecto "${quote.projectName}".`
    };
  }

  if (isTaken) {
    const nextFree = formatConsecutiveNumber(getNextConsecutiveNumber(sheet));
    return {
      success: false,
      isAvailable: false,
      isDuplicate: false,
      suggestedNumber: nextFree,
      error: `El consecutivo N° ${formatConsecutiveNumber(num)} ya está en uso. El próximo consecutivo libre es N° ${nextFree}.`
    };
  }

  return {
    success: true,
    isAvailable: true,
    isDuplicate: false
  };
}

/**
 * Escanea la Columna 1 para encontrar el número más alto
 */
function getNextConsecutiveNumber(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return 101;
  }

  const values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  let maxNum = 100;

  for (let i = 0; i < values.length; i++) {
    const rawVal = values[i][0];
    const cleanNum = parseInt(String(rawVal).replace(/\D/g, ''), 10);
    if (!isNaN(cleanNum) && cleanNum > maxNum) {
      maxNum = cleanNum;
    }
  }

  return maxNum < 101 ? 101 : maxNum + 1;
}

/**
 * Configura los encabezados oficiales de CotizacionesMYC (14 Columnas)
 */
function setupQuoteHeaders(sheet) {
  const headers = [
    'Numero Cotizacion',
    'Cliente Proyecto',
    'Nombre Proyecto',
    'Ubicacion Proyecto',
    'Tareas Proyecto',
    'Numero Tareas Proyecto',
    'Valor Anticipo',
    'Valor Saldo',
    'Total Cotizado',
    'Estado Cotizacion Cliente',
    'Estado Cotizacion',
    'Fecha Vigencia',
    'Creado El',
    'Actualizado El'
  ];

  sheet.appendRow(headers);
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#234794');
  headerRange.setFontColor('#FFFFFF');
  sheet.setFrozenRows(1);

  sheet.getRange('A:A').setNumberFormat('@');
  sheet.getRange('L:L').setNumberFormat('@');

  for (let col = 1; col <= headers.length; col++) {
    sheet.autoResizeColumn(col);
  }
}

/**
 * Helper para emitir respuestas JSON estándar
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
