import React from 'react';
import {
  Eye,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Printer,
  Layers,
  FileText,
  FileSpreadsheet,
} from 'lucide-react';

interface QuoteToolbarProps {
  zoomScale: number;
  highlightEmpty: boolean;
  totalPages?: number;
  activeView: 'both' | 'letter' | 'quote';
  onViewChange: (view: 'both' | 'letter' | 'quote') => void;
  onToggleHighlight: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onPrint: () => void;
}

export const QuoteToolbar: React.FC<QuoteToolbarProps> = ({
  zoomScale,
  highlightEmpty,
  totalPages = 1,
  activeView,
  onViewChange,
  onToggleHighlight,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onPrint,
}) => {
  const pageLabel =
    activeView === 'letter'
      ? '1 Hoja A4'
      : activeView === 'quote'
      ? `${totalPages} ${totalPages === 1 ? 'Hoja A4' : 'Hojas A4'}`
      : `${totalPages + 1} Hojas (Dossier)`;

  return (
    <div
      id="document-toolbar"
      className="px-4 sm:px-6 py-2 bg-white/95 backdrop-blur border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-700 shrink-0 shadow-xs z-10"
    >
      {/* Selector Segmentado de Vista (Dossier / Carta / Cotización) */}
      <div className="flex items-center gap-2">
        <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 shadow-2xs">
          <button
            type="button"
            onClick={() => onViewChange('both')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeView === 'both'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
            title="Ver propuesta completa: Carta de presentación + Cotización detallada"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Dossier Completo</span>
            <span className="sm:hidden">Dossier</span>
          </button>

          <button
            type="button"
            onClick={() => onViewChange('letter')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeView === 'letter'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
            title="Ver únicamente la Carta de Presentación formal"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Carta</span>
          </button>

          <button
            type="button"
            onClick={() => onViewChange('quote')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeView === 'quote'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
            title="Ver únicamente la Cotización de obra civil"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Cotización</span>
          </button>
        </div>

        <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-900 border border-blue-200">
          {pageLabel}
        </span>

        <button
          type="button"
          onClick={onToggleHighlight}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
            highlightEmpty
              ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-xs'
              : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
          }`}
          title="Resalta las variables entre paréntesis () pendientes de diligenciar"
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="hidden md:inline">
            {highlightEmpty ? 'Resaltando ()' : 'Vista final'}
          </span>
        </button>
      </div>

      {/* Controles de Zoom e Impresión */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onZoomOut}
          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors shadow-xs"
          title="Reducir zoom"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <span className="font-mono text-xs font-semibold text-slate-700 w-12 text-center bg-slate-100 py-1 rounded-md border border-slate-200">
          {Math.round(zoomScale * 100)}%
        </span>

        <button
          type="button"
          onClick={onZoomIn}
          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors shadow-xs"
          title="Aumentar zoom"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onResetZoom}
          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors shadow-xs"
          title="Ajustar al visor"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        <div className="h-4 w-[1px] bg-slate-200 mx-1" />

        <button
          type="button"
          onClick={onPrint}
          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-800 font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          title="Imprimir directamente o guardar en PDF con el navegador"
        >
          <Printer className="w-4 h-4 text-slate-600" />
          <span>Imprimir</span>
        </button>
      </div>
    </div>
  );
};
