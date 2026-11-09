import React, { useState } from 'react';
import { QuoteData, QuoteItem, PricingMode } from '../types/quote.types';
import { calculateQuoteTotals } from '../services/quote-calculator';
import { toProperCase, toSentenceCase, cleanWhitespace } from '../../../shared/utils/text-formatter';
import { formatCurrency, formatCOPInput } from '../../../shared/utils/currency';
import {
  User,
  Building,
  Percent,
  Plus,
  Trash2,
  Calendar,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  Download,
  RotateCcw,
  Loader2,
  Clock,
  DollarSign,
  Calculator,
} from 'lucide-react';

interface QuickFormProps {
  quote: QuoteData;
  onChange: (updated: QuoteData) => void;
  onFinalizeQuote: () => Promise<boolean>;
  onDownloadQuote: () => void;
  onNewQuote: () => void;
  onCloneQuote?: () => void;
  isFinalizing?: boolean;
}

export const QuickForm: React.FC<QuickFormProps> = ({
  quote,
  onChange,
  onFinalizeQuote,
  onDownloadQuote,
  onNewQuote,
  onCloneQuote,
  isFinalizing = false,
}) => {
  const [activeTab, setActiveTab] = useState<number>(1);
  const [taskCreationMode, setTaskCreationMode] = useState<'simple' | 'detailed'>('simple');
  const [attemptedStep1, setAttemptedStep1] = useState<boolean>(false);

  const updateField = (field: keyof QuoteData, value: any) => {
    const updated = { ...quote, [field]: value };
    const newTotals = calculateQuoteTotals(updated);
    updated.subtotal = newTotals.subtotal;
    updated.total = newTotals.total;
    onChange(updated);
  };

  const updateMultipleFields = (fields: Partial<QuoteData>) => {
    const updated = { ...quote, ...fields };
    const newTotals = calculateQuoteTotals(updated);
    updated.subtotal = newTotals.subtotal;
    updated.total = newTotals.total;
    onChange(updated);
  };

  const setPricingMode = (mode: PricingMode) => {
    updateMultipleFields({ pricingMode: mode });
  };

  const handlePresetPercentages = (start: number, end: number) => {
    updateMultipleFields({
      startPct: start,
      endPct: end,
    });
  };

  const handleStartPctChange = (raw: string) => {
    if (raw === '') {
      updateMultipleFields({ startPct: 0, endPct: 100 });
      return;
    }
    const val = parseInt(raw, 10);
    if (!isNaN(val)) {
      const clamped = Math.min(100, Math.max(0, val));
      updateMultipleFields({
        startPct: clamped,
        endPct: 100 - clamped,
      });
    }
  };

  const handleEndPctChange = (raw: string) => {
    if (raw === '') {
      updateMultipleFields({ startPct: 100, endPct: 0 });
      return;
    }
    const val = parseInt(raw, 10);
    if (!isNaN(val)) {
      const clamped = Math.min(100, Math.max(0, val));
      updateMultipleFields({
        startPct: 100 - clamped,
        endPct: clamped,
      });
    }
  };

  const handleAddDaysValidity = (days: number) => {
    let baseDate = new Date();
    if (quote.date && quote.date.includes('/')) {
      const parts = quote.date.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
          baseDate = new Date(year, month, day);
        }
      }
    }
    baseDate.setDate(baseDate.getDate() + days);
    const newDateStr = baseDate.toLocaleDateString('es-CO');
    updateMultipleFields({
      fechaVigencia: newDateStr,
      validityDays: newDateStr,
    });
  };

  const addItem = () => {
    const newItem: QuoteItem = {
      id: String(Date.now()),
      title: taskCreationMode === 'detailed' ? '' : undefined,
      description: '',
      subtotal: 0,
      mode: taskCreationMode,
    };
    updateField('items', [...quote.items, newItem]);
  };

  const updateItemTitle = (id: string, title: string) => {
    const newItems = quote.items.map((item) => {
      if (item.id === id) {
        return { ...item, title };
      }
      return item;
    });
    updateField('items', newItems);
  };

  const updateItemDescription = (id: string, description: string) => {
    const newItems = quote.items.map((item) => {
      if (item.id === id) {
        return { ...item, description };
      }
      return item;
    });
    updateField('items', newItems);
  };

  const updateItemSubtotal = (id: string, subtotal: number) => {
    const newItems = quote.items.map((item) => {
      if (item.id === id) {
        return { ...item, subtotal };
      }
      return item;
    });
    updateField('items', newItems);
  };

  const toggleItemMode = (id: string) => {
    const newItems = quote.items.map((item) => {
      if (item.id === id) {
        const isCurrentlyDetailed = item.mode === 'detailed' || Boolean(item.title && item.title.trim());
        const newMode: 'simple' | 'detailed' = isCurrentlyDetailed ? 'simple' : 'detailed';
        return {
          ...item,
          mode: newMode,
          title: newMode === 'detailed' ? (item.title || '') : undefined,
        };
      }
      return item;
    });
    updateField('items', newItems);
  };

  const removeItem = (id: string) => {
    const newItems = quote.items.filter((item) => item.id !== id);
    updateField('items', newItems);
  };

    const isClientValid = Boolean(quote.clientName && quote.clientName.trim());
  const isProjectValid = Boolean(quote.projectName && quote.projectName.trim());
  const isLocationValid = Boolean(quote.location && quote.location.trim());
  const isStep1Valid = isClientValid && isProjectValid && isLocationValid;

  const paymentSum = Number(quote.startPct || 0) + Number(quote.endPct || 0);
  const isPaymentValid = paymentSum === 100;

  const currentPricingMode: PricingMode = quote.pricingMode || 'tasks';
  const totalAmount = parseFloat(String(quote.total)) || 0;
  const subtotalAmount = parseFloat(String(quote.subtotal)) || 0;
  const startPct = parseFloat(String(quote.startPct)) || 50;
  const anticipoDinero = Math.round(totalAmount * (startPct / 100));
  const saldoDinero = totalAmount - anticipoDinero;

  const tabs = [
    { id: 1, label: 'Cliente y Proyecto', icon: User, num: '1', valid: isStep1Valid },
    { id: 2, label: 'Tareas del Proyecto', icon: Building, num: '2', badge: quote.items.length },
    { id: 3, label: 'Pagos y Tiempos', icon: Percent, num: '3', valid: isPaymentValid },
  ];

  return (
    <div className="h-full flex flex-col bg-slate-50 text-slate-800 select-text overflow-hidden min-h-0">
      {/* BANNER INFORMATIVO CUANDO SE ESTÁ EDITANDO UNA COTIZACIÓN EXISTENTE */}
      {quote.isEditingExisting && (
        <div className="bg-amber-50 border-b border-amber-200 px-3.5 py-2 flex items-center justify-between text-xs text-amber-900 shrink-0">
          <div className="flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <span className="truncate">
              Modo Edición: <strong>{quote.code || 'C1'} N° {quote.quoteNumber}</strong> ({quote.clientName || 'Cliente'})
            </span>
          </div>
          {onCloneQuote && (
            <button
              type="button"
              onClick={onCloneQuote}
              className="text-[11px] font-bold text-blue-900 bg-white hover:bg-amber-100/80 px-2.5 py-1 rounded-lg border border-amber-300 transition-colors shrink-0 cursor-pointer ml-2"
              title="Crear una cotización nueva copiando estos datos con el siguiente consecutivo libre"
            >
              Guardar como Nueva
            </button>
          )}
        </div>
      )}

      {/* NAVEGADOR SEGMENTADO DE 3 PASOS ÁGILES */}
      <div className="p-2 sm:p-3 bg-white border-b border-slate-200 shrink-0 shadow-xs">
        <nav className="grid grid-cols-3 gap-1 sm:gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  if (activeTab === 1 && tab.id > 1 && !isStep1Valid) {
                    setAttemptedStep1(true);
                    return;
                  }
                  setActiveTab(tab.id);
                }}
                className={`py-2 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
                  isActive
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span className="truncate">{tab.label}</span>
                {typeof tab.badge === 'number' && tab.badge > 0 && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-blue-800 text-white' : 'bg-slate-100 text-slate-600 border border-slate-300'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ÁREA DE CONTENIDO DE CADA PASO */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
        
        {/* ================= PASO 1: CLIENTE Y OBRA ================= */}
        {activeTab === 1 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-900" />
                  Informacion del cliente y proyecto
                </h3>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-900 border border-blue-200">
                Paso 1 de 3
              </span>
            </div>

            <div className="space-y-4">
              {/* Nombre del Cliente o Empresa */}
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                  Nombre del Cliente o Empresa <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={quote.clientName}
                    onChange={(e) => updateField('clientName', e.target.value)}
                    onBlur={() => updateField('clientName', toProperCase(cleanWhitespace(quote.clientName)))}
                    placeholder="Ej: Constructora Bolívar S.A.S."
                    className={`w-full h-12 pl-11 pr-4 text-base font-medium rounded-xl outline-none text-slate-900 border transition-all ${
                      attemptedStep1 && !isClientValid
                        ? 'border-rose-400 bg-rose-50/30 focus:border-rose-600'
                        : 'bg-slate-50 border-slate-300 focus:bg-white focus:border-blue-700'
                    }`}
                  />
                  <User className={`w-4 h-4 absolute left-3.5 top-4 pointer-events-none ${
                    attemptedStep1 && !isClientValid ? 'text-rose-400' : 'text-slate-400'
                  }`} />
                </div>
                {attemptedStep1 && !isClientValid && (
                  <p className="text-xs text-rose-600 font-semibold flex items-center gap-1 mt-1.5 animate-in fade-in duration-150">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>El nombre del cliente o empresa es obligatorio.</span>
                  </p>
                )}
              </div>

              {/* Nombre de la Obra o Proyecto */}
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                  Nombre de la Obra o Proyecto <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={quote.projectName}
                    onChange={(e) => updateField('projectName', e.target.value)}
                    onBlur={() => updateField('projectName', toProperCase(cleanWhitespace(quote.projectName)))}
                    placeholder="Ej: Adecuación y Acabados Arquitectónicos"
                    className={`w-full h-12 pl-11 pr-4 text-base font-medium rounded-xl outline-none text-slate-900 border transition-all ${
                      attemptedStep1 && !isProjectValid
                        ? 'border-rose-400 bg-rose-50/30 focus:border-rose-600'
                        : 'bg-slate-50 border-slate-300 focus:bg-white focus:border-blue-700'
                    }`}
                  />
                  <Building className={`w-4 h-4 absolute left-3.5 top-4 pointer-events-none ${
                    attemptedStep1 && !isProjectValid ? 'text-rose-400' : 'text-slate-400'
                  }`} />
                </div>
                {attemptedStep1 && !isProjectValid && (
                  <p className="text-xs text-rose-600 font-semibold flex items-center gap-1 mt-1.5 animate-in fade-in duration-150">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>El nombre de la obra o proyecto es obligatorio.</span>
                  </p>
                )}
              </div>

              {/* Ubicación de la Obra */}
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                  Ubicación de la Obra <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={quote.location || ''}
                    onChange={(e) => updateField('location', e.target.value)}
                    onBlur={() => updateField('location', toProperCase(cleanWhitespace(quote.location || '')))}
                    placeholder="Ej: Medellín - Carrera 43A # 1-50"
                    className={`w-full h-12 pl-11 pr-4 text-base font-medium rounded-xl outline-none text-slate-900 border transition-all ${
                      attemptedStep1 && !isLocationValid
                        ? 'border-rose-400 bg-rose-50/30 focus:border-rose-600'
                        : 'bg-slate-50 border-slate-300 focus:bg-white focus:border-blue-700'
                    }`}
                  />
                  <MapPin className={`w-4 h-4 absolute left-3.5 top-4 pointer-events-none ${
                    attemptedStep1 && !isLocationValid ? 'text-rose-400' : 'text-slate-400'
                  }`} />
                </div>
                {attemptedStep1 && !isLocationValid && (
                  <p className="text-xs text-rose-600 font-semibold flex items-center gap-1 mt-1.5 animate-in fade-in duration-150">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>La ubicación de la obra es obligatoria.</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= PASO 2: TAREAS DE OBRA Y VALORES ================= */}
        {activeTab === 2 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Building className="w-5 h-5 text-blue-900" />
                  Tareas del proyecto
                </h3>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-900 border border-blue-200">
                Paso 2 de 3
              </span>
            </div>

            {/* SELECTOR DE MODALIDAD DE PRESUPUESTO */}
            <div className="p-3.5 bg-slate-100/80 rounded-2xl border border-slate-200 space-y-2.5">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide block">
                Modalidad de Presupuestación:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPricingMode('tasks')}
                  className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 border cursor-pointer ${
                    currentPricingMode === 'tasks'
                      ? 'bg-blue-900 text-white border-blue-900 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Calculator className="w-4 h-4" />
                  <span>Por Tarea (Suma de Tareas)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPricingMode('global')}
                  className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 border cursor-pointer ${
                    currentPricingMode === 'global'
                      ? 'bg-blue-900 text-white border-blue-900 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Valor Global Total</span>
                </button>
              </div>
            </div>

            {/* CAMPO DE VALOR GLOBAL TOTAL (SI APLICA MODO GLOBAL) */}
            {currentPricingMode === 'global' && (
              <div className="p-4 bg-blue-50/70 border-2 border-blue-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-blue-950 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-blue-900" />
                    Valor Total del Proyecto <span className="text-rose-500">*</span>
                  </label>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={subtotalAmount === 0 ? '' : formatCOPInput(subtotalAmount)}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '');
                      const val = digits ? parseInt(digits, 10) : 0;
                      updateMultipleFields({
                        pricingMode: 'global',
                        subtotal: val,
                      });
                    }}
                    placeholder="0"
                    className="w-full h-12 pl-11 pr-4 text-lg font-mono font-bold bg-white border border-blue-300 rounded-xl focus:border-blue-700 outline-none text-slate-900"
                  />
                  <DollarSign className="w-5 h-5 text-blue-700 absolute left-3.5 top-3.5 pointer-events-none" />
                </div>
                <p className="text-xs text-blue-700">
                  El contrato se cotiza a suma global.
                </p>
              </div>
            )}

            {/* Selector de Modo de Partida (Simple o Compuesta) */}
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-700">Tipo de Tarea a Crear:</span>
              <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setTaskCreationMode('simple')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                    taskCreationMode === 'simple' ? 'bg-blue-900 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Simple
                </button>
                <button
                  type="button"
                  onClick={() => setTaskCreationMode('detailed')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                    taskCreationMode === 'detailed' ? 'bg-blue-900 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Compuesta (Título + Detalle)
                </button>
              </div>
            </div>

            {/* Listado Dinámico de Partidas */}
            <div className="space-y-3">
              {quote.items.length === 0 ? (
                <div className="text-center py-10 px-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  <Building className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">No hay tareas de obra registradas</p>
                  <p className="text-xs text-slate-400 mt-1">Haz clic en el botón inferior para agregar la primera tarea técnica.</p>
                </div>
              ) : (
                quote.items.map((item, index) => {
                  const isDetailed = item.mode === 'detailed' || Boolean(item.title && item.title.trim());
                  return (
                    <div
                      key={item.id}
                      className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 relative group hover:border-slate-300 transition-all"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                        <span className="text-xs font-mono font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          Tarea {index + 1}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => toggleItemMode(item.id)}
                            className="text-[11px] font-semibold text-slate-500 hover:text-blue-900 px-2 py-0.5 rounded hover:bg-slate-200/60 transition-colors cursor-pointer"
                          >
                            {isDetailed ? 'Cambiar a Simple' : 'Agregar Título'}
                          </button>
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Eliminar tarea"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {isDetailed && (
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Título / Tarea Principal
                          </label>
                          <input
                            type="text"
                            value={item.title || ''}
                            onChange={(e) => updateItemTitle(item.id, e.target.value)}
                            onBlur={() => updateItemTitle(item.id, toProperCase(item.title || ''))}
                            placeholder="Ej: MAMPOSTERÍA Y PAÑETES"
                            className="w-full h-10 px-3 text-sm font-semibold bg-white border border-slate-300 rounded-lg focus:border-blue-700 outline-none text-slate-900"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Descripción Técnica de la Tarea <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                          rows={2}
                          value={item.description}
                          onChange={(e) => updateItemDescription(item.id, e.target.value)}
                          onBlur={() => updateItemDescription(item.id, toSentenceCase(cleanWhitespace(item.description)))}
                          placeholder="Especificaciones, alcance de obra, suministro e instalación..."
                          className="w-full p-3 text-sm bg-white border border-slate-300 rounded-lg focus:border-blue-700 outline-none resize-y text-slate-900"
                        />
                      </div>

                      {/* Input de Valor de la Tarea (solo visible en modo Por Partida/Tarea) */}
                      {currentPricingMode === 'tasks' && (
                        <div>
                          <div className="mb-1">
                            <label className="block text-xs font-semibold text-slate-700">
                              Valor Tarea ($ COP)
                            </label>
                          </div>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={item.subtotal === 0 ? '' : formatCOPInput(item.subtotal)}
                            onChange={(e) => {
                              const digits = e.target.value.replace(/\D/g, '');
                              const val = digits ? parseInt(digits, 10) : 0;
                              updateItemSubtotal(item.id, val);
                            }}
                            placeholder="0"
                            className="w-full h-11 px-3 text-base font-mono font-semibold bg-white border border-slate-300 rounded-lg focus:border-blue-700 outline-none text-slate-900"
                          />
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              <button
                type="button"
                onClick={addItem}
                className="w-full py-3 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50/50 hover:bg-blue-50 hover:border-blue-500 text-blue-900 text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar Nueva Tarea</span>
              </button>
            </div>

            {/* BARRA INFERIOR DE SUMA SUBTOTAL EN PASO 2 */}
            <div className="p-3.5 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">
                {currentPricingMode === 'tasks' ? 'Subtotal Calculado (Suma de Tareas):' : 'Subtotal Global del Proyecto:'}
              </span>
              <span className="text-base font-mono font-bold text-blue-950">
                {formatCurrency(subtotalAmount)}
              </span>
            </div>
          </div>
        )}

        {/* ================= PASO 3: FORMA DE PAGO Y VIGENCIA ================= */}
        {activeTab === 3 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
            {/* Panel de Éxito cuando la Cotización ya fue Finalizada */}
            {quote.isFinalized && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 sm:p-5 text-emerald-950 shadow-2xs">
                <div className="flex items-start sm:items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-emerald-900">
                      Cotización N° {quote.quoteNumber} Finalizada y Guardada
                    </h4>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      Registrada formalmente en Google Sheets (CotizacionesMYC). Selecciona una acción para continuar:
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-3 border-t border-emerald-200/70">
                  <button
                    type="button"
                    onClick={onDownloadQuote}
                    className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Descargar Cotización (PDF)</span>
                  </button>

                  <button
                    type="button"
                    onClick={onNewQuote}
                    className="w-full py-2.5 px-4 bg-white hover:bg-emerald-100/80 text-emerald-800 border border-emerald-300 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4 text-emerald-700" />
                    <span>Generar una nueva cotización</span>
                  </button>
                </div>
              </div>
            )}

            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Percent className="w-5 h-5 text-blue-900" />
                  Pagos y tiempos
                </h3>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-900 border border-blue-200">
                Paso 3 de 3
              </span>
            </div>

            {/* SECCIÓN FECHA DE VIGENCIA CON BOTONES RÁPIDOS */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-900" />
                  <label className="text-sm font-bold text-slate-900">
                    Fecha de Vigencia de la Oferta
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div className="relative">
                  <input
                    type="text"
                    value={quote.fechaVigencia || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      updateMultipleFields({
                        fechaVigencia: val,
                        validityDays: val,
                      });
                    }}
                    placeholder="DD/MM/AAAA"
                    className="w-full h-11 px-4 text-base font-mono font-semibold bg-white border border-slate-300 rounded-xl focus:border-blue-700 outline-none text-slate-900"
                  />
                  <Calendar className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddDaysValidity(15)}
                    className="flex-1 h-11 rounded-xl text-xs font-bold font-mono bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition-colors shadow-2xs cursor-pointer"
                  >
                    +15 días
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddDaysValidity(30)}
                    className="flex-1 h-11 rounded-xl text-xs font-bold font-mono bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition-colors shadow-2xs cursor-pointer"
                  >
                    +30 días
                  </button>
                </div>
              </div>
              <span className="text-[11px] text-slate-500 block">
                Fecha hasta la cual los precios se mantienen vigentes para el cliente.
              </span>
            </div>

            {/* ESQUEMA DE ANTICIPO Y SALDO EN DINERO */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-slate-900">
                  Distribución Porcentual del Pago
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handlePresetPercentages(50, 50)}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                  >
                    50 / 50
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetPercentages(60, 40)}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                  >
                    60 / 40
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetPercentages(70, 30)}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                  >
                    70 / 30
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">Anticipo al Iniciar (%)</span>
                    <span className="text-xs font-mono font-bold text-blue-900">{quote.startPct}%</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={quote.startPct}
                    onChange={(e) => handleStartPctChange(e.target.value)}
                    className="w-full h-11 px-3 text-base font-mono font-bold bg-white border border-slate-300 rounded-lg focus:border-blue-700 outline-none text-slate-900"
                  />
                  <div className="text-xs font-mono font-bold text-slate-700 pt-1 border-t border-slate-200/60">
                    Valor Calculado: <span className="text-blue-900 font-extrabold">{formatCurrency(anticipoDinero)}</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">Saldo al Finalizar (%)</span>
                    <span className="text-xs font-mono font-bold text-blue-900">{quote.endPct}%</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={quote.endPct}
                    onChange={(e) => handleEndPctChange(e.target.value)}
                    className="w-full h-11 px-3 text-base font-mono font-bold bg-white border border-slate-300 rounded-lg focus:border-blue-700 outline-none text-slate-900"
                  />
                  <div className="text-xs font-mono font-bold text-slate-700 pt-1 border-t border-slate-200/60">
                    Valor Calculado: <span className="text-blue-900 font-extrabold">{formatCurrency(saldoDinero)}</span>
                  </div>
                </div>
              </div>

              {!isPaymentValid && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center gap-2 font-medium">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>La suma del anticipo ({quote.startPct}%) y el saldo ({quote.endPct}%) debe ser exactamente 100%.</span>
                </div>
              )}
            </div>

            {/* RESUMEN ECONÓMICO FINAL */}
            <div className="p-4 bg-blue-950 text-white rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs text-blue-200 uppercase tracking-wider font-semibold block">
                  {currentPricingMode === 'tasks' ? 'Total Cotizado (Suma de Tareas)' : 'Total Cotizado (Valor Global)'}
                </span>
                <span className="text-xl sm:text-2xl font-mono font-bold text-white">{formatCurrency(totalAmount)}</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-blue-200 block">N° Consecutivo</span>
                <span className="text-base sm:text-lg font-mono font-bold text-emerald-400">N° {quote.quoteNumber}</span>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* BOTONES INFERIORES DE NAVEGACIÓN ANTERIOR / SIGUIENTE / FINALIZAR */}
      <div className="p-3 sm:p-3.5 bg-white border-t border-slate-200 shrink-0 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setActiveTab((prev) => Math.max(1, prev - 1))}
          disabled={activeTab === 1}
          className="px-3 sm:px-4 py-2 sm:py-2.5 min-h-[42px] rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4 shrink-0" />
          <span className="hidden xs:inline">Paso </span>
          <span>Anterior</span>
        </button>

        <div className="flex items-center gap-1 sm:gap-1.5">
          {tabs.map((tab) => (
            <span
              key={tab.id}
              className={`h-2 rounded-full transition-all ${
                activeTab === tab.id ? 'w-5 sm:w-6 bg-blue-900' : 'w-2 bg-slate-300'
              }`}
            />
          ))}
        </div>

        {activeTab < 3 ? (
          <button
            type="button"
            onClick={() => {
            if (activeTab === 1 && !isStep1Valid) {
              setAttemptedStep1(true);
              return;
            }
            setActiveTab((prev) => Math.min(3, prev + 1));
          }}
            className="px-4 sm:px-5 py-2 sm:py-2.5 min-h-[42px] rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>Siguiente</span>
            <span className="hidden xs:inline"> Paso</span>
            <ChevronRight className="w-4 h-4 shrink-0" />
          </button>
        ) : !quote.isFinalized || quote.isEditingExisting ? (
          <button
            type="button"
            onClick={onFinalizeQuote}
            disabled={isFinalizing}
            className={`px-5 py-2 sm:py-2.5 min-h-[42px] rounded-xl text-white text-xs sm:text-sm font-bold shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer ${quote.isEditingExisting ? 'bg-blue-900 hover:bg-blue-800' : 'bg-emerald-700 hover:bg-emerald-800'}`}
          >
            {isFinalizing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{quote.isEditingExisting ? 'Actualizando...' : 'Finalizando...'}</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>{quote.isEditingExisting ? `Guardar Cambios (Actualizar N° ${quote.quoteNumber})` : 'Finalizar Cotización'}</span>
              </>
            )}
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onDownloadQuote}
              className="px-3.5 py-2 sm:py-2.5 min-h-[42px] rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Descargar cotización oficial en PDF"
            >
              <Download className="w-4 h-4" />
              <span>Descargar Cotización</span>
            </button>
            <button
              type="button"
              onClick={onNewQuote}
              className="px-3.5 py-2 sm:py-2.5 min-h-[42px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Iniciar una nueva cotización"
            >
              <RotateCcw className="w-4 h-4 text-slate-600" />
              <span className="hidden xs:inline">Nueva Cotización</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
