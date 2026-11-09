/**
 * M&C Construcciones Civiles S.A.S.
 * Módulo: DataBase_Services
 * 
 * Script de base de datos serverless en Google Sheets para:
 * 1. Hoja 'CotizacionesMYC' (14 Columnas Nativas en Texto Plano):
 *    Registro atómico, estados cliente, vigencia y tareas en texto plano sin zonas horarias ni formato extendido.
 * 2. Hoja 'ConfiguracionMYC': Parámetros corporativos centralizados (Series: C1 para cotización, CP 1 para carta, firmas y contacto).
 * 
 * Estructura Oficial de Columnas CotizacionesMYC (14):
 * 1. Numero Cotizacion          (ej: "101", "102")
 * 2. Cliente Proyecto           (Nombre del cliente o razón social)
 * 3. Nombre Proyecto            (Obra o proyecto civil)
 * 4. Ubicacion Proyecto         (Dirección o municipio)
 * 5. Tareas Proyecto            (JSON / Texto plano de tareas)
 * 6. Numero Tareas Proyecto     (Cantidad entera de tareas)
 * 7. Valor Anticipo             (Monto en dinero COP $)
 * 8. Valor Saldo                (Monto en dinero COP $)
 * 9. Total Cotizado             (Monto total en dinero COP $)
 * 10. Estado Cotizacion Cliente ("Pendiente", "Confirmada", "Rechazada")
 * 11. Estado Cotizacion         ("Activa", "Inactiva")
 * 12. Fecha Vigencia            (DD/MM/YYYY - Texto Plano)
 * 13. Creado El                 (DD/MM/YYYY - Texto Plano)
 * 14. Actualizado El            (DD/MM/YYYY - Texto Plano)
 */

const SHEET_NAME_QUOTES = 'CotizacionesMYC';
const SHEET_NAME_CONFIG = 'ConfiguracionMYC';
const DEFAULT_START_NUMBER = 101; // Base inicial: 101

const DEFAULT_CONFIG_ENTRIES = [
  ['Codigo_Serie_Cotizacion', 'C1'],
  ['Codigo_Serie_CartaPresentacion', 'CP 1'],
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
  const clean = String(num || '').trim().replace(/\D/g, '');
  const parsed = parseInt(clean, 10);
  if (isNaN(parsed) || parsed < 101) {
    return '101';
  }
  return parsed < 1000 ? String(parsed).padStart(3, '0') : String(parsed);
}

/**
 * Obtiene la fecha actual en formato local limpio (DD/MM/YYYY) sin hora ni zona horaria
 */
function getLocalDateString(baseDate) {
  const d = baseDate || new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Limpia y normaliza cualquier fecha a formato corto puro de texto plano (DD/MM/YYYY).
 * Elimina cualquier rastro de GMT, hora estándar de Colombia o formato largo.
 */
function cleanDateText(val) {
  if (!val) return '';
  if (val instanceof Date) {
    const day = String(val.getDate()).padStart(2, '0');
    const month = String(val.getMonth() + 1).padStart(2, '0');
    const year = val.getFullYear();
    return `${day}/${month}/${year}`;
  }
  const str = String(val).trim();

  // Si contiene GMT, hora estándar o formato largo de Apps Script
  if (str.includes('GMT') || str.includes('hora estándar') || str.includes('Colombia')) {
    const match = str.match(/([A-Za-z]{3})\s+(\d{1,2})\s+(\d{4})/);
    if (match) {
      const monthNames = {
        jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
        jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
      };
      const monthKey = match[1].toLowerCase();
      const month = monthNames[monthKey] || '11';
      const day = match[2].padStart(2, '0');
      const year = match[3];
      return `${day}/${month}/${year}`;
    }
  }

  // Si viene en formato ISO tipo YYYY-MM-DD
  if (str.includes('-') && !str.includes('/')) {
    const datePart = str.split('T')[0].split(' ')[0];
    const parts = datePart.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      const year = parts[0];
      const month = parts[1].padStart(2, '0');
      const day = parts[2].padStart(2, '0');
      return `${day}/${month}/${year}`;
    }
  }

  // Si tiene sufijo de hora tipo "09/11/2026 00:00:00"
  if (str.includes(' ')) {
    const firstToken = str.split(' ')[0];
    if (firstToken.includes('/')) {
      return firstToken;
    }
  }
  return str;
}

/**
 * Extrae valores numéricos limpios a partir de texto formateado con moneda
 */
