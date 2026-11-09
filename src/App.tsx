import { useState, useRef, useEffect } from 'react';
import { useQuote } from './modules/quote/hooks/useQuote';
import { useQuotePdf, ExportDocumentMode } from './modules/quote/hooks/useQuotePdf';
import { QuoteHeader } from './modules/quote/components/QuoteHeader';
import { QuoteToolbar } from './modules/quote/components/QuoteToolbar';
import { QuickForm } from './modules/quote/components/QuickForm';
import { QuoteDocument } from './modules/quote/components/QuoteDocument';
import { PresentationLetterDocument } from './modules/quote/components/PresentationLetterDocument';
import { QuoteRecoveryModal } from './modules/quote/components/QuoteRecoveryModal';
import { Toast } from './shared/components/Toast';
import { paginateQuoteItems } from './modules/quote/services/quote-paginator';
import {
  saveQuoteToGoogleSheets,
  updateQuoteInGoogleSheets,
  getEmergencyDraft,
} from './modules/quote/services/google-sheets.service';
import { QuoteData } from './modules/quote/types/quote.types';
import { Sliders, Eye } from 'lucide-react';

export default function App() {
  const {
    quote,
    setQuote,
    markAsFinalized,
    resetQuote,
    loadRecoveredQuote,
    cloneAsNewQuote,
    hasUnsavedChanges,
  } = useQuote();

  const [isFinalizing, setIsFinalizing] = useState<boolean>(false);
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState<boolean>(false);
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

  // Notificación de borrador de emergencia huérfano disponible al iniciar
  useEffect(() => {
    const draft = getEmergencyDraft();
    if (draft && draft.quote) {
      const isBlank =
        !draft.quote.clientName?.trim() &&
        !draft.quote.projectName?.trim() &&
        draft.quote.items.length === 0;

      if (!isBlank && !quote.clientName && !quote.projectName && quote.items.length === 0) {
        const minutesAgo = Math.max(1, Math.round((Date.now() - draft.timestamp) / 60000));
        showNotification(
          `Borrador no guardado disponible (${draft.quote.code || 'C1'} N° ${draft.quote.quoteNumber}, hace ${minutesAgo}m). Abrí 'Recuperar' para cargarlo.`
        );
      }
    }
  }, []);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleNewQuote = async () => {
    showNotification('Consultando consecutivo y preparando nueva cotización...');
    const msg = await resetQuote();
    showNotification(msg);
  };

  const handleCloneQuote = async () => {
    showNotification('Clonando cotización con nuevo consecutivo...');
    const msg = await cloneAsNewQuote();
    showNotification(msg);
  };

  const handleSelectRecoveredQuote = (recovered: QuoteData) => {
    loadRecoveredQuote(recovered);
    showNotification(`Cotización N° ${recovered.quoteNumber} cargada exitosamente para edición.`);
  };

  const handleResetZoom = () => {
    const optimal = calculateOptimalZoom();
    setZoomScale(optimal);
    showNotification(`Escala adaptada a la pantalla (${Math.round(optimal * 100)}%)`);
  };

  // Finalizar o Actualizar cotización en Google Sheets
  const handleFinalizeQuote = async (): Promise<boolean> => {
    if (!quote.clientName || !quote.clientName.trim()) {
      showNotification('El Nombre del Cliente o Empresa es obligatorio (Paso 1).');
      return false;
    }
    if (!quote.projectName || !quote.projectName.trim()) {
      showNotification('El Nombre de la Obra o Proyecto es obligatorio (Paso 1).');
      return false;
    }
    if (!quote.location || !quote.location.trim()) {
      showNotification('La Ubicación de la Obra es obligatoria (Paso 1).');
      return false;
    }
    if (!quote.items || quote.items.length === 0) {
      showNotification('Debes agregar al menos una tarea de obra en el Paso 2.');
      return false;
    }

    setIsFinalizing(true);
    const isUpdating = Boolean(quote.isEditingExisting);

    showNotification(
      isUpdating
        ? `Actualizando Cotización N° ${quote.quoteNumber} en Google Sheets...`
        : 'Validando y guardando cotización en Google Sheets...'
    );

    try {
      const saveRes = isUpdating
        ? await updateQuoteInGoogleSheets(quote)
        : await saveQuoteToGoogleSheets(quote);

      if (!saveRes.success) {
        showNotification(saveRes.error || 'No se pudo guardar la cotización.');
        setIsFinalizing(false);
        return false;
      }

      const assignedNumber = saveRes.quoteNumber || quote.quoteNumber;
      markAsFinalized(assignedNumber);
      showNotification(
        saveRes.message ||
          (isUpdating
            ? `Cotización N° ${assignedNumber} actualizada exitosamente.`
            : `Cotización N° ${assignedNumber} finalizada con éxito.`)
      );
      return true;
    } catch (err: any) {
      console.error('Error al finalizar cotización:', err);
      const msg = err?.message ? `Error: ${err.message}` : 'Error al conectar con Google Sheets.';
      showNotification(msg);
      return false;
    } finally {
      setIsFinalizing(false);
    }
  };

  // Descarga de PDF: Responsabilidad única de exportación (NO guarda en Sheets para evitar duplicaciones)
  const handleDownloadPdf = (mode?: ExportDocumentMode) => {
    const strategyId = mode || (activeDocumentView === 'both' ? 'joint' : activeDocumentView);
    downloadPdf(quote, strategyId, showNotification);
  };

  return (
    <div className="h-screen max-h-screen w-screen overflow-hidden bg-slate-100 text-slate-800 flex flex-col font-sans select-none antialiased">
      {/* Barra Superior Institucional con Menú Desplegable y Botón de Recuperación */}
      <QuoteHeader
        quote={quote}
        isExporting={isExporting}
        activeView={activeDocumentView === 'both' ? 'joint' : activeDocumentView}
        onNewQuote={handleNewQuote}
        onDownloadPdf={handleDownloadPdf}
        onOpenRecovery={() => setIsRecoveryModalOpen(true)}
      />

      {/* Modal de Búsqueda y Confirmación Emergente de Recuperación */}
      <QuoteRecoveryModal
        isOpen={isRecoveryModalOpen}
        onClose={() => setIsRecoveryModalOpen(false)}
        onSelectQuote={handleSelectRecoveredQuote}
        currentQuoteHasChanges={hasUnsavedChanges}
      />

      {/* Notificación Toast */}
      <Toast message={notification} />

      {/* Selector Segmentado de Modos en Móvil y Tablet (< 1024px) */}
      <div className="lg:hidden bg-white border-b border-slate-200 px-3 py-2 flex items-center justify-center shrink-0 z-10 shadow-2xs">
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl border border-slate-200 w-full max-w-md">
          <button
            type="button"
            onClick={() => setMobileTab('editor')}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
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
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
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
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative min-h-0">
        {/* Columna Izquierda: Consola de Captura de Campos Ergonómica */}
        <aside
          id="left-panel"
          className={`w-full lg:w-[480px] xl:w-[540px] 2xl:w-[600px] flex-col shrink-0 bg-slate-50 border-r border-slate-200 h-full overflow-hidden shadow-xs ${
            mobileTab === 'editor' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <div className="flex-1 overflow-hidden h-full min-h-0">
            <QuickForm
              quote={quote}
              onChange={setQuote}
              onFinalizeQuote={handleFinalizeQuote}
              onDownloadQuote={() => handleDownloadPdf()}
              onNewQuote={handleNewQuote}
              onCloneQuote={handleCloneQuote}
              isFinalizing={isFinalizing}
            />
          </div>
        </aside>

        {/* Columna Derecha: Vista Previa Interactiva de Documentos */}
        <main
          id="main-viewport"
          className={`flex-1 flex-col bg-slate-200/50 h-full overflow-hidden relative ${
            mobileTab === 'preview' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {/* Barra de Herramientas con Selector Segmentado */}
          <QuoteToolbar
            zoomScale={zoomScale}
            highlightEmpty={highlightEmpty}
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
              {/* Contenedor Imprimible y Capturable */}
              <div
                ref={documentRef}
                id="dossier-printable-container"
                className="flex flex-col items-center gap-6 sm:gap-10 print:gap-0"
              >
                {/* 1. Vista Cotización */}
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
    </div>
  );
}
