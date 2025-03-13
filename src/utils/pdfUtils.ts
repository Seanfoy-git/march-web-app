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
  
  // Add header with title - EXACTLY matching your example
  doc.setFillColor(240, 240, 240);
  doc.rect(0, 0, 297, 20, 'F'); // Header background
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Standard Work Instruction', 148.5, 12, { align: 'center' });
  
  // Add company logo or name - but removed eTWI as requested
  // doc.setFontSize(18);
  // doc.setTextColor(41, 128, 185);
  // doc.setFont('helvetica', 'bold');
  // doc.text('eTWI', 15, 10);
  
  // Add metadata table
  doc.setLineWidth(0.1);
  doc.setDrawColor(0);
  
  // Top row of metadata - EXACTLY matching your example
  const metadataTop = 25;
  doc.rect(65, metadataTop, 65, 10, 'S'); // Template No.
  doc.rect(130, metadataTop, 65, 10, 'S'); // Department
  doc.rect(195, metadataTop, 65, 10, 'S'); // Area
  doc.rect(65, metadataTop + 10, 65, 10, 'S'); // Operation
  doc.rect(130, metadataTop + 10, 65, 10, 'S'); // Instruction no.
  doc.rect(195, metadataTop + 10, 65, 10, 'S'); // Version
  doc.rect(260, metadataTop, 27, 20, 'S'); // Page Number (spans 2 rows)

  // Add headers for metadata
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text('Template No.:', 66, metadataTop + 5);
  doc.text('Department', 131, metadataTop + 5);
  doc.text('Area', 196, metadataTop + 5);
  doc.text('Operation', 66, metadataTop + 15);
  doc.text('Instruction no.:', 131, metadataTop + 15);
  doc.text('Version', 196, metadataTop + 15);
  doc.text('Page Number', 261, metadataTop + 10);
  
  // Fill in metadata values
  doc.setFontSize(10);
  doc.text(`SOP_${metadata.title.substring(0, 10)}`, 66, metadataTop + 8);
  doc.text(metadata.department || 'Department', 131, metadataTop + 8);
  doc.text('Production', 196, metadataTop + 8);
  doc.text(metadata.title.substring(0, 20), 66, metadataTop + 18);
  doc.text(`SOP_${Date.now().toString().substring(5, 10)}`, 131, metadataTop + 18);
  doc.text(metadata.version || '1.0', 196, metadataTop + 18);
  doc.text('1/1', 261, metadataTop + 14);
  
  // Create table for steps - EXACTLY matching your example
  const tableTop = metadataTop + 25;
  
  // Table headers with correct widths and layout
  doc.setFillColor(220, 220, 220);
  doc.rect(65, tableTop, 60, 10, 'FD'); // Pictures
  doc.rect(125, tableTop, 20, 10, 'FD'); // No.
  doc.rect(145, tableTop, 60, 10, 'FD'); // Important steps
  doc.rect(205, tableTop, 20, 10, 'FD'); // No.
  doc.rect(225, tableTop, 60, 10, 'FD'); // Key points
  doc.rect(285, tableTop, 20, 10, 'FD'); // Symbol
  doc.rect(305, tableTop, 40, 10, 'FD'); // Reason
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Pictures', 95, tableTop + 6, { align: 'center' });
  doc.text('No.', 135, tableTop + 6, { align: 'center' });
  doc.text('Important steps', 175, tableTop + 6, { align: 'center' });
  doc.text('No.', 215, tableTop + 6, { align: 'center' });
  doc.text('Key points', 255, tableTop + 6, { align: 'center' });
  doc.text('Symbol', 295, tableTop + 6, { align: 'center' });
  doc.text('Reason', 325, tableTop + 6, { align: 'center' });
  
  // Second row of headers
  const subHeaderTop = tableTop + 10;
  doc.rect(65, subHeaderTop, 60, 10, 'S');
  doc.rect(125, subHeaderTop, 20, 10, 'S');
  doc.rect(145, subHeaderTop, 60, 10, 'S');
  doc.rect(205, subHeaderTop, 20, 10, 'S');
  doc.rect(225, subHeaderTop, 60, 10, 'S');
  doc.rect(285, subHeaderTop, 20, 10, 'S');
  doc.rect(305, subHeaderTop, 40, 10, 'S');
  
  doc.setFont('helvetica', 'normal');
  doc.text('What?', 95, subHeaderTop + 6, { align: 'center' });
  doc.text('How?', 255, subHeaderTop + 6, { align: 'center' });
  doc.text('Why?', 325, subHeaderTop + 6, { align: 'center' });
  
  // Process each step
  let yPosition = subHeaderTop + 10;
  const rowHeight = 40; // Each step row height
  
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
      doc.setFillColor(220, 220, 220);
      doc.rect(65, yPosition, 60, 10, 'FD');
      doc.rect(125, yPosition, 20, 10, 'FD');
      doc.rect(145, yPosition, 60, 10, 'FD');
      doc.rect(205, yPosition, 20, 10, 'FD');
      doc.rect(225, yPosition, 60, 10, 'FD');
      doc.rect(285, yPosition, 20, 10, 'FD');
      doc.rect(305, yPosition, 40, 10, 'FD');
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Pictures', 95, yPosition + 6, { align: 'center' });
      doc.text('No.', 135, yPosition + 6, { align: 'center' });
      doc.text('Important steps', 175, yPosition + 6, { align: 'center' });
      doc.text('No.', 215, yPosition + 6, { align: 'center' });
      doc.text('Key points', 255, yPosition + 6, { align: 'center' });
      doc.text('Symbol', 295, yPosition + 6, { align: 'center' });
      doc.text('Reason', 325, yPosition + 6, { align: 'center' });
      
      yPosition += 10;
    }
    
    // Draw table cells for this step - EXACTLY matching your example
    doc.rect(65, yPosition, 60, rowHeight, 'S'); // Pictures
    doc.rect(125, yPosition, 20, rowHeight, 'S'); // No.
    doc.rect(145, yPosition, 60, rowHeight, 'S'); // Important steps
    doc.rect(205, yPosition, 20, rowHeight, 'S'); // No.
    doc.rect(225, yPosition, 60, rowHeight, 'S'); // Key points
    doc.rect(285, yPosition, 20, rowHeight, 'S'); // Symbol
    doc.rect(305, yPosition, 40, rowHeight, 'S'); // Reason
    
    // Fill in step data
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Image placeholder - EXACTLY matching your example
    if (step.imageUrl) {
      doc.rect(75, yPosition + 10, 40, 20, 'S');
      doc.line(75, yPosition + 10, 115, yPosition + 30);
      doc.line(115, yPosition + 10, 75, yPosition + 30);
      doc.setFontSize(8);
      doc.text('[See step image in app]', 95, yPosition + 22, { align: 'center' });
    }
    
    // Step number
    doc.text(`${i + 1}`, 135, yPosition + 20, { align: 'center' });
    
    // Step title and description
    doc.setFont('helvetica', 'bold');
    doc.text(step.title, 146, yPosition + 10);
    doc.setFont('helvetica', 'normal');
    
    // Step description
    if (step.description) {
      const splitDescription = doc.splitTextToSize(`description for ${step.title}`, 55);
      doc.text(splitDescription, 146, yPosition + 20);
    }
    
    // Key points - fixed matching your example
    doc.text('See step description', 226, yPosition + 20);
    
    // Reason
    doc.text('For correct process execution', 306, yPosition + 20);
    
    yPosition += rowHeight;
  }
  
  // Add footer with approvals - MATCHING the example
  const footerTop = Math.min(yPosition + 10, 190);
  
  doc.rect(65, footerTop, 60, 10, 'S'); // Approval Date
  doc.rect(125, footerTop, 80, 10, 'S'); // Date value
  doc.rect(205, footerTop, 140, 10, 'S'); // Prepared by
  
  doc.setFontSize(8);
  doc.text('Approval Date', 66, footerTop + 5);
  doc.text(metadata.approvalDate || new Date().toISOString().split('T')[0], 126, footerTop + 5);
  doc.text(`Prepared by: ${metadata.author || 'Author'}`, 206, footerTop + 5);
  
  // Add second row of footer
  doc.rect(65, footerTop + 10, 60, 10, 'S');
  doc.rect(125, footerTop + 10, 220, 10, 'S');
  
  doc.text('Tools', 66, footerTop + 15);
  doc.text('Required equipment: Standard safety equipment', 126, footerTop + 15);
  
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