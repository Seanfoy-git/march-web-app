// src/utils/pdfUtils.js
import { jsPDF } from "jspdf";
import 'jspdf-autotable';

/**
 * Creates a simple table for PDF without using autoTable
 * @param {jsPDF} doc - PDF document
 * @param {Array} head - Table header
 * @param {Array} body - Table body
 * @param {number} startY - Starting Y position
 * @returns {number} - Final Y position
 */
const createSimpleTable = (doc, head, body, startY) => {
  const cellWidth = 80;
  const cellHeight = 10;
  const margin = 20;
  let yPosition = startY;
  
  // Add headers
  doc.setFillColor(59, 130, 246);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold"); // Modern jsPDF API
  head[0].forEach((header, index) => {
    doc.setFillColor(59, 130, 246);
    doc.rect(margin + index * cellWidth, yPosition, cellWidth, cellHeight, 'F');
    doc.text(header, margin + 5 + index * cellWidth, yPosition + 7);
  });
  
  yPosition += cellHeight;
  
  // Add rows
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal"); // Modern jsPDF API
  body.forEach((row, rowIndex) => {
    row.forEach((cell, cellIndex) => {
      doc.setFillColor(rowIndex % 2 === 0 ? 245 : 255, rowIndex % 2 === 0 ? 245 : 255, rowIndex % 2 === 0 ? 245 : 255);
      doc.rect(margin + cellIndex * cellWidth, yPosition, cellWidth, cellHeight, 'F');
      doc.text(String(cell), margin + 5 + cellIndex * cellWidth, yPosition + 7);
    });
    yPosition += cellHeight;
  });
  
  return yPosition;
};

/**
 * Creates and downloads a PDF of the SOP
 * @param {Object} metadata - SOP metadata
 * @param {Array} steps - SOP steps
 * @returns {Promise<boolean>} - Success indicator
 */
export const createAndDownloadSopPdf = async (metadata, steps) => {
  try {
    console.log("Starting PDF generation");
    console.log("Metadata:", JSON.stringify(metadata));
    
    // Filter out any empty steps without title
    const validSteps = steps.filter(step => step.title && step.title.trim());
    console.log(`Processing ${validSteps.length} valid steps`);

    // Create new PDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Add title
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(metadata.title, 105, 20, { align: "center" });

    // Add metadata table
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    
    // Metadata table
    const metadataRows = [
      ["Department", metadata.department || ""],
      ["Author", metadata.author || ""],
      ["Approver", metadata.approver || ""],
      ["Created Date", metadata.createdDate || ""],
      ["Approval Date", metadata.approvalDate || "Pending"],
      ["Version", metadata.version || "1.0"]
    ];

    let currentY = 0;

    try {
      // Check if autoTable is available
      if (typeof doc.autoTable === 'function') {
        doc.autoTable({
          startY: 30,
          head: [["Field", "Value"]],
          body: metadataRows,
          theme: 'grid',
          headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255] },
          styles: { halign: 'left', fontSize: 10 }
        });
        
        // Process images and add steps
        currentY = doc.lastAutoTable.finalY + 15;
      } else {
        // Fallback to simple table
        console.log("AutoTable function not available, using fallback");
        currentY = createSimpleTable(doc, [["Field", "Value"]], metadataRows, 30) + 15;
      }
    } catch (tableError) {
      console.error("Error creating table:", tableError);
      // If table creation fails, start content after some space
      currentY = 50;
    }
    
    // Process steps
    processSteps(doc, validSteps, currentY);
    
    // Save PDF
    const filename = `${metadata.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_sop.pdf`;
    doc.save(filename);
    console.log(`PDF saved: ${filename}`);
    console.log("PDF generated successfully");
    
    return true;
    
  } catch (error) {
    console.error("Error generating PDF:", error);
    console.error("Error details:", JSON.stringify({
      message: error.message,
      stack: error.stack
    }));
    alert("There was an error generating the PDF. Please check the console for details.");
    return false;
  }
};

/**
 * Process steps and add them to the PDF
 * @param {jsPDF} doc - PDF document 
 * @param {Array} validSteps - Valid SOP steps
 * @param {number} startY - Starting Y position
 */
function processSteps(doc, validSteps, startY) {
  let currentY = startY;
  
  for (let i = 0; i < validSteps.length; i++) {
    const step = validSteps[i];
    
    console.log(`Processing step ${i + 1}: ${step.title}`);
    
    // Check if we need to add a new page
    if (currentY > 240) {
      doc.addPage();
      currentY = 20;
    }
    
    // Add step title
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`Step ${i + 1}: ${step.title}`, 20, currentY);
    currentY += 10;
    
    // Add step description if available
    if (step.description && step.description.trim()) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      
      // Split description text to fit width
      const descLines = doc.splitTextToSize(step.description, 170);
      doc.text(descLines, 20, currentY);
      currentY += (descLines.length * 5) + 5;
    }
    
    // Add "Reason Why" if available
    if (step.reasonWhy && step.reasonWhy.trim()) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.text("Why: ", 20, currentY);
      
      // Split reason text to fit width
      const reasonLines = doc.splitTextToSize(step.reasonWhy, 165);
      doc.text(reasonLines, 30, currentY);
      currentY += (reasonLines.length * 5) + 5;
    }
    
    // Add symbol type if available
    if (step.symbolType) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Symbol: ${step.symbolType}`, 20, currentY);
      currentY += 7;
    }
    
    // Add image if available
    if (step.imageUrl && step.imageUrl.trim()) {
      try {
        console.log(`Image found for step ${i + 1}, adding placeholder`);
        
        // Check if we need to add a new page for the image
        if (currentY > 180) {
          doc.addPage();
          currentY = 20;
        }
        
        // For now, just add a placeholder instead of trying to load the image
        doc.setFillColor(240, 240, 240);
        doc.rect(20, currentY, 160, 40, 'F');
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text('Image not available in PDF (see online version)', 100, currentY + 20, { align: 'center' });
        currentY += 50;
      } catch (error) {
        console.error(`Error processing image for step ${i + 1}:`, error);
        
        // Add placeholder for failed image
        doc.setFillColor(240, 240, 240);
        doc.rect(20, currentY, 160, 40, 'F');
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text('Image not available', 100, currentY + 20, { align: 'center' });
        currentY += 50;
      }
    }
    
    // Add some space after each step
    currentY += 10;
  }
}