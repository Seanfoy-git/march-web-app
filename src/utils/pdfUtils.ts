import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Comprehensive interfaces for type safety
interface SOPStep {
  title: string;
  description: string;
  imageUrl?: string;
  imageName?: string;
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
};

// Comprehensive image loading utility
async function loadImageAsBase64(url: string | undefined): Promise<string | null> {
  console.log('Starting image loading process');
  
  if (!url) {
    console.warn('No image URL provided');
    return null;
  }

  try {
    console.log('Attempting to fetch image:', url);
    
    // Use a more comprehensive fetch approach
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors', // Add CORS mode
      headers: {
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*'
      }
    });

    console.log('Fetch response status:', response.status);

    if (!response.ok) {
      console.error('Image fetch failed:', response.status, response.statusText);
      console.error('Failed URL:', url);
      return null;
    }

    const blob = await response.blob();
    console.log('Blob received, size:', blob.size);

    // Convert blob to base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        console.log('Image converted to base64, length:', base64data.length);
        resolve(base64data);
      };
      reader.onerror = (error) => {
        console.error('FileReader error:', error);
        reject(error);
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Comprehensive image loading error:', error);
    console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return null;
  }
}

// Comprehensive PDF generation function
export const createAndDownloadSopPdf = async (
  metadata: SOPMetadata, 
  steps: SOPStep[]
) => {
  console.log('Starting PDF generation');
  console.log('Metadata:', JSON.stringify(metadata));
  console.log('Steps:', JSON.stringify(steps));

  // Create PDF document
  const doc = new jsPDF() as jsPDFWithAutoTable;

  // Set up document properties
  doc.setProperties({
    title: `SOP: ${metadata.title}`,
    subject: 'Standard Operating Procedure',
    author: metadata.author,
    creator: 'SOP Builder App'
  });

  // Add title and header information
  doc.setFontSize(18);
  doc.setTextColor(40);
  doc.text(metadata.title, 14, 22);

  // Add metadata details
  doc.setFontSize(10);
  doc.setTextColor(100);
  
  const metadataLines = [
    `Author: ${metadata.author}`,
    `Department: ${metadata.department}`,
    `Approver: ${metadata.approver}`,
    `Created Date: ${metadata.createdDate}`,
    `Approval Date: ${metadata.approvalDate}`,
    `Version: ${metadata.version}`
  ];

  metadataLines.forEach((line, index) => {
    doc.text(line, 14, 30 + index * 6);
  });

  // Prepare steps for table and images
  const stepsData = await Promise.all(steps.map(async (step, index) => {
    console.log(`Processing step ${index + 1}:`, step);

    let base64Image = null;
    
    // Attempt to load image
    if (step.imageUrl) {
      try {
        base64Image = await loadImageAsBase64(step.imageUrl);
        console.log(`Image for step ${index + 1}:`, base64Image ? 'Loaded successfully' : 'Failed to load');
      } catch (error) {
        console.error(`Error loading image for step ${index + 1}:`, error);
      }
    } else {
      console.warn(`No image URL for step ${index + 1}`);
    }

    // Add image to PDF if successfully loaded
    if (base64Image) {
      try {
        doc.addImage(
          base64Image, 
          'JPEG', 
          14, 
          100 + index * 50, // Adjust positioning 
          50, // width
          40  // height
        );
      } catch (imgError) {
        console.error(`Error adding image to PDF:`, imgError);
      }
    }

    return [
      (index + 1).toString(),
      step.title,
      step.description,
      base64Image ? 'Yes' : 'No'
    ];
  }));

  // Add steps table
  doc.autoTable({
    startY: 220, // Adjust based on image positioning
    head: [['Step', 'Title', 'Description', 'Image']],
    body: stepsData,
    theme: 'striped',
    headStyles: { fillColor: [41, 128, 185] },
    alternateRowStyles: { fillColor: [244, 244, 244] },
    styles: { 
      fontSize: 9,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 50 },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 20, halign: 'center' }
    }
  });

  // Add page numbers
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
  }

  // Save the PDF
  console.log('Finalizing PDF generation');
  doc.save(`${metadata.title}_SOP_v${metadata.version}.pdf`);

  console.log('PDF generation complete');
};

export default {
  createAndDownloadSopPdf
};