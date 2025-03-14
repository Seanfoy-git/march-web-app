import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import type { SOPMetadata, Step } from '@/types/sop';

/**
 * Creates and downloads a PDF for a SOP
 */
export const createAndDownloadSopPdf = (metadata: SOPMetadata, steps: Step[]) => {
  // Remove any alert dialogs during PDF generation
  // Instead of showing alerts, we'll handle everything silently

  // Create search params
  const metadataParam = encodeURIComponent(JSON.stringify(metadata));
  const stepsParam = encodeURIComponent(JSON.stringify(steps));

  // Create URL for the PDF view
  const url = `/pdf-view?metadata=${metadataParam}&steps=${stepsParam}`;

  // Open the PDF view in a new tab
  window.open(url, '_blank');
};

/**
 * Generates a PDF for a SOP using jsPDF
 * Note: This is an alternative method if the window.open approach doesn't work well
 */
export const generatePdfDirect = (metadata: SOPMetadata, steps: Step[]) => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(20);
  doc.text(metadata.title || 'Standard Operating Procedure', 105, 20, { align: 'center' });
  doc.setFontSize(16);
  doc.text('Work Instruction', 105, 30, { align: 'center' });
  
  // Add metadata
  doc.setFontSize(12);
  doc.text('Department: ' + (metadata.department || ''), 20, 50);
  doc.text('Version: ' + (metadata.version || '1.0'), 150, 50);
  doc.text('Operation: ' + metadata.title, 20, 60);
  
  // Add steps table
  const tableBody = steps.map((step, index) => [
    index + 1,
    step.title,
    step.description || '',
    step.symbolType || 'quality',
    step.reasonWhy || 'Ensure quality',
    step.imageUrl ? 'Image available' : 'No image'
  ]);
  
  (doc as any).autoTable({
    startY: 70,
    head: [['No.', 'Major Steps', 'Key Points', 'Symbol', 'Reasons', 'Pictures']],
    body: tableBody,
    theme: 'grid',
    styles: { fontSize: 10 },
    headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0] },
    columnStyles: {
      0: { cellWidth: 10 },
      5: { cellWidth: 25 }
    }
  });
  
  // Add footer
  const finalY = (doc as any).lastAutoTable.finalY || 200;
  doc.text('Approval Date: ' + (metadata.approvalDate || new Date().toISOString().split('T')[0]), 20, finalY + 20);
  doc.text('Prepared by: ' + (metadata.author || ''), 120, finalY + 20);
  
  // Download the PDF
  doc.save(`${metadata.title.replace(/\s+/g, '_')}_SOP.pdf`);
};