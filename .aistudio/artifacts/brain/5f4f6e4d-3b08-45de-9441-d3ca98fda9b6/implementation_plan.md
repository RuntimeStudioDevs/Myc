# Asistente Inteligente de Cotizaciones — M&C Construcciones Civiles

Sistema de cotización automatizado con agente de inteligencia artificial (Gemini 3.8 Flash), formulario bidireccional y motor de renderizado de plantillas idéntico al diseño original de Canva para emitir documentos oficiales en formato PDF listos para enviar por correo.

---

## Decisiones del Usuario y Puntos Críticos

> [!IMPORTANT]
> **Decisiones confirmadas en la fase de consulta:**
> - **Modo de interacción**: Chat interactivo guiado y formulario rápido sincronizados en tiempo real. El usuario puede hablarle al agente en lenguaje natural o llenar los campos directamente; ambos se reflejan instantáneamente.
> - **Estructura de tareas**: Soporte dual tanto para concepto global único (tal como viene en la plantilla original) como para lista de ítems detallados con subtotales autocalculados.
> - **Entrega del documento**: Vista previa en vivo con descarga instantánea en PDF vectorial de alta fidelidad y botón de compartir/enviar por correo electrónico con asunto y cuerpo preconfigurados.
> - **Estrategia sobre Canva**: La API pública de Canva requiere credenciales de desarrollador empresarial y flujo OAuth externo que no permite la exportación autónoma por scripts de terceros. En su lugar, implementamos un motor de renderizado 1:1 de la plantilla idéntica en SVG/HTML con los colores corporativos, tipografía, logo original de M&C Construcciones Civiles, notas legales y franjas decorativas, garantizando generación instantánea de PDFs limpios y vectoriales sin costo de licencias ni dependencias externas frágiles.

---

## 1. Visión General y Concepto Central

- **Propósito**: Permitir al equipo de **M&C Construcciones Civiles** generar cotizaciones comerciales en menos de 60 segundos con exactitud contable y fidelidad visual absoluta respecto a la plantilla institucional.
- **Usuario objetivo**: Ingenieros civiles, directores de obra, asesores comerciales y el representante legal (**Ever Becerra**) que requieren emitir propuestas formales con rapidez desde cualquier dispositivo.
- **Valor diferencial**:
  1. El agente solo pregunta las variables requeridas `(NOMBRE CLIENTE)`, `(NOMBRE PROYECTO)`, `(DESCRIPCIÓN)`, `(VALOR)`, `(PORCENTAJE AL INICIAR)` y `(PORCENTAJE AL FINALIZAR)`.
  2. Si el usuario escribe un texto libre (ej: *"Cotiza para Constructora Bolívar el arreglo de fachada en Fontibón por 18 millones, 40% de anticipo y 60% al terminar"*), el agente extrae automáticamente todas las variables y rellena la cotización al instante.
  3. Numeración correlativa automática incrementable (`COT-001`, `COT-002`, etc.) y fecha automática configurable.

---

## 2. Experiencia de Usuario y Diseño Visual

### Flujo de Interacción
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       Top Bar: M&C Cotizador Pro                            │
│  [Logo M&C]  Cotizaciones Civiles   ·   Consecutivo: COT-001   ·   [Nuevo]  │
├──────────────────────────────────────┬──────────────────────────────────────┤
│               PANEL IZQUIERDO        │            PANEL DERECHO             │
│  [ Pestañas: Chat Asistente | Form ] │        VISTA PREVIA EN VIVO (1:1)    │
│                                      │                                      │
│  🤖 Asistente Virtual:               │  ┌────────────────────────────────┐  │
│  "¡Hola! ¿Para qué cliente y         │  │ 🏢 M&C      COTIZACIÓN   C1    │  │
│   proyecto prepararemos la           │  │             NIT: 901795226-7   │  │
│   cotización hoy?"                   │  │ Cliente: Consorcio Andino      │  │
│                                      │  │ Proyecto: Adecuación Vía 40    │  │
│  💬 Entrada de usuario + Micrófono   │  │                                │  │
│  [ Enviar ] [ Cargar Ejemplo ]       │  │ Tareas: • Nivelación $12.000...│  │
│                                      │  │ Total: $12.000.000 COP         │  │
│  ⚡ Barra de Variables Detectadas:   │  │ Pago: 50% inicio / 50% fin     │  │
│  ✓ Cliente  ✓ Proyecto  ✓ Monto      │  │ Ever Becerra - Rep. Legal      │  │
│                                      │  └────────────────────────────────┘  │
│                                      │  Acciones: [📄 Descargar PDF]        │
│                                      │            [✉️ Enviar por Correo]    │
└──────────────────────────────────────┴──────────────────────────────────────┘
```

### Identidad Visual y Estilo (Directo de la Plantilla M&C)
- **Paleta de Colores**:
  - Azul Marino Primario (`#173258`): Encabezado superior, títulos de tablas, caja de total y acentos corporativos.
  - Azul Real de Acento (`#2563EB` / `#1D4ED8`): Franja separadora superior y botones de acción principal.
  - Rojo Advertencia (`#DC2626`): "Importante: este valor es antes de IVA".
  - Blanco y Gris Neutro (`#FFFFFF`, `#F8FAFC`, `#E2E8F0`): Fondos de documento y divisiones de alta legibilidad.
- **Tipografía**:
  - Títulos y encabezados: `Plus Jakarta Sans` / `Outfit` en mayúsculas negritas con espaciado limpio.
  - Cuerpo de texto y cláusulas: `Public Sans` / `DM Sans` con métrica equilibrada.
  - Monedas y cantidades: Monospace con cifras tabulares (`font-mono tabular-nums`) para perfecto alineamiento de decimales e importes.
