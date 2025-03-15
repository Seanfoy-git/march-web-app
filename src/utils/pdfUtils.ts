// src/utils/pdfUtils.ts
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Comprehensive interfaces for type safety
interface SOPStep {
  title: string;
  description: string;
  imageUrl?: string;
  imageName?: string;
  reasonWhy?: string;
  symbolType?: string;
}

interface SOPMetadata {
  title: string;
  author: string;
  department: string;
  approver: string;
  createdDate: string;
  approvalDate: string;
  version: string;
  [key: string]: string;
}

// Extended type for jsPDF with autotable plugin
type jsPDFWithAutoTable = jsPDF & {
  autoTable: (options: Record<string, unknown>) => jsPDF;
  lastAutoTable?: { finalY: number };
};

/**
 * Get image through the proxy API to avoid CORS issues
 * @param {string} imageUrl - Original Firebase Storage URL
 * @returns {Promise<string | null>} - Base64 encoded image data
 */
async function getProxiedImage(imageUrl: string): Promise<string | null> {
  try {
    console.log('Getting image via proxy:', imageUrl);
    
    // Use our API route to proxy the image request
    const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(imageUrl)}`;
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image through proxy: ${response.status}`);
    }
    
    // Convert to blob and then to base64
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error fetching image through proxy:", error);
    return null;
  }
}

// Comprehensive PDF generation function
export const createAndDownloadSopPdf = async (
  metadata: SOPMetadata, 
  steps: SOPStep[]
) => {
  try {
    console.log('Starting PDF generation');
    console.log('Metadata:', JSON.stringify(metadata));
    
    // Filter out any empty steps without title
    const validSteps = steps.filter(step => step.title && step.title.trim());
    console.log(`Processing ${validSteps.length} valid steps`);

    // Create new PDF document
    const doc = new jsPDF() as jsPDFWithAutoTable;

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

    try {
      // Add table with metadata
      doc.autoTable({
        startY: 30,
        head: [["Field", "Value"]],
        body: metadataRows,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255] },
        styles: { halign: 'left', fontSize: 10 }
      });
    } catch (error) {
      console.error("Error creating table:", error);
      // If table fails, add some basic text
      let yPos = 30;
      metadataRows.forEach(row => {
        doc.text(`${row[0]}: ${row[1]}`, 20, yPos);
        yPos += 10;
      });
    }

    // Get current Y position after the table
    let currentY = 0;
    try {
      if (doc.lastAutoTable && doc.lastAutoTable.finalY) {
        currentY = doc.lastAutoTable.finalY + 15;
      } else {
        currentY = 80; // Fallback if lastAutoTable isn't available
      }
    } catch (error) {
      console.error("Error accessing lastAutoTable:", error);
      currentY = 80;
    }

    // Process images and add steps
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
          console.log(`Attempting to load image for step ${i + 1}`);
          
          // Check if we need to add a new page for the image
          if (currentY > 180) {
            doc.addPage();
            currentY = 20;
          }
          
          // Get image through our proxy to avoid CORS issues
          const imgData = await getProxiedImage(step.imageUrl);
          
          if (imgData) {
            // Add image to PDF (limiting dimensions)
            const maxWidth = 160; // mm
            const maxHeight = 80; // mm
            
            doc.addImage(
              imgData, 
              'JPEG', 
              20, 
              currentY,
              maxWidth, 
              maxHeight, 
              undefined, 
              'FAST'
            );
            
            currentY += maxHeight + 15;
          } else {
            throw new Error("Failed to load image data");
          }
        } catch (error) {
          console.error(`Error loading image for step ${i + 1}:`, error);
          
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
    
    // Add page numbers
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
    }
    
    // Save PDF
    const filename = `${metadata.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_sop.pdf`;
    doc.save(filename);
    console.log(`PDF saved: ${filename}`);
    
    return true;
    
  } catch (error) {
    console.error("Error generating PDF:", error);
    console.error("Error details:", JSON.stringify({
      message: (error as Error).message,
      stack: (error as Error).stack
    }));
    alert("There was an error generating the PDF. Please check the console for details.");
    return false;
  }
};

export default {
  createAndDownloadSopPdf
};