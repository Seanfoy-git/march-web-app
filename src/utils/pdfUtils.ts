// src/utils/pdfUtils.ts

import { SOPMetadata, Step } from '@/types/sop';

/**
 * Wrapper function that handles error management and UI interactions for PDF
 */
export const createAndDownloadSopPdf = async (metadata: SOPMetadata, steps: Step[]): Promise<void> => {
  try {
    // Show loading indicator
    alert("Starting PDF generation. This may take a moment...");
    
    // Instead of generating the PDF directly, we'll redirect to a special PDF view page
    // This approach uses client-side navigation to a page that renders the PDF
    const encodedMetadata = encodeURIComponent(JSON.stringify(metadata));
    const encodedSteps = encodeURIComponent(JSON.stringify(steps));
    
    // Open in new window/tab
    window.open(`/pdf-view?metadata=${encodedMetadata}&steps=${encodedSteps}`, '_blank');
    
    // Success message
    alert("PDF view opened in a new tab. You can print or save it as PDF from there.");
  } catch (error) {
    console.error('Error preparing PDF view:', error);
    alert(`Failed to prepare PDF view: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};