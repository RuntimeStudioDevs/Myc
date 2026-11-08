import React, { useState, useRef, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { useQuote } from './modules/quote/hooks/useQuote';
import { useQuotePdf, ExportDocumentMode } from './modules/quote/hooks/useQuotePdf';
import { QuoteHeader } from './modules/quote/components/QuoteHeader';
import { QuoteToolbar } from './modules/quote/components/QuoteToolbar';
import { QuickForm } from './modules/quote/components/QuickForm';
import { QuoteDocument } from './modules/quote/components/QuoteDocument';
import { PresentationLetterDocument } from './modules/quote/components/PresentationLetterDocument';
import { EmailModal } from './modules/mailer/components/EmailModal';
import { SheetsConfigModal } from './modules/quote/components/SheetsConfigModal';
import { Toast } from './shared/components/Toast';
import { paginateQuoteItems } from './modules/quote/services/quote-paginator';
import {
  isGoogleSheetsConfigured,
  saveQuoteToGoogleSheets,
  fetchNextQuoteNumber,
} from './modules/quote/services/google-sheets.service';
import { Sliders, Eye } from 'lucide-react';

export default function App() {
  const { quote, setQuote, loadSample, resetQuote } = useQuote();
  const documentRef = useRef<HTMLDivElement>(null);
  const vaultRef = useRef<HTMLDivElement>(null);
  const { isExporting, printDocument, downloadPdf } = useQuotePdf(documentRef, vaultRef);

  const pages = paginateQuoteItems(quote.items);
  const totalPages = pages.length;

  const [activeDocumentView, setActiveDocumentView] = useState<'both' | 'letter' | 'quote'>('both');
  const [mobileTab, setMobileTab] = useState<'editor' | 'preview'>('editor');

  // Auto-cálculo de escala óptima para garantizar que la hoja A4 (794px) quepa sin desborde
  const calculateOptimalZoom = () => {
    if (typeof window === 'undefined') return 0.85;
    const width = window.innerWidth;
    if (width < 640) {
      const available = width - 24;
      return Math.max(0.35, Math.min(0.75, Number((available / 794).toFixed(2))));
    }
    if (width < 1024) {
      const available = width - 48;
      return Math.max(0.55, Math.min(0.9, Number((available / 794).toFixed(2))));
    }
    return 0.85;
  };

  const [zoomScale, setZoomScale] = useState<number>(() => calculateOptimalZoom());
  const [highlightEmpty, setHighlightEmpty] = useState<boolean>(true);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState<boolean>(false);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Escuchar redimensionamiento de pantalla para mantener escala óptima en móviles
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setZoomScale(calculateOptimalZoom());
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const handleResetZoom = () => {
    const optimal = calculateOptimalZoom();
    setZoomScale(optimal);
    showNotification(`Escala adaptada a la pantalla (${Math.round(optimal * 100)}%)`);
  };

  const handleDownloadPdf = async (mode?: ExportDocumentMode) => {
    const strategyId = mode || (activeDocumentView === 'both' ? 'joint' : activeDocumentView);
    let activeQuote = quote;

    // Si Google Sheets está conectado, guardar cliente y obtener consecutivo único atómico
    if (isGoogleSheetsConfigured()) {
      showNotification('Conectando con Google Sheets y asignando N° único...');
      const cloudRes = await saveQuoteToGoogleSheets(quote);
      if (cloudRes.success && cloudRes.quoteNumber) {
        activeQuote = {
          ...quote,
          quoteNumber: cloudRes.quoteNumber,
        };
        // Sincronizar inmediatamente el DOM antes de que html2canvas capture
        flushSync(() => {
          setQuote(activeQuote);
        });
        showNotification(`Registrado en Google Sheets (N° ${cloudRes.quoteNumber}). Generando PDF...`);
      } else if (cloudRes.isOfflineFallback) {
        showNotification(`Modo local (${cloudRes.error || 'sin conexión'}). Generando PDF...`);
      }
    }

    downloadPdf(activeQuote, strategyId, showNotification);
  };

  const handleSheetsConfigSaved = () => {
    if (isGoogleSheetsConfigured()) {
      fetchNextQuoteNumber().then((res) => {
        if (res.success && res.nextQuoteNumber) {
          setQuote({
            ...quote,
            quoteNumber: res.nextQuoteNumber,
          });
          showNotification(`Google Sheets conectado. Próximo consecutivo: N° ${res.nextQuoteNumber}`);
        } else {
          showNotification('Google Sheets conectado.');
        }
      });
    } else {
      showNotification('Modo local activado.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans select-none antialiased">
      {/* Barra Superior Institucional con Menú Desplegable Basado en Strategy Pattern */}
      <QuoteHeader
        quote={quote}
        isExporting={isExporting}
        activeView={activeDocumentView === 'both' ? 'joint' : activeDocumentView}
        onNewQuote={handleNewQuote}
        onLoadSample={handleLoadSample}
        onOpenEmailModal={() => setIsEmailModalOpen(true)}
        onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
        onDownloadPdf={handleDownloadPdf}
      />

      {/* Notificación Toast */}
      <Toast message={notification} />

      {/* Selector Segmentado de Modos en Móvil y Tablet (< 1024px) */}
      <div className="lg:hidden bg-white border-b border-slate-200 px-3 py-2 flex items-center justify-center shrink-0 z-10 shadow-2xs">
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl border border-slate-200 w-full max-w-md">
          <button
            type="button"
            onClick={() => setMobileTab('editor')}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              mobileTab === 'editor'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Editor de Obra</span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                mobileTab === 'editor'
                  ? 'bg-blue-800 text-white'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {quote.items.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMobileTab('preview')}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              mobileTab === 'preview'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Vista Previa & PDF</span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                mobileTab === 'preview'
                  ? 'bg-blue-800 text-white'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {activeDocumentView === 'letter'
                ? 1
                : activeDocumentView === 'quote'
                ? totalPages
                : totalPages + 1}p
            </span>
          </button>
        </div>
      </div>

      {/* Espacio de Trabajo Principal: Dos Columnas en Desktop (>= 1024px) o Pestañas en Móvil/Tablet (< 1024px) */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Columna Izquierda: Consola de Captura de Campos Ergonómica */}
        <aside
          id="left-panel"
          className={`w-full lg:w-[480px] xl:w-[540px] 2xl:w-[600px] flex-col shrink-0 bg-slate-50 border-r border-slate-200 h-full overflow-hidden shadow-xs ${
            mobileTab === 'editor' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {/* Encabezado del Panel de Captura */}
          <div className="px-4 sm:px-5 py-3 sm:py-3.5 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 shadow-xs">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-900 border border-blue-200 flex items-center justify-center font-bold shrink-0">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Consola de Captura de Obra
                </h2>
                <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium">
                  Modo claro con controles ergonómicos en 5 pasos
                </p>
              </div>
            </div>

            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
              {quote.items.length} {quote.items.length === 1 ? 'partida' : 'partidas'}
            </span>
          </div>

          {/* Formulario con Navegación y Campos Amplios */}
          <div className="flex-1 overflow-hidden">
            <QuickForm quote={quote} onChange={setQuote} />
          </div>
        </aside>

        {/* Columna Derecha: Vista Previa Interactiva de Documentos */}
        <main
          id="main-viewport"
          className={`flex-1 flex-col bg-slate-200/50 h-full overflow-hidden relative ${
            mobileTab === 'preview' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {/* Barra de Herramientas con Selector Segmentado (Dossier / Carta / Cotización) */}
          <QuoteToolbar
            zoomScale={zoomScale}
            highlightEmpty={highlightEmpty}
            totalPages={totalPages}
            activeView={activeDocumentView}
            onViewChange={setActiveDocumentView}
            onToggleHighlight={() => setHighlightEmpty(!highlightEmpty)}
            onZoomIn={() => setZoomScale((z) => Math.min(1.2, Number((z + 0.1).toFixed(2))))}
            onZoomOut={() => setZoomScale((z) => Math.max(0.35, Number((z - 0.1).toFixed(2))))}
            onResetZoom={handleResetZoom}
            onPrint={printDocument}
          />

          {/* Visor con Scroll */}
          <div
            id="quote-viewport-scroll"
            className="flex-1 overflow-auto p-3 sm:p-8 flex items-start justify-center bg-slate-300/40 print:p-0 print:m-0 print:overflow-visible print:block print:bg-white print:w-[210mm]"
          >
            <div
              id="quote-viewport-scale"
              className="transition-all duration-150 ease-out print:transform-none print:m-0 print:p-0 print:block print:w-[210mm]"
            >
              {/* Contenedor Imprimible y Capturable (Primero Cotización, debajo Carta de Presentación) */}
              <div
                ref={documentRef}
                id="dossier-printable-container"
                className="flex flex-col items-center gap-6 sm:gap-10 print:gap-0"
              >
                {/* 1. Vista Cotización Canva Oficial */}
                {(activeDocumentView === 'both' || activeDocumentView === 'quote') && (
                  <QuoteDocument
                    quote={quote}
                    scale={zoomScale}
                    highlightEmpty={highlightEmpty}
                  />
                )}

                {/* 2. Vista Carta de Presentación */}
                {(activeDocumentView === 'both' || activeDocumentView === 'letter') && (
                  <PresentationLetterDocument
                    quote={quote}
                    scale={zoomScale}
                    highlightEmpty={highlightEmpty}
                  />
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Bóveda de Renderizado Limpio 1:1 para Exportación PDF HD Sin Escalar */}
      <div
        ref={vaultRef}
        id="pdf-render-vault"
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: '-10000px',
          top: 0,
          width: '794px',
          zIndex: -9999,
          pointerEvents: 'none',
        }}
      >
        <QuoteDocument quote={quote} scale={1} highlightEmpty={false} />
        <PresentationLetterDocument quote={quote} scale={1} highlightEmpty={false} />
      </div>

      {/* Modal de Envío por Correo y WhatsApp */}
      <EmailModal
        quote={quote}
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
      />

      {/* Modal de Configuración y Diagnóstico de Google Sheets */}
      <SheetsConfigModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
        onConfigSaved={handleSheetsConfigSaved}
      />
    </div>
  );
}