function parseNumericValue(val) {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const clean = String(val || '').replace(/[^0-9.-]+/g, '');
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Parsea una fecha en formato DD/MM/YYYY a medianoche para evaluar vigencia
 */
function parseDateOnly(dateStr) {
  if (!dateStr) return null;
  const str = cleanDateText(dateStr);

  const parts = str.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      return new Date(year, month, day, 23, 59, 59, 999);
    }
  }

  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    d.setHours(23, 59, 59, 999);
    return d;
  }
  return null;
}

/**
 * Determina si una cotización está "Activa" o "Inactiva" según su fecha de vigencia
 */
function calculateExpirationStatus(fechaVigenciaStr) {
  const vigenciaDate = parseDateOnly(fechaVigenciaStr);
  if (!vigenciaDate) return 'Activa';

  const now = new Date();
  return now.getTime() <= vigenciaDate.getTime() ? 'Activa' : 'Inactiva';
}

/**
 * Parsea las tareas de la Columna 5 tolerando tanto JSON serializado como texto plano
 */
function parseTasksCell(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  const str = String(raw).trim();
  if (!str) return [];

  // 1. Intentar como JSON estructurado
  if (str.startsWith('[') || str.startsWith('{')) {
    try {
      const parsed = JSON.parse(str);
      if (Array.isArray(parsed)) return parsed;
      if (parsed && typeof parsed === 'object') return [parsed];
    } catch (_) {}
  }

  // 2. Si es texto plano por renglones
  const lines = str.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length > 0) {
    return lines.map((line, idx) => ({
      id: String(Date.now() + idx),
      title: '',
      description: line.trim(),
      subtotal: 0,
      mode: 'simple'
    }));
  }

  return [{
    id: String(Date.now()),
    title: '',
    description: str,
    subtotal: 0,
    mode: 'simple'
  }];
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

  const values = sheet.getRange(2, 1, Math.max(1, sheet.getLastRow() - 1), 2).getDisplayValues();
  const config = {};

  for (let i = 0; i < values.length; i++) {
    const key = String(values[i][0]).trim();
    const val = String(values[i][1]).trim();
    if (key) {
      config[key] = val;
    }
  }

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
 * Obtiene el catálogo de cotizaciones en texto plano para alimentar el buscador
 */
function getQuotesCatalog(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];

  const ss = sheet.getParent();
  const config = getCompanyConfig(ss);
  const quoteCode = config.Codigo_Serie_Cotizacion || 'C1';

  const colsToRead = Math.min(sheet.getLastColumn(), 14);
  const displayData = sheet.getRange(2, 1, lastRow - 1, colsToRead).getDisplayValues();
  const rawData = sheet.getRange(2, 1, lastRow - 1, colsToRead).getValues();
  const catalog = [];

  for (let i = 0; i < displayData.length; i++) {
    const dRow = displayData[i];
    const rRow = rawData[i];
    const rawNum = dRow[0] || rRow[0];
    const cleanNum = String(rawNum || '').trim().replace(/\D/g, '');
    if (!cleanNum) continue;

    const totalNum = typeof rRow[8] === 'number' ? rRow[8] : parseNumericValue(dRow[8]);

    const rawVigenciaCell = String(dRow[10] || 'Activa').trim();
    const fechaVigenciaClean = cleanDateText(dRow[11] || rRow[11]);
    let computedStatusVigencia = rawVigenciaCell;
    if (rawVigenciaCell.toLowerCase() === 'inactiva') {
      computedStatusVigencia = 'Inactiva';
    } else {
      computedStatusVigencia = calculateExpirationStatus(fechaVigenciaClean);
    }

    catalog.push({
      quoteNumber: formatConsecutiveNumber(cleanNum),
      code: quoteCode,
      clientName: String(dRow[1] || '').trim() || 'Sin Nombre',
      projectName: String(dRow[2] || '').trim() || 'Sin Proyecto',
      location: String(dRow[3] || '').trim() || '',
      total: totalNum,
      statusCliente: String(dRow[9] || 'Pendiente').trim(),
      statusVigencia: computedStatusVigencia,
      fechaVigencia: fechaVigenciaClean,
      date: cleanDateText(dRow[12] || rRow[12]),
      updatedAt: cleanDateText(dRow[13] || rRow[13] || dRow[12] || rRow[12]),
    });
  }

  catalog.sort((a, b) => {
    const nA = parseInt(a.quoteNumber.replace(/\D/g, ''), 10) || 0;
    const nB = parseInt(b.quoteNumber.replace(/\D/g, ''), 10) || 0;
    return nB - nA;
  });

  return catalog;
}

