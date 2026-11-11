import { forwardRef } from 'react';
import { QuoteData } from '../types/quote.types';
import { MCLogo } from '../../../shared/components/MCLogo';
import { formatCurrency } from '../../../shared/utils/currency';
import { calculateQuoteTotals } from '../services/quote-calculator';
import { paginateQuoteItems } from '../services/quote-paginator';
import { cleanSimpleDate } from '../services/google-sheets.service';
import { Phone, Instagram, Mail } from 'lucide-react';

interface QuoteDocumentProps {
  quote: QuoteData;
  scale?: number;
  highlightEmpty?: boolean;
}

export const QuoteDocument = forwardRef<HTMLDivElement, QuoteDocumentProps>(
  ({ quote, scale = 1, highlightEmpty = true }, ref) => {
    const totals = calculateQuoteTotals(quote);
    const pages = paginateQuoteItems(quote.items);
    const hasItems = quote.items && quote.items.length > 0;

    const renderVariable = (value: string | number | undefined, placeholder: string, label: string) => {
      if (value !== undefined && value !== null && String(value).trim() !== '' && String(value) !== '0') {
        return <span className="text-slate-900 font-semibold font-poppins">{value}</span>;
      }
      return highlightEmpty ? (
        <span
          className="inline-block bg-amber-50 text-amber-900 border border-amber-300 border-dashed px-1.5 py-0.5 rounded text-[12px] font-poppins font-medium tracking-tight animate-pulse print:bg-transparent print:border-none print:p-0 print:animate-none print:text-slate-500"
          title={`Variable pendiente: ${label}`}
        >
          {placeholder}
        </span>
      ) : (
        <span className="text-slate-500 font-medium font-poppins">{placeholder}</span>
      );
    };

    return (
      <div
        ref={ref}
        id="quote-document-printable"
        className="relative transition-all duration-150 mx-auto select-none print:transform-none flex flex-col items-center gap-6 sm:gap-8 print:gap-0"
      >
        {pages.map((page) => (
          <div
            key={`page-${page.pageNumber}`}
            className="quote-page-wrapper flex flex-col items-center print:block print:m-0 print:p-0 print:w-[210mm]"
          >
            {/* Indicador de hoja en pantalla (Oculto al imprimir y en PDF) */}
            {pages.length > 1 && (
              <div className="mb-2 text-[11px] font-mono font-medium text-slate-400 bg-slate-900/80 px-3 py-0.5 rounded-full border border-slate-800 shadow-sm print:hidden">
                Hoja {page.pageNumber} de {page.totalPages}
              </div>
            )}

            {/* Contenedor Adaptativo de Escala Fiel */}
            <div
              style={{
                width: scale !== 1 ? `${Math.round(794 * scale)}px` : undefined,
                height: scale !== 1 ? `${Math.round(1123 * scale)}px` : undefined,
              }}
              className="relative transition-all duration-150 print:w-[210mm] print:h-[296.5mm]"
            >
              {/* Marco estándar A4: 210mm x 297mm (794px x 1123px en pantalla, 296.5mm seguro en print) */}
              <div
                style={{
                  width: '794px',
                  height: '1123px',
                  transform: scale !== 1 ? `scale(${scale})` : undefined,
                  transformOrigin: 'top left',
                }}
                className="quote-page quote-document-page w-[794px] h-[1123px] max-h-[1123px] print:w-[210mm] print:h-[296.5mm] print:max-h-[296.5mm] print:min-h-0 flex flex-col justify-between bg-white text-slate-800 font-poppins relative overflow-hidden shadow-2xl print:shadow-none print:m-0 print:transform-none"
              >
              
              {/* CUERPO SUPERIOR DE LA PÁGINA */}
              <div className="flex-1 flex flex-col font-poppins">
                
                {/* 1. ENCABEZADO */}
                {page.isFirstPage ? (
                  // Encabezado Principal Oficial M&C (#234794 idéntico a Agente.svg)
                  <>
                    <div className="bg-[#234794] text-white px-8 py-3.5 flex items-center justify-between relative font-poppins min-h-[116px]">
                      {/* Izquierda: Logo Oficial M&C (Blanco Níveo Puro a Gran Escala para Máxima Nitidez y Lectura de Subtítulo) */}
                      <div className="flex items-center z-10 shrink-0">
                        <MCLogo variant="transparent" className="h-24 sm:h-26 w-auto max-h-[104px]" />
                      </div>

                      {/* Centro: Título COTIZACIÓN con centrado geométrico absoluto */}
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none z-10">
                        <h1 className="text-3xl font-bold tracking-[0.16em] text-white font-poppins uppercase select-none">
                          COTIZACIÓN
                        </h1>
                      </div>

                      {/* Derecha: Cuadrícula de Metadatos tabulada */}
                      <div className="z-10 text-[11px] font-medium text-slate-200 min-w-[200px] font-poppins">
                        <div className="grid grid-cols-[auto_1fr] gap-x-2.5 gap-y-1 items-center justify-items-end font-poppins">
                          <span className="text-slate-200 font-poppins">Código:</span>
                          <span className="font-bold text-white tracking-wide font-poppins">{quote.code || 'C1'}</span>

                          <span className="text-slate-200 font-poppins">N°</span>
                          <span className="font-poppins">
                            {quote.quoteNumber ? (
                              <span className="font-medium text-white tracking-wide font-poppins">{quote.quoteNumber}</span>
                            ) : (
                              renderVariable('', '(N COTIZACION INCREMNTADO)', 'Número Consecutivo')
                            )}
                          </span>

                          <span className="text-slate-200 font-poppins">NIT:</span>
                          <span className="font-medium text-white tracking-wide font-poppins">{quote.nit || '901795226-7'}</span>

                          <span className="text-slate-200 font-poppins">Fecha:</span>
                          <span className="font-medium text-white tracking-wide font-poppins">
                            {cleanSimpleDate(quote.date)}
                          </span>

                          {(quote.fechaVigencia || quote.validityDays) && (
                            <>
                              <span className="text-slate-200 font-poppins">Validez:</span>
                              <span className="font-medium text-white tracking-wide font-poppins">{cleanSimpleDate(quote.fechaVigencia || quote.validityDays)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Franja azul brillante de acento */}
                    <div className="h-1.5 w-full bg-[#1D4ED8]" />
                  </>
                ) : (
                  // Encabezado de Continuación (Para Hoja 2 en adelante)
                  <>
                    <div className="bg-[#234794] text-white px-8 py-2.5 flex items-center justify-between relative font-poppins min-h-[76px]">
                      <div className="flex items-center gap-3 z-10 shrink-0">
                        <MCLogo variant="transparent" className="h-14 w-auto max-h-[56px]" />
                      </div>

                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none z-10">
                        <h1 className="text-xl font-bold tracking-[0.14em] text-white font-poppins uppercase select-none">
                          COTIZACIÓN
                        </h1>
                        <span className="text-[10px] text-blue-200 tracking-wider uppercase font-poppins font-medium block">
                          (Continuación - Hoja {page.pageNumber})
                        </span>
                      </div>

                      <div className="z-10 text-[11px] font-medium text-slate-200 font-poppins text-right">
                        <div>
                          <span className="text-slate-300">Ref: </span>
                          <span className="font-bold text-white font-mono">{quote.code || 'C1'}-{quote.quoteNumber || '101'}</span>
                        </div>
                        <div className="text-[10px] text-slate-300">
                          Fecha: {cleanSimpleDate(quote.date)}
                          {(quote.fechaVigencia || quote.validityDays) ? ` | Validez: ${cleanSimpleDate(quote.fechaVigencia || quote.validityDays)}` : ''}
                        </div>
                      </div>
                    </div>

                    {/* Franja azul brillante de acento */}
                    <div className="h-1.5 w-full bg-[#1D4ED8]" />
                  </>
                )}

                {/* 2. CONTENIDO PRINCIPAL */}
                <div
                  className={`px-10 ${page.isFirstPage ? 'pt-7' : 'pt-4'} pb-4 flex-1 flex flex-col ${
                    page.isFirstPage && page.isLastPage ? 'justify-between' : 'justify-start'
                  } font-poppins`}
                >
                  <div>
                    {/* Datos del Cliente y Proyecto */}
                    {page.isFirstPage ? (
                      <div className="space-y-2 mb-6 font-poppins">
                        <div className="text-[13px] text-slate-900 tracking-wide flex items-baseline gap-2 font-poppins">
                          <span className="shrink-0 text-slate-900 font-normal font-poppins">CLIENTE:</span>
                          <div className="flex-1 font-poppins">
                            {renderVariable(quote.clientName, '(NOMBRE CLIENTE)', 'Nombre del Cliente')}
                          </div>
                        </div>

                        <div className="text-[13px] text-slate-900 tracking-wide flex items-baseline gap-2 font-poppins">
                          <span className="shrink-0 text-slate-900 font-normal font-poppins">PROYECTO:</span>
                          <div className="flex-1 font-poppins">
                            {renderVariable(quote.projectName, '(NOMBRE PROYECTO)', 'Nombre del Proyecto')}
                          </div>
                        </div>

                        <div className="text-[13px] text-slate-900 tracking-wide flex items-baseline gap-2 font-poppins">
                          <span className="shrink-0 text-slate-900 font-normal font-poppins">UBICACIÓN:</span>
                          <div className="flex-1 font-poppins">
                            {renderVariable(quote.location, '(UBICACIÓN DE LA OBRA)', 'Ubicación de la Obra')}
                          </div>
                        </div>

                        <p className="text-[11.5px] text-slate-800 pt-1 font-normal font-poppins">
                          El proyecto incluye la obra civil necesaria para llevar a cabo las siguientes tareas:
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between py-1.5 px-3 bg-slate-50 border border-slate-200 rounded text-[11.5px] text-slate-800 mb-4 font-poppins">
                        <div>
                          <span className="font-semibold text-slate-900">CLIENTE: </span>
                          <span>{quote.clientName || 'Cliente'}</span>
                        </div>
                        <div className="text-slate-400">|</div>
                        <div>
                          <span className="font-semibold text-slate-900">PROYECTO: </span>
                          <span>{quote.projectName || 'Obra civil'}</span>
                        </div>
                        {quote.location && (
                          <>
                            <div className="text-slate-400">|</div>
                            <div>
                              <span className="font-semibold text-slate-900">UBICACIÓN: </span>
                              <span>{quote.location}</span>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* Encabezado de la Tabla de Tareas */}
                    <div className="bg-[#234794] text-white px-5 py-2.5 flex justify-between items-center text-xs font-semibold tracking-wider uppercase font-poppins">
                      <span className="w-3/4 font-poppins">DESCRIPCIÓN</span>
                      <span className="w-1/4 text-right font-poppins">SUBTOTAL</span>
                    </div>

                    {/* Lista de Tareas para esta página */}
                    <div className="py-3 px-2 flex flex-col font-poppins text-xs">
                      <div
                        className={`${
                          page.items.length <= 4
                            ? 'space-y-4'
                            : page.items.length <= 8
                            ? 'space-y-3'
                            : 'space-y-2'
                        } font-poppins`}
                      >
                        {page.items.length > 0 ? (
                          page.items.map((item, idx) => {
                            const isVeryFirstItem = page.isFirstPage && idx === 0;
                            const hasTitle = Boolean(item.title && item.title.trim());
                            return (
                              <div key={item.id || idx} className="flex justify-between items-start gap-4 font-poppins">
                                <div className="flex items-start gap-2.5 w-3/4 font-poppins">
                                  <span className="text-slate-600 font-bold text-sm leading-none pt-0.5">•</span>
                                  {hasTitle ? (
                                    <div className="flex flex-col font-poppins">
                                      <span className="text-slate-900 font-semibold font-poppins leading-snug">
                                        {item.title}
                                      </span>
                                      {item.description && (
                                        <span className="text-slate-700 text-[11.5px] leading-relaxed mt-0.5 whitespace-pre-wrap font-poppins">
                                          {item.description}
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-slate-800 leading-relaxed font-normal whitespace-pre-wrap font-poppins">
                                      {item.description || '(DESCRIPCION DEL PROYECTO)'}
                                    </span>
                                  )}
                                </div>
                                <div className="w-1/4 text-right font-medium text-slate-900 tabular-nums font-poppins">
                                  {quote.pricingMode === 'global' ? (
                                    isVeryFirstItem && totals.subtotal > 0 ? (
                                      formatCurrency(totals.subtotal)
                                    ) : (
                                      ''
                                    )
                                  ) : item.subtotal > 0 ? (
                                    formatCurrency(item.subtotal)
                                  ) : (
                                    '-'
                                  )}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          // Placeholder si no hay tareas cargadas
                          <div className="flex justify-between items-start gap-4 font-poppins">
                            <div className="flex items-start gap-2.5 w-3/4 font-poppins">
                              <span className="text-slate-400 font-bold">•</span>
                              <div className="text-slate-500 italic font-poppins">
                                {renderVariable('', '(DESCRICION DEL PROYECTO)', 'Descripción de Tareas')}
                              </div>
                            </div>
                            <div className="w-1/4 text-right font-medium text-slate-500 font-poppins">
                              {renderVariable('', '$(VALOR)', 'Monto')}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Nota de supervisión técnica (solo si cabe holgadamente en 1 sola página) */}
                      {hasItems && quote.items.length < 3 && page.isFirstPage && page.isLastPage && (
                        <div className="text-[11px] text-slate-400 italic pt-6 mt-4 border-t border-slate-100 font-poppins">
                          * Incluye mano de obra calificada, herramientas especializadas, equipo de seguridad y supervisión técnica permanente de obra.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 3. SECCIÓN INFERIOR: CONDICIONES, DESGLOSE AIU, TOTAL Y FIRMA */}
                  {/* Se muestra exclusivamente en la última página del documento */}
                  {page.showFooter && (
                    <div
                      className={`${
                        page.isFirstPage
                          ? page.items.length >= 8
                            ? 'mt-3 pt-3'
                            : 'mt-6 pt-4'
                          : 'mt-5 pt-4'
                      } border-t border-slate-200 grid grid-cols-12 gap-8 items-start font-poppins`}
                    >
                      
                      {/* Columna Izquierda: Notas de Pago, Advertencia y Contacto */}
                      <div className="col-span-7 space-y-3.5 font-poppins">
                        
                        {/* Cláusula de Pago */}
                        <div className="text-[11.5px] text-slate-800 leading-relaxed font-poppins">
                          <span className="font-bold font-poppins">NOTA:</span> El pago se realiza de la siguiente manera el{' '}
                          <span className="font-medium font-poppins">
                            {quote.startPct ? `${quote.startPct}%` : renderVariable('', '(PORCENTAJE AL INICIAR)', 'Porcentaje Inicio')}
                          </span>{' '}
                          al iniciar y el{' '}
                          <span className="font-medium font-poppins">
                            {quote.endPct ? `${quote.endPct}%` : renderVariable('', '(PORCENTAJE AL FINALIZAR)', 'Porcentaje Final')}
                          </span>{' '}
                          restante será cancelado de manera escalonada según las fases del proyecto
                        </div>

                        {/* Advertencia en Rojo #ff3131 (exacto de Agente.svg) */}
                        <div className="text-[11.5px] tracking-wide font-poppins">
                          <span className="font-bold text-[#ff3131] font-poppins">Importante</span>
                          <span className="text-slate-900 font-normal font-poppins">: este valor es antes de IVA</span>
                        </div>

                        {/* Gratitud */}
                        <div className="pt-2 text-xs font-bold tracking-wider text-slate-900 uppercase font-poppins">
                          GRACIAS POR SU CONFIANZA
                        </div>

                        {/* Contactos Oficiales con íconos circulares azules #234794 */}
                        <div className="space-y-2 text-xs text-slate-800 font-medium pt-1 font-poppins">
                          <div className="flex items-center gap-2.5 font-poppins">
                            <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[#234794]">
                              <Phone className="w-3 h-3 text-[#234794]" />
                            </div>
                            <span className="text-slate-800 tracking-wide font-medium font-poppins">
                              {quote.contactPhone || '311 796 9848'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2.5 font-poppins">
                            <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[#234794]">
                              <Instagram className="w-3 h-3 text-[#234794]" />
                            </div>
                            <span className="text-slate-800 font-medium font-poppins">
                              {quote.contactInstagram || 'mcobracivil'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2.5 font-poppins">
                            <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[#234794]">
                              <Mail className="w-3 h-3 text-[#234794]" />
                            </div>
                            <span className="text-slate-800 font-medium font-poppins">
                              {quote.contactEmail || 'mcobracivil@gmail.com'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Columna Derecha: Desglose AIU, Caja de Total y Firma */}
                      <div className="col-span-5 space-y-2.5 font-poppins">
                        <div className="bg-slate-50/80 rounded border border-slate-200 p-3 space-y-1.5 text-xs font-poppins">
                          <div className="flex justify-between items-center text-slate-800 font-poppins">
                            <span className="font-semibold font-poppins">Sub-total:</span>
                            <span className="tabular-nums text-slate-900 font-medium font-poppins">
                              {totals.subtotal > 0 ? formatCurrency(totals.subtotal) : '$(VALOR)'}
                            </span>
                          </div>

                          <div className="flex justify-between items-center text-slate-700 font-poppins">
                            <span className="font-semibold font-poppins">Administración</span>
                            <span className="tabular-nums font-normal font-poppins">
                              {quote.adminPct ? formatCurrency(totals.adminAmount) : '$0.00'}
                            </span>
                          </div>

                          <div className="flex justify-between items-center text-slate-700 font-poppins">
                            <span className="font-semibold font-poppins">Imprevistos</span>
                            <span className="tabular-nums font-normal font-poppins">
                              {quote.contingencyPct ? formatCurrency(totals.contingencyAmount) : '$0.00'}
                            </span>
                          </div>

                          <div className="flex justify-between items-center text-slate-700 font-poppins">
                            <span className="font-semibold font-poppins">Utilidad</span>
                            <span className="tabular-nums font-normal font-poppins">
                              {quote.utilityPct ? formatCurrency(totals.utilityAmount) : '$0.00'}
                            </span>
                          </div>

                          <div className="flex justify-between items-center text-slate-700 font-poppins">
                            <span className="font-semibold font-poppins">IVA</span>
                            <span className="tabular-nums font-normal font-poppins">
                              {quote.ivaPct ? formatCurrency(totals.ivaAmount) : '$0.00'}
                            </span>
                          </div>
                        </div>

                        {/* Caja de Total Azul Sólido #234794 */}
                        <div className="bg-[#234794] text-white px-4 py-2.5 rounded flex justify-between items-center shadow-sm font-poppins">
                          <span className="text-base font-semibold tracking-wide font-poppins">Total:</span>
                          <span className="text-base font-medium tracking-tight tabular-nums font-poppins">
                            {totals.total > 0 ? formatCurrency(totals.total) : '$(VALOR)'}
                          </span>
                        </div>

                        {/* Firma del Representante Legal */}
                        <div className="pt-5 text-center sm:text-right font-poppins">
                          <div className="inline-block text-center border-t border-slate-300 pt-1.5 min-w-[170px] font-poppins">
                            <div className="font-bold text-slate-900 text-xs tracking-wide font-poppins">
                              {quote.representativeName || 'Ever Becerra'}
                            </div>
                            <div className="text-[11px] text-slate-600 font-poppins">
                              {quote.representativeRole || 'Representante legal'}
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              </div>

              {/* PIE DE PÁGINA DECORATIVO: Base #b4c3e1 con dos paralelogramos #234794 a -22deg */}
              <div className="h-10 w-full bg-[#b4c3e1] relative flex items-center justify-between overflow-hidden px-8">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-[#234794] tracking-wide font-poppins">
                    Cotización · M&C Construcciones Civiles
                  </span>
                  {pages.length > 1 && (
                    <span className="text-[11px] font-medium text-[#234794]/80 font-poppins">
                      · Página {page.pageNumber} de {page.totalPages}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 h-full">
                  <div className="w-5 h-14 bg-[#234794] transform -skew-x-[22deg] translate-y-1" />
                  <div className="w-5 h-14 bg-[#234794] transform -skew-x-[22deg] translate-y-1" />
                </div>
              </div>

            </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
);

QuoteDocument.displayName = 'QuoteDocument';
