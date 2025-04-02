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
  // Create the PDF document (landscape A4)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'A4',
  })

  // Add SOP metadata at the top
  doc.setFontSize(18)
  doc.text(sop.metadata.title || 'Untitled SOP', 40, 50)

  doc.setFontSize(10)
  doc.text(`Department: ${sop.metadata.department}`, 40, 70)
  doc.text(`Author: ${sop.metadata.author}`, 40, 85)
  doc.text(`Approver: ${sop.metadata.approver}`, 40, 100)
  doc.text(`Created Date: ${sop.metadata.createdDate}`, 40, 115)
  doc.text(`Approval Date: ${sop.metadata.approvalDate}`, 40, 130)
  doc.text(`Version: ${sop.metadata.version}`, 40, 145)

  // Preload images for each step that has an imageUrl
  const preloadedImages: Record<number, string> = {}
  await Promise.all(
    sop.steps.map(async (step, i) => {
      if (step.imageUrl) {
        try {
          preloadedImages[i] = await getBase64ImageFromUrl(step.imageUrl)
        } catch (err) {
          console.error(`Error preloading image for step ${i}`, err)
        }
      }
    })
  )

  // Prepare table rows from steps
  const bodyRows = []
  for (let i = 0; i < sop.steps.length; i++) {
    const step = sop.steps[i]
    bodyRows.push([
      (i + 1).toString(),           // Step #
      step.title,                   // What (Title)
      step.description,             // Key Points (How)
      step.reasonWhy || '',         // Why
      step.symbolType || '',        // Symbol
      step.imageUrl || ''           // We'll use the preloaded image in didDrawCell
    ])
  }

  // Define table columns
  const tableColumns = [
    { header: 'Step #', dataKey: 'stepNum' },
    { header: 'What', dataKey: 'title' },
    { header: 'Key Points (How)', dataKey: 'description' },
    { header: 'Why', dataKey: 'why' },
    { header: 'Symbol', dataKey: 'symbol' },
    { header: 'Image', dataKey: 'image' },
  ]

  // Configure autoTable options including the synchronous didDrawCell callback
  const autoTableOptions: UserOptions = {
    startY: 180,
    head: [tableColumns.map(col => col.header)],
    body: bodyRows,
    styles: { fontSize: 9, cellPadding: 6 },
    headStyles: { fillColor: [230, 230, 230] },
    margin: { left: 40, right: 40 },
    didDrawCell: (data) => {
      // Only process cells in the "Image" column (index 5) of the body
      if (data.section === 'body' && data.column.index === 5 && data.cell) {
        const stepIndex = data.row.index
        if (preloadedImages[stepIndex]) {
          const { x, y, width } = data.cell
          const imgSize = 50 // Adjust size as needed
          doc.addImage(
            preloadedImages[stepIndex],
            'JPEG',
            x + (width - imgSize) / 2,
            y + 2,
            imgSize,
            imgSize
          )
        }
      }
    },
  }

  // Draw the table into the document
  autoTable(doc, autoTableOptions)

  // Save/download the PDF
  doc.save(`${sop.metadata.title || 'SOP'}.pdf`)
}
