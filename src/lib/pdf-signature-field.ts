/**
 * PDF Signature Field Utility
 *
 * Adds an empty digital signature field to a PDF for CAC/PKI signing in Adobe Reader.
 * The field is positioned above the signature block, aligned with the signer's name.
 */

import { PDFDocument, rgb } from 'pdf-lib';
import { PDF_INDENTS, PDF_PAGE, PDF_SPACING } from './pdf-settings';

// Signature field dimensions in points (1 inch = 72 points)
const SIGNATURE_FIELD = {
  width: 108,          // 1.5 inches
  height: 36,          // ~0.5 inches (2 lines at ~18pt)
  xOffset: PDF_INDENTS.signature,  // 3.25" from page left (aligned with signature block)
  yAboveName: 36,      // Space above the typed name where signature appears
};

// Text appearance constants for the placeholder
const PLACEHOLDER_TEXT = {
  content: 'SIGN HERE',
  size: 10,
  hPadding: 25,
  vOffset: 4,
  color: rgb(0.4, 0.4, 0.6),
};

// Position estimation bounds
const MIN_Y_RATIO = 0.20;
const MAX_Y_RATIO = 0.60;
const DEFAULT_Y_RATIO = 0.25;

/**
 * Configuration for signature field placement
 */
export interface SignatureFieldConfig {
  /** Y position from bottom of page in points (if known) */
  yPosition?: number;
  /** Approximate number of content lines for position estimation */
  contentLines?: number;
}

/**
 * Estimates the Y position of the signature block based on typical naval letter layout.
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
  const contentHeight = contentLines * PDF_SPACING.emptyLine;

  // Position signature about 3 lines above where typed name would be
  // Note: Using 72pt (1 inch) as effective top margin where content starts
  const TOP_MARGIN_PT = 72;
  const estimatedNamePosition = pageHeight - TOP_MARGIN_PT - contentHeight;

  // Ensure reasonable bounds (between 20% and 60% from bottom)
  const minY = pageHeight * MIN_Y_RATIO;
  const maxY = pageHeight * MAX_Y_RATIO;

  return Math.max(minY, Math.min(maxY, estimatedNamePosition + SIGNATURE_FIELD.yAboveName));
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

  // Calculate Y position using estimation if contentLines provided, otherwise use default
  const yPosition =
    config.yPosition ??
    (config.contentLines
      ? estimateSignatureYPosition(height, config.contentLines)
      : height * DEFAULT_Y_RATIO);

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
  lastPage.drawText(PLACEHOLDER_TEXT.content, {
    x: SIGNATURE_FIELD.xOffset + PLACEHOLDER_TEXT.hPadding,
    y: yPosition + SIGNATURE_FIELD.height / 2 - PLACEHOLDER_TEXT.vOffset,
    size: PLACEHOLDER_TEXT.size,
    color: PLACEHOLDER_TEXT.color,
  });

  // Save and return the modified PDF
  return pdfDoc.save();
}
