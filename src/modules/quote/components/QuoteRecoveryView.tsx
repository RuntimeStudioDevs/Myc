import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ArrowLeft,
  Search,
  RefreshCw,
  AlertTriangle,
  FileText,
  Building2,
  Calendar,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  X,
  User,
  RotateCcw,
  Ban,
  Check,
} from 'lucide-react';
import { QuoteData, QuoteSummaryItem } from '../types/quote.types';
import {
  fetchQuoteCatalog,
  fetchQuoteByNumber,
  getCachedCompanyConfig,
  updateQuoteStatusInGoogleSheets,
} from '../services/google-sheets.service';
import { formatCurrency } from '../../../shared/utils/currency';
import { MCLogo } from '../../../shared/components/MCLogo';

interface QuoteRecoveryViewProps {
  onBack: () => void;
  onSelectQuote: (quote: QuoteData) => void;
  currentQuoteHasChanges?: boolean;
}

export const QuoteRecoveryView: React.FC<QuoteRecoveryViewProps> = ({
  onBack,
  onSelectQuote,
  currentQuoteHasChanges = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Activa' | 'Inactiva' | 'ALL'>('Activa');
  const [catalog, setCatalog] = useState<QuoteSummaryItem[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  // Estado para la cotización seleccionada para el paso de confirmación de recuperación
  const [selectedItemForConfirmation, setSelectedItemForConfirmation] = useState<QuoteSummaryItem | null>(null);
  const [isHydrating, setIsHydrating] = useState(false);
  const [hydrationError, setHydrationError] = useState<string | null>(null);

  // Estado para anulación (soft delete) / reactivación
  const [itemForStatusToggle, setItemForStatusToggle] = useState<QuoteSummaryItem | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusActionSuccess, setStatusActionSuccess] = useState<string | null>(null);
  const [statusActionError, setStatusActionError] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Carga inicial del catálogo al montar la vista
  useEffect(() => {
    loadCatalog();
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 150);
  }, []);

  // Limpiar mensaje de éxito tras 4 segundos
  useEffect(() => {
    if (statusActionSuccess) {
      const timer = setTimeout(() => setStatusActionSuccess(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [statusActionSuccess]);

  const loadCatalog = async () => {
    setIsLoadingCatalog(true);
    setCatalogError(null);
    try {
      const res = await fetchQuoteCatalog();
      if (res.success && res.catalog) {
        setCatalog(res.catalog);
      } else {
        setCatalogError(res.error || 'No se pudo cargar el catálogo de cotizaciones desde Google Sheets.');
      }
    } catch (err: any) {
      setCatalogError(err.message || 'Error de conexión con Google Sheets.');
    } finally {
      setIsLoadingCatalog(false);
    }
  };

  // Contadores reactivos
  const activeCount = useMemo(
    () => catalog.filter((i) => i.statusVigencia === 'Activa').length,
    [catalog]
  );
  const inactiveCount = useMemo(
    () => catalog.filter((i) => i.statusVigencia === 'Inactiva').length,
    [catalog]
  );
  const allCount = catalog.length;

  // Filtrado reactivo en memoria (0 ms de latencia) combinando estado y búsqueda
  const filteredCatalog = useMemo(() => {
    let list = catalog;

    // Filtro por Estado de Vigencia (Activa / Inactiva / Todas)
    if (statusFilter !== 'ALL') {
      list = list.filter((item) => item.statusVigencia === statusFilter);
    }

    if (!searchTerm.trim()) return list;
    const term = searchTerm.toLowerCase().trim();

    return list.filter((item) => {
      const numMatch = item.quoteNumber.toLowerCase().includes(term);
      const clientMatch = (item.clientName || '').toLowerCase().includes(term);
      const projectMatch = (item.projectName || '').toLowerCase().includes(term);
      const locationMatch = (item.location || '').toLowerCase().includes(term);
      return numMatch || clientMatch || projectMatch || locationMatch;
    });
  }, [catalog, searchTerm, statusFilter]);

  // Manejador de selección de cotización para recuperar
  const handleItemClick = (item: QuoteSummaryItem) => {
    setHydrationError(null);
    setSelectedItemForConfirmation(item);
  };

  // Confirmar recuperación formal y descargar datos completos
  const handleConfirmRecovery = async () => {
    if (!selectedItemForConfirmation) return;

    setIsHydrating(true);
    setHydrationError(null);

    try {
      const res = await fetchQuoteByNumber(selectedItemForConfirmation.quoteNumber);
      if (res.success && res.quote) {
        onSelectQuote(res.quote);
        onBack();
      } else {
        setHydrationError(res.error || `No se pudo recuperar la cotización N° ${selectedItemForConfirmation.quoteNumber}`);
      }
    } catch (err: any) {
      setHydrationError(err.message || 'Error al descargar datos de la cotización.');
    } finally {
      setIsHydrating(false);
    }
  };

  // Solicitar confirmación de anulación o reactivación
  const handlePromptStatusToggle = (item: QuoteSummaryItem) => {
    setStatusActionError(null);
    setItemForStatusToggle(item);
  };

  // Ejecutar anulación lógica (Soft Delete) o reactivación en Google Sheets
  const handleConfirmStatusToggle = async () => {
    if (!itemForStatusToggle) return;

    const targetNumber = itemForStatusToggle.quoteNumber;
    const nextStatus: 'Activa' | 'Inactiva' =
      itemForStatusToggle.statusVigencia === 'Activa' ? 'Inactiva' : 'Activa';

    setIsUpdatingStatus(true);
    setStatusActionError(null);

    try {
      const res = await updateQuoteStatusInGoogleSheets(targetNumber, nextStatus);
      if (res.success) {
        // Actualización optimista inmediata en memoria
        setCatalog((prev) =>
          prev.map((q) =>
            q.quoteNumber === targetNumber ? { ...q, statusVigencia: nextStatus } : q
          )
        );

        const actionText = nextStatus === 'Inactiva' ? 'anulada y pasada a Inactivas' : 'reactivada con éxito';
        setStatusActionSuccess(`Cotización N° ${targetNumber} ${actionText}.`);
        setItemForStatusToggle(null);
      } else {
        setStatusActionError(res.message || 'No se pudo actualizar el estado en Google Sheets.');
      }
    } catch (err: any) {
      setStatusActionError(err.message || 'Error de comunicación al actualizar estado.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const companyConfig = getCachedCompanyConfig();
  const defaultQuoteCode = companyConfig.Codigo_Serie_Cotizacion || 'C1';

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-100 flex flex-col font-sans select-none antialiased">
      {/* 1. BARRA SUPERIOR DE NAVEGACIÓN */}
      <header className="bg-white border-b border-slate-200 px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-3 shrink-0 shadow-xs z-20">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            disabled={isHydrating || isUpdatingStatus}
            className="p-2 sm:px-3 sm:py-2 rounded-xl text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 transition-all flex items-center gap-2 font-bold text-xs sm:text-sm cursor-pointer disabled:opacity-50"
            title="Volver al Cotizador"
          >
            <ArrowLeft className="w-4 h-4 text-slate-700" />
            <span className="hidden sm:inline">Volver al Cotizador</span>
          </button>

          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-blue-950 flex items-center justify-center p-1 border border-blue-900 shadow-xs shrink-0">
              <MCLogo variant="transparent" className="h-5 sm:h-6 w-auto" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                Todas las Cotizaciones
              </h1>
              <p className="text-[11px] text-slate-500 font-medium hidden xs:block">
                Base de datos en la nube (CotizacionesMYC)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadCatalog}
            disabled={isLoadingCatalog || isHydrating || isUpdatingStatus}
            className="p-2 sm:px-3 sm:py-2 rounded-xl text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer disabled:opacity-50"
            title="Actualizar catálogo desde Google Sheets"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCatalog ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">Actualizar Catálogo</span>
          </button>
        </div>
      </header>

      {/* TOAST DE ACCIÓN (Éxito al anular/reactivar) */}
      {statusActionSuccess && (
        <div className="bg-emerald-600 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 text-center flex items-center justify-center gap-2 shadow-md animate-in slide-in-from-top-2 duration-200 shrink-0 z-30">
          <Check className="w-4 h-4 shrink-0" />
          <span>{statusActionSuccess}</span>
          <button
            type="button"
            onClick={() => setStatusActionSuccess(null)}
            className="ml-2 hover:opacity-80 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. SI HAY UNA COTIZACIÓN SELECCIONADA: VISTA DE CONFIRMACIÓN RESPONSIVA */}
      {selectedItemForConfirmation ? (
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200/90 max-w-lg w-full p-5 sm:p-7 flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Cabecera del paso de confirmación */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200 shadow-2xs">
                <CheckCircle2 className="w-6 h-6 text-blue-700" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60 inline-block mb-1">
                  Paso de Confirmación
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  ¿Deseas recuperar esta cotización?
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Se restaurará la información técnica y financiera completa para permitir su edición en tiempo real.
                </p>
              </div>
            </div>

            {/* Ficha Resumen de la Cotización */}
            <div className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-200">
                <span className="text-slate-500 font-medium">N° de Cotización:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-blue-900 bg-blue-100/80 px-2.5 py-1 rounded-lg text-xs sm:text-sm border border-blue-200">
                    {selectedItemForConfirmation.code || defaultQuoteCode} N° {selectedItemForConfirmation.quoteNumber}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      selectedItemForConfirmation.statusVigencia === 'Activa'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {selectedItemForConfirmation.statusVigencia}
                  </span>
                </div>
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

              {selectedItemForConfirmation.location && (
                <div className="flex justify-between items-start gap-2">
                  <span className="text-slate-500 font-medium shrink-0">Ubicación:</span>
                  <span className="text-slate-600 text-right truncate">
                    {selectedItemForConfirmation.location}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center text-xs text-slate-500 pt-1">
                <span>Fecha de Emisión:</span>
                <span className="font-mono font-medium">{selectedItemForConfirmation.date}</span>
              </div>

              <div className="flex justify-between items-center pt-2.5 border-t border-slate-200">
                <span className="text-slate-700 font-semibold">Total Cotizado:</span>
                <span className="font-bold text-blue-900 font-mono text-base sm:text-lg">
                  {formatCurrency(selectedItemForConfirmation.total)}
                </span>
              </div>
            </div>

            {/* Advertencia si la cotización está Inactiva */}
            {selectedItemForConfirmation.statusVigencia === 'Inactiva' && (
              <div className="p-3 bg-slate-100 border border-slate-300 rounded-xl flex items-start gap-2.5 text-xs text-slate-700">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Nota:</strong> Esta cotización se encuentra actualmente <strong>Inactiva</strong> (anulada o con vigencia vencida). Al editarla podés renovar su fecha o reactivarla.
                </span>
              </div>
            )}

            {/* Advertencia si hay cambios sin guardar */}
            {currentQuoteHasChanges && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Atención:</strong> Tenés cambios no guardados en el cotizador. Al recuperar esta cotización se descartarán esos datos en memoria.
                </span>
              </div>
            )}

            {/* Error durante hidratación si ocurre */}
            {hydrationError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-900">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{hydrationError}</span>
              </div>
            )}

            {/* Botones de Acción */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedItemForConfirmation(null);
                  setHydrationError(null);
                }}
                disabled={isHydrating}
                className="w-full sm:w-auto px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
              >
                Volver a la lista
              </button>

              <button
                type="button"
                onClick={handleConfirmRecovery}
                disabled={isHydrating}
                className="w-full sm:w-auto px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-xl transition-all shadow-xs inline-flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isHydrating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Cargando datos completos...</span>
                  </>
                ) : (
                  <>
                    <span>Confirmar Recuperación</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* 3. VISTA PRINCIPAL: BUSCADOR + PESTAÑAS (ACTIVAS / INACTIVAS / TODAS) + LISTADO */
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          {/* Barra de Filtros y Búsqueda */}
          <div className="bg-white border-b border-slate-200 px-3 sm:px-6 py-3 shrink-0 shadow-2xs space-y-3">
            <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Selector Segmentado de Estados: Activas | Inactivas | Todas */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 shrink-0 self-start sm:self-auto overflow-x-auto w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setStatusFilter('Activa')}
                  className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    statusFilter === 'Activa'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${statusFilter === 'Activa' ? 'bg-white' : 'bg-emerald-500'}`} />
                  <span>Activas</span>
                  <span
                    className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-md ${
                      statusFilter === 'Activa'
                        ? 'bg-white/25 text-white'
                        : 'bg-slate-200/80 text-slate-700'
                    }`}
                  >
                    {activeCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter('Inactiva')}
                  className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    statusFilter === 'Inactiva'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${statusFilter === 'Inactiva' ? 'bg-white' : 'bg-rose-500'}`} />
                  <span>Inactivas</span>
                  <span
                    className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-md ${
                      statusFilter === 'Inactiva'
                        ? 'bg-white/25 text-white'
                        : 'bg-slate-200/80 text-slate-700'
                    }`}
                  >
                    {inactiveCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter('ALL')}
                  className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    statusFilter === 'ALL'
                      ? 'bg-blue-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <span>Todas</span>
                  <span
                    className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-md ${
                      statusFilter === 'ALL'
                        ? 'bg-white/25 text-white'
                        : 'bg-slate-200/80 text-slate-700'
                    }`}
                  >
                    {allCount}
                  </span>
                </button>
              </div>

              {/* Input de Búsqueda Instantánea */}
              <div className="relative flex-1 max-w-full sm:max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por número (ej: 105), cliente o proyecto..."
                  className="w-full pl-10 pr-9 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all placeholder:text-slate-400 text-slate-900 font-medium"
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
            </div>

            <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-slate-500 font-medium px-0.5">
              <span>
                {catalog.length > 0 ? (
                  <>
                    Mostrando <strong className="text-slate-800">{filteredCatalog.length}</strong> cotizaciones ({statusFilter === 'ALL' ? 'todas' : statusFilter === 'Activa' ? 'activas' : 'inactivas'})
                  </>
                ) : isLoadingCatalog ? (
                  'Conectando con Google Sheets...'
                ) : (
                  'Sin cotizaciones sincronizadas'
                )}
              </span>

              <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60 font-semibold text-[11px]">
                0 ms de latencia
              </span>
            </div>
          </div>

          {/* Listado en Cuadrícula Multiplataforma (1 col móvil, 2 tablet, 3 desktop) */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-6 min-h-0">
            <div className="max-w-6xl mx-auto">
              {isLoadingCatalog ? (
                <div className="h-64 flex flex-col items-center justify-center text-slate-500 gap-3">
                  <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs sm:text-sm font-medium text-slate-600">
                    Obteniendo catálogo de CotizacionesMYC...
                  </p>
                </div>
              ) : catalogError ? (
                <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 flex items-start gap-3.5 max-w-lg mx-auto mt-6">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs sm:text-sm space-y-2">
                    <p className="font-bold">No se pudo cargar el catálogo:</p>
                    <p className="text-amber-800 text-xs">{catalogError}</p>
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
                <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-center px-4">
                  <FileText className="w-12 h-12 text-slate-300 mb-2" />
                  <p className="text-base font-semibold text-slate-700">No se encontraron cotizaciones</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    {searchTerm
                      ? `No hay coincidencias para "${searchTerm}" en la pestaña de ${statusFilter === 'ALL' ? 'todas' : statusFilter === 'Activa' ? 'activas' : 'inactivas'}.`
                      : statusFilter === 'Inactiva'
                      ? 'No hay cotizaciones inactivas o anuladas en el registro.'
                      : 'Aún no hay cotizaciones registradas en la hoja CotizacionesMYC.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                  {filteredCatalog.map((item) => (
                    <div
                      key={item.quoteNumber}
                      onClick={() => handleItemClick(item)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 group relative ${
                        item.statusVigencia === 'Activa'
                          ? 'border-slate-200 bg-white hover:border-blue-500 hover:shadow-md'
                          : 'border-slate-200/90 bg-slate-50/70 hover:border-slate-400 hover:shadow-sm opacity-90'
                      }`}
                    >
                      {/* Cabecera de la Tarjeta */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-blue-900 bg-blue-100/80 px-2 py-0.5 rounded-lg text-xs border border-blue-200 group-hover:bg-blue-900 group-hover:text-white transition-colors">
                            {item.code || defaultQuoteCode} N° {item.quoteNumber}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                              item.statusVigencia === 'Activa'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                item.statusVigencia === 'Activa' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                              }`}
                            />
                            {item.statusVigencia}
                          </span>
                        </div>

                        {/* Botón de Soft Delete (Anular) o Reactivar */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePromptStatusToggle(item);
                          }}
                          className={`text-[11px] font-bold px-2 py-1 rounded-lg border transition-all flex items-center gap-1 cursor-pointer ${
                            item.statusVigencia === 'Activa'
                              ? 'text-slate-500 hover:text-rose-700 hover:bg-rose-50 border-slate-200 hover:border-rose-200'
                              : 'text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                          }`}
                          title={
                            item.statusVigencia === 'Activa'
                              ? 'Anular / Desactivar cotización sin romper consecutivos'
                              : 'Reactivar cotización'
                          }
                        >
                          {item.statusVigencia === 'Activa' ? (
                            <>
                              <Ban className="w-3 h-3 text-slate-400 group-hover:text-rose-600" />
                              <span>Anular</span>
                            </>
                          ) : (
                            <>
                              <RotateCcw className="w-3 h-3 text-emerald-600" />
                              <span>Reactivar</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Datos del Cliente y Proyecto */}
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-900 truncate">
                          <User className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="truncate">{item.clientName}</span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-600 truncate">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{item.projectName}</span>
                        </div>

                        {item.location && (
                          <p className="text-[11px] text-slate-400 truncate pl-5">
                            {item.location}
                          </p>
                        )}
                      </div>

                      {/* Total y Pie de Tarjeta */}
                      <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">Total Cotizado</span>
                          <span className="text-sm font-bold text-blue-900 font-mono">
                            {formatCurrency(item.total)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-xs font-bold text-blue-700 group-hover:text-blue-900 transition-colors">
                          <span className="text-[11px]">Recuperar</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>

                      {/* Fecha de Emisión y Vigencia */}
                      <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-50">
                        <span className="flex items-center gap-1 font-mono">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {item.date || 'Sin fecha'}
                        </span>
                        {item.fechaVigencia && (
                          <span className="font-mono text-slate-500">
                            Vence: {item.fechaVigencia}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. MODAL DE CONFIRMACIÓN DE ANULACIÓN (SOFT DELETE) O REACTIVACIÓN */}
      {itemForStatusToggle && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-5 sm:p-6 space-y-4">
            <div className="flex items-start gap-3.5">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  itemForStatusToggle.statusVigencia === 'Activa'
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {itemForStatusToggle.statusVigencia === 'Activa' ? (
                  <Ban className="w-5 h-5 text-rose-700" />
                ) : (
                  <RotateCcw className="w-5 h-5 text-emerald-700" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-slate-900">
                  {itemForStatusToggle.statusVigencia === 'Activa'
                    ? '¿Anular esta cotización?'
                    : '¿Reactivar esta cotización?'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 truncate">
                  {itemForStatusToggle.code || defaultQuoteCode} N° {itemForStatusToggle.quoteNumber} — {itemForStatusToggle.clientName}
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5 leading-relaxed">
              {itemForStatusToggle.statusVigencia === 'Activa' ? (
                <>
                  <p>
                    • Se marcará como <strong>Inactiva</strong> en Google Sheets (Columna 11).
                  </p>
                  <p>
                    • <strong>No se borrará la fila ni se alterarán los números consecutivos</strong> (se preserva el consecutivo N° {itemForStatusToggle.quoteNumber}).
                  </p>
                  <p>
                    • La cotización se ocultará de la pestaña <strong>Activas</strong>, pero podrás reactivarla cuando quieras en la pestaña <strong>Inactivas</strong>.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    • Se marcará como <strong>Activa</strong> en Google Sheets (Columna 11).
                  </p>
                  <p>
                    • Volverá a aparecer inmediatamente en el listado de la pestaña <strong>Activas</strong>.
                  </p>
                </>
              )}
            </div>

            {statusActionError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{statusActionError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setItemForStatusToggle(null);
                  setStatusActionError(null);
                }}
                disabled={isUpdatingStatus}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmStatusToggle}
                disabled={isUpdatingStatus}
                className={`px-4 py-2 text-xs font-bold text-white rounded-xl transition-all shadow-xs inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                  itemForStatusToggle.statusVigencia === 'Activa'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {isUpdatingStatus ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Guardando en Google Sheets...</span>
                  </>
                ) : itemForStatusToggle.statusVigencia === 'Activa' ? (
                  <>
                    <Ban className="w-3.5 h-3.5" />
                    <span>Confirmar Anulación</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Confirmar Reactivación</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
