import {
  DocumentExportStrategy,
  ExportContext,
  ExportResult,
  ExportStrategyId,
  buildExportFilename,
} from './export-strategy.interface';
import { shimWindowGetComputedStyle } from '../../../../shared/utils/html2canvas-color-shim';

/**
 * Función auxiliar para compilar un arreglo de elementos DOM (.quote-page) en un documento jsPDF A4.
 */
async function compilePagesToPdf(
  targets: HTMLElement[],
  html2canvas: any,
  jsPDF: any
) {
  if (targets.length === 0) {
    throw new Error('No se encontraron páginas para compilar en PDF');
  }

  // Activar shim en la ventana principal para interceptar estilos de documentElement y body
  const restoreMainWindowShim = shimWindowGetComputedStyle(window);

  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];
      if (i > 0) {
        pdf.addPage('a4', 'portrait');
      }

      const canvas = await html2canvas(target, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#FFFFFF',
        onclone: (clonedDoc: Document) => {
          // Activar shim en el iframe clonado por html2canvas
          if (clonedDoc.defaultView) {
            shimWindowGetComputedStyle(clonedDoc.defaultView);
          }
        },
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
    }

    return pdf;
  } finally {
    // Restaurar getComputedStyle en la ventana principal
    restoreMainWindowShim();
  }
}

/**
 * Obtiene exclusivamente las páginas de la Cotización de obra civil.
 */
function getQuotePages(rootContainer: HTMLElement): HTMLElement[] {
  const pages = Array.from(
    rootContainer.querySelectorAll<HTMLElement>('.quote-document-page')
  );
  if (pages.length > 0) return pages;

  // Fallback seguro: filtrar excluyendo estrictamente la carta de presentación
  return Array.from(
    rootContainer.querySelectorAll<HTMLElement>('.quote-page')
  ).filter((p) => !p.classList.contains('presentation-letter-page'));
}

/**
 * Obtiene exclusivamente la página de la Carta de Presentación.
 */
function getLetterPages(rootContainer: HTMLElement): HTMLElement[] {
  return Array.from(
    rootContainer.querySelectorAll<HTMLElement>('.presentation-letter-page')
  );
}

/**
 * Estrategia 1: Dossier Conjunto (Cotización + Carta de presentación en 1 solo archivo).
 * Nombre: MYC_CC[N°].pdf (ej. MYC_CC111.pdf)
 */
export class JointDossierStrategy implements DocumentExportStrategy {
  readonly id: ExportStrategyId = 'joint';
  readonly label = 'Cotización Completa (1 Archivo)';
  readonly shortLabel = 'Descargar Cotización';
  readonly description = 'Cotización técnica y Carta de presentación unificadas en un único archivo.';
  readonly badge = '1 Solo PDF';

  async execute(context: ExportContext): Promise<ExportResult> {
    const quotePages = getQuotePages(context.rootContainer);
    const letterPages = getLetterPages(context.rootContainer);
    const allPages = [...quotePages, ...letterPages];

    const pdf = await compilePagesToPdf(allPages, context.html2canvas, context.jsPDF);
    const filename = buildExportFilename(context.quote, 'MYC_CC');

    pdf.save(filename);

    const message = `Cotización completa guardada como ${filename} (${allPages.length} páginas)`;
    context.onNotification?.(message);

    return {
      strategyId: this.id,
      filesCount: 1,
      filenames: [filename],
      message,
    };
  }
}

/**
 * Estrategia 2: Descarga Separada Simultánea (Genera los 2 PDFs independientes en 1 clic).
 * Nombres: Cotizacion_[N°].pdf y Carta_de_Presentacion_[N°].pdf
 */
export class SeparateBatchStrategy implements DocumentExportStrategy {
  readonly id: ExportStrategyId = 'separated';
  readonly label = 'Ambos como Archivos Separados';
  readonly shortLabel = 'Descargar Ambos (Separados)';
  readonly description = 'Genera los 2 archivos independientes en una sola acción sin hacer doble trabajo.';
  readonly badge = '2 PDFs en 1 Clic';

