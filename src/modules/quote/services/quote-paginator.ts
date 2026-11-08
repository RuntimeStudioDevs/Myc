import { QuoteItem } from '../types/quote.types';

export interface QuotePageData {
  pageIndex: number;
  pageNumber: number;
  totalPages: number;
  isFirstPage: boolean;
  isLastPage: boolean;
  items: QuoteItem[];
  startIndex: number;
  showFooter: boolean;
}

// Altura disponible en píxeles (basada en el marco A4 de 1123px @ 96DPI)
// 510px permite que las descripciones lleguen hasta justo encima del bloque de notas y subtotal (con encabezado ampliado de 116px)
const PAGE_1_MAX_ITEMS_HEIGHT_WITH_FOOTER = 510;
const PAGE_1_MAX_ITEMS_HEIGHT_WITHOUT_FOOTER = 750;
const PAGE_2_MAX_ITEMS_HEIGHT_WITH_FOOTER = 560;
const PAGE_N_MAX_ITEMS_HEIGHT_WITHOUT_FOOTER = 850;

/**
 * Estima la altura en píxeles que ocupa una tarea en la tabla.
 * Soporta tanto string directo como objeto QuoteItem (con título y descripción).
 */
export function estimateItemHeight(itemOrDesc: QuoteItem | string): number {
  const lineLength = 52; // Caracteres estimados por línea en la columna del 75%
  let title = '';
  let description = '';

  if (typeof itemOrDesc === 'string') {
    description = itemOrDesc;
  } else if (itemOrDesc) {
    title = itemOrDesc.title || '';
    description = itemOrDesc.description || '';
  }

  let totalLines = 0;
  if (title.trim()) {
    const titleLines = title.trim().split('\n');
    for (const line of titleLines) {
      totalLines += Math.max(1, Math.ceil(line.length / lineLength));
    }
  }

  const text = (description || '').trim() || (title.trim() ? '' : '(DESCRIPCION DEL PROYECTO)');
  if (text) {
    const lines = text.split('\n');
    for (const line of lines) {
      totalLines += Math.max(1, Math.ceil(line.length / lineLength));
    }
  }

  // 14px de margen entre filas + 18px por línea de texto + 4px extra si tiene título y descripción
  const extraSpacing = title.trim() && description.trim() ? 6 : 0;
  return 14 + totalLines * 18 + extraSpacing;
}

/**
 * Divide la lista de tareas en páginas A4 según la altura disponible.
 */
export function paginateQuoteItems(items: QuoteItem[]): QuotePageData[] {
  // Caso 1: Sin tareas o lista vacía
  if (!items || items.length === 0) {
    return [
      {
        pageIndex: 0,
        pageNumber: 1,
        totalPages: 1,
        isFirstPage: true,
        isLastPage: true,
        items: [],
        startIndex: 0,
        showFooter: true,
      },
    ];
  }

  // Medir altura de cada item
  const itemHeights = items.map((item) => estimateItemHeight(item));
  const totalItemsHeight = itemHeights.reduce((acc, h) => acc + h, 0);

  // Caso 2: Todo cabe en 1 sola hoja A4 hasta la línea roja (hasta ~12-14 tareas)
  if (totalItemsHeight <= PAGE_1_MAX_ITEMS_HEIGHT_WITH_FOOTER) {
    return [
      {
        pageIndex: 0,
        pageNumber: 1,
        totalPages: 1,
        isFirstPage: true,
        isLastPage: true,
        items,
        startIndex: 0,
        showFooter: true,
      },
    ];
  }

  // Caso 3: Supera la capacidad de 1 página con footer -> Requiere paginación multi-página
  const pages: { items: QuoteItem[]; startIndex: number; showFooter: boolean }[] = [];
  let currentIndex = 0;
  let pageIndex = 0;

  while (currentIndex < items.length) {
    const isFirst = pageIndex === 0;
    const pageItems: QuoteItem[] = [];
    const startIndex = currentIndex;
    let currentHeight = 0;

    if (isFirst) {
      // Página 1: Se llena de forma fija y monótona hasta la capacidad máxima con footer (510px).
      // Esto fija la Página 1 de manera estable, evitando saltos erráticos y garantizando
      // que las nuevas tareas se agreguen de forma continua en la Página 2 ("vaya bajando").
      while (currentIndex < items.length) {
        const h = itemHeights[currentIndex];
        if (currentHeight + h > PAGE_1_MAX_ITEMS_HEIGHT_WITH_FOOTER && pageItems.length > 0) {
          break;
        }
        currentHeight += h;
        pageItems.push(items[currentIndex]);
        currentIndex++;
      }

      pages.push({
        items: pageItems,
        startIndex,
        showFooter: false,
      });
    } else {
      // Páginas subsecuentes (Página 2 en adelante)
      const remainingHeights = itemHeights.slice(currentIndex).reduce((a, b) => a + b, 0);
      const fitsWithFooterOnThisPage = remainingHeights <= PAGE_2_MAX_ITEMS_HEIGHT_WITH_FOOTER;

      if (fitsWithFooterOnThisPage) {
        // Todos los items restantes caben con el footer en esta página
        while (currentIndex < items.length) {
          pageItems.push(items[currentIndex]);
          currentIndex++;
        }
        pages.push({
          items: pageItems,
          startIndex,
          showFooter: true,
        });
      } else {
        // No caben todos con el footer; llenamos esta página sin footer
        while (currentIndex < items.length) {
          const h = itemHeights[currentIndex];
          if (currentHeight + h > PAGE_N_MAX_ITEMS_HEIGHT_WITHOUT_FOOTER && pageItems.length > 0) {
            break;
          }
          currentHeight += h;
          pageItems.push(items[currentIndex]);
          currentIndex++;
        }
        pages.push({
          items: pageItems,
          startIndex,
          showFooter: false,
        });
      }
    }

    pageIndex++;
  }

  // Asegurar que la última página siempre tenga showFooter = true
  if (pages.length > 0) {
    pages[pages.length - 1].showFooter = true;
  }

  const totalPages = pages.length;

  return pages.map((p, idx) => ({
    pageIndex: idx,
    pageNumber: idx + 1,
    totalPages,
    isFirstPage: idx === 0,
    isLastPage: idx === totalPages - 1,
    items: p.items,
    startIndex: p.startIndex,
    showFooter: p.showFooter,
  }));
}