- **Fidelidad Estructural 1:1**:
  - Logotipo vectorial oficial de M&C Construcciones Civiles.
  - Cabecera con Código `C1`, consecutivo autoincrementable y NIT `901795226-7`.
  - Estructura de tabla: `DESCRIPCIÓN` y `SUBTOTAL`.
  - Desglose contable: Sub-total, Administración ($0.00 o % configurable), Imprevistos, Utilidad, IVA y Total.
  - Bloque legal de condiciones de pago: porcentajes de anticipo y entrega.
  - Pie de página con datos de contacto (Teléfono `311 796 9848`, Instagram `@mcobracivil`, Correo `mcobracivil@gmail.com`) y firma del Representante Legal (**Ever Becerra**).
  - Franja decorativa inferior con barras diagonales en ángulo idénticas a la plantilla gráfica.

---

## 3. Decisiones de Producto y Arquitectura

1. **Motor del Agente (Gemini 3.8 Flash Server-Side)**:
   - Procesamiento estructurado mediante endpoint `/api/agent/chat` utilizando `@google/genai`.
   - El agente detecta qué variables faltan de la lista: `cliente`, `proyecto`, `items`, `valorTotal`, `porcentajeInicio`, `porcentajeFin`.
   - Si faltan datos, hace una pregunta breve y directa. Si el usuario le da todos los datos juntos, los parsea a un objeto JSON estructurado que actualiza el documento de inmediato.
2. **Sincronización Bidireccional**:
   - El estado reside en un store React unificado (`QuoteState`).
   - El usuario puede editar directamente en el formulario o corregir mediante el chat (ej: *"Cambia el anticipo al 60%"*); ambos sincronizan la vista previa en vivo en $<50\text{ms}$.
3. **Generación de PDF**:
   - Generación directa con `html2pdf.js` / motor de impresión CSS para obtener un archivo PDF idéntico a tamaño A4 / Carta con resolución 300 DPI, listo para anexar o enviar.
4. **Integración con Correo**:
   - Botón `Preparar Correo` que abre el cliente de correo predeterminado del usuario (`mailto:`) o genera un enlace prellenado con asunto profesional: *"Cotización C1-[N°] - [NOMBRE PROYECTO] - M&C Construcciones Civiles"* y cuerpo detallado listo para adjuntar el PDF generado.

---

## 4. Arquitectura Técnica y Estrategia de Datos

```
┌────────────────────────────────────────────────────────────────────────┐
│                              CLIENTE (Vite + React)                    │
│                                                                        │
│   ┌────────────────────┐     ┌────────────────┐    ┌────────────────┐  │
│   │    Chat Agent UI   │ <-> │   Quote Store  │ -> │   Live Preview │  │
│   │  (Asistente Guiado)│     │  (State React) │    │  (Plantilla)   │  │
│   └─────────┬──────────┘     └───────┬────────┘    └────────┬───────┘  │
│             │                        │                      │          │
│             │                        │             [PDF Export Engine] │
│             │                        │             [Mailto Generator]  │
└─────────────┼────────────────────────┼──────────────────────┼──────────┘
              │                        │                      │
              ▼                        ▼                      │
┌────────────────────────────────────────────────┐            │
│          SERVIDOR EXPRESS (server.ts)          │            │
│                                                │            │
│   POST /api/agent/chat                         │            │
│   -> Google GenAI SDK (gemini-3.8-flash)       │            │
│   -> JSON Structured Extraction & Natural Chat │            │
│   -> System Instruction con variables exactas  │            │
└────────────────────────────────────────────────┘            ▼
                                                    [Documento PDF Oficial]
```

### Modelo de Datos de la Cotización (`QuoteData`)
```typescript
interface QuoteItem {
  id: string;
  description: string;
  subtotal: number;
}

interface QuoteData {
  code: string;               // Ej: "C1"
  quoteNumber: string;        // Ej: "COT-001"
  nit: string;                // "901795226-7"
  date: string;               // "DD/MM/AAAA"
  clientName: string;         // (NOMBRE CLIENTE)
  projectName: string;        // (NOMBRE PROYECTO)
  items: QuoteItem[];         // [(DESCRIPCIÓN DEL PROYECTO), $(VALOR)]
  subtotal: number;
  adminPct: number;           // % Administración (default 0)
  contingencyPct: number;     // % Imprevistos (default 0)
  utilityPct: number;         // % Utilidad (default 0)
  ivaPct: number;             // % IVA (default 0, valor antes de IVA)
  total: number;
  startPct: number;           // (PORCENTAJE AL INICIAR)
  endPct: number;             // (PORCENTAJE AL FINALIZAR)
  notes: string;
  representativeName: string; // "Ever Becerra"
  representativeRole: string; // "Representante legal"
  contactPhone: string;       // "311 796 9848"
  contactInstagram: string;   // "mcobracivil"
  contactEmail: string;       // "mcobracivil@gmail.com"
}
```

---

## Plan de Verificación

1. **Prueba de Extracción por IA**: Probar con descripciones breves y complejas para confirmar que el agente extrae con 100% de precisión las variables de la cotización.
2. **Prueba de Exactitud Gráfica**: Comparar pixel a pixel el PDF resultante con `/public/assets/aistudio/Agente_c7d0605a.pdf` para verificar encabezados, colores `#173258`, tabla de tareas, desglose de totales, notas legales y franjas angulares.
3. **Prueba de Exportación PDF**: Generar y descargar el PDF en el navegador para asegurar que no se produzcan saltos de página erróneos ni texto cortado.
4. **Prueba de Envío por Correo**: Probar la acción de compartir y correo preconfigurado.
