// PDF hyperlink helpers for pdf-lib
// Sprint 3: enables clickable internal navigation (Table of Contents ↔ pages)
// and external URL links inside generated PDFs (planners, journals, etc.).

import { PDFName, PDFArray, PDFDict, PDFNumber, PDFString, PDFRef } from 'pdf-lib'

/**
 * Add an internal (GoTo) link annotation to a source page that jumps to
 * `targetPage` when clicked.
 *
 * @param {PDFDocument} pdfDoc
 * @param {PDFPage}     sourcePage
 * @param {[number,number,number,number]} rect  [x1, y1, x2, y2] in PDF points
 * @param {PDFPage}     targetPage
 */
export function addInternalLink(pdfDoc, sourcePage, rect, targetPage) {
  const context = pdfDoc.context
  const [x1, y1, x2, y2] = rect

  // Destination array: [targetPageRef /Fit]
  // /Fit fits the entire page in the viewer window
  const destArray = PDFArray.withContext(context)
  destArray.push(targetPage.ref)
  destArray.push(PDFName.of('Fit'))

  // Action dictionary: /GoTo
  const actionDict = PDFDict.withContext(context)
  actionDict.set(PDFName.of('Type'), PDFName.of('Action'))
  actionDict.set(PDFName.of('S'), PDFName.of('GoTo'))
  actionDict.set(PDFName.of('D'), destArray)

  // Link annotation
  const rectArray = PDFArray.withContext(context)
  rectArray.push(PDFNumber.of(x1))
  rectArray.push(PDFNumber.of(y1))
  rectArray.push(PDFNumber.of(x2))
  rectArray.push(PDFNumber.of(y2))

  // Border [H V W] — invisible border
  const borderArray = PDFArray.withContext(context)
  borderArray.push(PDFNumber.of(0))
  borderArray.push(PDFNumber.of(0))
  borderArray.push(PDFNumber.of(0))

  const annot = PDFDict.withContext(context)
  annot.set(PDFName.of('Type'), PDFName.of('Annot'))
  annot.set(PDFName.of('Subtype'), PDFName.of('Link'))
  annot.set(PDFName.of('Rect'), rectArray)
  annot.set(PDFName.of('Border'), borderArray)
  annot.set(PDFName.of('A'), actionDict)

  const annotRef = context.register(annot)
  attachAnnotationRef(sourcePage, annotRef, context)
}

/**
 * Add an external (URI) link annotation — for shop links, resource lists, etc.
 */
export function addExternalLink(pdfDoc, sourcePage, rect, url) {
  const context = pdfDoc.context
  const [x1, y1, x2, y2] = rect

  const actionDict = PDFDict.withContext(context)
  actionDict.set(PDFName.of('Type'), PDFName.of('Action'))
  actionDict.set(PDFName.of('S'), PDFName.of('URI'))
  actionDict.set(PDFName.of('URI'), PDFString.of(url))

  const rectArray = PDFArray.withContext(context)
  rectArray.push(PDFNumber.of(x1))
  rectArray.push(PDFNumber.of(y1))
  rectArray.push(PDFNumber.of(x2))
  rectArray.push(PDFNumber.of(y2))

  const borderArray = PDFArray.withContext(context)
  borderArray.push(PDFNumber.of(0))
  borderArray.push(PDFNumber.of(0))
  borderArray.push(PDFNumber.of(0))

  const annot = PDFDict.withContext(context)
  annot.set(PDFName.of('Type'), PDFName.of('Annot'))
  annot.set(PDFName.of('Subtype'), PDFName.of('Link'))
  annot.set(PDFName.of('Rect'), rectArray)
  annot.set(PDFName.of('Border'), borderArray)
  annot.set(PDFName.of('A'), actionDict)

  const annotRef = context.register(annot)
  attachAnnotationRef(sourcePage, annotRef, context)
}

// Push an annotation reference onto sourcePage.Annots (create if missing).
function attachAnnotationRef(sourcePage, annotRef, context) {
  const existing = sourcePage.node.get(PDFName.of('Annots'))
  if (existing && existing instanceof PDFArray) {
    existing.push(annotRef)
    return
  }
  // If existing is a PDFRef (indirect reference), resolve and push
  if (existing && existing instanceof PDFRef) {
    const resolved = context.lookup(existing)
    if (resolved instanceof PDFArray) {
      resolved.push(annotRef)
      return
    }
  }
  const fresh = PDFArray.withContext(context)
  fresh.push(annotRef)
  sourcePage.node.set(PDFName.of('Annots'), fresh)
}
