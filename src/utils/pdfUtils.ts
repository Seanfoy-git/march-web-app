// src/utils/pdfUtils.ts
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { SOPMetadata, Step } from '@/types/sop';

// Define types for jspdf-autotable
interface AutoTableOptions {
  startY?: number;
  head?: unknown[][];
  body: unknown[][];
  theme?: string;
  tableWidth?: number | string;
  margin?: { left: number; right: number };
  styles?: Record<string, unknown>;
  columnStyles?: Record<string, unknown>;
  didDrawCell?: (data: { column: { dataKey: string }; row: { index: number; section: string }; cell: { x: number; y: number; width: number; height: number } }) => void;
}

// Add autoTable to jsPDF type
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: AutoTableOptions) => { finalY: number };
    lastAutoTable?: { finalY: number };
  }
}

/**
 * Creates a professional SOP PDF document with proper layout
 * @param metadata SOP metadata information
 * @param steps SOP steps with descriptions and images
 * @returns Promise resolved when PDF is generated and downloaded
 */
export const generateSOPPdf = async (metadata: SOPMetadata, steps: Step[]): Promise<void> => {
  if (!metadata.title) {
    throw new Error('SOP title is required');
  }
  
  if (steps.length === 0) {
    throw new Error('At least one step is required');
  }
  
  // Create new jsPDF instance in landscape mode
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  const usableWidth = pageWidth - (margin * 2);
  
  // Add border around page
  doc.setLineWidth(0.5);
  doc.rect(margin, margin, usableWidth, pageHeight - (margin * 2));
  
  // Title section
  doc.setLineWidth(0.1);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Work Instruction', pageWidth / 2, margin + 8, { align: 'center' });
  
  // Generate a formular number
  const formularNr = Date.now().toString().substring(5, 13);
  
  // Add header table
  const headerData = [
    [{ content: 'Operation: ' + metadata.title, colSpan: 3 }, 'Formular nr', formularNr],
    [{ content: 'Line/Project', rowSpan: 2 }, 'Training room', 'Product name', 'Work station', 'Training room', 'Prepared by', metadata.author || 'SOP Author'],
    ['Cycle Time (s)', '11s', 'Supervision:', 'Leader', 'Checked', metadata.approver || ''],
    ['PROFILES (PARTS)', { content: 'Production materials (Tools)', colSpan: 3 }, 'Version', metadata.version || '1.0'],
    [{ content: 'The knot', colSpan: 2 }, { content: 'Knots', colSpan: 2 }, { content: 'Compound', colSpan: 2 }]
  ];

  // Create the header table
  doc.autoTable({
    startY: margin + 12,
    head: [],
    body: headerData,
    theme: 'plain',
    tableWidth: usableWidth,
    margin: { left: margin, right: margin },
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: usableWidth * 0.15 },
      1: { cellWidth: usableWidth * 0.15 },
      2: { cellWidth: usableWidth * 0.15 },
      3: { cellWidth: usableWidth * 0.15 },
      4: { cellWidth: usableWidth * 0.15 },
      5: { cellWidth: usableWidth * 0.15 },
      6: { cellWidth: usableWidth * 0.10 }
    }
  });
  
  // Add legend section
  const lastY = doc.lastAutoTable?.finalY || (margin + 45);
  const legendY = lastY + 5;
  
  doc.setFontSize(9);
  doc.text('Legend:', margin + 5, legendY + 5);
  
  // Draw symbols and their meanings
  doc.setFontSize(8);
  
  // Hazard symbol (green square with plus)
  doc.setFillColor(0, 180, 0);
  doc.rect(margin + 40, legendY + 2, 6, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.text('+', margin + 43, legendY + 6);
  doc.setTextColor(0, 0, 0);
  doc.text('Hazard', margin + 48, legendY + 6);
  
  // Quality symbol (red circle)
  doc.setFillColor(255, 0, 0);
  doc.circle(margin + 70, legendY + 5, 3, 'F');
  doc.text('Quality', margin + 75, legendY + 6);
  
  // Tip symbol (checkmark)
  doc.text('✓', margin + 98, legendY + 6);
  doc.text('Tip', margin + 103, legendY + 6);
  
  // Correctness symbol (black circle)
  doc.setFillColor(0, 0, 0);
  doc.circle(margin + 120, legendY + 5, 3, 'F');
  doc.text('Correctness', margin + 125, legendY + 6);
  
  // Main table with steps - using arrays directly for better type safety
  const rows: unknown[][] = steps.map((step, index) => {
    // Format key points
    const keyPointsText = step.description 
      ? `1. ${step.description.substring(0, 200)}` 
      : `1. description for ${step.title}`;
    
    // Determine which symbol to use based on step index (alternating)
    const symbolCode = index % 3 === 0 ? '●' : (index % 3 === 1 ? '●' : '✓');
    const symbolColor = index % 3 === 0 ? '#FF0000' : '#000000';
    
    return [
      (index + 1).toString(),
      step.title,
      keyPointsText,
      { content: symbolCode, styles: { textColor: symbolColor, fontStyle: 'bold', halign: 'center' } },
      'Ensure quality',
      { content: '●', styles: { textColor: '#0000FF', fontStyle: 'bold', halign: 'center' } },
      { content: `${index + 1}.1\n[See step image in app]`, styles: { halign: 'center' } }
    ];
  });
  
  // Create the main table
  doc.autoTable({
    startY: legendY + 10,
    head: [['No.', 'Major steps (What)', 'Key points (How)', 'Symbol', 'Reasons for key points (Why)', 'Obligatory', 'Pictures']],
    body: rows,
    theme: 'grid',
    tableWidth: usableWidth,
    margin: { left: margin, right: margin },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 15 }, // No.
      1: { cellWidth: 50 }, // Major steps
      2: { cellWidth: 60 }, // Key points
      3: { cellWidth: 15 }, // Symbol
      4: { cellWidth: 60 }, // Reasons
      5: { cellWidth: 20 }, // Obligatory
      6: { cellWidth: 40 }  // Pictures
    }
  });
  
  // Save the PDF
  doc.save(`${metadata.title.replace(/\s+/g, '_')}_SOP.pdf`);
};

/**
 * Wrapper function that handles error management and UI interactions
 */
export const createAndDownloadSopPdf = async (metadata: SOPMetadata, steps: Step[]): Promise<void> => {
  try {
    console.log("PDF Generation - Metadata:", JSON.stringify(metadata));
    console.log("PDF Generation - Steps:", JSON.stringify(steps.map(s => ({
      title: s.title,
      hasDescription: !!s.description,
      hasImage: !!s.imageUrl
    }))));
    
    // Show loading indicator
    alert("Starting PDF generation. This may take a moment...");
    
    // Generate the PDF
    await generateSOPPdf(metadata, steps);
    
    // Success message
    alert("PDF generated successfully! Note: To view images, please refer to the SOP in the app.");
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};