/**
 * Recupera y reconstruye la cotización completa directamente en TEXTO PLANO desde las 14 columnas
 * y utiliza la configuración oficial de la pestaña ConfiguracionMYC (C1 y CP 1)
 */
function getQuoteByNumber(sheet, targetNumber) {
  if (!targetNumber) {
    return { success: false, error: 'Número de cotización no especificado' };
  }

  const cleanTarget = formatConsecutiveNumber(targetNumber);
  const targetParsed = parseInt(cleanTarget.replace(/\D/g, ''), 10);
  const lastRow = sheet.getLastRow();
  const lastCol = Math.min(sheet.getLastColumn(), 14);

  if (lastRow <= 1) {
    return { success: false, error: `Cotización N° ${cleanTarget} no encontrada en la base de datos.` };
  }

  const ss = sheet.getParent();
  const config = getCompanyConfig(ss);

  // Lectura en TEXTO PLANO estricto con getDisplayValues()
  const displayValues = sheet.getRange(2, 1, lastRow - 1, lastCol).getDisplayValues();
  const rawValues = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

  for (let i = 0; i < displayValues.length; i++) {
    const dRow = displayValues[i];
    const rRow = rawValues[i];
    const rawVal = dRow[0] || rRow[0];
    const cleanNum = parseInt(String(rawVal).replace(/\D/g, ''), 10);

    if (cleanNum === targetParsed) {
      // 1. Tareas en texto plano (Columna 5)
      const tasksRaw = rRow[4] || dRow[4];
      const items = parseTasksCell(tasksRaw);

      // 2. Valores numéricos (anticipo, saldo, total)
      const totalVal = typeof rRow[8] === 'number' ? rRow[8] : parseNumericValue(dRow[8]);
      const anticipoVal = typeof rRow[6] === 'number' ? rRow[6] : parseNumericValue(dRow[6]);
      const saldoVal = typeof rRow[7] === 'number' ? rRow[7] : parseNumericValue(dRow[7]);

      const startPct = totalVal > 0 && anticipoVal > 0 ? Math.round((anticipoVal / totalVal) * 100) : 50;
      const endPct = 100 - startPct;

      // 3. Fechas en texto plano estricto (DD/MM/YYYY sin hora ni GMT)
      const fechaVigenciaStr = cleanDateText(dRow[11] || rRow[11]);
      const fechaCreacionStr = cleanDateText(dRow[12] || rRow[12]);
      const rawVigenciaCell = String(dRow[10] || 'Activa').trim();
      let statusVigencia = rawVigenciaCell;
      if (rawVigenciaCell.toLowerCase() === 'inactiva') {
        statusVigencia = 'Inactiva';
      } else {
        statusVigencia = calculateExpirationStatus(fechaVigenciaStr);
      }

      const recoveredQuote = {
        code: config.Codigo_Serie_Cotizacion || 'C1',
        letterCode: config.Codigo_Serie_CartaPresentacion || 'CP 1',
        quoteNumber: cleanTarget,
        nit: config.Firma_NitEmpresa || '901795226-7',
        date: fechaCreacionStr || getLocalDateString(),
        clientName: String(dRow[1] || '').trim(),
        projectName: String(dRow[2] || '').trim(),
        location: String(dRow[3] || 'Medellín').trim(),
        fechaVigencia: fechaVigenciaStr || getLocalDateString(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
        validityDays: fechaVigenciaStr || '',
        pricingMode: 'tasks',
        items: items,
        subtotal: totalVal,
        adminPct: 0,
        contingencyPct: 0,
        utilityPct: 0,
        ivaPct: 0,
        total: totalVal,
        startPct: startPct,
        endPct: endPct,
        statusCliente: String(dRow[9] || 'Pendiente').trim(),
        statusVigencia: statusVigencia,
        notes: `El pago se realiza de la siguiente manera el ${startPct}% al iniciar y el ${endPct}% restante al finalizar el trabajo.`,
        representativeName: config.Firma_RepresentanteLegal || 'Ever Becerra',
        representativeRole: config.Firma_CargoInstitucional || 'Representante Legal',
        contactPhone: config.Firma_NumeroCelular || '311 796 9848',
        contactWhatsApp: config.Firma_WhatsApp || '311 796 9848',
        contactInstagram: config.Firma_Instagram || 'mcobracivil',
        contactEmail: config.Firma_CorreoElectronico || 'mcobracivil@gmail.com',
        letterCity: config.Cuidad_CartaPresentacion || 'Medellín',
        isEditingExisting: true,
        isFinalized: true
      };

      return {
        success: true,
        quote: recoveredQuote,
        config: config
      };
    }
  }

  return { success: false, error: `Cotización N° ${cleanTarget} no encontrada en CotizacionesMYC.` };
}

/**
 * Sobrescribe in-place las 14 columnas de una cotización existente en texto plano
 */
function updateQuoteInSheet(sheet, quote) {
  if (!quote || !quote.quoteNumber) {
    return { success: false, error: 'Falta el número de cotización a actualizar' };
  }

  const cleanTarget = formatConsecutiveNumber(quote.quoteNumber);
  const targetParsed = parseInt(cleanTarget.replace(/\D/g, ''), 10);
  const lastRow = sheet.getLastRow();

  if (lastRow <= 1) {
    return { success: false, error: `No se encontró la cotización N° ${cleanTarget} para actualizar` };
  }

  const displayValues = sheet.getRange(2, 1, lastRow - 1, 1).getDisplayValues();
  let targetRowIndex = -1;

  for (let i = 0; i < displayValues.length; i++) {
    const rawVal = displayValues[i][0];
    const cleanNum = parseInt(String(rawVal).replace(/\D/g, ''), 10);
    if (cleanNum === targetParsed) {
      targetRowIndex = i + 2;
      break;
    }
  }

  if (targetRowIndex === -1) {
    return { success: false, error: `No se encontró la fila correspondiente a la cotización N° ${cleanTarget}` };
  }

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
  const startPct = parseFloat(quote.startPct) || 50;
  const valorAnticipo = parseFloat(quote.valorAnticipo) || Math.round(totalAmount * (startPct / 100));
  const valorSaldo = parseFloat(quote.valorSaldo) || (totalAmount - valorAnticipo);
  const estadoCliente = quote.statusCliente || 'Pendiente';
  const fechaVigencia = cleanDateText(quote.fechaVigencia || getLocalDateString(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)));
  const estadoVigencia = calculateExpirationStatus(fechaVigencia);
  const fechaActual = getLocalDateString();

  // Preservar la fecha original de creación en texto plano limpio
  const originalCreatedDisplay = sheet.getRange(targetRowIndex, 13).getDisplayValue();
  const originalCreatedDate = cleanDateText(originalCreatedDisplay) || fechaActual;

  const updatedRowData = [
    cleanTarget,        // Col 1: Numero Cotizacion
    clientName,         // Col 2: Cliente Proyecto
    projectName,        // Col 3: Nombre Proyecto
    location,           // Col 4: Ubicacion Proyecto
    tareasJson,         // Col 5: Tareas Proyecto (JSON en texto plano)
    numeroTareas,       // Col 6: Numero Tareas Proyecto
    valorAnticipo,      // Col 7: Valor Anticipo ($)
    valorSaldo,         // Col 8: Valor Saldo ($)
    totalAmount,        // Col 9: Total Cotizado ($)
    estadoCliente,      // Col 10: Estado Cotizacion Cliente
    estadoVigencia,     // Col 11: Estado Cotizacion
    fechaVigencia,      // Col 12: Fecha Vigencia (DD/MM/YYYY)
    originalCreatedDate,// Col 13: Creado El (DD/MM/YYYY texto plano)
    fechaActual         // Col 14: Actualizado El (DD/MM/YYYY texto plano)
  ];

  sheet.getRange(targetRowIndex, 1, 1, 14).setValues([updatedRowData]);

  // Formato monetario
  sheet.getRange(targetRowIndex, 7).setNumberFormat('"$"#,##0');
  sheet.getRange(targetRowIndex, 8).setNumberFormat('"$"#,##0');
  sheet.getRange(targetRowIndex, 9).setNumberFormat('"$"#,##0');

  // Formato de texto plano '@' para códigos y fechas para evitar conversiones horarias de Sheets
  sheet.getRange(targetRowIndex, 1).setNumberFormat('@');
  sheet.getRange(targetRowIndex, 12).setNumberFormat('@');
  sheet.getRange(targetRowIndex, 13).setNumberFormat('@');
  sheet.getRange(targetRowIndex, 14).setNumberFormat('@');

  return {
    success: true,
    quoteNumber: cleanTarget,
    row: targetRowIndex,
    statusCliente: estadoCliente,
    statusVigencia: estadoVigencia,
    fechaVigencia: fechaVigencia,
    message: `Cotización N° ${cleanTarget} actualizada exitosamente en CotizacionesMYC`
  };
}

