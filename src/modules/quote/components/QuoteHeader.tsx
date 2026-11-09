import React, { useState, useRef, useEffect } from 'react';
import { MCLogo } from '../../../shared/components/MCLogo';
import { QuoteData } from '../types/quote.types';
import { ExportDocumentMode } from '../hooks/useQuotePdf';
import {
  exportStrategyRegistry,
} from '../services/export-strategies/export-strategies';
import {
  Download,
  RotateCcw,
  ChevronDown,
  Layers,
  Files,
  FileText,
  FileSpreadsheet,
  Cloud,
  Menu,
  X,
  Search,
} from 'lucide-react';
import {
  isGoogleSheetsConfigured,
  checkGoogleSheetsHealth,
  GoogleSheetsHealthStatus,
} from '../services/google-sheets.service';

interface QuoteHeaderProps {
  quote: QuoteData;
  isExporting: boolean;
  activeView?: ExportDocumentMode;
  onNewQuote: () => void;
  onDownloadPdf: (mode?: ExportDocumentMode) => void;
  onOpenRecovery?: () => void;
}

export const QuoteHeader: React.FC<QuoteHeaderProps> = ({
  quote,
  isExporting,
  activeView = 'joint',
  onNewQuote,
  onDownloadPdf,
  onOpenRecovery,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [sheetStatus, setSheetStatus] = useState<GoogleSheetsHealthStatus>(
    isGoogleSheetsConfigured() ? 'checking' : 'unconfigured'
  );

  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const strategies = exportStrategyRegistry.getAll();

  // Microproceso en segundo plano para verificar health-check de Google Sheets sin afectar rendimiento
  useEffect(() => {
    if (!isGoogleSheetsConfigured()) {
      setSheetStatus('unconfigured');
      return;
    }

    let isMounted = true;

    const runHealthCheck = async () => {
      try {
        const res = await checkGoogleSheetsHealth();
        if (isMounted) setSheetStatus(res);
      } catch (_) {
        if (isMounted) setSheetStatus('disconnected');
      }
    };

    const initialTimer = setTimeout(() => {
      runHealthCheck();
    }, 1200);

    const intervalTimer = setInterval(runHealthCheck, 180000);

    return () => {
      isMounted = false;
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
    };
  }, []);

  // Cerrar los menús desplegables al hacer clic afuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDownload = (mode: ExportDocumentMode) => {
    setIsDropdownOpen(false);
    onDownloadPdf(mode);
  };

  const getPrimaryLabel = () => {
    if (isExporting) return 'Generando PDF...';
    const current = exportStrategyRegistry.get(activeView);
    return current ? current.shortLabel : 'Descargar Cotización';
  };

  const getStrategyIcon = (id: ExportDocumentMode) => {
    switch (id) {
      case 'joint':
        return <Layers className="w-4 h-4" />;
      case 'separated':
        return <Files className="w-4 h-4" />;
      case 'quote':
        return <FileSpreadsheet className="w-4 h-4" />;
      case 'letter':
        return <FileText className="w-4 h-4" />;
      default:
        return <Download className="w-4 h-4" />;
    }
  };

  return (
    <header
      id="top-bar"
      className="relative flex items-center justify-between gap-2.5 sm:gap-4 px-3 sm:px-6 py-2.5 sm:py-3 bg-white border-b border-slate-200 shadow-xs shrink-0 z-30"
    >
      {/* Marca / Identidad Corporativa */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0 min-w-0">
        <div className="h-9 w-9 sm:h-11 sm:w-11 rounded-xl bg-blue-950 flex items-center justify-center p-1 border border-blue-900 shadow-xs shrink-0">
          <MCLogo variant="transparent" className="h-6 sm:h-8 w-auto" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-xs sm:text-base font-bold tracking-tight text-slate-900 truncate">
            <span className="hidden sm:inline">M&C CONSTRUCCIONES CIVILES</span>
            <span className="sm:hidden">M&C CIVILES</span>
          </span>
          <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium font-mono truncate">
            NIT: {quote.nit || '901795226-7'} · <span className="hidden xs:inline">Editor Oficial</span>
          </span>
        </div>
      </div>

      {/* Navegación Desktop (>= 1024px) */}
      <nav className="hidden lg:flex items-center gap-3 text-xs font-semibold text-slate-600">
        {quote.isEditingExisting && (
          <div className="flex items-center gap-1.5 bg-amber-50 text-amber-900 border border-amber-300 px-2.5 py-1 rounded-lg text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Editando {quote.code || 'C1'} N° {quote.quoteNumber}</span>
          </div>
        )}

        {onOpenRecovery && (
          <button
            type="button"
            onClick={onOpenRecovery}
            className="hover:text-blue-900 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer text-blue-700 font-bold"
            title="Ver todas las cotizaciones registradas en Google Sheets"
          >
            <Search className="w-3.5 h-3.5 text-blue-600" />
            Todas las Cotizaciones
          </button>
        )}

        <button
          type="button"
          onClick={onNewQuote}
          className="hover:text-slate-900 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
          title="Reiniciar cotización en blanco"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          Nueva Cotización
        </button>
      </nav>

      {/* Acciones Principales */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Indicador Automático de Google Sheets */}
        <div
          className={`relative p-2 rounded-xl transition-all border flex items-center justify-center shrink-0 select-none ${
            sheetStatus === 'connected'
              ? 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-2xs'
              : sheetStatus === 'checking'
              ? 'bg-amber-50 text-amber-600 border-amber-200'
              : 'bg-slate-100 text-slate-400 border-slate-200'
          }`}
          title={
            sheetStatus === 'connected'
              ? 'Google Sheets: Conectado y en línea'
              : sheetStatus === 'checking'
              ? 'Google Sheets: Verificando conexión en segundo plano...'
              : 'Google Sheets: Desconectado o sin conexión'
          }
        >
          <Cloud className="w-4 h-4" />
          {sheetStatus === 'connected' && (
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          )}
        </div>

        {/* Botón Móvil de Recuperación (< 1024px) */}
        {onOpenRecovery && (
          <button
            type="button"
            onClick={onOpenRecovery}
            className="lg:hidden p-2 rounded-xl text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors flex items-center justify-center cursor-pointer shrink-0"
            title="Ver todas las cotizaciones"
          >
            <Search className="w-4 h-4 text-blue-700" />
          </button>
        )}

        {/* Grupo de Botón de Descarga / Impresión con Dropdown de Estrategias */}
        <div ref={dropdownRef} className="relative inline-flex rounded-xl shadow-xs">
          <button
            type="button"
            onClick={() => handleDownload(activeView)}
            disabled={isExporting}
            className="px-3 sm:px-4.5 py-2 text-xs sm:text-sm font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-l-xl transition-all whitespace-nowrap flex items-center gap-1.5 sm:gap-2 disabled:opacity-60 cursor-pointer"
            title="Descargar documento PDF con el consecutivo asignado"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">{getPrimaryLabel()}</span>
            <span className="sm:hidden">PDF</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            disabled={isExporting}
            className="px-2 sm:px-2.5 py-2 text-white bg-blue-950 hover:bg-blue-900 border-l border-blue-800 rounded-r-xl transition-colors disabled:opacity-60 flex items-center justify-center cursor-pointer"
            title="Elegir modalidad de exportación (Junta, Separada en 1 Clic, Solo Cotización o Solo Carta)"
          >
            <ChevronDown
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-150 ${
                isDropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Menú Desplegable con las 4 Estrategias de Exportación */}
          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 max-w-[calc(100vw-20px)] bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 text-left animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3.5 py-2 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Modalidades de Exportación
                  </span>
                </div>
                <div
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 select-none ${
                    sheetStatus === 'connected'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                  title={sheetStatus === 'connected' ? 'Google Sheets Conectado' : 'Modo Local'}
                >
                  <Cloud className="w-3 h-3" />
                  <span>{sheetStatus === 'connected' ? 'En la Nube' : 'Modo Local'}</span>
                </div>
              </div>

              <div className="p-1.5 space-y-1">
                {strategies.map((strategy) => (
                  <button
                    key={strategy.id}
                    type="button"
                    onClick={() => handleDownload(strategy.id)}
                    className="w-full px-3 py-2.5 rounded-xl hover:bg-blue-50/70 text-slate-800 flex items-start gap-3 transition-colors text-left group cursor-pointer"
                  >
                    <div className="p-2 rounded-lg bg-slate-100 text-blue-900 group-hover:bg-blue-900 group-hover:text-white transition-colors shrink-0 mt-0.5">
                      {getStrategyIcon(strategy.id)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="truncate">{strategy.label}</span>
                        {strategy.badge && (
                          <span className="px-1.5 py-0.2 text-[10px] font-semibold bg-emerald-100 text-emerald-800 rounded-full shrink-0">
                            {strategy.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                        {strategy.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Botón de Menú Móvil / Tablet (< 1024px) */}
        <div ref={mobileMenuRef} className="lg:hidden">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors flex items-center justify-center shrink-0 cursor-pointer"
            title="Opciones adicionales"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5 text-slate-900" /> : <Menu className="w-5 h-5 text-slate-700" />}
          </button>

          {/* Menú Desplegable Móvil */}
          {isMobileMenuOpen && (
            <div className="absolute top-full left-0 right-0 bg-white border-b border-slate-200 shadow-xl p-4 z-40 animate-in slide-in-from-top-2 duration-150 space-y-3">
              {quote.isEditingExisting && (
                <div className="p-2.5 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span>Modo Edición: {quote.code || 'C1'} N° {quote.quoteNumber}</span>
                </div>
              )}

              {onOpenRecovery && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenRecovery();
                  }}
                  className="w-full p-2.5 text-xs font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Search className="w-4 h-4 text-blue-600" />
                  <span>Todas las Cotizaciones</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onNewQuote();
                }}
                className="w-full p-2.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-slate-500" />
                <span>Nueva Cotización</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
