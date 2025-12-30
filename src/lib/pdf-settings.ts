/**
 * PDF Settings for Naval Letter Generation
 *
 * Measurements are in points (1 inch = 72 points)
 * Converted from TWIPs used in Word document (1 inch = 1440 TWIPs)
 * Conversion: TWIPs / 20 = points
 */

// Helper to convert TWIPs to points
export const twipsToPoints = (twips: number): number => twips / 20;

// Page dimensions
export const PDF_PAGE = {
  width: 612,        // 8.5 inches
  height: 792,       // 11 inches
  orientation: 'portrait' as const,
};

// Page margins (matching Word document)
export const PDF_MARGINS = {
  top: 0,            // 0" - seal and letterhead start at top
  bottom: 72,        // 1"
  left: 72,          // 1"
  right: 72,         // 1"
};

// Font sizes in points
export const PDF_FONT_SIZES = {
  title: 10,         // Header title (UNITED STATES MARINE CORPS)
  unitLines: 8,      // Unit address lines
  body: 12,          // Body text
};

// Colors
export const PDF_COLORS = {
  usmc: '#000000',   // Black for USMC
  don: '#002D72',    // Navy blue for DON
};

// Indentation positions in points
export const PDF_INDENTS = {
  // Tab stop 1 (From/To/Via/Subj/Ref/Encl label alignment)
  tabStop1: 36,      // 0.5" (720 TWIPs / 20)

  // Tab stop 2 (Via numbering)
  tabStop2: 52.3,    // 0.726" (1046 TWIPs / 20)

  // SSIC/Code/Date block (right-aligned)
  ssicBlock: 396,    // 5.5" from left (7920 TWIPs / 20)

  // Signature block
  signature: 234,    // 3.25" (4680 TWIPs / 20)

  // Reference/Enclosure hanging indent (Times)
  refHangingTimes: 54,    // 0.75" (1080 TWIPs / 20)

  // Reference/Enclosure hanging indent (Courier)
  refHangingCourier: 79.2, // 1.1" (1584 TWIPs / 20)

  // Paragraph level indentation (0.25" per level)
  levelSpacing: 18,  // 0.25" (360 TWIPs / 20)

  // Copy-to indent
  copyTo: 36,        // 0.5" (720 TWIPs / 20)
};

// Paragraph tab stops for 8-level numbering (SECNAV M-5216.5)
// Each level: citation position and text position
export const PDF_PARAGRAPH_TABS = {
  1: { citation: 0, text: 18 },      // Level 1: "1." at 0", text at 0.25"
  2: { citation: 18, text: 36 },     // Level 2: "a." at 0.25", text at 0.5"
  3: { citation: 36, text: 54 },     // Level 3: "(1)" at 0.5", text at 0.75"
  4: { citation: 54, text: 72 },     // Level 4: "(a)" at 0.75", text at 1.0"
  5: { citation: 72, text: 90 },     // Level 5: underlined 1. at 1.0", text at 1.25"
  6: { citation: 90, text: 108 },    // Level 6: underlined a. at 1.25", text at 1.5"
  7: { citation: 108, text: 126 },   // Level 7: underlined (1) at 1.5", text at 1.75"
  8: { citation: 126, text: 144 },   // Level 8: underlined (a) at 1.75", text at 2.0"
} as const;

// DoD Seal dimensions
export const PDF_SEAL = {
  width: 72,         // 1 inch (96px at 96dpi, scaled to 72pt)
  height: 72,
  offsetX: 36,       // 0.5" from page edge
  offsetY: 36,       // 0.5" from page edge
};

// Subject line configuration
export const PDF_SUBJECT = {
  maxLineLength: 57, // Maximum characters per line
  continuationIndent: 36, // 0.5" for continuation lines
};

// Line spacing
export const PDF_SPACING = {
  paragraph: 12,     // Space after paragraphs (6pt in Word = ~12pt line height)
  emptyLine: 14.4,   // Height of empty line (12pt font + leading)
};

// Calculate content width (page width minus margins)
export const PDF_CONTENT_WIDTH = PDF_PAGE.width - PDF_MARGINS.left - PDF_MARGINS.right;
