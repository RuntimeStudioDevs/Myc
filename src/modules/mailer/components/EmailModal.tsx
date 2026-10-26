import React, { useState } from 'react';
import { QuoteData } from '../../quote/types/quote.types';
import { formatCurrency } from '../../../shared/utils/currency';
import { X, Mail, Copy, Check, MessageSquare } from 'lucide-react';

interface EmailModalProps {
  quote: QuoteData;
  isOpen: boolean;
  onClose: () => void;
}

export const EmailModal: React.FC<EmailModalProps> = ({ quote, isOpen, onClose }) => {
  const [recipient, setRecipient] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const subject = `Cotización ${quote.code}-${quote.quoteNumber || '001'} | ${quote.projectName || 'Proyecto de Obra Civil'} | M&C Construcciones Civiles`;

  const emailBody = `Apreciado(a) ${quote.clientName || 'Cliente'},

Reciba un cordial saludo de parte de M&C CONSTRUCCIONES CIVILES (NIT: 901795226-7).

Adjunto a este correo encontrará la cotización oficial formal correspondiente al proyecto: "${quote.projectName || 'Obra Civil'}".

Resumen de la propuesta:
• Código de Cotización: ${quote.code}-${quote.quoteNumber || '001'}
• Fecha de emisión: ${quote.date || new Date().toLocaleDateString('es-CO')}
• Tareas incluidas:
${quote.items.map((it) => `  - ${it.description}: ${formatCurrency(it.subtotal)}`).join('\n') || '  - Obra civil según especificaciones'}
• Valor Total de la propuesta: ${formatCurrency(quote.total)} (Antes de IVA)
• Condiciones de pago: ${quote.startPct}% al iniciar y ${quote.endPct}% al finalizar los trabajos.

Agradecemos de antemano su confianza en nuestro equipo de ingeniería y quedamos a su entera disposición para cualquier aclaración o visita técnica previa.

Atentamente,

${quote.representativeName || 'Ever Becerra'}
${quote.representativeRole || 'Representante legal'}
M&C CONSTRUCCIONES CIVILES
Teléfono / WhatsApp: ${quote.contactPhone || '311 796 9848'}
Instagram: @${quote.contactInstagram || 'mcobracivil'}
Correo: ${quote.contactEmail || 'mcobracivil@gmail.com'}`;

  const mailtoLink = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(emailBody)}`;

  const whatsappText = `*COTIZACIÓN M&C CONSTRUCCIONES CIVILES*\nCódigo: ${quote.code}-${quote.quoteNumber || '001'}\nCliente: ${quote.clientName || 'Cliente'}\nProyecto: ${quote.projectName || 'Obra civil'}\nTotal: ${formatCurrency(quote.total)} (Antes de IVA)\nPago: ${quote.startPct}% inicio / ${quote.endPct}% entrega.\n\nEver Becerra - Representante Legal (311 796 9848)`;

  const whatsappLink = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappText)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(emailBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Preparar Envío de Cotización</h2>
              <p className="text-[11px] text-slate-400">
                Plantilla de mensaje lista con los datos específicos del cliente
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Correo del Destinatario (Cliente):
            </label>
            <input
              type="email"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="cliente@ejemplo.com"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-500 outline-none placeholder-slate-600"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Asunto sugerido:
            </label>
            <input
              type="text"
              readOnly
              value={subject}
              className="w-full bg-slate-950/70 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-400 font-mono outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-semibold text-slate-300">
                Cuerpo del mensaje institucional:
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copied ? '¡Copiado al portapapeles!' : 'Copiar texto'}
              </button>
            </div>
            <textarea
              readOnly
              rows={9}
              value={emailBody}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-[11px] font-mono text-slate-300 leading-relaxed outline-none resize-none selection:bg-blue-600"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-3">
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 text-xs font-semibold text-emerald-400 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/60 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Compartir por WhatsApp</span>
          </a>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cerrar
            </button>
            <a
              href={mailtoLink}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow transition-colors flex items-center gap-1.5"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Abrir en Cliente de Correo</span>
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};
