/**
 * PDF Signature Field Utility
 *
 * Adds an empty digital signature field to a PDF for CAC/PKI signing in Adobe Reader.
 * The field is positioned above the signature block, aligned with the signer's name.
 */

import { PDFDocument, rgb } from 'pdf-lib';
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
 * Adds a visual signature placeholder to the last page of a PDF.
 * Users can click this area in Adobe Reader and use Tools > Certificates > Digitally Sign
 * to add their CAC/PKI signature.
 *
 * @param pdfBytes - The PDF as a Uint8Array or ArrayBuffer
 * @param config - Optional configuration for field placement
 * @returns The modified PDF as Uint8Array
 */
export async function addSignatureField(
  pdfBytes: Uint8Array | ArrayBuffer,
  config: SignatureFieldConfig = {}
): Promise<Uint8Array> {
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

  // Add "SIGN HERE" text inside the box
  lastPage.drawText('SIGN HERE', {
    x: SIGNATURE_FIELD.xOffset + 25,
    y: yPosition + SIGNATURE_FIELD.height / 2 - 4,
    size: 10,
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
