// src/utils/pdfUtils.ts
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { SOPMetadata, Step } from '@/types/sop';

/**
 * Creates a professional SOP PDF document that matches the example layout
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
  
  // Add header with title - matching example exactly
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, 297, 20, 'F'); // Header background
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Work Instruction', 148.5, 12, { align: 'center' });
  
  // Add main border around entire document
  doc.setLineWidth(0.5);
  doc.rect(10, 10, 277, 190, 'S');
  
  // Reset line width for tables
  doc.setLineWidth(0.1);
  
  // Add top section
  // First row
  doc.rect(10, 10, 40, 16, 'S'); // Company logo left
  doc.rect(50, 10, 168, 16, 'S'); // Title centered
  doc.rect(218, 10, 35, 8, 'S'); // Formular nr
  doc.rect(253, 10, 34, 8, 'S'); // Formular value
  
  // Second row below the title
  doc.rect(218, 18, 35, 8, 'S'); // Prepared by
  doc.rect(253, 18, 34, 8, 'S'); // Prepared value
  
  // Text in top section
  doc.setFontSize(8);
  doc.text('Formular nr', 220, 15);
  doc.text(Date.now().toString().substring(5, 15), 255, 15);
  doc.text('Prepared by', 220, 23);
  doc.text(metadata.author || '', 255, 23);
  
  // Third row
  doc.rect(10, 26, 40, 8, 'S'); // Line/Project
  doc.rect(50, 26, 35, 16, 'S'); // Training room
  doc.rect(85, 26, 30, 8, 'S'); // Product name
  doc.rect(115, 26, 50, 8, 'S'); // Product value
  doc.rect(165, 26, 30, 8, 'S'); // Work station
  doc.rect(195, 26, 35, 8, 'S'); // Station value
  doc.rect(230, 26, 23, 8, 'S'); // Checked
  doc.rect(253, 26, 34, 8, 'S'); // Checked value
  
  // Fourth row
  doc.rect(85, 34, 30, 8, 'S'); // Cycle
  doc.rect(115, 34, 20, 8, 'S'); // Cycle value
  doc.rect(135, 34, 30, 8, 'S'); // Time sec
  doc.rect(165, 34, 20, 8, 'S'); // Time value
  doc.rect(185, 34, 45, 8, 'S'); // Supervision
  doc.rect(230, 34, 23, 8, 'S'); // Version
  doc.rect(253, 34, 34, 8, 'S'); // Version value
  
  // Text in middle sections
  doc.text('Line/Project', 12, 31);
  doc.text('Training room', 52, 31);
  doc.text('Product name', 87, 31);
  doc.text(`Operation: ${metadata.title}`, 117, 31);
  doc.text('Work station', 167, 31);
  doc.text('Training room', 197, 31);
  doc.text('Checked', 232, 31);
  doc.text(metadata.approver || '', 255, 31);
  
  doc.text('Cycle Time (s)', 87, 39);
  doc.text('11s', 120, 39);
  doc.text('Supervision:', 187, 39);
  doc.text('Leader', 215, 39);
  doc.text('Version', 232, 39);
  doc.text(metadata.version || '1.0', 255, 39);
  
  // Materials row
  doc.rect(10, 42, 40, 8, 'S'); // Profiles (Parts)
  doc.rect(50, 42, 158, 8, 'S'); // Production materials
  doc.rect(208, 42, 79, 8, 'S'); // Compound
  
  doc.text('PROFILES (PARTS)', 18, 47);
  doc.text('Production materials (Tools)', 118, 47);
  doc.text('Compound', 248, 47);
  
  // Second materials row
  doc.rect(10, 50, 147, 16, 'S'); // The knot
  doc.rect(157, 50, 50, 16, 'S'); // Knots
  doc.rect(207, 50, 80, 16, 'S'); // n/a
  
  doc.text('The knot', 80, 58);
  doc.text('Knots', 182, 58);
  doc.text('n/a', 247, 58);
  
  // Legend section
  doc.rect(10, 66, 277, 20, 'S');
  doc.setFontSize(7);
  doc.text('Legend', 832, 71);
  
  // Legend symbols
  doc.setFontSize(9);
  // Hazard symbol (green plus)
  doc.setFillColor(0, 200, 0);
  doc.rect(228, 70, 8, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.text('+', 232, 75, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  doc.text('Hazard', 245, 75);
  
  // Quality symbol (red circle)
  doc.setFillColor(255, 0, 0);
  doc.circle(232, 80, 4, 'F');
  doc.text('Quality', 245, 80);
  
  // Tip symbol (checkmark)
  doc.text('✓', 232, 85);
  doc.text('Tip', 245, 85);
  
  // Correctness symbol (black dot)
  doc.setFillColor(0, 0, 0);
  doc.circle(232, 90, 4, 'F');
  doc.text('Correctness', 245, 90);
  
  // Main table headers
  const tableTop = 86;
  
  // Table header cells
  doc.rect(10, tableTop, 30, 12, 'S'); // No.
  doc.rect(40, tableTop, 80, 12, 'S'); // Major steps (What)
  doc.rect(120, tableTop, 20, 12, 'S'); // Time (s)
  doc.rect(140, tableTop, 80, 12, 'S'); // Key points (How)
  doc.rect(220, tableTop, 15, 12, 'S'); // Symbols
  doc.rect(235, tableTop, 125, 12, 'S'); // Reasons for key points (Why)
  doc.rect(260, tableTop, 27, 12, 'S'); // Obligatory/forbidden
  doc.rect(287, tableTop, 40, 12, 'S'); // Pictures
  
  // Table header text
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('No.:', 12, tableTop + 7);
  doc.text('Major steps (What)', 45, tableTop + 7);
  doc.text('Time (s)', 122, tableTop + 7);
  doc.text('Key points (How)', 142, tableTop + 7);
  doc.text('Symbols', 221, tableTop + 7);
  doc.text('Reasons for key points (Why)', 237, tableTop + 7);
  doc.text('Obligatory / Forbidden', 261, tableTop + 7);
  doc.text('Pictures', 295, tableTop + 7, { align: 'center' });
  
  // Process each step
  let yPosition = tableTop + 12;
  const rowHeight = Math.max(30, 20 + (steps.length * 10)); // Larger rows
  
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const keyPoints = step.description ? step.description.split('\n').filter(Boolean) : [];
    const numKeyPoints = Math.max(1, keyPoints.length);
    const calculatedRowHeight = Math.max(rowHeight, numKeyPoints * 25);
    
    // Check if we need a new page
    if (yPosition + calculatedRowHeight > 180) {
      doc.addPage('a4', 'landscape');
      doc.setLineWidth(0.5);
      doc.rect(10, 10, 277, 190, 'S'); // Main border
      doc.setLineWidth(0.1);
      
      // Reset headers
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Work Instruction (Continued)', 148.5, 20, { align: 'center' });
      
      // Add table headers on new page
      const newTableTop = 30;
      doc.setFontSize(9);
      doc.rect(10, newTableTop, 30, 12, 'S'); // No.
      doc.rect(40, newTableTop, 80, 12, 'S'); // Major steps (What)
      doc.rect(120, newTableTop, 20, 12, 'S'); // Time (s)
      doc.rect(140, newTableTop, 80, 12, 'S'); // Key points (How)
      doc.rect(220, newTableTop, 15, 12, 'S'); // Symbols
      doc.rect(235, newTableTop, 125, 12, 'S'); // Reasons for key points (Why)
      doc.rect(260, tableTop, 27, 12, 'S'); // Obligatory/forbidden
      doc.rect(287, newTableTop, 40, 12, 'S'); // Pictures
      
      doc.text('No.:', 12, newTableTop + 7);
      doc.text('Major steps (What)', 45, newTableTop + 7);
      doc.text('Time (s)', 122, newTableTop + 7);
      doc.text('Key points (How)', 142, newTableTop + 7);
      doc.text('Symbols', 221, newTableTop + 7);
      doc.text('Reasons for key points (Why)', 237, newTableTop + 7);
      doc.text('Obligatory / Forbidden', 261, newTableTop + 7);
      doc.text('Pictures', 295, newTableTop + 7, { align: 'center' });
      
      yPosition = newTableTop + 12;
    }
    
    // Draw main step row cells
    doc.rect(10, yPosition, 30, calculatedRowHeight, 'S'); // No.
    doc.rect(40, yPosition, 80, calculatedRowHeight, 'S'); // Major steps
    doc.rect(120, yPosition, 20, calculatedRowHeight, 'S'); // Time
    doc.rect(140, yPosition, 80, calculatedRowHeight, 'S'); // Key points
    doc.rect(220, yPosition, 15, calculatedRowHeight, 'S'); // Symbol
    doc.rect(235, yPosition, 25, calculatedRowHeight, 'S'); // Reasons for key points
    doc.rect(260, yPosition, 27, calculatedRowHeight, 'S'); // Obligatory/forbidden
    doc.rect(287, yPosition, 40, calculatedRowHeight, 'S'); // Pictures
    
    // Fill in step data
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Step number
    doc.text(`${i + 1}`, 20, yPosition + 15, { align: 'center' });
    
    // Major step title
    doc.setFont('helvetica', 'bold');
    doc.text(step.title, 42, yPosition + 15);
    doc.setFont('helvetica', 'normal');
    
    // Time
    doc.text((i + 1).toString(), 130, yPosition + 15, { align: 'center' });
    
    // Key points
    let keyPointY = yPosition + 15;
    if (keyPoints.length > 0) {
      keyPoints.forEach((point, idx) => {
        doc.text(`${idx + 1}. ${point}`, 142, keyPointY);
        keyPointY += 10;
      });
    } else {
      doc.text("1. Follow procedure", 142, keyPointY);
    }
    
    // Symbol (alternating between quality, correctness and tip)
    const symbolType = i % 3;
    if (symbolType === 0) {
      // Quality symbol (red circle)
      doc.setFillColor(255, 0, 0);
      doc.circle(227, yPosition + 15, 4, 'F');
    } else if (symbolType === 1) {
      // Correctness symbol (black circle)
      doc.setFillColor(0, 0, 0);
      doc.circle(227, yPosition + 15, 4, 'F');
    } else {
      // Tip symbol (checkmark)
      doc.setTextColor(0, 0, 0);
      doc.text('✓', 227, yPosition + 15, { align: 'center' });
    }
    doc.setTextColor(0, 0, 0);
    
    // Reason for key points - simple placeholder
    doc.text("Ensure quality", 237, yPosition + 15);
    
    // Obligatory/Forbidden - if available, add symbol
    if (i % 2 === 0) {
      doc.setFillColor(0, 0, 255);
      doc.circle(273, yPosition + 15, 5, 'F');
    }
    
    // Pictures - show reference numbers and placeholders
    if (step.imageUrl) {
      const stepId = `${i+1}.${Math.floor(Math.random() * 2) + 1}`;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(stepId, 307, yPosition + 15, { align: 'center' });
      
      // Add a placeholder box for the image
      doc.rect(292, yPosition + 20, 30, 20, 'S');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('[See step image in app]', 307, yPosition + 32, { align: 'center' });
    }
    
    yPosition += calculatedRowHeight;
  }
  
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