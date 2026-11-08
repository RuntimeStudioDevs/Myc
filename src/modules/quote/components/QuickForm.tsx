import React, { useState } from 'react';
import { QuoteData, QuoteItem } from '../types/quote.types';
import { calculateQuoteTotals } from '../services/quote-calculator';
import { toProperCase, toSentenceCase, cleanWhitespace } from '../../../shared/utils/text-formatter';
import {
  FileText,
  User,
  Building,
  Percent,
  Plus,
  Trash2,
  Calendar,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  Briefcase,
  Instagram,
  Hash,
} from 'lucide-react';

interface QuickFormProps {
  quote: QuoteData;
  onChange: (updated: QuoteData) => void;
}

export const QuickForm: React.FC<QuickFormProps> = ({ quote, onChange }) => {
  const [activeTab, setActiveTab] = useState<number>(1);
  const [taskCreationMode, setTaskCreationMode] = useState<'simple' | 'detailed'>('simple');

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
    updateField('validityDays', baseDate.toLocaleDateString('es-CO'));
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

  const paymentSum = Number(quote.startPct || 0) + Number(quote.endPct || 0);
  const isPaymentValid = paymentSum === 100;

  const tabs = [
    { id: 1, label: 'Documento', icon: FileText, num: '1' },
    { id: 2, label: 'Cliente y Obra', icon: User, num: '2' },
    { id: 3, label: 'Tareas de Obra', icon: Building, num: '3', badge: quote.items.length },
    { id: 4, label: 'Forma de Pago', icon: Percent, num: '4', valid: isPaymentValid },
    { id: 5, label: 'Firma y Empresa', icon: Briefcase, num: '5' },
  ];

  return (
    <div className="h-full flex flex-col bg-slate-50 text-slate-800 select-text">
      {/* NAVEGADOR SEGMENTADO DE 5 PASOS */}
      <div className="p-2 sm:p-3 bg-white border-b border-slate-200 shrink-0 shadow-xs">
        <nav className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-2.5 sm:px-3 py-2 min-h-[38px] rounded-xl text-xs font-bold flex items-center gap-1.5 sm:gap-2 transition-all whitespace-nowrap shrink-0 border ${
                  isActive
                    ? 'bg-blue-900 text-white border-blue-900 shadow-sm'
                    : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full text-[11px] flex items-center justify-center font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.num}
                </span>
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
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
        
        {/* ================= PASO 1: DATOS DEL DOCUMENTO ================= */}
        {activeTab === 1 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-900" />
                  Datos y Consecutivo del Documento
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Identificación oficial, folio correlativo y vigencia de precios de la cotización.
                </p>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-900 border border-blue-200">
                Paso 1 de 5
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                  Código de Serie
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={quote.code}
                    onChange={(e) => updateField('code', e.target.value)}
                    className="w-full h-12 px-4 text-base font-mono font-semibold bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-700 focus:ring-4 focus:ring-blue-100 outline-none transition-all text-slate-900"
                    placeholder="C1"
                  />
                  <Hash className="w-4 h-4 text-slate-400 absolute right-3.5 top-4 pointer-events-none" />
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">Prefijo de la serie documental.</span>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                  N° Consecutivo
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={quote.quoteNumber}
                    onChange={(e) => updateField('quoteNumber', e.target.value)}
                    placeholder="111"
                    className="w-full h-12 px-4 text-base font-mono font-bold text-blue-900 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-700 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                  />
                  <span className="text-[11px] font-bold text-blue-700 absolute right-3.5 top-4">OFICIAL</span>
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">Número consecutivo correlativo.</span>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                  Fecha de Emisión
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={quote.date}
                    onChange={(e) => updateField('date', e.target.value)}
                    placeholder="DD/MM/AAAA"
                    className="w-full h-12 px-4 text-base font-mono font-medium bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-700 focus:ring-4 focus:ring-blue-100 outline-none transition-all text-slate-900"
                  />
                  <Calendar className="w-4 h-4 text-slate-400 absolute right-3.5 top-4 pointer-events-none" />
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">Fecha visible en el encabezado impreso.</span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-semibold text-slate-800">
                    Vigencia de la Oferta
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleAddDaysValidity(15)}
                      className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition-colors"
                      title="Fijar fecha a 15 días desde la fecha de emisión"
                    >
                      +15d
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddDaysValidity(30)}
                      className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition-colors"
                      title="Fijar fecha a 30 días desde la fecha de emisión"
                    >
                      +30d
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={quote.validityDays || ''}
                    onChange={(e) => updateField('validityDays', e.target.value)}
                    placeholder="DD/MM/AAAA"
                    className="w-full h-12 px-4 text-base font-mono font-medium bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-700 focus:ring-4 focus:ring-blue-100 outline-none transition-all text-slate-900"
                  />
                  <Calendar className="w-4 h-4 text-slate-400 absolute right-3.5 top-4 pointer-events-none" />
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">Fecha límite de validez de la oferta (DD/MM/AAAA).</span>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                  Ciudad de la Carta de Presentación
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={quote.letterCity || ''}
                    onChange={(e) => updateField('letterCity', e.target.value)}
                    onBlur={() => updateField('letterCity', toProperCase(quote.letterCity))}
                    placeholder="Medellín"
                    className="w-full h-12 px-4 text-base font-medium bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-700 focus:ring-4 focus:ring-blue-100 outline-none transition-all text-slate-900"
                  />
                  <MapPin className="w-4 h-4 text-slate-400 absolute right-3.5 top-4 pointer-events-none" />
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Ciudad que encabeza la fecha formal epistolar (ej: Medellín, 27 de Octubre de 2026).
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ================= PASO 2: CLIENTE Y UBICACIÓN ================= */}
        {activeTab === 2 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-900" />
                  Cliente y Ubicación de la Obra
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Datos de la persona o entidad contratante y localización física de los trabajos.
                </p>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-900 border border-blue-200">
                Paso 2 de 5
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm sm:text-base font-semibold text-slate-800 mb-1.5">
                  Nombre o Razón Social del Cliente <span className="text-blue-600 font-bold">*</span>
                </label>
                <input
                  type="text"
                  value={quote.clientName}
                  onChange={(e) => updateField('clientName', e.target.value)}
                  onBlur={() => updateField('clientName', toProperCase(quote.clientName))}
                  placeholder="Ej: Constructora Bolívar S.A. o Mateo Palacios"
                  className="w-full h-12 px-4 text-base font-medium bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-700 focus:ring-4 focus:ring-blue-100 outline-none transition-all text-slate-900"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Reemplaza la variable (CLIENTE) en la plantilla Canva.
                </span>
              </div>

              <div>
                <label className="block text-sm sm:text-base font-semibold text-slate-800 mb-1.5">
                  Nombre del Proyecto u Obra <span className="text-blue-600 font-bold">*</span>
                </label>
                <input
                  type="text"
                  value={quote.projectName}
                  onChange={(e) => updateField('projectName', e.target.value)}
                  onBlur={() => updateField('projectName', toProperCase(quote.projectName))}
                  placeholder="Ej: Adecuación y pintura de fachada Edificio Central"
                  className="w-full h-12 px-4 text-base font-medium bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-700 focus:ring-4 focus:ring-blue-100 outline-none transition-all text-slate-900"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Reemplaza la variable (PROYECTO) en la plantilla Canva.
                </span>
              </div>

              <div>
                <label className="block text-sm sm:text-base font-semibold text-slate-800 mb-1.5">
                  Ubicación de la Obra (Dirección o Predio)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={quote.location || ''}
                    onChange={(e) => updateField('location', e.target.value)}
                    onBlur={() => updateField('location', toProperCase(quote.location))}
                    placeholder="Ej: Bogotá D.C. - Carrera 7 # 120-10"
                    className="w-full h-12 pl-11 pr-4 text-base font-medium bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-700 focus:ring-4 focus:ring-blue-100 outline-none transition-all text-slate-900"
                  />
                  <MapPin className="w-5 h-5 text-blue-700 absolute left-3.5 top-3.5 pointer-events-none" />
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Se visualiza en la tarjeta de localización del encabezado.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ================= PASO 3: TAREAS DE OBRA CIVIL ================= */}
        {activeTab === 3 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Building className="w-5 h-5 text-blue-900" />
                  Tareas de Obra Civil y Subtotal
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Define las actividades contratadas y el valor subtotal único de obra civil.
                </p>
              </div>

              {/* Botones de Modalidad y Agregar Tarea */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setTaskCreationMode('simple')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      taskCreationMode === 'simple'
                        ? 'bg-white text-blue-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Crear actividades sencillas de un solo campo"
                  >
                    📋 Actividad
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaskCreationMode('detailed')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      taskCreationMode === 'detailed'
                        ? 'bg-white text-blue-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Crear actividades con título y descripción técnica"
                  >
                    📝 Con descripción
                  </button>
                </div>

                <button
                  type="button"
                  onClick={addItem}
                  className="px-4 py-2 text-xs sm:text-sm font-bold bg-blue-900 hover:bg-blue-800 text-white rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Agregar Tarea</span>
                </button>
              </div>
            </div>

            {/* LISTA DE TAREAS */}
            {quote.items.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-2xl text-slate-500 space-y-2">
                <Building className="w-8 h-8 mx-auto text-slate-400 stroke-[1.5]" />
                <p className="text-sm font-semibold text-slate-700">No hay tareas de obra registradas</p>
                <p className="text-xs text-slate-400">Haz clic en &quot;Agregar Tarea&quot; para registrar la primera partida.</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {quote.items.map((item, index) => {
                  const isDetailed = item.mode === 'detailed' || Boolean(item.title && item.title.trim());
                  return (
                    <div
                      key={item.id}
                      className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 transition-all hover:border-slate-300"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-900 font-mono text-xs font-bold">
                            Tarea #{index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleItemMode(item.id)}
                            className="text-xs px-2.5 py-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 transition-colors font-medium"
                          >
                            {isDetailed ? '📝 Con descripción' : '📋 Sencilla'}
                          </button>
                        </div>

                        {quote.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="text-xs text-slate-400 hover:text-red-600 transition-colors flex items-center gap-1 p-1"
                            title="Eliminar esta tarea"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Eliminar</span>
                          </button>
                        )}
                      </div>

                      {isDetailed ? (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                              Actividad / Título del Capítulo
                            </label>
                            <input
                              type="text"
                              value={item.title || ''}
                              onChange={(e) => updateItemTitle(item.id, e.target.value)}
                              onBlur={() => updateItemTitle(item.id, toProperCase(item.title || ''))}
                              placeholder="Ej: Mampostería y muros estructurales"
                              className="w-full h-11 px-3 text-base font-semibold bg-white border border-slate-300 rounded-lg outline-none focus:border-blue-700 text-slate-900"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                              Descripción Técnica de la Actividad
                            </label>
                            <textarea
                              value={item.description}
                              onChange={(e) => updateItemDescription(item.id, e.target.value)}
                              onBlur={() => updateItemDescription(item.id, toSentenceCase(item.description))}
                              placeholder="Especificaciones técnicas, alcance, materiales o consideraciones de la actividad..."
                              rows={2}
                              className="w-full p-3 text-sm bg-white border border-slate-300 rounded-lg outline-none focus:border-blue-700 resize-none text-slate-800"
                            />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                            Descripción de la Actividad
                          </label>
                          <textarea
                            value={item.description}
                            onChange={(e) => updateItemDescription(item.id, e.target.value)}
                            onBlur={() => updateItemDescription(item.id, toSentenceCase(item.description))}
                            placeholder="Descripción de la tarea u obra civil a ejecutar..."
                            rows={2}
                            className="w-full p-3 text-base bg-white border border-slate-300 rounded-lg outline-none focus:border-blue-700 resize-none text-slate-800"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* CAMPO DESTACADO DE SUBTOTAL ÚNICO GLOBAL */}
            <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <label className="block text-sm sm:text-base font-bold text-blue-950 uppercase tracking-wide">
                  Subtotal Único Global ($ COP)
                </label>
                <p className="text-xs sm:text-sm text-blue-800 mt-0.5">
                  Valor único global acordado para la totalidad del conjunto de tareas.
                </p>
              </div>
              <div className="relative w-full sm:w-64">
                <span className="absolute left-3.5 top-3 text-lg font-bold text-blue-900 font-mono">$</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={quote.subtotal || ''}
                  onChange={(e) => updateField('subtotal', Number(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full h-12 pl-8 pr-4 text-right text-xl sm:text-2xl font-bold font-mono text-blue-950 bg-white border border-blue-300 rounded-xl focus:border-blue-700 focus:ring-4 focus:ring-blue-100 outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* ================= PASO 4: FORMAS DE PAGO Y CLÁUSULAS ================= */}
        {activeTab === 4 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Percent className="w-5 h-5 text-blue-900" />
                  Condiciones de Pago y Cláusulas
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Distribución porcentual de pago entre anticipo y finalización de los trabajos.
                </p>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-900 border border-blue-200">
                Paso 4 de 5
              </span>
            </div>

            {/* Preajustes rápidos */}
            <div>
              <span className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                Preajustes Rápidos de Distribución:
              </span>
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                {[
                  [50, 50],
                  [40, 60],
                  [60, 40],
                  [30, 70],
                ].map(([start, end]) => {
                  const isSelected = quote.startPct === start && quote.endPct === end;
                  return (
                    <button
                      key={`${start}-${end}`}
                      type="button"
                      onClick={() => handlePresetPercentages(start, end)}
                      className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-mono font-bold transition-all border ${
                        isSelected
                          ? 'bg-blue-900 text-white border-blue-900 shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {start}/{end}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                  % al Iniciar (Anticipo)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    max="100"
                    value={quote.startPct === 0 && quote.endPct === 100 ? '' : (quote.startPct ?? '')}
                    onChange={(e) => handleStartPctChange(e.target.value)}
                    placeholder="50"
                    className="w-full h-12 px-4 text-lg font-bold font-mono bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-700 outline-none text-slate-900"
                  />
                  <span className="absolute right-4 top-3 text-slate-400 font-bold">%</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                  % al Finalizar el Trabajo
                </label>
                <div className="relative">
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    max="100"
                    value={quote.endPct === 0 && quote.startPct === 100 ? '' : (quote.endPct ?? '')}
                    onChange={(e) => handleEndPctChange(e.target.value)}
                    placeholder="50"
                    className="w-full h-12 px-4 text-lg font-bold font-mono bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-700 outline-none text-slate-900"
                  />
                  <span className="absolute right-4 top-3 text-slate-400 font-bold">%</span>
                </div>
              </div>
            </div>

            {/* BANNER DE VALIDACIÓN 100% */}
            <div
              className={`p-4 rounded-xl border flex items-center justify-between text-xs sm:text-sm font-medium ${
                isPaymentValid
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-amber-50 border-amber-300 text-amber-900'
              }`}
            >
              <div className="flex items-center gap-2">
                {isPaymentValid ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                )}
                <span>
                  {isPaymentValid
                    ? 'Distribución válida: La suma de inicio y entrega equivale exactamente al 100%.'
                    : `Advertencia: La suma actual es de ${paymentSum}%. Debe totalizar el 100%.`}
                </span>
              </div>
              <span className="font-mono font-bold text-sm shrink-0">Total: {paymentSum}%</span>
            </div>

            {/* CLÁUSULA ESTÁNDAR CANVA */}
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs sm:text-sm text-amber-900 flex items-center gap-2">
              <span className="font-bold text-red-600">Importante:</span>
              <span>En la plantilla Canva se redacta: &quot;este valor es antes de IVA&quot;.</span>
            </div>
          </div>
        )}

        {/* ================= PASO 5: FIRMA Y EMPRESA ================= */}
        {activeTab === 5 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-blue-900" />
                  Firma Institucional y Canales de Contacto
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Información corporativa del contratista visible en el pie de página de la cotización.
                </p>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-900 border border-blue-200">
                Paso 5 de 5
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                  Representante Legal
                </label>
                <input
                  type="text"
                  value={quote.representativeName}
                  onChange={(e) => updateField('representativeName', e.target.value)}
                  onBlur={() => updateField('representativeName', toProperCase(quote.representativeName))}
                  className="w-full h-12 px-4 text-base font-medium bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-700 outline-none text-slate-900"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                  Cargo Institucional
                </label>
                <input
                  type="text"
                  value={quote.representativeRole}
                  onChange={(e) => updateField('representativeRole', e.target.value)}
                  onBlur={() => updateField('representativeRole', toProperCase(quote.representativeRole))}
                  className="w-full h-12 px-4 text-base font-medium bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-700 outline-none text-slate-900"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                  Teléfono / WhatsApp
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="tel"
                    value={quote.contactPhone}
                    onChange={(e) => updateField('contactPhone', e.target.value)}
                    className="w-full h-12 pl-11 pr-4 text-base font-mono font-medium bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-700 outline-none text-slate-900"
                  />
                  <Phone className="w-4 h-4 text-blue-700 absolute left-3.5 top-4 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="email"
                    value={quote.contactEmail}
                    onChange={(e) => updateField('contactEmail', e.target.value)}
                    className="w-full h-12 pl-11 pr-4 text-base font-medium bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-700 outline-none text-slate-900"
                  />
                  <Mail className="w-4 h-4 text-blue-700 absolute left-3.5 top-4 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                  Instagram Corporativo
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={quote.contactInstagram}
                    onChange={(e) => updateField('contactInstagram', e.target.value)}
                    className="w-full h-12 pl-11 pr-4 text-base font-medium bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-700 outline-none text-slate-900"
                  />
                  <Instagram className="w-4 h-4 text-blue-700 absolute left-3.5 top-4 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                  NIT de la Empresa
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={quote.nit}
                    onChange={(e) => updateField('nit', e.target.value)}
                    className="w-full h-12 pl-11 pr-4 text-base font-mono font-medium bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-700 outline-none text-slate-900"
                  />
                  <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-4 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* BOTONES INFERIORES DE NAVEGACIÓN ANTERIOR / SIGUIENTE */}
      <div className="p-3 sm:p-3.5 bg-white border-t border-slate-200 shrink-0 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setActiveTab((prev) => Math.max(1, prev - 1))}
          disabled={activeTab === 1}
          className="px-3 sm:px-4 py-2 sm:py-2.5 min-h-[42px] rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
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

        <button
          type="button"
          onClick={() => setActiveTab((prev) => Math.min(5, prev + 1))}
          disabled={activeTab === 5}
          className="px-4 sm:px-5 py-2 sm:py-2.5 min-h-[42px] rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span>{activeTab === 5 ? 'Completado' : 'Siguiente'}</span>
          <span className="hidden xs:inline">{activeTab === 5 ? '' : ' Paso'}</span>
          <ChevronRight className="w-4 h-4 shrink-0" />
        </button>
      </div>
    </div>
  );
};
