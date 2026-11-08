import React, { forwardRef } from 'react';
import { QuoteData } from '../types/quote.types';
import { MCLogo } from '../../../shared/components/MCLogo';
import {
  formatCurrency,
  numberToWordsCOP,
  formatDateToLongSpanish,
} from '../../../shared/utils/currency';
import { calculateQuoteTotals } from '../services/quote-calculator';
import { Phone, Mail } from 'lucide-react';

interface PresentationLetterDocumentProps {
  quote: QuoteData;
  scale?: number;
  highlightEmpty?: boolean;
}

export const PresentationLetterDocument = forwardRef<
  HTMLDivElement,
  PresentationLetterDocumentProps
>(({ quote, scale = 1, highlightEmpty = true }, ref) => {
  const totals = calculateQuoteTotals(quote);

  const renderVariable = (
    value: string | number | undefined,
    placeholder: string,
    label: string
  ) => {
    if (
      value !== undefined &&
      value !== null &&
      String(value).trim() !== '' &&
      String(value) !== '0'
    ) {
      return (
        <span className="text-slate-900 font-semibold font-poppins">{value}</span>
      );
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

  const longDate =
    quote.letterDateLong ||
    formatDateToLongSpanish(quote.date, quote.letterCity || 'Medellín');

  const totalInWords =
    totals.total > 0
      ? numberToWordsCOP(totals.total)
      : null;

  // Filtrar ítems principales para viñetas (hasta 5 ítems para garantizar A4 perfecto sin desborde)
  const displayItems = quote.items && quote.items.length > 0 ? quote.items.slice(0, 5) : [];
  const remainingCount = (quote.items?.length || 0) - displayItems.length;

  return (
    <div
      ref={ref}
      id="presentation-letter-printable"
      className="relative transition-all duration-150 mx-auto select-none print:transform-none flex flex-col items-center gap-6 sm:gap-8 print:gap-0"
    >
      <div className="quote-page-wrapper flex flex-col items-center print:block print:m-0 print:p-0 print:w-[210mm]">
        {/* Indicador de hoja en pantalla */}
        <div className="mb-2 text-[11px] font-mono font-medium text-slate-400 bg-slate-900/80 px-3 py-0.5 rounded-full border border-slate-800 shadow-sm print:hidden">
          Carta de Presentación Oficial (1 Hoja A4)
        </div>

        {/* Contenedor Adaptativo de Escala Fiel */}
        <div
          style={{
            width: scale !== 1 ? `${Math.round(794 * scale)}px` : undefined,
            height: scale !== 1 ? `${Math.round(1123 * scale)}px` : undefined,
          }}
          className="relative transition-all duration-150 print:w-[210mm] print:h-[296.5mm]"
        >
          {/* Marco estándar A4: 210mm x 297mm (794px x 1123px) */}
          <div
            style={{
              width: '794px',
              height: '1123px',
              transform: scale !== 1 ? `scale(${scale})` : undefined,
              transformOrigin: 'top left',
            }}
            className="quote-page presentation-letter-page w-[794px] h-[1123px] max-h-[1123px] print:w-[210mm] print:h-[296.5mm] print:max-h-[296.5mm] print:min-h-0 flex flex-col justify-between bg-white text-slate-800 font-poppins relative overflow-hidden shadow-2xl print:shadow-none print:m-0 print:transform-none"
          >
          
          {/* CUERPO SUPERIOR */}
          <div className="flex-1 flex flex-col font-poppins">
            
            {/* 1. ENCABEZADO INSTITUCIONAL (#234794 idéntico al SVG oficial) */}
            <div className="bg-[#234794] text-white px-8 py-3.5 flex items-center justify-between relative font-poppins min-h-[116px]">
              {/* Logo Oficial M&C */}
              <div className="flex items-center z-10 shrink-0">
                <MCLogo variant="transparent" className="h-24 sm:h-26 w-auto max-h-[104px]" />
              </div>

              {/* Título: CARTA DE PRESENTACION */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none z-10">
                <h1 className="text-2xl sm:text-[26px] font-bold tracking-[0.16em] text-white font-poppins uppercase select-none whitespace-nowrap">
                  CARTA DE PRESENTACION
                </h1>
              </div>

              {/* Metadatos tabulados a la derecha */}
              <div className="z-10 text-[11px] font-medium text-slate-200 min-w-[190px] font-poppins">
                <div className="grid grid-cols-[auto_1fr] gap-x-2.5 gap-y-1 items-center justify-items-end font-poppins">
                  <span className="text-slate-200 font-poppins">Código:</span>
                  <span className="font-bold text-white tracking-wide font-poppins">
                    {quote.code || 'C1'}
                  </span>

                  <span className="text-slate-200 font-poppins">N°</span>
                  <span className="font-poppins">
                    {quote.quoteNumber ? (
                      <span className="font-medium text-white tracking-wide font-poppins">
                        {quote.quoteNumber}
                      </span>
                    ) : (
                      renderVariable('', '(N° CARTA)', 'Número Consecutivo')
                    )}
                  </span>

                  <span className="text-slate-200 font-poppins">NIT:</span>
                  <span className="font-medium text-white tracking-wide font-poppins">
                    {quote.nit || '901795226-7'}
                  </span>

                  <span className="text-slate-200 font-poppins">Fecha:</span>
                  <span className="font-medium text-white tracking-wide font-poppins">
                    {quote.date || new Date().toLocaleDateString('es-CO')}
                  </span>
                </div>
              </div>
            </div>

            {/* Franja azul brillante de acento */}
            <div className="h-1.5 w-full bg-[#1D4ED8]" />

            {/* 2. CONTENIDO EPISTOLAR FORMAL */}
            <div className="px-12 pt-7 pb-4 flex-1 flex flex-col justify-between font-poppins text-xs leading-relaxed">
              
              <div className="space-y-4">
                {/* Fila: Fecha epistolar a la izquierda y Badge de Total a la derecha */}
                <div className="flex items-center justify-between pt-1">
                  <div className="text-[12.5px] text-slate-800 font-normal font-poppins">
                    {longDate}
                  </div>

                  {/* Badge Total (#234794 idéntico al SVG) */}
                  <div className="bg-[#234794] text-white px-4 py-1.5 rounded-lg flex items-center gap-2 shadow-xs font-poppins">
                    <span className="text-xs font-semibold uppercase tracking-wider font-poppins">
                      Total:
                    </span>
                    <span className="text-sm font-bold font-mono tracking-tight text-white">
                      {totals.total > 0 ? formatCurrency(totals.total) : '$0'}
                    </span>
                  </div>
                </div>

                {/* Bloque Destinatario */}
                <div className="space-y-1 pt-1 font-poppins text-[12.5px]">
                  <div className="font-bold text-slate-900 tracking-wide font-poppins">
                    Cliente
                  </div>
                  <div className="text-slate-800 font-poppins pl-0.5">
                    {renderVariable(quote.clientName, '(nombre cliente)', 'Nombre del Cliente')}
                  </div>

                  <div className="pt-2 text-slate-900 font-poppins flex items-baseline gap-1.5">
                    <span className="font-bold text-slate-900 font-poppins">Asunto:</span>
                    <span className="font-poppins">
                      {renderVariable(quote.projectName, '(nombre proyecto)', 'Nombre del Proyecto')}
                    </span>
                  </div>

                  <div className="text-slate-700 font-poppins pl-0.5">
                    {renderVariable(quote.location, '(ubicacion de la obra)', 'Ubicación de la Obra')}
                  </div>
                </div>

                {/* Saludo formal */}
                <div className="pt-2 text-[12.5px] font-normal text-slate-800 font-poppins">
                  {quote.letterGreeting || 'Cordial saludo,'}
                </div>

                {/* Párrafo institucional de apertura */}
                <p className="text-[12px] text-slate-800 leading-relaxed text-justify font-poppins">
                  Es un gusto para nosotros presentar a su consideración la siguiente propuesta técnica y económica para llevar a cabo su proyecto. Nuestro compromiso es ejecutar cada obra garantizando los más altos estándares de calidad, cumplimiento y seguridad. A continuación, detallamos las actividades y materiales a intervenir:
                </p>

                {/* Viñetas de actividades del proyecto */}
                <div className="py-1 px-3 bg-slate-50/70 rounded-xl border border-slate-200/60 font-poppins">
                  {quote.letterSummary ? (
                    <div className="text-[12px] text-slate-800 leading-relaxed whitespace-pre-line font-poppins py-1">
                      {quote.letterSummary}
                    </div>
                  ) : displayItems.length > 0 ? (
                    <div className="space-y-2 py-1 font-poppins">
                      {displayItems.map((item, idx) => (
                        <div key={item.id || idx} className="flex items-start gap-2 text-[12px] font-poppins">
                          <span className="text-[#234794] font-bold text-sm leading-none pt-0.5">•</span>
                          <span className="text-slate-800 leading-relaxed font-poppins">
                            {item.title ? (
                              <strong className="text-slate-900 font-semibold">{item.title}: </strong>
                            ) : null}
                            {item.description || '(descripción de la partida)'}
                          </span>
                        </div>
                      ))}
                      {remainingCount > 0 && (
                        <div className="text-[11px] text-slate-500 italic pt-1 pl-4 font-poppins">
                          (+ {remainingCount} actividades adicionales detalladas en la cotización anexa)
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 text-[12px] text-slate-500 py-1 font-poppins italic">
                      <span className="text-slate-400 font-bold">•</span>
                      <span>
                        {renderVariable('', '(descripcion de proyecto)', 'Descripción de Proyecto')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Párrafo de inversión con valor alfanumérico (número en negrita y texto en letras) */}
                <div className="space-y-1.5 pt-1 font-poppins">
                  <p className="text-[12px] text-slate-800 font-poppins">
                    El valor total de la inversión para la ejecución completa del servicio asciende a la suma de:
                  </p>
                  <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200 text-slate-900 text-xs font-poppins flex flex-wrap items-baseline gap-2">
                    {totals.total > 0 ? (
                      <>
                        <span className="font-bold font-mono text-sm sm:text-base text-[#173258]">
                          {formatCurrency(totals.total)}
                        </span>
                        <span className="font-bold text-[#173258] uppercase tracking-wide">
                          ({totalInWords})
                        </span>
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        {renderVariable('', '$(VALOR)', 'Monto numérico')}
                        {renderVariable('', '(VALOR ALFANUMERICO)', 'Monto en letras')}
                      </div>
                    )}
                  </div>
                </div>

                {/* Condiciones comerciales y notas de pago */}
                <div className="text-[11.5px] text-slate-800 leading-relaxed font-poppins bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="font-bold font-poppins">NOTA:</span> El pago se realiza de la siguiente manera: el{' '}
                  <span className="font-semibold text-slate-900 font-poppins">
                    {quote.startPct ? `${quote.startPct}%` : renderVariable('', '(PORCENTAJE AL INICIAR)', 'Porcentaje Inicio')}
                  </span>{' '}
                  al iniciar (Anticipo) y el{' '}
                  <span className="font-semibold text-slate-900 font-poppins">
                    {quote.endPct ? `${quote.endPct}%` : renderVariable('', '(PORCENTAJE AL FINALIZAR)', 'Porcentaje Final')}
                  </span>{' '}
                  restante al finalizar el trabajo.
                </div>
              </div>

              {/* SECCIÓN DE FIRMA Y CONTACTO */}
              <div className="pt-4 border-t border-slate-200 space-y-4 font-poppins">
                <div className="text-[12px] text-slate-800 font-poppins">
                  Cordialmente,
                </div>

                <div className="flex items-end justify-between">
                  {/* Firma de Representante Legal */}
                  <div className="border-t border-slate-400 pt-1.5 min-w-[200px]">
                    <div className="font-bold text-slate-900 text-xs tracking-wide font-poppins">
                      {quote.representativeName || 'Ever Becerra'}
                    </div>
                    <div className="text-[11px] text-slate-600 font-poppins">
                      {quote.representativeRole || 'Representante legal'}
                    </div>
                  </div>

                  {/* Datos de contacto oficiales */}
                  <div className="space-y-1 text-xs text-slate-700 font-poppins text-right">
                    <div className="flex items-center justify-end gap-2 font-poppins">
                      <span className="font-medium text-slate-800 font-mono">
                        {quote.contactPhone || '311 796 9848'}
                      </span>
                      <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[#234794]">
                        <Phone className="w-3 h-3 text-[#234794]" />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 font-poppins">
                      <span className="font-medium text-slate-800">
                        {quote.contactEmail || 'mcobracivil@gmail.com'}
                      </span>
                      <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[#234794]">
                        <Mail className="w-3 h-3 text-[#234794]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* 3. PIE DE PÁGINA DECORATIVO (#b4c3e1 con dos paralelogramos #234794 a -22deg idéntico al SVG) */}
          <div className="h-10 w-full bg-[#b4c3e1] relative flex items-center justify-between overflow-hidden px-8">
            <span className="text-[11px] font-semibold text-[#234794] tracking-wide font-poppins">
              Carta de Presentación · M&C Construcciones Civiles
            </span>

            <div className="flex items-center gap-2 h-full">
              <div className="w-5 h-14 bg-[#234794] transform -skew-x-[22deg] translate-y-1" />
              <div className="w-5 h-14 bg-[#234794] transform -skew-x-[22deg] translate-y-1" />
            </div>
          </div>

        </div>
        </div>
      </div>
    </div>
  );
});

PresentationLetterDocument.displayName = 'PresentationLetterDocument';
