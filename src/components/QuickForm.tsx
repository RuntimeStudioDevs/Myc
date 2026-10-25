import React from 'react';
import { QuoteData, QuoteItem } from '../types';
import { Plus, Trash2, Calculator, Calendar, FileText, User, Building, Percent } from 'lucide-react';

interface QuickFormProps {
  quote: QuoteData;
  onChange: (updated: QuoteData) => void;
}

export const QuickForm: React.FC<QuickFormProps> = ({ quote, onChange }) => {
  const updateField = (field: keyof QuoteData, value: any) => {
    const updated = { ...quote, [field]: value };

    // Auto recalculate subtotal and total
    if (field === 'items' || field === 'adminPct' || field === 'contingencyPct' || field === 'utilityPct' || field === 'ivaPct') {
      const itemsList = field === 'items' ? (value as QuoteItem[]) : quote.items;
      const subtotal = itemsList.reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0);
      updated.subtotal = subtotal;

      const adminVal = subtotal * ((updated.adminPct || 0) / 100);
      const contVal = subtotal * ((updated.contingencyPct || 0) / 100);
      const utilVal = subtotal * ((updated.utilityPct || 0) / 100);
      const ivaVal = (adminVal + contVal + utilVal) * ((updated.ivaPct || 0) / 100);
      updated.total = subtotal + adminVal + contVal + utilVal + ivaVal;
    }

    onChange(updated);
  };

  const addItem = () => {
    const newItem: QuoteItem = {
      id: String(Date.now()),
      description: '',
      subtotal: 0,
    };
    updateField('items', [...quote.items, newItem]);
  };

  const updateItem = (id: string, field: 'description' | 'subtotal', val: any) => {
    const newItems = quote.items.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          [field]: field === 'subtotal' ? Number(val) || 0 : val,
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

  return (
    <div className="h-full overflow-y-auto p-4 bg-slate-900 text-slate-100 space-y-6">
      
      {/* SECTION 1: Document Header Data */}
      <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5" />
          Datos del Documento
        </h3>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] text-slate-400 font-medium mb-1">Código</label>
            <input
              type="text"
              value={quote.code}
              onChange={(e) => updateField('code', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 font-medium mb-1">N° Consecutivo</label>
            <input
              type="text"
              value={quote.quoteNumber}
              onChange={(e) => updateField('quoteNumber', e.target.value)}
              placeholder="COT-001"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono font-semibold focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 font-medium mb-1">Fecha</label>
            <div className="relative">
              <input
                type="text"
                value={quote.date}
                onChange={(e) => updateField('date', e.target.value)}
                placeholder="DD/MM/AAAA"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:border-blue-500 outline-none pr-7"
              />
              <Calendar className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Client & Project Variables */}
      <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
          <User className="w-3.5 h-3.5" />
          Cliente y Proyecto (Variables de Plantilla)
        </h3>

        <div>
          <label className="block text-[11px] text-slate-300 font-medium mb-1">
            CLIENTE: <span className="text-slate-500">(NOMBRE CLIENTE)</span>
          </label>
          <input
            type="text"
            value={quote.clientName}
            onChange={(e) => updateField('clientName', e.target.value)}
            placeholder="Ej: Constructora Bolívar S.A. o Mateo Palacios"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:border-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-[11px] text-slate-300 font-medium mb-1">
            PROYECTO: <span className="text-slate-500">(NOMBRE PROYECTO)</span>
          </label>
          <input
            type="text"
            value={quote.projectName}
            onChange={(e) => updateField('projectName', e.target.value)}
            placeholder="Ej: Adecuación y pintura de fachada Edificio Central"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:border-blue-500 outline-none"
          />
        </div>
      </div>

      {/* SECTION 3: Task Items & Subtotals */}
      <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5" />
            Tareas de Obra Civil y Subtotales
          </h3>
          <button
            type="button"
            onClick={addItem}
            className="flex items-center gap-1 text-[11px] bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded-md transition-colors"
          >
            <Plus className="w-3 h-3" />
            Agregar Tarea
          </button>
        </div>

        {quote.items.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-slate-800 rounded-lg text-slate-500 text-xs">
            No hay tareas registradas. Haz clic en &quot;Agregar Tarea&quot; para comenzar.
          </div>
        ) : (
          <div className="space-y-2.5">
            {quote.items.map((item, index) => (
              <div
                key={item.id}
                className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 space-y-2 relative group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400">Tarea #{index + 1}</span>
                  {quote.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-slate-500 hover:text-red-400 p-1 transition-colors"
                      title="Eliminar tarea"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div>
                  <textarea
                    value={item.description}
                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                    placeholder="Descripción detallada de la tarea u obra..."
                    rows={2}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-blue-500 resize-none"
                  />
                </div>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <label className="text-[11px] text-slate-400 font-medium">Subtotal COP ($):</label>
                  <input
                    type="number"
                    value={item.subtotal || ''}
                    onChange={(e) => updateItem(item.id, 'subtotal', e.target.value)}
                    placeholder="0"
                    className="w-36 bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-right font-mono font-semibold text-emerald-400 outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Calculated Total Bar */}
        <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
          <span className="text-slate-400 font-medium">Subtotal general:</span>
          <span className="font-mono font-bold text-white text-sm">
            ${(quote.subtotal || 0).toLocaleString('es-CO')}
          </span>
        </div>
      </div>

      {/* SECTION 4: Payment Conditions */}
      <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
            <Percent className="w-3.5 h-3.5" />
            Condiciones de Pago (Variables de Plantilla)
          </h3>
          
          <div className="flex items-center gap-1">
            {[
              [50, 50],
              [40, 60],
              [60, 40],
              [30, 70],
            ].map(([start, end]) => (
              <button
                key={`${start}-${end}`}
                type="button"
                onClick={() => {
                  updateField('startPct', start);
                  updateField('endPct', end);
                }}
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded transition-colors ${
                  quote.startPct === start && quote.endPct === end
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {start}/{end}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] text-slate-300 font-medium mb-1">
              % al Iniciar: <span className="text-slate-500">(ANTICIPO)</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                value={quote.startPct}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  updateField('startPct', val);
                  if (val <= 100) updateField('endPct', 100 - val);
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-100 outline-none focus:border-blue-500"
              />
              <span className="absolute right-3 top-2 text-xs text-slate-500">%</span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-slate-300 font-medium mb-1">
              % al Finalizar: <span className="text-slate-500">(ENTREGA)</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                value={quote.endPct}
                onChange={(e) => updateField('endPct', Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-100 outline-none focus:border-blue-500"
              />
              <span className="absolute right-3 top-2 text-xs text-slate-500">%</span>
            </div>
          </div>
        </div>

        <p className="text-[10px] text-slate-400 italic">
          Nota: En la plantilla se redacta como: &quot;El pago se realiza el {quote.startPct}% al iniciar y el {quote.endPct}% restante al finalizar el trabajo&quot;.
        </p>
      </div>

      {/* SECTION 5: Institutional Contacts */}
      <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Calculator className="w-3.5 h-3.5" />
          Firma y Contacto Institucional
        </h3>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-[10px] text-slate-400 mb-0.5">Representante Legal</label>
            <input
              type="text"
              value={quote.representativeName}
              onChange={(e) => updateField('representativeName', e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 mb-0.5">Cargo</label>
            <input
              type="text"
              value={quote.representativeRole}
              onChange={(e) => updateField('representativeRole', e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 mb-0.5">Teléfono / WhatsApp</label>
            <input
              type="text"
              value={quote.contactPhone}
              onChange={(e) => updateField('contactPhone', e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 mb-0.5">Correo</label>
            <input
              type="text"
              value={quote.contactEmail}
              onChange={(e) => updateField('contactEmail', e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 outline-none"
            />
          </div>
        </div>
      </div>

    </div>
  );
};
