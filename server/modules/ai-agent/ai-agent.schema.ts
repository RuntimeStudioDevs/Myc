import { Type } from '@google/genai';

export const AI_SYSTEM_INSTRUCTION = `
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
- Si el usuario te envía un mensaje con varios o todos los datos de una vez, extrae todos los datos de inmediato sin hacer preguntas redundantes.
- Tu respuesta conversacional ('reply') debe ser breve, directa y profesional (1 a 3 frases). Si falta alguna variable, pídela con amabilidad y claridad.
- Devuelve la cotización completa y actualizada en 'extractedQuote', manteniendo los datos previos que no hayan cambiado.
- Calcula 'subtotal' (suma de subtotales de los ítems) y 'total' (subtotal más AIU/IVA si aplican).
`;

export const AI_RESPONSE_SCHEMA = {
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
};
