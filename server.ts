import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Initialize Google GenAI if a valid API key is present
let ai: GoogleGenAI | null = null;
if (
  process.env.GEMINI_API_KEY &&
  process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY' &&
  process.env.GEMINI_API_KEY.trim().length > 15
) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Quote structure definition
interface QuoteItem {
  id: string;
  description: string;
  subtotal: number;
}

interface QuoteData {
  code: string;
  quoteNumber: string;
  nit: string;
  date: string;
  clientName: string;
  projectName: string;
  items: QuoteItem[];
  subtotal: number;
  adminPct: number;
  contingencyPct: number;
  utilityPct: number;
  ivaPct: number;
  total: number;
  startPct: number;
  endPct: number;
  notes: string;
  representativeName: string;
  representativeRole: string;
  contactPhone: string;
  contactInstagram: string;
  contactEmail: string;
}

// Fallback heuristic extraction if Gemini key is temporarily missing
function fallbackExtractor(userMessage: string, current: QuoteData) {
  const updated = { ...current };
  const lower = userMessage.toLowerCase();

  // Try extracting client
  const clientMatch = userMessage.match(/(?:cliente|para|señor(?:es)?|empresa)\s*:\s*([^,\n]+)/i) ||
                      userMessage.match(/(?:para|cliente)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)*)/);
  if (clientMatch && clientMatch[1]) {
    updated.clientName = clientMatch[1].trim();
  }

  // Try extracting project
  const projectMatch = userMessage.match(/(?:proyecto|obra|trabajo)\s*:\s*([^,\n]+)/i);
  if (projectMatch && projectMatch[1]) {
    updated.projectName = projectMatch[1].trim();
  }

  // Try extracting value / money
  const moneyMatch = userMessage.match(/(?:\$|valor|por|precio|costo)\s*([0-9.,]+)\s*(?:millones?|mil(?:es)?|cop)?/i) ||
                     userMessage.match(/([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?)/);
  if (moneyMatch && moneyMatch[1]) {
    let cleanNum = moneyMatch[1].replace(/\./g, '').replace(',', '.');
    let val = parseFloat(cleanNum);
    if (lower.includes('millon') || lower.includes('millones')) {
      if (val < 1000) val = val * 1000000;
    }
    if (!isNaN(val) && val > 0) {
      if (updated.items.length === 0) {
        updated.items = [{ id: '1', description: 'Obra civil y ejecución de proyecto', subtotal: val }];
      } else {
        updated.items[0].subtotal = val;
      }
    }
  }

  // Try extracting percentages
  const pctMatch = userMessage.match(/(\d{1,2})%\s*(?:anticipo|iniciar|inicio)?.*?(\d{1,2})%\s*(?:final|entrega|terminar)?/i);
  if (pctMatch) {
    updated.startPct = parseInt(pctMatch[1], 10);
    updated.endPct = parseInt(pctMatch[2], 10);
  }

  // Recalculate totals
  const itemsSum = updated.items.reduce((acc, it) => acc + (Number(it.subtotal) || 0), 0);
  updated.subtotal = itemsSum;
  updated.total = itemsSum;

  const missing: string[] = [];
  if (!updated.clientName) missing.push('Nombre del cliente');
  if (!updated.projectName) missing.push('Nombre del proyecto');
  if (updated.items.length === 0 || updated.subtotal === 0) missing.push('Descripción y valor de las tareas');
  if (!updated.startPct || !updated.endPct) missing.push('Porcentajes de pago (inicio y final)');

  let reply = 'He actualizado los datos de la cotización en la plantilla.';
  if (missing.length > 0) {
    reply += ` Para completar el documento oficial, ¿podrías indicarme: ${missing.join(', ')}?`;
  } else {
    reply += ' ¡Excelente! Todos los campos requeridos están listos en la vista previa del documento. Puedes generar el PDF cuando lo desees.';
  }

  return {
    reply,
    extractedQuote: updated,
    missingFields: missing,
    isComplete: missing.length === 0,
  };
}

