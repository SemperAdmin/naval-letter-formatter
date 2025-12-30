/**
 * PDF Signature Field Utility
 *
 * Adds an empty digital signature field to a PDF for CAC/PKI signing in Adobe Reader.
 * The field is positioned above the signature block, aligned with the signer's name.
 */

import { PDFDocument, PDFPage, PDFName, PDFDict, PDFArray, PDFString, PDFNumber, rgb } from 'pdf-lib';
import { PDF_INDENTS, PDF_MARGINS, PDF_PAGE } from './pdf-settings';

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

  // Create the signature field rectangle [x1, y1, x2, y2]
  const sigFieldRect = [
    SIGNATURE_FIELD.xOffset,                              // x1: left edge
    yPosition,                                             // y1: bottom edge
    SIGNATURE_FIELD.xOffset + SIGNATURE_FIELD.width,      // x2: right edge
    yPosition + SIGNATURE_FIELD.height,                    // y2: top edge
  ];

  // Get or create the AcroForm
  const form = pdfDoc.getForm();

  // Create signature field using pdf-lib's form API
  // Note: pdf-lib doesn't have createSignature, so we need to do this at the low level
  const context = pdfDoc.context;

  // Create the signature field dictionary
  const sigFieldDict = context.obj({
    Type: 'Annot',
    Subtype: 'Widget',
    FT: 'Sig',                    // Field Type: Signature
    T: PDFString.of(fieldName),   // Field name
    Rect: sigFieldRect,
    F: 4,                         // Annotation flags: Print
    P: lastPage.ref,              // Reference to the page
    // Visual appearance - light blue background to show clickable area
    MK: {
      BG: [0.9, 0.95, 1.0],       // Light blue background
      BC: [0.4, 0.4, 0.8],        // Blue border
    },
    // Tooltip when hovering
    TU: PDFString.of(`Click to sign with CAC - ${signerName}`),
  });

  // Register the signature field dictionary
  const sigFieldRef = context.register(sigFieldDict);

  // Add the widget annotation to the page's Annots array
  const pageDict = lastPage.node;
  let annots = pageDict.lookup(PDFName.of('Annots'), PDFArray);

  if (!annots) {
    annots = context.obj([]);
    pageDict.set(PDFName.of('Annots'), annots);
  }

  annots.push(sigFieldRef);

  // Get or create the AcroForm dictionary
  const catalogDict = pdfDoc.catalog;
  let acroFormDict = catalogDict.lookup(PDFName.of('AcroForm'), PDFDict);

  if (!acroFormDict) {
    acroFormDict = context.obj({
      Fields: [],
      SigFlags: 3,  // SignaturesExist | AppendOnly
    });
    catalogDict.set(PDFName.of('AcroForm'), acroFormDict);
  } else {
    // Ensure SigFlags is set
    acroFormDict.set(PDFName.of('SigFlags'), PDFNumber.of(3));
  }

  // Add the signature field to the AcroForm's Fields array
  let fieldsArray = acroFormDict.lookup(PDFName.of('Fields'), PDFArray);
  if (!fieldsArray) {
    fieldsArray = context.obj([]);
    acroFormDict.set(PDFName.of('Fields'), fieldsArray);
  }
  fieldsArray.push(sigFieldRef);

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
