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
export const createAndDownloadSopPdf = async (metadata: SOPMetadata, steps: Step[]): Promise<void> => {
    try {
      console.log("PDF Generation - Metadata:", JSON.stringify(metadata));
      console.log("PDF Generation - Steps:", JSON.stringify(steps));
      
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