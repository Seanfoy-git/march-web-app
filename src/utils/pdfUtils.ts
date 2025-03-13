// src/utils/pdfUtils.ts
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { SOPMetadata, Step } from '@/types/sop';

/**
 * Creates a professional SOP PDF document
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
  
  // Add header
  doc.setFillColor(240, 240, 240);
  doc.rect(0, 0, 297, 20, 'F'); // Header background
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Standard Work Instruction', 148.5, 10, { align: 'center' });
  
  // Add company logo or name
  doc.setFontSize(18);
  doc.setTextColor(41, 128, 185);
  doc.setFont('helvetica', 'bold');
  doc.text('eTWI', 15, 10);
  
  // Add metadata table
  doc.setLineWidth(0.1);
  doc.setDrawColor(0);
  doc.setFillColor(255, 255, 255);
  
  // Top row of metadata
  const metadataTop = 25;
  doc.rect(10, metadataTop, 45, 10, 'S'); // Template No.
  doc.rect(55, metadataTop, 45, 10, 'S'); // Department
  doc.rect(100, metadataTop, 60, 10, 'S'); // Area
  doc.rect(160, metadataTop, 50, 10, 'S'); // Operation
  doc.rect(210, metadataTop, 40, 10, 'S'); // Instruction no.
  doc.rect(250, metadataTop, 15, 10, 'S'); // Version
  doc.rect(265, metadataTop, 22, 10, 'S'); // Page Number
  
  // Headers for metadata
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Template No.:', 11, metadataTop + 5);
  doc.text('Department', 56, metadataTop + 5);
  doc.text('Area', 101, metadataTop + 5);
  doc.text('Operation', 161, metadataTop + 5);
  doc.text('Instruction no.:', 211, metadataTop + 5);
  doc.text('Version', 251, metadataTop + 5);
  doc.text('Page Number', 266, metadataTop + 5);
  
  // Values for metadata
  const metadataValues = metadataTop + 15;
  doc.rect(10, metadataValues, 45, 10, 'S');
  doc.rect(55, metadataValues, 45, 10, 'S');
  doc.rect(100, metadataValues, 60, 10, 'S');
  doc.rect(160, metadataValues, 50, 10, 'S');
  doc.rect(210, metadataValues, 40, 10, 'S');
  doc.rect(250, metadataValues, 15, 10, 'S');
  doc.rect(265, metadataValues, 22, 10, 'S');
  
  doc.setFontSize(10);
  // Fill in metadata values
  doc.text(`SOP_${metadata.title.substring(0, 10)}`, 11, metadataValues + 5);
  doc.text(metadata.department || 'Department', 56, metadataValues + 5);
  doc.text('Production', 101, metadataValues + 5);
  doc.text(metadata.title.substring(0, 20), 161, metadataValues + 5);
  doc.text(`SOP_${Date.now().toString().substring(8, 13)}`, 211, metadataValues + 5);
  doc.text(metadata.version || '1.0', 251, metadataValues + 5);
  doc.text('1/1', 266, metadataValues + 5);
  
  // Create table for steps
  const tableTop = metadataValues + 15;
  
  // Table headers
  doc.setFillColor(240, 240, 240);
  doc.rect(10, tableTop, 55, 10, 'FD'); // Pictures
  doc.rect(65, tableTop, 15, 10, 'FD'); // No.
  doc.rect(80, tableTop, 80, 10, 'FD'); // Important steps
  doc.rect(160, tableTop, 15, 10, 'FD'); // No.
  doc.rect(175, tableTop, 50, 10, 'FD'); // Key points
  doc.rect(225, tableTop, 20, 10, 'FD'); // Symbol
  doc.rect(245, tableTop, 42, 10, 'FD'); // Reason
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Pictures', 35, tableTop + 6, { align: 'center' });
  doc.text('No.', 72, tableTop + 6, { align: 'center' });
  doc.text('Important steps', 120, tableTop + 6, { align: 'center' });
  doc.text('No.', 167, tableTop + 6, { align: 'center' });
  doc.text('Key points', 200, tableTop + 6, { align: 'center' });
  doc.text('Symbol', 235, tableTop + 6, { align: 'center' });
  doc.text('Reason', 266, tableTop + 6, { align: 'center' });
  
  // Second row of headers
  const subHeaderTop = tableTop + 10;
  doc.rect(10, subHeaderTop, 55, 10, 'S');
  doc.rect(65, subHeaderTop, 15, 10, 'S');
  doc.rect(80, subHeaderTop, 80, 10, 'S');
  doc.rect(160, subHeaderTop, 15, 10, 'S');
  doc.rect(175, subHeaderTop, 50, 10, 'S');
  doc.rect(225, subHeaderTop, 20, 10, 'S');
  doc.rect(245, subHeaderTop, 42, 10, 'S');
  
  doc.setFont('helvetica', 'normal');
  doc.text('What?', 35, subHeaderTop + 6, { align: 'center' });
  doc.text('How?', 200, subHeaderTop + 6, { align: 'center' });
  doc.text('Why?', 266, subHeaderTop + 6, { align: 'center' });
  
  // Process each step
  let yPosition = subHeaderTop + 10;
  const rowHeight = 30; // Each step row height
  
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    
    // Check if we need a new page
    if (yPosition + rowHeight > 200) {
      doc.addPage('a4', 'landscape');
      doc.setFillColor(240, 240, 240);
      doc.rect(0, 0, 297, 20, 'F'); // Header background
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Standard Work Instruction (Continued)', 148.5, 10, { align: 'center' });
      yPosition = 25;
      
      // Add table headers on new page
      doc.setFillColor(240, 240, 240);
      doc.rect(10, yPosition, 55, 10, 'FD');
      doc.rect(65, yPosition, 15, 10, 'FD');
      doc.rect(80, yPosition, 80, 10, 'FD');
      doc.rect(160, yPosition, 15, 10, 'FD');
      doc.rect(175, yPosition, 50, 10, 'FD');
      doc.rect(225, yPosition, 20, 10, 'FD');
      doc.rect(245, yPosition, 42, 10, 'FD');
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Pictures', 35, yPosition + 6, { align: 'center' });
      doc.text('No.', 72, yPosition + 6, { align: 'center' });
      doc.text('Important steps', 120, yPosition + 6, { align: 'center' });
      doc.text('No.', 167, yPosition + 6, { align: 'center' });
      doc.text('Key points', 200, yPosition + 6, { align: 'center' });
      doc.text('Symbol', 235, yPosition + 6, { align: 'center' });
      doc.text('Reason', 266, yPosition + 6, { align: 'center' });
      
      yPosition += 10;
    }
    
    // Draw table cells for this step
    doc.rect(10, yPosition, 55, rowHeight, 'S'); // Pictures
    doc.rect(65, yPosition, 15, rowHeight, 'S'); // No.
    doc.rect(80, yPosition, 80, rowHeight, 'S'); // Important steps
    doc.rect(160, yPosition, 15, rowHeight, 'S'); // No.
    doc.rect(175, yPosition, 50, rowHeight, 'S'); // Key points
    doc.rect(225, yPosition, 20, rowHeight, 'S'); // Symbol
    doc.rect(245, yPosition, 42, rowHeight, 'S'); // Reason
    
    // Fill in step data
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Step number
    doc.text(`${i + 1}`, 72, yPosition + 15, { align: 'center' });
    
    // Step title
    doc.setFont('helvetica', 'bold');
    doc.text(step.title, 83, yPosition + 10);
    doc.setFont('helvetica', 'normal');
    
    // Step description (if any)
    if (step.description) {
      const splitDescription = doc.splitTextToSize(step.description, 75);
      doc.text(splitDescription, 83, yPosition + 15);
    }
    
    // Indicator for picture
    doc.setFontSize(8);
    if (step.imageUrl) {
      doc.text('[See step image in app]', 35, yPosition + 15, { align: 'center' });
      
      // Add a placeholder box for the image
      doc.rect(15, yPosition + 5, 45, 20, 'S');
      doc.line(15, yPosition + 5, 60, yPosition + 25);
      doc.line(60, yPosition + 5, 15, yPosition + 25);
    }
    
    // Key points (assumed from step description)
    doc.setFontSize(9);
    doc.text('See step description', 177, yPosition + 10);
    
    // Reason (derived from purpose or just a placeholder)
    doc.text('For correct process execution', 247, yPosition + 10);
    
    yPosition += rowHeight;
  }
  
  // Add footer with approvals
  const footerTop = Math.min(yPosition + 10, 190);
  
  doc.rect(10, footerTop, 40, 10, 'S');
  doc.rect(50, footerTop, 40, 10, 'S');
  doc.rect(90, footerTop, 80, 10, 'S');
  
  doc.setFontSize(8);
  doc.text('Approval Date', 11, footerTop + 5);
  doc.text(metadata.approvalDate || new Date().toLocaleDateString(), 51, footerTop + 5);
  doc.text(`Prepared by: ${metadata.author || 'Author'}`, 91, footerTop + 5);
  
  // Add second row of footer
  doc.rect(10, footerTop + 10, 40, 10, 'S');
  doc.rect(50, footerTop + 10, 237, 10, 'S');
  
  doc.text('Tools', 11, footerTop + 15);
  doc.text('Required equipment: Standard safety equipment', 51, footerTop + 15);
  
  // Save the PDF
  doc.save(`${metadata.title.replace(/\s+/g, '_')}_SOP.pdf`);
};

/**
 * Wrapper function that handles error management and UI interactions
 */
export const createAndDownloadSopPdf = async (metadata: SOPMetadata, steps: Step[]): Promise<void> => {
  try {
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