// src/utils/pdfUtils.ts
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { SOPMetadata, Step } from '@/types/sop';

/**
 * Creates a professional SOP PDF document with improved layout
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
  
  // Add header with title
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, 297, 20, 'F'); // Header background
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Work Instruction', 148.5, 12, { align: 'center' });
  
  // Add metadata table
  doc.setLineWidth(0.1);
  doc.setDrawColor(0);
  doc.setFillColor(255, 255, 255);
  
  // Top metadata section
  const headerTop = 20;
  
  // Main header sections
  doc.rect(10, headerTop, 150, 10, 'S'); // Operation
  doc.rect(160, headerTop, 65, 10, 'S'); // Formular nr
  doc.rect(225, headerTop, 62, 10, 'S'); // Formular value
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Operation: ${metadata.title}`, 12, headerTop + 7);
  doc.text('Formular nr', 162, headerTop + 7);
  doc.text(`${Date.now().toString().substring(0, 11)}`, 227, headerTop + 7);
  
  // Second row
  const row2 = headerTop + 10;
  doc.rect(10, row2, 150, 10, 'S'); // Blank
  doc.rect(160, row2, 65, 10, 'S'); // Prepared by
  doc.rect(225, row2, 62, 10, 'S'); // Prepared value
  
  doc.text('Prepared by', 162, row2 + 7);
  doc.text(metadata.author || '', 227, row2 + 7);
  
  // Third row
  const row3 = row2 + 10;
  doc.rect(10, row3, 150, 10, 'S'); // Blank
  doc.rect(160, row3, 65, 10, 'S'); // Checked
  doc.rect(225, row3, 62, 10, 'S'); // Checked value
  
  doc.text('Checked', 162, row3 + 7);
  doc.text(metadata.approver || '', 227, row3 + 7);
  
  // Fourth row
  const row4 = row3 + 10;
  doc.rect(10, row4, 150, 10, 'S'); // Blank 
  doc.rect(160, row4, 65, 10, 'S'); // Version
  doc.rect(225, row4, 62, 10, 'S'); // Version value
  
  doc.text('Version', 162, row4 + 7);
  doc.text(metadata.version || '1.0', 227, row4 + 7);
  
  // Create legend for symbols
  const legendTop = row4 + 15;
  doc.setFontSize(8);
  doc.text('Legend:', 225, legendTop);
  
  // Draw symbols and their meanings
  const symbolX = 230;
  const symbolY = legendTop + 10;
  const symbolSpacing = 15;
  
  // Quality symbol (red circle)
  doc.setFillColor(255, 0, 0);
  doc.circle(symbolX, symbolY, 3, 'F');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text('Quality', symbolX + 5, symbolY + 2);
  
  // Correctness symbol (black circle)
  doc.setFillColor(0, 0, 0);
  doc.circle(symbolX, symbolY + symbolSpacing, 3, 'F');
  doc.text('Correctness', symbolX + 5, symbolY + symbolSpacing + 2);
  
  // Tip symbol (checkmark)
  doc.setFillColor(0, 0, 0);
  doc.text('✓', symbolX - 1, symbolY + symbolSpacing * 2 + 2);
  doc.text('Tip', symbolX + 5, symbolY + symbolSpacing * 2 + 2);
  
  // Create table for steps
  const tableTop = row4 + 30;
  
  // Table headers
  doc.setFillColor(240, 240, 240);
  
  // Main table headers
  doc.rect(10, tableTop, 25, 10, 'FD'); // No.
  doc.rect(35, tableTop, 75, 10, 'FD'); // Major steps (What)
  doc.rect(110, tableTop, 25, 10, 'FD'); // Time (s)
  doc.rect(135, tableTop, 75, 10, 'FD'); // Key points (How)
  doc.rect(210, tableTop, 15, 10, 'FD'); // Symbols
  doc.rect(225, tableTop, 62, 10, 'FD'); // Pictures
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('No.', 12, tableTop + 6);
  doc.text('Major steps (What)', 37, tableTop + 6);
  doc.text('Time (s)', 112, tableTop + 6);
  doc.text('Key points (How)', 137, tableTop + 6);
  doc.text('Symbols', 212, tableTop + 6);
  doc.text('Pictures', 250, tableTop + 6, { align: 'center' });
  
  // Process each step
  let yPosition = tableTop + 10;
  const rowHeight = 30; // Each step row height
  
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const rowCount = Math.ceil((step.description?.length || 0) / 100) + 1; // Estimate rows needed
    const calculatedRowHeight = Math.max(rowHeight, rowCount * 10);
    
    // Check if we need a new page
    if (yPosition + calculatedRowHeight > 190) {
      doc.addPage('a4', 'landscape');
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Work Instruction (Continued)', 148.5, 10, { align: 'center' });
      yPosition = 25;
      
      // Add table headers on new page
      doc.setFillColor(240, 240, 240);
      
      // Main table headers
      doc.rect(10, yPosition, 25, 10, 'FD'); // No.
      doc.rect(35, yPosition, 75, 10, 'FD'); // Major steps (What)
      doc.rect(110, yPosition, 25, 10, 'FD'); // Time (s)
      doc.rect(135, yPosition, 75, 10, 'FD'); // Key points (How)
      doc.rect(210, yPosition, 15, 10, 'FD'); // Symbols
      doc.rect(225, yPosition, 62, 10, 'FD'); // Pictures
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('No.', 12, yPosition + 6);
      doc.text('Major steps (What)', 37, yPosition + 6);
      doc.text('Time (s)', 112, yPosition + 6);
      doc.text('Key points (How)', 137, yPosition + 6);
      doc.text('Symbols', 212, yPosition + 6);
      doc.text('Pictures', 250, yPosition + 6, { align: 'center' });
      
      yPosition += 10;
    }
    
    // Draw table cells for this step
    doc.rect(10, yPosition, 25, calculatedRowHeight, 'S'); // No.
    doc.rect(35, yPosition, 75, calculatedRowHeight, 'S'); // Major steps
    doc.rect(110, yPosition, 25, calculatedRowHeight, 'S'); // Time
    doc.rect(135, yPosition, 75, calculatedRowHeight, 'S'); // Key points
    doc.rect(210, yPosition, 15, calculatedRowHeight, 'S'); // Symbol
    doc.rect(225, yPosition, 62, calculatedRowHeight, 'S'); // Pictures
    
    // Fill in step data
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Step number
    doc.text(`${i + 1}`, 22, yPosition + 15, { align: 'center' });
    
    // Step title
    doc.setFont('helvetica', 'bold');
    doc.text(step.title, 37, yPosition + 10);
    doc.setFont('helvetica', 'normal');
    
    // Add a placeholder time value
    doc.text(`${Math.floor(Math.random() * 5) + 1}`, 122, yPosition + 15, { align: 'center' });
    
    // Step description (as key points)
    if (step.description) {
      const keyPoints = step.description.split('\n').filter(line => line.trim().length > 0);
      let keyPointY = yPosition + 10;
      
      keyPoints.forEach((point, idx) => {
        const pointNumber = idx + 1;
        const splitPoint = doc.splitTextToSize(`${pointNumber}. ${point}`, 70);
        doc.text(splitPoint, 137, keyPointY);
        keyPointY += splitPoint.length * 8;
      });
    } else {
      doc.text('1. Follow the procedure carefully', 137, yPosition + 10);
    }
    
    // Add a symbol depending on the step number
    const symbols = ['○', '●', '✓'];
    const symbolIndex = i % symbols.length;
    
    if (symbolIndex === 0) {
      // Quality symbol (red circle)
      doc.setFillColor(255, 0, 0);
      doc.circle(217, yPosition + 15, 3, 'F');
    } else if (symbolIndex === 1) {
      // Correctness symbol (black circle)
      doc.setFillColor(0, 0, 0);
      doc.circle(217, yPosition + 15, 3, 'F');
    } else {
      // Tip symbol (checkmark)
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.text('✓', 217, yPosition + 15, { align: 'center' });
      doc.setFontSize(10);
    }
    doc.setTextColor(0, 0, 0);
    
    // Add reference to image
    if (step.imageUrl) {
      const stepId = `${i+1}.${Math.floor(Math.random() * 3) + 1}`;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(stepId, 250, yPosition + 15, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('[See step image in app]', 250, yPosition + 25, { align: 'center' });
    }
    
    yPosition += calculatedRowHeight;
  }
  
  // Add footer with approval date only if provided
  if (metadata.approvalDate) {
    const footerTop = Math.min(yPosition + 10, 190);
    
    doc.rect(10, footerTop, 60, 10, 'S');
    doc.rect(70, footerTop, 60, 10, 'S');
    
    doc.setFontSize(8);
    doc.text('Approval Date', 11, footerTop + 5);
    doc.text(metadata.approvalDate, 71, footerTop + 5);
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