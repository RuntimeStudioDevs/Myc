import React, { useState, useEffect } from 'react';
import {
  X,
  Cloud,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Save,
  Trash2,
  Loader2,
} from 'lucide-react';
import {
  getGoogleSheetsWebhookUrl,
  setCustomGoogleSheetsUrl,
  fetchNextQuoteNumber,
} from '../services/google-sheets.service';

interface SheetsConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved?: () => void;
}

export const SheetsConfigModal: React.FC<SheetsConfigModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved,
}) => {
  const [url, setUrl] = useState<string>('');
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setUrl(getGoogleSheetsWebhookUrl() || '');
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    if (!url.trim().startsWith('http')) {
      setTestResult({
        success: false,
        message: 'Por favor ingresa una URL válida (debe empezar con https://script.google.com/...)',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    // Guardar temporalmente para probar
    setCustomGoogleSheetsUrl(url);

    const res = await fetchNextQuoteNumber();
    setIsTesting(false);

    if (res.success) {
      setTestResult({
        success: true,
        message: `¡Conexión exitosa! Próximo consecutivo en la nube: N° ${res.nextQuoteNumber}`,
      });
    } else {
      setTestResult({
        success: false,
        message: `Error de conexión: ${res.error || 'No respondió la aplicación web'}`,
      });
    }
  };

  const handleSave = () => {
    setCustomGoogleSheetsUrl(url);
    onConfigSaved?.();
    onClose();
  };

  const handleClear = () => {
    setUrl('');
    setCustomGoogleSheetsUrl('');
    setTestResult(null);
    onConfigSaved?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        
        {/* Cabecera del Modal */}
        <div className="px-6 py-4 bg-[#234794] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10">
              <Cloud className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base tracking-wide font-poppins">
                Sincronización con Google Sheets
              </h3>
              <p className="text-[11px] text-blue-100 font-poppins">
                Base de datos en la nube sin costos ni apagado por inactividad
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido del Modal */}
        <div className="p-6 space-y-4 text-xs font-poppins text-slate-700">
          
          <div className="space-y-1.5">
            <label className="font-bold text-slate-800 text-xs block">
              URL de la Aplicación Web (Google Apps Script):
            </label>
            <input
              type="url"
              placeholder="https://script.google.com/macros/s/.../exec"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setTestResult(null);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent font-mono text-xs text-slate-800 placeholder:text-slate-400"
            />
            <p className="text-[11px] text-slate-500">
              Pega aquí la URL terminada en <code className="text-blue-900 font-bold font-mono">/exec</code> generada desde tu hoja de Google Sheets.
            </p>
          </div>

          {/* Resultado de prueba de conexión */}
          {testResult && (
            <div
              className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span className="text-xs font-medium leading-relaxed">
                {testResult.message}
              </span>
            </div>
          )}

          {/* Guía Rápida de 3 Pasos */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
            <div className="font-bold text-slate-800 text-[11px] flex items-center justify-between">
              <span>¿Cómo obtener esta URL en tu Google Sheets?</span>
              <a
                href="https://sheets.new"
                target="_blank"
                rel="noreferrer"
                className="text-blue-800 hover:underline flex items-center gap-1 font-semibold"
              >
                Crear Hoja <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <ol className="list-decimal pl-4 space-y-1 text-[11px] text-slate-600">
              <li>En tu hoja de cálculo, ve a: <strong>Extensiones &gt; Apps Script</strong>.</li>
              <li>Pega el código del archivo <code className="font-mono text-slate-800 font-bold">google-apps-script/Code.gs</code>.</li>
              <li>Haz clic en <strong>Implementar &gt; Nueva implementación &gt; Aplicación web</strong>.</li>
              <li>Elige en Acceso: <strong>"Cualquiera"</strong> y copia el enlace web.</li>
            </ol>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={handleClear}
            disabled={!url}
            className="px-3 py-2 text-rose-700 hover:bg-rose-50 rounded-xl font-semibold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-40"
            title="Borrar configuración y volver a modo local"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Desconectar</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting || !url.trim()}
              className="px-3.5 py-2 rounded-xl text-slate-700 hover:bg-slate-200 font-semibold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 border border-slate-300"
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-900" />
                  <span>Probando...</span>
                </>
              ) : (
                <span>Probar Conexión</span>
              )}
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Guardar</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
