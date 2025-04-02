// src/utils/pdfUtils.ts
import { jsPDF } from 'jspdf'
import autoTable, { UserOptions } from 'jspdf-autotable'
import type { SOP } from '@/types/sop'

// Utility to fetch an image from a URL and convert to base64
async function getBase64ImageFromUrl(imageUrl: string): Promise<string> {
  const res = await fetch(imageUrl)
  const blob = await res.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      resolve(reader.result as string)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export async function createAndDownloadSopPdf(sop: SOP) {
  // Landscape A4 so we have more horizontal space (change if you prefer portrait)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'A4',
  })

  // Title + Basic Info
  doc.setFontSize(18)
  doc.text(sop.metadata.title || 'Untitled SOP', 40, 50)

  doc.setFontSize(10)
  doc.text(`Department: ${sop.metadata.department}`, 40, 70)
  doc.text(`Author: ${sop.metadata.author}`, 40, 85)
  doc.text(`Approver: ${sop.metadata.approver}`, 40, 100)
  doc.text(`Created Date: ${sop.metadata.createdDate}`, 40, 115)
  doc.text(`Approval Date: ${sop.metadata.approvalDate}`, 40, 130)
  doc.text(`Version: ${sop.metadata.version}`, 40, 145)

  // Prepare table rows
  const bodyRows = [];
  for (let i = 0; i < sop.steps.length; i++) {
    const step = sop.steps[i];
    bodyRows.push([
      (i + 1).toString(),  // Step #
      step.title,          // What (Title)
      step.description,    // Key Points (How)
      step.reasonWhy || '',// Why
      step.symbolType || '',// Symbol
      step.imageUrl || ''  // Image URL (for custom drawing)
    ]);
  }

  // Define table columns
  const tableColumns = [
    { header: 'Step #', dataKey: 'stepNum' },
    { header: 'What', dataKey: 'title' },
    { header: 'Key Points (How)', dataKey: 'description' },
    { header: 'Why', dataKey: 'why' },
    { header: 'Symbol', dataKey: 'symbol' },
    { header: 'Image', dataKey: 'image' },
  ];

  // Use jspdf-autotable with a custom cell drawing to embed images
  const autoTableOptions: UserOptions = {
    startY: 180,
    head: [tableColumns.map(col => col.header)],
    body: bodyRows,
    styles: { fontSize: 9, cellPadding: 6 },
    headStyles: { fillColor: [230, 230, 230] },
    margin: { left: 40, right: 40 },
    didDrawCell: (data) => {
      // Only handle body cells in the "Image" column (index 5)
      if (data.section === 'body' && data.column.index === 5 && data.cell) {
        const stepIndex = data.row.index;
        const step = sop.steps[stepIndex];
        if (step.imageUrl) {
          getBase64ImageFromUrl(step.imageUrl)
            .then((base64Img) => {
              if (data.cell && data.cell.x !== undefined && data.cell.width !== undefined && data.cell.y !== undefined) {
                const { x, y, width } = data.cell;
                const imgSize = 50; // Adjust image size as needed
                doc.addImage(
                  base64Img,
                  'JPEG',
                  x + (width - imgSize) / 2, // center the image in the cell
                  y + 2,
                  imgSize,
                  imgSize
                );
              }
            })
            .catch((err) => {
              console.error('Image load error:', err);
            });
        }
      }
    },
  };

  autoTable(doc, autoTableOptions);

  // Save the PDF with the SOP title as the filename
  doc.save(`${sop.metadata.title || 'SOP'}.pdf`);
}