/**
 * Modifica atómicamente el estado de una cotización (Activa / Inactiva) sin tocar datos ni consecutivos (Soft Delete)
 */
function setQuoteStatusInSheet(sheet, targetNumber, statusVigencia, statusCliente) {
  if (!targetNumber) {
    return { success: false, error: 'Número de cotización no especificado' };
  }

  const cleanTarget = formatConsecutiveNumber(targetNumber);
  const targetParsed = parseInt(cleanTarget.replace(/\D/g, ''), 10);
  const lastRow = sheet.getLastRow();

  if (lastRow <= 1) {
    return { success: false, error: 'La hoja no tiene registros' };
  }

  const numbersData = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  let targetRowIndex = -1;

  for (let i = 0; i < numbersData.length; i++) {
    const rawVal = numbersData[i][0];
    const cleanNum = parseInt(String(rawVal).replace(/\D/g, ''), 10);
    if (cleanNum === targetParsed) {
      targetRowIndex = i + 2;
      break;
    }
  }

  if (targetRowIndex === -1) {
    return { success: false, error: `Cotización N° ${cleanTarget} no encontrada en la base de datos.` };
  }

  const fechaActual = getLocalDateString();

  if (statusVigencia) {
    sheet.getRange(targetRowIndex, 11).setValue(statusVigencia);
    sheet.getRange(targetRowIndex, 11).setNumberFormat('@');
  }

  if (statusCliente) {
    sheet.getRange(targetRowIndex, 10).setValue(statusCliente);
    sheet.getRange(targetRowIndex, 10).setNumberFormat('@');
  }

  // Actualizar columna 14 con la fecha de modificación
  sheet.getRange(targetRowIndex, 14).setValue(fechaActual);
  sheet.getRange(targetRowIndex, 14).setNumberFormat('@');

  return {
    success: true,
    quoteNumber: cleanTarget,
    statusVigencia: statusVigencia || sheet.getRange(targetRowIndex, 11).getDisplayValue(),
    statusCliente: statusCliente || sheet.getRange(targetRowIndex, 10).getDisplayValue(),
    message: `Estado de la Cotización N° ${cleanTarget} actualizado a "${statusVigencia || statusCliente}".`
  };
}

