import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Search,
  RefreshCw,
  AlertTriangle,
  FileText,
  Building2,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Clock,
  Sparkles,
  Layers,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { QuoteData, QuoteSummaryItem } from '../types/quote.types';
import {
  fetchQuoteCatalog,
  fetchQuoteByNumber,
  getCachedCompanyConfig,
} from '../services/google-sheets.service';
import { formatCurrency } from '../../../shared/utils/currency';

interface QuoteRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectQuote: (quote: QuoteData) => void;
  currentQuoteHasChanges?: boolean;
}

export const QuoteRecoveryModal: React.FC<QuoteRecoveryModalProps> = ({
  isOpen,
  onClose,
  onSelectQuote,
  currentQuoteHasChanges = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [catalog, setCatalog] = useState<QuoteSummaryItem[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  // Estado para la cotización seleccionada que dispara la ventana emergente de confirmación
  const [selectedItemForConfirmation, setSelectedItemForConfirmation] = useState<QuoteSummaryItem | null>(null);
  const [isHydrating, setIsHydrating] = useState(false);
  const [hydrationError, setHydrationError] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Carga inicial del catálogo al abrir el modal (si no está cargado)
  useEffect(() => {
    if (isOpen) {
      setSelectedItemForConfirmation(null);
      setHydrationError(null);
      if (catalog.length === 0) {
        loadCatalog();
      }
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const loadCatalog = async () => {
    setIsLoadingCatalog(true);
    setCatalogError(null);
    try {
      const res = await fetchQuoteCatalog();
      if (res.success && res.catalog) {
        setCatalog(res.catalog);
      } else {
        setCatalogError(res.error || 'No se pudo cargar el catálogo de cotizaciones.');
      }
    } catch (err: any) {
      setCatalogError(err.message || 'Error de conexión con Google Sheets.');
    } finally {
      setIsLoadingCatalog(false);
    }
  };

  // Filtrado reactivo en memoria (0 ms de latencia) por Número, Cliente o Proyecto
  const filteredCatalog = useMemo(() => {
    if (!searchTerm.trim()) return catalog;
    const term = searchTerm.toLowerCase().trim();
    return catalog.filter((item) => {
      const numMatch = item.quoteNumber.toLowerCase().includes(term);
      const clientMatch = (item.clientName || '').toLowerCase().includes(term);
      const projectMatch = (item.projectName || '').toLowerCase().includes(term);
      const locationMatch = (item.location || '').toLowerCase().includes(term);
      return numMatch || clientMatch || projectMatch || locationMatch;
    });
  }, [catalog, searchTerm]);

  // Manejador del clic en una cotización del listado
  const handleItemClick = (item: QuoteSummaryItem) => {
    setHydrationError(null);
    setSelectedItemForConfirmation(item);
  };

  // Confirmar recuperación formal
  const handleConfirmRecovery = async () => {
    if (!selectedItemForConfirmation) return;

    setIsHydrating(true);
    setHydrationError(null);

    try {
      const res = await fetchQuoteByNumber(selectedItemForConfirmation.quoteNumber);
      if (res.success && res.quote) {
        onSelectQuote(res.quote);
        onClose();
      } else {
        setHydrationError(res.error || `No se pudo recuperar la cotización N° ${selectedItemForConfirmation.quoteNumber}`);
      }
    } catch (err: any) {
      setHydrationError(err.message || 'Error al descargar datos de la cotización.');
    } finally {
      setIsHydrating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isHydrating) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="recovery-modal-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden relative">
        {/* Cabecera del Modal */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <Layers className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 id="recovery-modal-title" className="text-base font-bold text-white tracking-tight">
                Recuperar y Editar Cotización
              </h2>
              <p className="text-xs text-slate-400">
                Búsqueda en Google Sheets por número de cotización o cliente
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadCatalog}
              disabled={isLoadingCatalog || isHydrating}
              title="Refrescar catálogo desde Google Sheets"
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-40"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingCatalog ? 'animate-spin text-blue-400' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isHydrating}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-40"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Buscador Rápido en Memoria (0 ms) */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por número (ej: 105) o cliente (ej: Constructora, Ever)..."
              disabled={isHydrating}
              className="w-full pl-10 pr-9 py-2.5 text-sm bg-white border border-slate-300 rounded-xl shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all placeholder:text-slate-400 text-slate-900 font-medium"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-slate-500 font-medium">
            <span>
              {catalog.length > 0 ? (
                <>
                  Mostrando <strong className="text-slate-800">{filteredCatalog.length}</strong> de {catalog.length} cotizaciones registradas
                </>
              ) : isLoadingCatalog ? (
                'Conectando con Google Sheets...'
              ) : (
                'Sin cotizaciones sincronizadas'
              )}
            </span>
            <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60 font-semibold">
              Búsqueda instantánea
            </span>
          </div>
        </div>

        {/* Lista de Resultados */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 min-h-[220px]">
          {isLoadingCatalog ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-500 gap-3">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-medium text-slate-600">
                Obteniendo catálogo de CotizacionesMYC...
              </p>
            </div>
          ) : catalogError ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold">No se pudo cargar el catálogo:</p>
                <p className="text-amber-800">{catalogError}</p>
                <button
                  type="button"
                  onClick={loadCatalog}
                  className="mt-2 text-xs font-bold text-blue-700 hover:underline inline-flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Reintentar conexión
                </button>
              </div>
            </div>
          ) : filteredCatalog.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-slate-400 text-center px-4">
              <FileText className="w-10 h-10 text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700">No se encontraron cotizaciones</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                {searchTerm
                  ? `No hay coincidencias para "${searchTerm}". Probá buscando con otro número o palabra clave.`
                  : 'Aún no hay cotizaciones registradas en la hoja CotizacionesMYC.'}
              </p>
            </div>
          ) : (
            filteredCatalog.map((item) => {
              const isSelected = selectedItemForConfirmation?.quoteNumber === item.quoteNumber;
              return (
                <div
                  key={item.quoteNumber}
                  onClick={() => handleItemClick(item)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/70 shadow-xs ring-1 ring-blue-600'
                      : 'border-slate-200 bg-white hover:border-blue-400 hover:bg-slate-50/80 shadow-2xs'
                  }`}
                >
                  {/* Consecutivo y Datos del Proyecto */}
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="shrink-0 flex flex-col items-center justify-center bg-blue-900 text-white rounded-lg px-2.5 py-1.5 shadow-2xs">
                      <span className="text-[9px] font-bold text-blue-200 uppercase tracking-wider">{item.code || getCachedCompanyConfig().Codigo_Serie_Cotizacion || 'C1'}</span>
                      <span className="text-sm font-black font-mono tracking-tight leading-none">
                        {item.quoteNumber}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 truncate">
                          {item.clientName}
                        </span>
                        {item.statusCliente && (
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                              item.statusCliente === 'Confirmada'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : item.statusCliente === 'Rechazada'
                                ? 'bg-red-100 text-red-800 border border-red-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {item.statusCliente}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-600 mt-0.5 truncate">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{item.projectName}</span>
                        {item.location && (
                          <span className="text-slate-400 hidden md:inline truncate">
                            • {item.location}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                        <span className="flex items-center gap-1 font-mono">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {item.date || 'Sin fecha'}
                        </span>
                        {item.updatedAt && item.updatedAt !== item.date && (
                          <span className="text-blue-700 flex items-center gap-1 font-medium">
                            <Clock className="w-3 h-3" /> Editada: {item.updatedAt}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Valor Total y Acción */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 shrink-0">
                    <span className="text-xs font-bold text-blue-900 font-mono">
                      {formatCurrency(item.total)}
                    </span>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900 transition-colors mt-0.5"
                    >
                      <span>Recuperar</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* =========================================================================
         * VENTANA EMERGENTE DE CONFIRMACIÓN (Sub-Modal / Alert Dialog Requerido)
         * ========================================================================= */}
        {selectedItemForConfirmation && (
          <div className="absolute inset-0 z-30 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden p-5 flex flex-col gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200">
                  <CheckCircle2 className="w-5 h-5 text-blue-700" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    ¿Deseas recuperar esta cotización?
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Se restaurará la información técnica y financiera completa para permitir su edición.
                  </p>
                </div>
              </div>

              {/* Ficha Resumen de la Cotización */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">N° de Cotización:</span>
                  <span className="font-mono font-bold text-blue-900 bg-blue-100/70 px-2 py-0.5 rounded text-xs border border-blue-200">
                    {selectedItemForConfirmation.code || getCachedCompanyConfig().Codigo_Serie_Cotizacion || 'C1'} N° {selectedItemForConfirmation.quoteNumber}
                  </span>
                </div>
                <div className="flex justify-between items-start gap-2">
                  <span className="text-slate-500 font-medium shrink-0">Cliente:</span>
                  <span className="font-bold text-slate-800 text-right truncate">
                    {selectedItemForConfirmation.clientName}
                  </span>
                </div>
                <div className="flex justify-between items-start gap-2">
                  <span className="text-slate-500 font-medium shrink-0">Proyecto:</span>
                  <span className="font-medium text-slate-700 text-right truncate">
                    {selectedItemForConfirmation.projectName}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                  <span className="text-slate-500 font-medium">Total Cotizado:</span>
                  <span className="font-bold text-blue-900 font-mono text-sm">
                    {formatCurrency(selectedItemForConfirmation.total)}
                  </span>
                </div>
              </div>

              {/* Advertencia si hay cambios sin guardar en el editor */}
              {currentQuoteHasChanges && (
                <div className="p-2.5 bg-amber-50 border border-amber-200/80 rounded-lg flex items-start gap-2 text-[11px] text-amber-900">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Atención:</strong> Tenés cambios no guardados en la cotización actual. Al recuperar esta cotización se descartarán esos cambios.
                  </span>
                </div>
              )}

              {/* Error durante hidratación si ocurre */}
              {hydrationError && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-xs text-red-900">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{hydrationError}</span>
                </div>
              )}

              {/* Botones de Acción de la Ventana Emergente */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedItemForConfirmation(null);
                    setHydrationError(null);
                  }}
                  disabled={isHydrating}
                  className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-all disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleConfirmRecovery}
                  disabled={isHydrating}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-xl transition-all shadow-xs inline-flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isHydrating ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Cargando datos...</span>
                    </>
                  ) : (
                    <>
                      <span>Confirmar Recuperación</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pie del Modal con Instrucciones */}
        <div className="px-5 py-3 bg-slate-100/80 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between shrink-0">
          <span>
            Podrás editar precios, tareas y actualizar directamente en Google Sheets.
          </span>
          <button
            type="button"
            onClick={onClose}
            disabled={isHydrating}
            className="text-xs font-bold text-slate-600 hover:text-slate-900 underline"
          >
            Cerrar ventana
          </button>
        </div>
      </div>
    </div>
  );
};
