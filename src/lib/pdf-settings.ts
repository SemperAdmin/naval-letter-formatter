/**
 * PDF Settings for Naval Letter Generation
 * 
 * UPDATED: Removed extra blank lines between sections
 * Spacing now matches the tight spacing between paragraphs
 * (like between "2. Points of contact." and "a. Primary CDDM")
 */

// Page dimensions
export const PDF_PAGE = {
  width: 612,        // 8.5 inches
  height: 792,       // 11 inches
  orientation: 'portrait' as const,
};

// Page margins
export const PDF_MARGINS = {
  top: 72,           // 1"
  bottom: 72,        // 1"
  left: 72,          // 1"
  right: 72,         // 1"
};

// Font sizes in points
export const PDF_FONT_SIZES = {
  title: 10,         // Header title
  unitLines: 8,      // Unit address lines
  body: 12,          // Body text
};

// Colors
export const PDF_COLORS = {
  usmc: '#000000',
  don: '#002D72',
};

// DoD Seal
export const PDF_SEAL = {
  width: 72,
  height: 72,
  offsetX: 36,
  offsetY: 36,
};

// Indentation positions in points
export const PDF_INDENTS = {
  tabStop1: 36,
  tabStop2: 52.3,
  ssicBlock: 324,
  signature: 234,
  refHangingTimes: 54,
  refHangingCourier: 79.2,
  levelSpacing: 18,
  copyTo: 36,
};

// Paragraph tab stops
export const PDF_PARAGRAPH_TABS = {
  1: { citation: 0, text: 18 },
  2: { citation: 18, text: 36 },
  3: { citation: 36, text: 54 },
  4: { citation: 54, text: 72 },
  5: { citation: 72, text: 90 },
  6: { citation: 90, text: 108 },
  7: { citation: 108, text: 126 },
  8: { citation: 126, text: 144 },
} as const;

// Subject line
export const PDF_SUBJECT = {
  maxLineLength: 57,
  continuationIndent: 36,
};

// Line spacing - NO extra blank lines between sections
export const PDF_SPACING = {
  // Standard paragraph spacing (bottom margin after each paragraph/line)
  paragraph: 0,      // No extra space - just line height
  
  // Empty line height when explicitly needed
  emptyLine: 14.4,
  
  // Section spacing - same as normal line flow (NO blank line)
  sectionGap: 0,
};

// Content width
export const PDF_CONTENT_WIDTH = PDF_PAGE.width - PDF_MARGINS.left - PDF_MARGINS.right;
