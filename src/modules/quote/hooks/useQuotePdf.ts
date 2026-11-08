import { useState, useCallback, RefObject } from 'react';
import { QuoteData } from '../types/quote.types';
import {
  ExportStrategyId,
  ExportResult,
} from '../services/export-strategies/export-strategy.interface';
import { exportStrategyRegistry } from '../services/export-strategies/export-strategies';

export type ExportDocumentMode = ExportStrategyId;

export function useQuotePdf(
  documentRef: RefObject<HTMLDivElement | null>,
  vaultRef?: RefObject<HTMLDivElement | null>
) {
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const printDocument = useCallback(() => {
    window.print();
  }, []);

  const downloadPdf = useCallback(
    async (
      quote: QuoteData,
      mode: ExportDocumentMode = 'joint',
      onNotification?: (msg: string) => void
    ): Promise<ExportResult | undefined> => {
      const rootContainer = vaultRef?.current || documentRef.current;
      if (!rootContainer) return;

      setIsExporting(true);

      try {
        const html2canvas = (await import('html2canvas')).default;
        const { jsPDF } = await import('jspdf');

        const prevTransform = rootContainer.style.transform;
        rootContainer.style.transform = 'none';

        const strategy = exportStrategyRegistry.get(mode);
        const result = await strategy.execute({
          quote,
          rootContainer,
          html2canvas,
          jsPDF,
          onNotification,
        });

        rootContainer.style.transform = prevTransform;
        return result;
      } catch (err) {
        console.error('Error ejecutando estrategia de exportación PDF:', err);
        onNotification?.('Error al generar el PDF. Intenta nuevamente.');
      } finally {
        setIsExporting(false);
      }
    },
    [documentRef, vaultRef]
  );

  return {
    isExporting,
    printDocument,
    downloadPdf,
  };
}
