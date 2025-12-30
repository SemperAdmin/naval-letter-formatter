/**
 * PDF Signature Field Utility
 *
 * Adds an empty digital signature field to a PDF for CAC/PKI signing in Adobe Reader.
 * The field is positioned above the signature block, aligned with the signer's name.
 */

import { PDFDocument, rgb, PDFPage, PDFName, PDFDict, PDFArray } from 'pdf-lib';
import { PDF_INDENTS } from './pdf-settings';

// Signature field dimensions in points (1 inch = 72 points)
const SIGNATURE_FIELD = {
  width: 108,          // 1.5 inches
  height: 36,          // ~0.5 inches (2 lines at ~18pt)
  xOffset: PDF_INDENTS.signature,  // 3.25" from page left (aligned with signature block)
  yAboveName: 24,      // Points to shift up from the signature name position
};

// Text appearance constants for the placeholder
const PLACEHOLDER_TEXT = {
  content: 'SIGN HERE',
  size: 10,
  hPadding: 25,
  vOffset: 4,
  color: rgb(0.4, 0.4, 0.6),
};

// Default Y position as percentage from bottom if text search fails
const DEFAULT_Y_RATIO = 0.35;

/**
 * Configuration for signature field placement
 */
export interface SignatureFieldConfig {
  /** Y position from bottom of page in points (if known) */
  yPosition?: number;
  /** Signer's name to search for in the PDF to determine positioning */
  signerName?: string;
}

/**
 * Attempts to find text in a PDF page and return its Y position.
 * Searches through the page's content stream for text operations.
 *
 * @param page - The PDF page to search
 * @param searchText - Text to search for (case-insensitive)
 * @returns Y position if found, undefined otherwise
 */
function findTextYPosition(page: PDFPage, searchText: string): number | undefined {
  try {
    const contents = page.node.Contents();
    if (!contents) return undefined;

    // Get the content stream data
    const contentStream = contents instanceof PDFArray
      ? contents.lookup(0)
      : contents;

    if (!contentStream) return undefined;

    const streamDict = contentStream as PDFDict;
    const streamData = streamDict.lookup(PDFName.of('stream'));

    // Try to decode the stream - this is a simplified approach
    // that looks for Tj/TJ operators with the search text
    const node = page.node;
    const rawContent = node.Contents();
    if (!rawContent) return undefined;

    // Get raw bytes from content stream
    let contentBytes: Uint8Array | undefined;
    if (rawContent instanceof PDFDict) {
      // Try to get decoded stream content
      const stream = rawContent as any;
      if (stream.getContents) {
        contentBytes = stream.getContents();
      }
    }

    if (!contentBytes) return undefined;

    // Decode content as string and search for text patterns
    const contentStr = new TextDecoder('latin1').decode(contentBytes);

    // Search for the text - check both hex encoded and regular strings
    const searchUpper = searchText.toUpperCase();
    const searchHex = Array.from(searchUpper).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');

    // Look for text matrix (Tm) operations followed by text show (Tj/TJ)
    // Pattern: x y x y x y Tm ... (text) Tj
    const tmPattern = /(\d+\.?\d*)\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s+Tm/g;

    let lastY = 0;
    let match;
    while ((match = tmPattern.exec(contentStr)) !== null) {
      const y = parseFloat(match[6]); // Y position is the 6th number in Tm matrix
      lastY = y;
    }

    // Check if our search text appears in the content
    if (contentStr.includes(searchUpper) || contentStr.toLowerCase().includes(searchHex.toLowerCase())) {
      // Return the last Y position we found (signature is typically near the end)
      return lastY > 0 ? lastY : undefined;
    }

    return undefined;
  } catch {
    return undefined;
  }
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

  // Determine Y position:
  // 1. Use explicit yPosition if provided
  // 2. Try to find the signer's name text and position above it
  // 3. Fall back to default position
  let yPosition = config.yPosition;

  if (yPosition === undefined && config.signerName) {
    const textY = findTextYPosition(lastPage, config.signerName);
    if (textY !== undefined) {
      // Position the signature box directly above the signer's name
      // Add yAboveName to shift it up from the text baseline
      yPosition = textY + SIGNATURE_FIELD.yAboveName;
    }
  }

  // Fall back to default position if text search didn't work
  if (yPosition === undefined) {
    yPosition = height * DEFAULT_Y_RATIO;
  }

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
