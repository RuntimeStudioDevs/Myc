import React from 'react';
import { Eye, ZoomIn, ZoomOut, Maximize2, Printer } from 'lucide-react';

interface QuoteToolbarProps {
  zoomScale: number;
  highlightEmpty: boolean;
  onToggleHighlight: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onPrint: () => void;
}

export const QuoteToolbar: React.FC<QuoteToolbarProps> = ({
  zoomScale,
  highlightEmpty,
  onToggleHighlight,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onPrint,
}) => {
  return (
    <div
      id="document-toolbar"
      className="px-6 py-2.5 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-300 shrink-0"
    >
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Vista Previa de Plantilla (Canva 1:1)
        </span>
        <span className="text-slate-600">·</span>
        <button
          type="button"
          onClick={onToggleHighlight}
          className={`px-2 py-0.5 rounded text-[11px] flex items-center gap-1 transition-colors ${
            highlightEmpty
              ? 'bg-amber-950/60 text-amber-300 border border-amber-800/60'
              : 'bg-slate-800 text-slate-400'
          }`}
          title="Resalta las variables entre paréntesis () pendientes de diligenciar"
        >
          <Eye className="w-3 h-3" />
          {highlightEmpty ? 'Resaltando variables ()' : 'Vista final de impresión'}
        </button>
      </div>

      {/* Controles de Zoom e Impresión */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onZoomOut}
          className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          title="Reducir zoom"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <span className="font-mono text-[11px] text-slate-400 w-10 text-center">
          {Math.round(zoomScale * 100)}%
        </span>

        <button
          type="button"
          onClick={onZoomIn}
          className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          title="Aumentar zoom"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={onResetZoom}
          className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          title="Ajustar al visor"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-[1px] bg-slate-800 mx-1" />

        <button
          type="button"
          onClick={onPrint}
          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 transition-colors"
          title="Imprimir directamente o guardar en PDF con el motor del navegador"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Imprimir</span>
        </button>
      </div>
    </div>
  );
};
