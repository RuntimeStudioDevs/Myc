import React from 'react';
import { MCLogo } from '../../../shared/components/MCLogo';
import { QuoteData } from '../types/quote.types';
import { Mail, Download, RotateCcw, FileCheck } from 'lucide-react';

interface QuoteHeaderProps {
  quote: QuoteData;
  isExporting: boolean;
  onNewQuote: () => void;
  onLoadSample: () => void;
  onOpenEmailModal: () => void;
  onDownloadPdf: () => void;
}

export const QuoteHeader: React.FC<QuoteHeaderProps> = ({
  quote,
  isExporting,
  onNewQuote,
  onLoadSample,
  onOpenEmailModal,
  onDownloadPdf,
}) => {
  return (
    <header
      id="top-bar"
      className="flex items-center justify-between gap-8 px-6 py-3 bg-slate-900 border-b border-slate-800 shrink-0 z-20"
    >
      {/* Marca / Identidad Corporativa */}
      <div className="flex items-center gap-3 shrink-0">
        <MCLogo variant="light" className="h-8 text-blue-400" />
        <div className="flex flex-col">
          <span className="text-sm font-bold tracking-tight text-white whitespace-nowrap">
            M&C CONSTRUCCIONES CIVILES
          </span>
          <span className="text-[10px] text-slate-400 tracking-wider uppercase font-mono">
            Editor y Generador Oficial de Cotizaciones
          </span>
        </div>
      </div>

      {/* Navegación y Consecutivo */}
      <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-400">
        <button
          type="button"
          onClick={onNewQuote}
          className="hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Nueva Cotización
        </button>

        <button
          type="button"
          onClick={onLoadSample}
          className="hover:text-blue-400 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
        >
          <FileCheck className="w-3.5 h-3.5" />
          Cargar Ejemplo
        </button>

        <div className="h-4 w-[1px] bg-slate-800" />

        <div className="flex items-center gap-1 text-[11px] font-mono text-slate-300">
          <span className="text-slate-500">Consecutivo:</span>
          <span className="text-blue-400 font-bold">{quote.quoteNumber || 'COT-001'}</span>
        </div>
      </nav>

      {/* Acciones Principales */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          type="button"
          onClick={onOpenEmailModal}
          className="px-3.5 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg border border-slate-700 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
          title="Preparar correo listo para el cliente"
        >
          <Mail className="w-3.5 h-3.5 text-blue-400" />
          <span>Enviar por Correo</span>
        </button>

        <button
          type="button"
          onClick={onDownloadPdf}
          disabled={isExporting}
          className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 disabled:opacity-60"
          title="Descargar documento PDF listo para enviar"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{isExporting ? 'Generando PDF...' : 'Descargar PDF'}</span>
        </button>
      </div>
    </header>
  );
};
