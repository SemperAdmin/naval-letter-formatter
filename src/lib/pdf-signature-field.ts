/**
 * PDF Signature Field Utility
 *
 * Adds an empty digital signature field to a PDF for CAC/PKI signing in Adobe Reader.
 * The field is positioned above the signature block, aligned with the signer's name.
 */

import { PDFDocument, PDFName, PDFDict, PDFArray, PDFString, PDFNumber, rgb } from 'pdf-lib';
import { PDF_INDENTS, PDF_PAGE } from './pdf-settings';

// Signature field dimensions in points (1 inch = 72 points)
const SIGNATURE_FIELD = {
  width: 108,          // 1.5 inches
  height: 36,          // ~0.5 inches (2 lines at ~18pt)
  xOffset: PDF_INDENTS.signature,  // 3.25" from page left (aligned with signature block)
  yAboveName: 36,      // Space above the typed name where signature appears
};

/**
 * Configuration for signature field placement
 */
export interface SignatureFieldConfig {
  /** Y position from bottom of page in points (if known) */
  yPosition?: number;
  /** Field name for the signature */
  fieldName?: string;
  /** Signer's name (for field tooltip) */
  signerName?: string;
}

/**
 * Adds an empty digital signature field to the last page of a PDF.
 * The signature field can be clicked in Adobe Reader to sign with a CAC/PIV card.
 *
 * @param pdfBytes - The PDF as a Uint8Array or ArrayBuffer
 * @param config - Optional configuration for field placement
 * @returns The modified PDF as Uint8Array
 */
export async function addSignatureField(
  pdfBytes: Uint8Array | ArrayBuffer,
  config: SignatureFieldConfig = {}
): Promise<Uint8Array> {
  const {
    fieldName = 'DigitalSignature',
    signerName = 'Signer',
  } = config;

  // Load the PDF
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  const lastPage = pages[pages.length - 1];
  const { height } = lastPage.getSize();

  // Calculate Y position - default to lower third of page where signature typically appears
  // In PDF coordinates, Y=0 is at bottom
  const yPosition = config.yPosition ?? (height * 0.25); // ~25% from bottom of page

  // Draw a visual indicator for the signature box (visible placeholder)
  lastPage.drawRectangle({
    x: SIGNATURE_FIELD.xOffset,
    y: yPosition,
    width: SIGNATURE_FIELD.width,
    height: SIGNATURE_FIELD.height,
    borderColor: rgb(0.6, 0.6, 0.8),
    borderWidth: 1,
    color: rgb(0.95, 0.97, 1.0),
    opacity: 0.5,
  });

  // Add "Click to sign" text inside the box
  lastPage.drawText('Click to sign', {
    x: SIGNATURE_FIELD.xOffset + 10,
    y: yPosition + SIGNATURE_FIELD.height / 2 - 4,
    size: 8,
    color: rgb(0.4, 0.4, 0.6),
  });

  // Create the signature field using low-level pdf-lib API
  const context = pdfDoc.context;

  // Create the rectangle array for the signature field
  const rectArray = context.obj([
    PDFNumber.of(SIGNATURE_FIELD.xOffset),
    PDFNumber.of(yPosition),
    PDFNumber.of(SIGNATURE_FIELD.xOffset + SIGNATURE_FIELD.width),
    PDFNumber.of(yPosition + SIGNATURE_FIELD.height),
  ]);

  // Create the MK (appearance) dictionary
  const mkDict = context.obj({});
  mkDict.set(PDFName.of('BG'), context.obj([PDFNumber.of(0.9), PDFNumber.of(0.95), PDFNumber.of(1.0)]));
  mkDict.set(PDFName.of('BC'), context.obj([PDFNumber.of(0.4), PDFNumber.of(0.4), PDFNumber.of(0.8)]));

  // Create the signature field widget annotation dictionary
  const sigFieldDict = context.obj({});
  sigFieldDict.set(PDFName.of('Type'), PDFName.of('Annot'));
  sigFieldDict.set(PDFName.of('Subtype'), PDFName.of('Widget'));
  sigFieldDict.set(PDFName.of('FT'), PDFName.of('Sig'));
  sigFieldDict.set(PDFName.of('T'), PDFString.of(fieldName));
  sigFieldDict.set(PDFName.of('Rect'), rectArray);
  sigFieldDict.set(PDFName.of('F'), PDFNumber.of(4)); // Print flag
  sigFieldDict.set(PDFName.of('P'), lastPage.ref);
  sigFieldDict.set(PDFName.of('MK'), mkDict);
  sigFieldDict.set(PDFName.of('TU'), PDFString.of(`Click to sign with CAC - ${signerName}`));

  // Register the signature field dictionary
  const sigFieldRef = context.register(sigFieldDict);

  // Add the widget annotation to the page's Annots array
  const pageDict = lastPage.node;
  let annots = pageDict.lookup(PDFName.of('Annots'), PDFArray);

  if (!annots) {
    annots = context.obj([]) as PDFArray;
    pageDict.set(PDFName.of('Annots'), annots);
  }

  annots.push(sigFieldRef);

  // Get or create the AcroForm dictionary
  const catalogDict = pdfDoc.catalog;
  let acroFormDict = catalogDict.lookup(PDFName.of('AcroForm'), PDFDict);

  if (!acroFormDict) {
    acroFormDict = context.obj({}) as PDFDict;
    acroFormDict.set(PDFName.of('SigFlags'), PDFNumber.of(3));
    acroFormDict.set(PDFName.of('Fields'), context.obj([]));
    catalogDict.set(PDFName.of('AcroForm'), acroFormDict);
  } else {
    // Ensure SigFlags is set
    acroFormDict.set(PDFName.of('SigFlags'), PDFNumber.of(3));
  }

  // Add the signature field to the AcroForm's Fields array
  let fieldsArray = acroFormDict.lookup(PDFName.of('Fields'), PDFArray);
  if (!fieldsArray) {
    fieldsArray = context.obj([]) as PDFArray;
    acroFormDict.set(PDFName.of('Fields'), fieldsArray);
  }
  fieldsArray.push(sigFieldRef);

  // Save and return the modified PDF
  return pdfDoc.save();
}

/**
 * Estimates the Y position of the signature block based on typical naval letter layout.
 * This is a fallback when exact position cannot be determined.
 *
 * @param pageHeight - Height of the page in points
 * @param contentLines - Approximate number of content lines on the page
 * @returns Estimated Y position for the signature field
 */
export function estimateSignatureYPosition(
  pageHeight: number = PDF_PAGE.height,
  contentLines: number = 30
): number {
  // Typical naval letter has signature block 2-3 inches from bottom on last page
  // Adjust based on content density
  const lineHeight = 14.4; // Approximate line height in points
  const topMargin = 72; // 1 inch
  const contentHeight = contentLines * lineHeight;

  // Position signature about 3 lines above where typed name would be
  const estimatedNamePosition = pageHeight - topMargin - contentHeight;

  // Ensure reasonable bounds (between 20% and 60% from bottom)
  const minY = pageHeight * 0.20;
  const maxY = pageHeight * 0.60;

  return Math.max(minY, Math.min(maxY, estimatedNamePosition + SIGNATURE_FIELD.yAboveName));
}
