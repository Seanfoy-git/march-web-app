// src/utils/pdfUtils.ts
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { SOPMetadata, Step } from '@/types/sop';

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
  
  // Add header table
  const headerData = [
    [{ content: 'Operation: ' + metadata.title, colSpan: 3 }, 'Formular nr', metadata.id || '99934520'],
    [{ content: 'Line/Project', rowSpan: 2 }, 'Training room', 'Product name', 'Work station', 'Training room', 'Prepared by', metadata.author || 'SOP Author'],
    ['Cycle Time (s)', '11s', 'Supervision:', 'Leader', 'Checked', metadata.approver || ''],
    ['PROFILES (PARTS)', { content: 'Production materials (Tools)', colSpan: 3 }, 'Version', metadata.version || '1.0'],
    [{ content: 'The knot', colSpan: 2 }, { content: 'Knots', colSpan: 2 }, { content: 'Compound', colSpan: 2 }]
  ];

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
  
  // Add legend
  const legendY = doc.autoTable.previous.finalY + 5;
  
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
  
  // Main table with steps
  const columns = [
    { header: 'No.', dataKey: 'no', width: 15 },
    { header: 'Major steps (What)', dataKey: 'step', width: 50 },
    { header: 'Key points (How)', dataKey: 'keyPoints', width: 60 },
    { header: 'Symbol', dataKey: 'symbol', width: 15 },
    { header: 'Reasons for key points (Why)', dataKey: 'reasons', width: 60 },
    { header: 'Obligatory', dataKey: 'obligatory', width: 20 },
    { header: 'Pictures', dataKey: 'pictures', width: 40 }
  ];
  
  const rows = steps.map((step, index) => {
    // Determine which symbol to use
    let symbolCell = '';
    let symbolColor = '#000000';
    
    if (index % 3 === 0) {
      symbolCell = '●';
      symbolColor = '#FF0000'; // Red for quality
    } else if (index % 3 === 1) {
      symbolCell = '●';
      symbolColor = '#000000'; // Black for correctness
    } else {
      symbolCell = '✓';
      symbolColor = '#000000'; // Black checkmark for tip
    }
    
    // Format key points
    const keyPointsText = step.description 
      ? `1. ${step.description.substring(0, 200)}` 
      : `1. description for ${step.title}`;
    
    return {
      no: (index + 1).toString(),
      step: step.title,
      keyPoints: keyPointsText,
      symbol: { content: symbolCell, styles: { textColor: symbolColor, fontStyle: 'bold', halign: 'center' } },
      reasons: 'Ensure quality',
      obligatory: { content: '●', styles: { textColor: '#0000FF', fontStyle: 'bold', halign: 'center' } },
      pictures: { content: 'See step image in app', styles: { halign: 'center' } }
    };
  });
  
  // Create the main table
  doc.autoTable({
    startY: legendY + 10,
    head: [columns.map(col => col.header)],
    body: rows.map(row => {
      return columns.map(col => {
        const cell = row[col.dataKey];
        return cell;
      });
    }),
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
    },
    didDrawCell: (data) => {
      // If this is a pictures cell in the body, draw a placeholder
      if (data.column.dataKey === 'pictures' && data.row.section === 'body') {
        const cell = data.cell;
        const row = data.row.index;
        
        // Add reference number
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`${row + 1}.1`, cell.x + cell.width / 2, cell.y + 8, { align: 'center' });
      }
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