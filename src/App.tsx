/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { QuoteData } from './types';
import { QuoteDocument } from './components/QuoteDocument';
import { QuickForm } from './components/QuickForm';
import { EmailModal } from './components/EmailModal';
import { MCLogo } from './components/MCLogo';
import {
  Download,
  Mail,
  Printer,
  Sliders,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Eye,
  CheckCircle,
  FileCheck,
} from 'lucide-react';

export default function App() {
  const [quote, setQuote] = useState<QuoteData>({
    code: 'C1',
    quoteNumber: 'COT-001',
    nit: '901795226-7',
    date: new Date().toLocaleDateString('es-CO'),
    clientName: '',
    projectName: '',
    items: [],
    subtotal: 0,
    adminPct: 0,
    contingencyPct: 0,
    utilityPct: 0,
    ivaPct: 0,
    total: 0,
    startPct: 50,
    endPct: 50,
    notes: 'El pago se realiza de la siguiente manera el 50% al iniciar y el 50% restante al finalizar el trabajo.',
    representativeName: 'Ever Becerra',
    representativeRole: 'Representante legal',
    contactPhone: '311 796 9848',
    contactInstagram: 'mcobracivil',
    contactEmail: 'mcobracivil@gmail.com',
  });

  const [zoomScale, setZoomScale] = useState<number>(0.85);
  const [highlightEmpty, setHighlightEmpty] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  const documentRef = useRef<HTMLDivElement>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Sample real data preset for testing
  const handleLoadSample = () => {
    const sampleItems = [
      {
        id: '1',
        description: 'Demolición controlada de muros divisorios y retiro de escombros con volqueta a botadero certificado.',
        subtotal: 4500000,
      },
      {
        id: '2',
        description: 'Construcción de mampostería en bloque estructural, pañete liso y aplicación de estuco plástico.',
        subtotal: 7800000,
      },
      {
        id: '3',
        description: 'Suministro e instalación de pisos en porcelanato de alto tráfico 60x60 cm con boquilla epóxica.',
        subtotal: 6200000,
      },
    ];
    const subtotal = sampleItems.reduce((s, i) => s + i.subtotal, 0);

    setQuote((prev) => ({
      ...prev,
      clientName: 'Constructora Bolívar S.A.',
      projectName: 'Remodelación y Acabados Sede Empresarial Calle 26',
      items: sampleItems,
      subtotal,
      total: subtotal,
      startPct: 50,
      endPct: 50,
      quoteNumber: 'COT-014',
    }));
    showNotification('Ejemplo institucional cargado correctamente');
  };

  const handleNewQuote = () => {
    const nextNum = 'COT-' + String(Math.floor(Math.random() * 899 + 100));
    setQuote({
      code: 'C1',
      quoteNumber: nextNum,
      nit: '901795226-7',
      date: new Date().toLocaleDateString('es-CO'),
      clientName: '',
      projectName: '',
      items: [],
      subtotal: 0,
      adminPct: 0,
      contingencyPct: 0,
      utilityPct: 0,
      ivaPct: 0,
      total: 0,
      startPct: 50,
      endPct: 50,
      notes: 'El pago se realiza de la siguiente manera el 50% al iniciar y el 50% restante al finalizar el trabajo.',
      representativeName: 'Ever Becerra',
      representativeRole: 'Representante legal',
      contactPhone: '311 796 9848',
      contactInstagram: 'mcobracivil',
      contactEmail: 'mcobracivil@gmail.com',
    });
    showNotification(`Nueva cotización ${nextNum} iniciada`);
  };

  // Native Print (Crisp Vector PDF)
  const handlePrint = () => {
    window.print();
  };

  // Export to PDF using html2canvas & jsPDF
  const handleDownloadPDF = async () => {
    if (!documentRef.current) return;
    setIsExporting(true);

    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      // Temporarily set scale to 1 for high-fidelity rasterization
      const element = documentRef.current;
      const prevTransform = element.style.transform;
      element.style.transform = 'none';

      const canvas = await html2canvas(element, {
        scale: 2, // High resolution
        useCORS: true,
        logging: false,
        backgroundColor: '#FFFFFF',
      });

      element.style.transform = prevTransform;

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210; // A4 mm
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, Math.min(imgHeight, pageHeight));

      const safeClient = (quote.clientName || 'Cliente').replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `Cotizacion_${quote.code}_${quote.quoteNumber || '001'}_${safeClient}.pdf`;

      pdf.save(filename);
      showNotification(`Documento ${filename} descargado con éxito`);
    } catch (err: any) {
      console.error('Error generating PDF:', err);
      // Fallback to native print
      window.print();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
      
      {/* ======================================================== */}
      {/* TOP BAR CONTRACT: Brand — Nav/Mode — Primary Actions     */}
      {/* ======================================================== */}
      <header
        id="top-bar"
        className="flex items-center justify-between gap-8 px-6 py-3 bg-slate-900 border-b border-slate-800 shrink-0 z-20"
      >
        {/* Zone 1: Single text element wordmark */}
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

        {/* Zone 2: Navigation Links / Segmented Workspace Mode */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-400">
          <button
            type="button"
            onClick={handleNewQuote}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Nueva Cotización
          </button>

          <button
            type="button"
            onClick={handleLoadSample}
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

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsEmailModalOpen(true)}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg border border-slate-700 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
            title="Preparar correo listo para el cliente"
          >
            <Mail className="w-3.5 h-3.5 text-blue-400" />
            <span>Enviar por Correo</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={isExporting}
            className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 disabled:opacity-60"
            title="Descargar documento PDF listo para enviar"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Generando PDF...' : 'Descargar PDF'}</span>
          </button>
        </div>
      </header>

      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-16 right-6 z-50 bg-blue-600 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle className="w-4 h-4 text-white" />
          <span>{notification}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* MAIN TWO-COLUMN WORKSPACE: LEFT INPUT | RIGHT PREVIEW     */}
      {/* ======================================================== */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT COLUMN: Editor de Campos (Variables de Plantilla) */}
        <aside
          id="left-panel"
          className="w-full md:w-[480px] lg:w-[520px] flex flex-col shrink-0 bg-slate-900 border-r border-slate-800 h-full overflow-hidden"
        >
          {/* Header Panel */}
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

          {/* Form Content */}
          <div className="flex-1 overflow-hidden">
            <QuickForm quote={quote} onChange={setQuote} />
          </div>
        </aside>

        {/* RIGHT COLUMN: Interactive Document Viewport (1:1 Template) */}
        <main
          id="main-viewport"
          className="flex-1 flex flex-col bg-slate-950/90 h-full overflow-hidden relative"
        >
          
          {/* Document Viewport Toolbar */}
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
                onClick={() => setHighlightEmpty(!highlightEmpty)}
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

            {/* Zoom and Print Affordances */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setZoomScale((z) => Math.max(0.5, z - 0.1))}
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
                onClick={() => setZoomScale((z) => Math.min(1.2, z + 0.1))}
                className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                title="Aumentar zoom"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setZoomScale(0.85)}
                className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                title="Ajustar al visor"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>

              <div className="h-4 w-[1px] bg-slate-800 mx-1" />

              <button
                type="button"
                onClick={handlePrint}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 transition-colors"
                title="Imprimir directamente o guardar en PDF con el motor del navegador"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir</span>
              </button>
            </div>
          </div>

          {/* Document Canvas Container */}
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

      {/* ======================================================== */}
      {/* EMAIL & SHARING MODAL                                    */}
      {/* ======================================================== */}
      <EmailModal
        quote={quote}
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
      />

    </div>
  );
}