  async execute(context: ExportContext): Promise<ExportResult> {
    const quotePages = getQuotePages(context.rootContainer);
    const letterPages = getLetterPages(context.rootContainer);

    // 1. Generar y guardar Cotización
    const quoteFilename = buildExportFilename(context.quote, 'Cotizacion');
    const pdfQuote = await compilePagesToPdf(quotePages, context.html2canvas, context.jsPDF);
    pdfQuote.save(quoteFilename);

    // Pausa asíncrona de 350ms para garantizar que el navegador procese y acepte ambas descargas
    await new Promise((resolve) => setTimeout(resolve, 350));

    // 2. Generar y guardar Carta de Presentación
    const letterFilename = buildExportFilename(context.quote, 'Carta_de_Presentacion');
    const pdfLetter = await compilePagesToPdf(letterPages, context.html2canvas, context.jsPDF);
    pdfLetter.save(letterFilename);

    const message = `Archivos guardados: ${quoteFilename} y ${letterFilename}`;
    context.onNotification?.(message);

    return {
      strategyId: this.id,
      filesCount: 2,
      filenames: [quoteFilename, letterFilename],
      message,
    };
  }
}

/**
 * Estrategia 3: Solo Cotización Oficial de Obra.
 * Nombre: Cotizacion_[N°].pdf (ej. Cotizacion_111.pdf)
 */
export class QuoteOnlyStrategy implements DocumentExportStrategy {
  readonly id: ExportStrategyId = 'quote';
  readonly label = 'Solo Cotización';
  readonly shortLabel = 'Descargar Cotización (PDF)';
  readonly description = 'Presupuesto de tareas de obra civil, subtotal y desglose AIU.';

  async execute(context: ExportContext): Promise<ExportResult> {
    const quotePages = getQuotePages(context.rootContainer);
    const pdf = await compilePagesToPdf(quotePages, context.html2canvas, context.jsPDF);
    const filename = buildExportFilename(context.quote, 'Cotizacion');

    pdf.save(filename);

    const message = `Cotización guardada como ${filename} (${quotePages.length} páginas)`;
    context.onNotification?.(message);

    return {
      strategyId: this.id,
      filesCount: 1,
      filenames: [filename],
      message,
    };
  }
}

/**
 * Estrategia 4: Solo Carta de Presentación Formal.
 * Nombre: Carta_de_Presentacion_[N°].pdf (ej. Carta_de_Presentacion_111.pdf)
 */
export class LetterOnlyStrategy implements DocumentExportStrategy {
  readonly id: ExportStrategyId = 'letter';
  readonly label = 'Solo Carta de Presentación';
  readonly shortLabel = 'Descargar Carta (PDF)';
  readonly description = 'Propuesta formal A4 con saludo institucional y valor alfanumérico.';

  async execute(context: ExportContext): Promise<ExportResult> {
    const letterPages = getLetterPages(context.rootContainer);
    const pdf = await compilePagesToPdf(letterPages, context.html2canvas, context.jsPDF);
    const filename = buildExportFilename(context.quote, 'Carta_de_Presentacion');

    pdf.save(filename);

    const message = `Carta de presentación guardada como ${filename}`;
    context.onNotification?.(message);

    return {
      strategyId: this.id,
      filesCount: 1,
      filenames: [filename],
      message,
    };
  }
}

/**
 * Registro Central de Estrategias de Exportación (Strategy Registry).
 */
export class ExportStrategyRegistry {
  private strategies: Map<ExportStrategyId, DocumentExportStrategy> = new Map();

  constructor() {
    this.register(new QuoteOnlyStrategy());
    this.register(new LetterOnlyStrategy());
    this.register(new JointDossierStrategy());
    this.register(new SeparateBatchStrategy());
  }

  register(strategy: DocumentExportStrategy): void {
    this.strategies.set(strategy.id, strategy);
  }

  get(id: ExportStrategyId): DocumentExportStrategy {
    const strategy = this.strategies.get(id);
    if (!strategy) {
      return this.strategies.get('quote')!;
    }
    return strategy;
  }

  getAll(): DocumentExportStrategy[] {
    return Array.from(this.strategies.values());
  }
}

export const exportStrategyRegistry = new ExportStrategyRegistry();