// API Route for Agent Chat
app.post('/api/agent/chat', async (req: Request, res: Response) => {
  const { message, history, currentQuote } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'El mensaje es requerido' });
  }

  const baseQuote: QuoteData = currentQuote || {
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
    notes: 'El pago se realiza de la siguiente manera el {startPct}% al iniciar y el {endPct}% restante al finalizar el trabajo.',
    representativeName: 'Ever Becerra',
    representativeRole: 'Representante legal',
    contactPhone: '311 796 9848',
    contactInstagram: 'mcobracivil',
    contactEmail: 'mcobracivil@gmail.com',
  };

  if (!ai) {
    const fallback = fallbackExtractor(message, baseQuote);
    return res.json(fallback);
  }

  try {
    const systemInstruction = `
Eres el Asistente Inteligente de Cotizaciones de "M&C CONSTRUCCIONES CIVILES" (NIT: 901795226-7), empresa de obras civiles en Colombia representada legalmente por Ever Becerra.
Tu objetivo es interactuar de manera eficiente, cortés, técnica y concisa con el usuario para recopilar y actualizar las variables exactas de la plantilla oficial de cotización.

Las variables clave de la plantilla encerradas entre paréntesis en el diseño son:
1. CLIENTE: (NOMBRE CLIENTE) -> 'clientName'
2. PROYECTO: (NOMBRE PROYECTO) -> 'projectName'
3. DESCRIPCIÓN Y SUB-TOTAL: (DESCRIPCIÓN DEL PROYECTO) y $(VALOR) -> 'items': array de objetos { id: string, description: string, subtotal: number }
   - Si el usuario da una sola descripción global y monto, crea 1 ítem con esa descripción y valor.
   - Si da varias tareas con sus montos, desglósalas en ítems individuales.
   - Si da un total general sin desglose detallado de ítems, asígnalo como concepto principal.
4. CONDICIONES DE PAGO: (PORCENTAJE AL INICIAR) y (PORCENTAJE AL FINALIZAR) -> 'startPct' y 'endPct' (ejemplo 50% al iniciar y 50% al finalizar, o 40%/60%, deben sumar preferiblemente 100%).
5. N° DE COTIZACIÓN: 'quoteNumber' (ej: "COT-001", o un número incremental que el usuario indique).
6. FECHA: 'date' (DD/MM/AAAA o fecha actual).
7. Impuestos / AIU opcionales:
   - 'adminPct' (Administración, default 0)
   - 'contingencyPct' (Imprevistos, default 0)
   - 'utilityPct' (Utilidad, default 0)
   - 'ivaPct' (IVA, default 0, nota que el documento indica: "este valor es antes de IVA")

Instrucciones de comportamiento:
- Solo pregunta por las variables que realmente falten. No repitas preguntas de variables que ya están diligenciadas a menos que el usuario pida cambiarlas.
- Si el usuario te envía un mensaje con varios o todos los datos de una vez (ej: "Cotización para Constructora Bolívar, proyecto Reparación de Placa Fontibón, 12 millones, 50 y 50"), extrae todos los datos de inmediato sin hacer preguntas redundantes.
- Tu respuesta conversacional ('reply') debe ser breve, directa y profesional (1 a 3 frases). Si falta alguna variable, pídela con amabilidad y claridad.
- Devuelve la cotización completa y actualizada en 'extractedQuote', manteniendo los datos previos que no hayan cambiado.
- Calcula 'subtotal' (suma de subtotales de los ítems) y 'total' (subtotal más AIU/IVA si aplican).
`;

    const prompt = `
Estado actual de la cotización:
${JSON.stringify(baseQuote, null, 2)}

Mensaje del usuario:
"${message}"

Historial reciente:
${JSON.stringify(history?.slice(-4) || [])}

Analiza el mensaje, extrae las variables, actualiza el objeto de cotización y responde en formato JSON según el esquema.
`;

    const genPromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: {
              type: Type.STRING,
              description: 'Respuesta conversacional breve, amable y profesional para el usuario.',
            },
            extractedQuote: {
              type: Type.OBJECT,
              properties: {
                code: { type: Type.STRING },
                quoteNumber: { type: Type.STRING },
                nit: { type: Type.STRING },
                date: { type: Type.STRING },
                clientName: { type: Type.STRING },
                projectName: { type: Type.STRING },
                items: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      description: { type: Type.STRING },
                      subtotal: { type: Type.NUMBER },
                    },
                    required: ['description', 'subtotal'],
                  },
                },
                subtotal: { type: Type.NUMBER },
                adminPct: { type: Type.NUMBER },
                contingencyPct: { type: Type.NUMBER },
                utilityPct: { type: Type.NUMBER },
                ivaPct: { type: Type.NUMBER },
                total: { type: Type.NUMBER },
                startPct: { type: Type.NUMBER },
                endPct: { type: Type.NUMBER },
                notes: { type: Type.STRING },
                representativeName: { type: Type.STRING },
                representativeRole: { type: Type.STRING },
                contactPhone: { type: Type.STRING },
                contactInstagram: { type: Type.STRING },
                contactEmail: { type: Type.STRING },
              },
              required: ['clientName', 'projectName', 'items', 'startPct', 'endPct'],
            },
            missingFields: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Lista de nombres legibles de variables que aún no han sido proporcionadas.',
            },
            isComplete: {
              type: Type.BOOLEAN,
              description: 'True si cliente, proyecto, al menos un ítem con valor y porcentajes están presentes.',
            },
          },
          required: ['reply', 'extractedQuote', 'missingFields', 'isComplete'],
        },
      },
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout de consulta')), 7000)
    );

    const response = (await Promise.race([genPromise, timeoutPromise])) as any;

    const parsed = JSON.parse(response.text || '{}');

    // Ensure IDs on items and ensure correct totals
    if (parsed.extractedQuote && Array.isArray(parsed.extractedQuote.items)) {
      parsed.extractedQuote.items = parsed.extractedQuote.items.map((item: any, idx: number) => ({
        id: item.id || String(idx + 1),
        description: item.description || '',
        subtotal: Number(item.subtotal) || 0,
      }));
      const calcSubtotal = parsed.extractedQuote.items.reduce((sum: number, it: any) => sum + (it.subtotal || 0), 0);
      parsed.extractedQuote.subtotal = calcSubtotal;
      
      const adminVal = calcSubtotal * ((parsed.extractedQuote.adminPct || 0) / 100);
      const contVal = calcSubtotal * ((parsed.extractedQuote.contingencyPct || 0) / 100);
      const utilVal = calcSubtotal * ((parsed.extractedQuote.utilityPct || 0) / 100);
      const ivaVal = (adminVal + contVal + utilVal) * ((parsed.extractedQuote.ivaPct || 0) / 100);
      parsed.extractedQuote.total = calcSubtotal + adminVal + contVal + utilVal + ivaVal;

      // Retain defaults if missing
      parsed.extractedQuote.code = parsed.extractedQuote.code || baseQuote.code || 'C1';
      parsed.extractedQuote.quoteNumber = parsed.extractedQuote.quoteNumber || baseQuote.quoteNumber || 'COT-001';
      parsed.extractedQuote.nit = parsed.extractedQuote.nit || baseQuote.nit || '901795226-7';
      parsed.extractedQuote.date = parsed.extractedQuote.date || baseQuote.date || new Date().toLocaleDateString('es-CO');
      parsed.extractedQuote.representativeName = parsed.extractedQuote.representativeName || 'Ever Becerra';
      parsed.extractedQuote.representativeRole = parsed.extractedQuote.representativeRole || 'Representante legal';
      parsed.extractedQuote.contactPhone = parsed.extractedQuote.contactPhone || '311 796 9848';
      parsed.extractedQuote.contactInstagram = parsed.extractedQuote.contactInstagram || 'mcobracivil';
      parsed.extractedQuote.contactEmail = parsed.extractedQuote.contactEmail || 'mcobracivil@gmail.com';
    }

    return res.json(parsed);
  } catch (err: any) {
    console.error('Error in /api/agent/chat:', err);
    // Graceful fallback to heuristic extraction
    const fallback = fallbackExtractor(message, baseQuote);
    fallback.reply = `(Procesado localmente) ${fallback.reply}`;
    return res.json(fallback);
  }
});

// Production and Development middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`M&C Cotizador server running on port ${port}`);
  });
}

startServer();
