import React, { forwardRef } from 'react';
import { QuoteData } from '../types/quote.types';
import { MCLogo } from '../../../shared/components/MCLogo';
import { formatCurrency } from '../../../shared/utils/currency';
import { calculateQuoteTotals } from '../services/quote-calculator';
import { Phone, Instagram, Mail } from 'lucide-react';

interface QuoteDocumentProps {
  quote: QuoteData;
  scale?: number;
  highlightEmpty?: boolean;
}

export const QuoteDocument = forwardRef<HTMLDivElement, QuoteDocumentProps>(
  ({ quote, scale = 1, highlightEmpty = true }, ref) => {
    const hasItems = quote.items && quote.items.length > 0;
    const totals = calculateQuoteTotals(quote);

    const renderVariable = (value: string | number | undefined, placeholder: string, label: string) => {
      if (value !== undefined && value !== null && String(value).trim() !== '' && String(value) !== '0') {
        return <span className="text-slate-900 font-semibold">{value}</span>;
      }
      return highlightEmpty ? (
        <span
          className="inline-block bg-amber-50 text-amber-900 border border-amber-300 border-dashed px-1.5 py-0.5 rounded text-[13px] font-mono tracking-tight animate-pulse"
          title={`Variable pendiente: ${label}`}
        >
          {placeholder}
        </span>
      ) : (
        <span className="text-slate-500 font-medium">{placeholder}</span>
      );
    };

    return (
      <div
        ref={ref}
        id="quote-document-printable"
        style={{
          transform: scale !== 1 ? `scale(${scale})` : undefined,
          transformOrigin: 'top center',
        }}
        className="relative bg-white text-slate-800 font-sans shadow-2xl transition-transform duration-150 mx-auto select-none print:shadow-none print:m-0 print:transform-none"
      >
        {/* Document Frame with Exact Aspect Ratio (A4 standard: 210mm x 297mm -> approx 794px x 1123px) */}
        <div className="w-[794px] min-h-[1123px] flex flex-col justify-between bg-white relative overflow-hidden">
          
          {/* TOP SECTION: Header + Content */}
          <div className="flex-1 flex flex-col">
            
            {/* Header Navy Banner */}
            <div className="bg-[#16325B] text-white px-8 pt-6 pb-5 flex items-center justify-between relative">
              {/* Left: Official M&C Logo */}
              <div className="flex items-center">
                <MCLogo variant="light" className="h-16 text-white" />
              </div>

              {/* Center: Title COTIZACIÓN */}
              <div className="text-center">
                <h1 className="text-3xl font-extrabold tracking-[0.2em] text-white font-['Plus_Jakarta_Sans'] uppercase">
                  COTIZACIÓN
                </h1>
              </div>

              {/* Right: Metadata Grid */}
              <div className="text-right text-xs space-y-1 font-medium text-slate-200 min-w-[200px]">
                <div className="flex justify-end gap-2 items-center">
                  <span className="text-slate-300">Código:</span>
                  <span className="font-bold text-white tracking-wide">{quote.code || 'C1'}</span>
                </div>
                <div className="flex justify-end gap-2 items-center">
                  <span className="text-slate-300">N°</span>
                  <span>
                    {quote.quoteNumber ? (
                      <span className="font-bold text-white tracking-wide">{quote.quoteNumber}</span>
                    ) : (
                      renderVariable('', '(N COTIZACION INCREMNTADO)', 'Número Consecutivo')
                    )}
                  </span>
                </div>
                <div className="flex justify-end gap-2 items-center">
                  <span className="text-slate-300">NIT:</span>
                  <span className="font-bold text-white tracking-wide">{quote.nit || '901795226-7'}</span>
                </div>
                <div className="flex justify-end gap-2 items-center">
                  <span className="text-slate-300">Fecha:</span>
                  <span className="font-semibold text-white tracking-wide">
                    {quote.date || new Date().toLocaleDateString('es-CO')}
                  </span>
                </div>
              </div>
            </div>

            {/* Blue accent stripe underneath header */}
            <div className="h-1.5 w-full bg-[#1D4ED8]" />

            {/* Document Body Padding */}
            <div className="px-10 pt-7 pb-4 flex-1 flex flex-col">
              
              {/* Client & Project Information */}
              <div className="space-y-2 mb-6">
                <div className="text-sm font-bold text-slate-900 tracking-wide flex items-baseline gap-2">
                  <span className="shrink-0 text-slate-800">CLIENTE:</span>
                  <div className="flex-1">
                    {renderVariable(quote.clientName, '(NOMBRE CLIENTE)', 'Nombre del Cliente')}
                  </div>
                </div>

                <div className="text-sm font-bold text-slate-900 tracking-wide flex items-baseline gap-2">
                  <span className="shrink-0 text-slate-800">PROYECTO:</span>
                  <div className="flex-1">
                    {renderVariable(quote.projectName, '(NOMBRE PROYECTO)', 'Nombre del Proyecto')}
                  </div>
                </div>

                <p className="text-xs text-slate-700 pt-2 font-normal">
                  El proyecto incluye. la obra civil necesaria para llevar a cabo las siguientes tareas:
                </p>
              </div>

              {/* Tasks / Description Table Header */}
              <div className="bg-[#16325B] text-white px-5 py-2.5 rounded-t flex justify-between items-center text-xs font-bold tracking-wider uppercase">
                <span className="w-3/4">DESCRIPCIÓN</span>
                <span className="w-1/4 text-right">SUBTOTAL</span>
              </div>

              {/* Tasks List */}
              <div className="border-x border-b border-slate-200 min-h-[220px] p-5 flex flex-col justify-between bg-white text-xs">
                <div className="space-y-4">
                  {hasItems ? (
                    quote.items.map((item, idx) => (
                      <div key={item.id || idx} className="flex justify-between items-start gap-4">
                        <div className="flex items-start gap-2.5 w-3/4">
                          <span className="text-slate-600 font-bold text-sm leading-none">•</span>
                          <span className="text-slate-800 leading-relaxed font-normal whitespace-pre-wrap">
                            {item.description || '(DESCRIPCION DEL PROYECTO)'}
                          </span>
                        </div>
                        <div className="w-1/4 text-right font-mono font-semibold text-slate-900 tabular-nums">
                          {formatCurrency(item.subtotal)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex items-start gap-2.5 w-3/4">
                        <span className="text-slate-400 font-bold">•</span>
                        <div className="text-slate-500 italic">
                          {renderVariable('', '(DESCRICON DEL PROYECTO)', 'Descripción de Tareas')}
                        </div>
                      </div>
                      <div className="w-1/4 text-right font-mono font-medium text-slate-400">
                        {renderVariable('', '$(VALOR)', 'Monto')}
                      </div>
                    </div>
                  )}
                </div>

                {/* Subtle reassurance note if minimal tasks */}
                {hasItems && quote.items.length < 3 && (
                  <div className="text-[11px] text-slate-400 italic pt-6 border-t border-slate-100">
                    * Incluye mano de obra calificada, herramientas especializadas, equipo de seguridad y supervisión técnica permanente de obra.
                  </div>
                )}
              </div>

              {/* FINANCIAL BREAKDOWN AND PAYMENT TERMS ROW */}
              <div className="mt-8 grid grid-cols-12 gap-8 items-start">
                
                {/* Left Column: Payment Notes, Warnings & Contact */}
                <div className="col-span-7 space-y-4">
                  
                  {/* Payment Milestone Clause */}
                  <div className="text-[12px] text-slate-800 leading-relaxed">
                    <span className="font-bold">NOTA:</span> El pago se realiza de la siguiente manera el{' '}
                    <span className="font-bold">
                      {quote.startPct ? `${quote.startPct}%` : renderVariable('', '(PORCENTAJE AL INICIAR)', 'Porcentaje Inicio')}
                    </span>{' '}
                    al iniciar y el{' '}
                    <span className="font-bold">
                      {quote.endPct ? `${quote.endPct}%` : renderVariable('', '(PORCENTAJE AL FINALIZAR)', 'Porcentaje Final')}
                    </span>{' '}
                    restante al finalizar el trabajo
                  </div>

                  {/* Warning: Antes de IVA */}
                  <div className="text-[12px] font-bold text-[#DC2626] tracking-wide">
                    Importante: este valor es antes de IVA
                  </div>

                  {/* Gratitude & Confidence */}
                  <div className="pt-2 text-xs font-extrabold tracking-wider text-slate-900 uppercase">
                    GRACIAS POR SU CONFIANZA
                  </div>

                  {/* Official Contact Badges */}
                  <div className="space-y-1.5 text-xs text-slate-700 font-medium pt-1">
                    <div className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[#16325B]">
                        <Phone className="w-3 h-3 text-[#16325B]" />
                      </div>
                      <span className="font-mono text-slate-800 tracking-wide font-semibold">
                        {quote.contactPhone || '311 796 9848'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[#16325B]">
                        <Instagram className="w-3 h-3 text-[#16325B]" />
                      </div>
                      <span className="text-slate-800 font-medium">
                        {quote.contactInstagram || 'mcobracivil'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[#16325B]">
                        <Mail className="w-3 h-3 text-[#16325B]" />
                      </div>
                      <span className="text-slate-800 font-medium">
                        {quote.contactEmail || 'mcobracivil@gmail.com'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Column: Subtotal, AIU Breakdown & Total Box */}
                <div className="col-span-5 space-y-2">
                  <div className="bg-slate-50/80 rounded border border-slate-200 p-3 space-y-1.5 text-xs">
                    <div className="flex justify-between items-center text-slate-700">
                      <span className="font-semibold">Sub-total:</span>
                      <span className="font-mono tabular-nums text-slate-900 font-semibold">
                        {totals.subtotal > 0 ? formatCurrency(totals.subtotal) : '$(VALOR)'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-slate-600">
                      <span>Administración</span>
                      <span className="font-mono tabular-nums">
                        {quote.adminPct ? formatCurrency(totals.adminAmount) : '$0.00'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-slate-600">
                      <span>Imprevistos</span>
                      <span className="font-mono tabular-nums">
                        {quote.contingencyPct ? formatCurrency(totals.contingencyAmount) : '$0.00'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-slate-600">
                      <span>Utilidad</span>
                      <span className="font-mono tabular-nums">
                        {quote.utilityPct ? formatCurrency(totals.utilityAmount) : '$0.00'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-slate-600">
                      <span>IVA</span>
                      <span className="font-mono tabular-nums">
                        {quote.ivaPct ? formatCurrency(totals.ivaAmount) : '$0.00'}
                      </span>
                    </div>
                  </div>

                  {/* Primary Total Box (Navy Blue solid) */}
                  <div className="bg-[#16325B] text-white px-4 py-2.5 rounded flex justify-between items-center shadow-sm">
                    <span className="text-base font-bold tracking-wide">Total:</span>
                    <span className="font-mono text-base font-bold tracking-tight tabular-nums">
                      {totals.total > 0 ? formatCurrency(totals.total) : '$(VALOR)'}
                    </span>
                  </div>

                  {/* Representative Signature */}
                  <div className="pt-8 text-center sm:text-right">
                    <div className="inline-block text-center border-t border-slate-300 pt-1.5 min-w-[170px]">
                      <div className="font-bold text-slate-900 text-xs tracking-wide">
                        {quote.representativeName || 'Ever Becerra'}
                      </div>
                      <div className="text-[11px] text-slate-600">
                        {quote.representativeRole || 'Representante legal'}
                      </div>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>

          {/* BOTTOM DECORATIVE FOOTER */}
          <div className="h-9 w-full bg-[#CBD5E1]/60 relative flex items-center justify-end overflow-hidden px-8">
            <div className="flex items-center gap-2 h-full">
              <div className="w-4 h-12 bg-[#16325B] transform -skew-x-[25deg] translate-y-1" />
              <div className="w-4 h-12 bg-[#16325B] transform -skew-x-[25deg] translate-y-1" />
            </div>
          </div>

        </div>
      </div>
    );
  }
);

QuoteDocument.displayName = 'QuoteDocument';