/**
 * Manejador GET
 */
function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let quoteSheet = ss.getSheetByName(SHEET_NAME_QUOTES);

    if (!quoteSheet) {
      quoteSheet = ss.insertSheet(SHEET_NAME_QUOTES);
      setupQuoteHeaders(quoteSheet);
    }

    const config = getCompanyConfig(ss);
    const action = e && e.parameter && e.parameter.action ? e.parameter.action : null;

    if (action === 'get_catalog') {
      const catalog = getQuotesCatalog(quoteSheet);
      return createJsonResponse({
        success: true,
        catalog: catalog,
        config: config
      });
    }

    if (action === 'get_quote') {
      const quoteNumber = e.parameter.quoteNumber;
      const quoteResult = getQuoteByNumber(quoteSheet, quoteNumber);
      return createJsonResponse({
        ...quoteResult,
        config: config
      });
    }

    const nextNumber = getNextConsecutiveNumber(quoteSheet);

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
 * Manejador POST
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
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

    const config = getCompanyConfig(ss);

    if (action === 'get_catalog') {
      const catalog = getQuotesCatalog(quoteSheet);
      return createJsonResponse({
        success: true,
        catalog: catalog,
        config: config
      });
    }

    if (action === 'get_quote') {
      const quoteNumber = contents.quoteNumber;
      const quoteResult = getQuoteByNumber(quoteSheet, quoteNumber);
      return createJsonResponse({
        ...quoteResult,
        config: config
      });
    }

    if (action === 'validate_quote') {
      const quote = contents.quote || {};
      const validation = validateQuoteData(quoteSheet, quote);
      return createJsonResponse(validation);
    }

    if (action === 'update_quote') {
      const quote = contents.quote || {};
      const updateResult = updateQuoteInSheet(quoteSheet, quote);
      return createJsonResponse(updateResult);
    }

    if (action === 'set_quote_status') {
      const quoteNumber = contents.quoteNumber;
      const statusVigencia = contents.statusVigencia;
      const statusCliente = contents.statusCliente;
      const statusResult = setQuoteStatusInSheet(quoteSheet, quoteNumber, statusVigencia, statusCliente);
      return createJsonResponse(statusResult);
    }

    if (action === 'save_quote') {
      const quote = contents.quote || {};

      const duplicateCheck = checkDuplicateQuote(quoteSheet, quote);
      if (duplicateCheck.isDuplicate) {
        return createJsonResponse({
          success: false,
          error: `Ya existe una cotización idéntica (N° ${duplicateCheck.existingNumber}) para el cliente "${quote.clientName}" y proyecto "${quote.projectName}".`,
          existingNumber: duplicateCheck.existingNumber,
          isDuplicate: true
        });
      }

      let quoteNumberRaw = quote.quoteNumber ? parseInt(quote.quoteNumber, 10) : null;
      const nextAvailableNumber = getNextConsecutiveNumber(quoteSheet);

      if (!quoteNumberRaw || isNumberAlreadyTaken(quoteSheet, quoteNumberRaw)) {
        quoteNumberRaw = nextAvailableNumber;
      }

      const formattedNumber = formatConsecutiveNumber(quoteNumberRaw);

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

      const estadoCliente = quote.statusCliente || 'Pendiente';
      const fechaVigencia = cleanDateText(quote.fechaVigencia || getLocalDateString(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)));
      const estadoVigencia = calculateExpirationStatus(fechaVigencia);
      const fechaActual = getLocalDateString();

      const rowData = [
        formattedNumber,    // Col 1: Numero Cotizacion
        clientName,         // Col 2: Cliente Proyecto
        projectName,        // Col 3: Nombre Proyecto
        location,           // Col 4: Ubicacion Proyecto
        tareasJson,         // Col 5: Tareas Proyecto (JSON en texto plano)
        numeroTareas,       // Col 6: Numero Tareas Proyecto
        valorAnticipo,      // Col 7: Valor Anticipo ($)
        valorSaldo,         // Col 8: Valor Saldo ($)
        totalAmount,        // Col 9: Total Cotizado ($)
        estadoCliente,      // Col 10: Estado Cotizacion Cliente
        estadoVigencia,     // Col 11: Estado Cotizacion
        fechaVigencia,      // Col 12: Fecha Vigencia (DD/MM/YYYY)
        fechaActual,        // Col 13: Creado El (DD/MM/YYYY)
        fechaActual         // Col 14: Actualizado El (DD/MM/YYYY)
      ];

      quoteSheet.appendRow(rowData);
      const lastRow = quoteSheet.getLastRow();

      // Formatear columnas de moneda
      quoteSheet.getRange(lastRow, 7).setNumberFormat('"$"#,##0');
      quoteSheet.getRange(lastRow, 8).setNumberFormat('"$"#,##0');
      quoteSheet.getRange(lastRow, 9).setNumberFormat('"$"#,##0');

      // Forzar texto plano '@' para código y fechas
      quoteSheet.getRange(lastRow, 1).setNumberFormat('@');
      quoteSheet.getRange(lastRow, 12).setNumberFormat('@');
      quoteSheet.getRange(lastRow, 13).setNumberFormat('@');
      quoteSheet.getRange(lastRow, 14).setNumberFormat('@');

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
  const values = sheet.getRange(2, 1, lastRow - 1, 1).getDisplayValues();

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

  const data = sheet.getRange(2, 1, lastRow - 1, 9).getDisplayValues();
  const rawValues = sheet.getRange(2, 1, lastRow - 1, 9).getValues();

  for (let i = 0; i < data.length; i++) {
    const existingNum = String(data[i][0]);
    const existingClient = String(data[i][1]).trim().toLowerCase();
    const existingProject = String(data[i][2]).trim().toLowerCase();
    const existingTotal = typeof rawValues[i][8] === 'number' ? rawValues[i][8] : parseNumericValue(data[i][8]);

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

  const values = sheet.getRange(2, 1, lastRow - 1, 1).getDisplayValues();
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
 * Configura los encabezados oficiales de CotizacionesMYC (14 Columnas Nativas en Texto Plano)
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
  sheet.getRange('M:M').setNumberFormat('@');
  sheet.getRange('N:N').setNumberFormat('@');

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
