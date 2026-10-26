import React, { useState, useRef } from 'react';
import { useQuote } from './modules/quote/hooks/useQuote';
import { useQuotePdf } from './modules/quote/hooks/useQuotePdf';
import { QuoteHeader } from './modules/quote/components/QuoteHeader';
import { QuoteToolbar } from './modules/quote/components/QuoteToolbar';
import { QuickForm } from './modules/quote/components/QuickForm';
import { QuoteDocument } from './modules/quote/components/QuoteDocument';
import { EmailModal } from './modules/mailer/components/EmailModal';
import { Toast } from './shared/components/Toast';
import { Sliders } from 'lucide-react';

export default function App() {
  const { quote, setQuote, loadSample, resetQuote } = useQuote();
  const documentRef = useRef<HTMLDivElement>(null);
  const { isExporting, printDocument, downloadPdf } = useQuotePdf(documentRef);

  const [zoomScale, setZoomScale] = useState<number>(0.85);
  const [highlightEmpty, setHighlightEmpty] = useState<boolean>(true);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleNewQuote = () => {
    const msg = resetQuote();
    showNotification(msg);
  };

  const handleLoadSample = () => {
    const msg = loadSample();
    showNotification(msg);
  };

  const handleDownloadPdf = () => {
    downloadPdf(quote, showNotification);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
      {/* Barra Superior Institucional */}
      <QuoteHeader
        quote={quote}
        isExporting={isExporting}
        onNewQuote={handleNewQuote}
        onLoadSample={handleLoadSample}
        onOpenEmailModal={() => setIsEmailModalOpen(true)}
        onDownloadPdf={handleDownloadPdf}
      />

      {/* Notificación Toast */}
      <Toast message={notification} />

      {/* Espacio de Trabajo Principal Dividido en Dos Columnas */}
      <div className="flex-1 flex overflow-hidden">
        {/* Columna Izquierda: Formulario y Editor de Variables */}
        <aside
          id="left-panel"
          className="w-full md:w-[480px] lg:w-[520px] flex flex-col shrink-0 bg-slate-900 border-r border-slate-800 h-full overflow-hidden"
        >
          <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                  Editor de Campos
                </h2>
                <p className="text-[10px] text-slate-400">
                  Llenado directo de las variables entre paréntesis ()
                </p>
              </div>
            </div>

            <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {quote.items.length} {quote.items.length === 1 ? 'partida' : 'partidas'}
            </span>
          </div>

          <div className="flex-1 overflow-hidden">
            <QuickForm quote={quote} onChange={setQuote} />
          </div>
        </aside>

        {/* Columna Derecha: Vista Previa Interactiva de Plantilla (Canva 1:1) */}
        <main
          id="main-viewport"
          className="flex-1 flex flex-col bg-slate-950/90 h-full overflow-hidden relative"
        >
          <QuoteToolbar
            zoomScale={zoomScale}
            highlightEmpty={highlightEmpty}
            onToggleHighlight={() => setHighlightEmpty(!highlightEmpty)}
            onZoomIn={() => setZoomScale((z) => Math.min(1.2, z + 0.1))}
            onZoomOut={() => setZoomScale((z) => Math.max(0.5, z - 0.1))}
            onResetZoom={() => setZoomScale(0.85)}
            onPrint={printDocument}
          />

          <div className="flex-1 overflow-auto p-8 flex items-start justify-center bg-neutral-900/40">
            <div className="transition-all duration-150 ease-out">
              <QuoteDocument
                ref={documentRef}
                quote={quote}
                scale={zoomScale}
                highlightEmpty={highlightEmpty}
              />
            </div>
          </div>
        </main>
      </div>

      {/* Modal de Envío por Correo y WhatsApp */}
      <EmailModal
        quote={quote}
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
      />
    </div>
  );
}
