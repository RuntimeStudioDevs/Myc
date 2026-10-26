import { useState, useCallback, RefObject } from 'react';
import { QuoteData } from '../types/quote.types';

export function useQuotePdf(documentRef: RefObject<HTMLDivElement | null>) {
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const printDocument = useCallback(() => {
    window.print();
  }, []);

  const downloadPdf = useCallback(
    async (quote: QuoteData, onNotification?: (msg: string) => void) => {
      if (!documentRef.current) return;
      setIsExporting(true);

      try {
        const html2canvas = (await import('html2canvas')).default;
        const { jsPDF } = await import('jspdf');

        const element = documentRef.current;
        const prevTransform = element.style.transform;
        element.style.transform = 'none';

        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#FFFFFF',
        });

        element.style.transform = prevTransform;

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        });

        const imgWidth = 210;
        const pageHeight = 297;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, Math.min(imgHeight, pageHeight));

        const safeClient = (quote.clientName || 'Cliente').replace(/[^a-zA-Z0-9]/g, '_');
        const filename = `Cotizacion_${quote.code}_${quote.quoteNumber || '001'}_${safeClient}.pdf`;

        pdf.save(filename);
        onNotification?.(`Documento ${filename} descargado con éxito`);
      } catch (err) {
        console.error('Error generando PDF con html2canvas:', err);
        window.print();
      } finally {
        setIsExporting(false);
      }
    },
    [documentRef]
  );

  return {
    isExporting,
    printDocument,
    downloadPdf,
  };
}
