/**
 * PDF Settings for Naval Letter Generation
 * 
 * CORRECTED VALUES - Matched against Word document XML structure
 *
 * Measurements are in points (1 inch = 72 points)
 * Converted from TWIPs used in Word document (1 inch = 1440 TWIPs)
 * Conversion: TWIPs / 20 = points
 * EMUs to points: EMUs / 914400 * 72
 */

// Helper to convert TWIPs to points
export const twipsToPoints = (twips: number): number => twips / 20;

// Page dimensions
export const PDF_PAGE = {
  width: 612,        // 8.5 inches
  height: 792,       // 11 inches
  orientation: 'portrait' as const,
};

// Page margins (matching Word document - pgMar values)
// Word: top="0", right="1440", bottom="1440", left="1440"
export const PDF_MARGINS = {
  top: 72,           // 1" - Word uses 0 but has header offset, so we use 1" to account for seal space
  bottom: 72,        // 1" (1440 TWIPs / 20)
  left: 72,          // 1" (1440 TWIPs / 20)
  right: 72,         // 1" (1440 TWIPs / 20)
};

// Font sizes in points (converted from half-points)
// Word uses sz val in half-points, so sz="24" = 12pt, sz="20" = 10pt, sz="16" = 8pt
export const PDF_FONT_SIZES = {
  title: 10,         // Header title - sz="20" / 2 = 10pt
  unitLines: 8,      // Unit address lines - sz="16" / 2 = 8pt
  body: 12,          // Body text - sz="24" / 2 = 12pt
};

// Colors
export const PDF_COLORS = {
  usmc: '#000000',   // Black for USMC
  don: '#002D72',    // Navy blue for DON
};

// Indentation positions in points (converted from TWIPs)
export const PDF_INDENTS = {
  // Tab stop 1 for From/To/Via/Subj/Ref/Encl labels
  // Word: w:pos="720" TWIPs = 36pt = 0.5"
  tabStop1: 36,

  // Tab stop 2 for Via/Ref numbering
  // Word: w:pos="1046" TWIPs = 52.3pt
  tabStop2: 52.3,

  // SSIC/Code/Date block - left indent from page left edge
  // Word: w:ind w:left="7920" TWIPs = 396pt = 5.5"
  // But this is from the margin, so actual position = 396pt from left margin
  // In react-pdf, this needs to be relative to content area, so subtract left margin
  ssicBlock: 396 - 72,  // 324pt from left margin = 5.5" from page edge minus 1" margin

  // Signature block indent
  // Word: w:ind w:left="4680" TWIPs = 234pt = 3.25"
  signature: 234,

  // Reference/Enclosure hanging indent (Times)
  // Word: w:ind w:left="1080" w:hanging="1080" = 54pt
  refHangingTimes: 54,

  // Reference/Enclosure hanging indent (Courier)
  // Using 1584 TWIPs = 79.2pt for Courier alignment
  refHangingCourier: 79.2,

  // Paragraph level indentation
  // Word: Level 1 tab at 360 TWIPs = 18pt = 0.25"
  levelSpacing: 18,

  // Copy-to indent
  copyTo: 36,        // 0.5" (720 TWIPs / 20)
};

// Paragraph tab stops for 8-level numbering (SECNAV M-5216.5)
// Word document uses these tab positions:
// Level 1: tab at 360 TWIPs (18pt)
// Level 2: tabs at 360, 720 TWIPs
// Level 3: tabs at 720, 1080 TWIPs
// Level 4: tabs at 720, 1080 TWIPs (same as 3)
export const PDF_PARAGRAPH_TABS = {
  1: { citation: 0, text: 18 },      // Level 1: "1." at margin, text at 0.25"
  2: { citation: 18, text: 36 },     // Level 2: "a." at 0.25", text at 0.5"
  3: { citation: 36, text: 54 },     // Level 3: "(1)" at 0.5", text at 0.75"
  4: { citation: 54, text: 72 },     // Level 4: "(a)" at 0.75", text at 1.0"
  5: { citation: 72, text: 90 },     // Level 5: underlined 1. at 1.0", text at 1.25"
  6: { citation: 90, text: 108 },    // Level 6: underlined a. at 1.25", text at 1.5"
  7: { citation: 108, text: 126 },   // Level 7: underlined (1) at 1.5", text at 1.75"
  8: { citation: 126, text: 144 },   // Level 8: underlined (a) at 1.75", text at 2.0"
} as const;

// DoD Seal dimensions and position
// Word header2.xml shows:
// wp:positionH: wp:posOffset="458700" EMUs = 0.5" from page edge
// wp:positionV: wp:posOffset="458700" EMUs = 0.5" from page edge
// wp:extent cx="914400" cy="914400" EMUs = 1" x 1"
export const PDF_SEAL = {
  width: 72,         // 1 inch (914400 EMUs / 914400 * 72)
  height: 72,        // 1 inch
  offsetX: 36,       // 0.5" from page edge (458700 EMUs / 914400 * 72)
  offsetY: 36,       // 0.5" from page edge
};

// Letterhead positioning
// The letterhead text starts at approximately 1.75" from left edge
// and aligns with the seal + some spacing
export const PDF_LETTERHEAD = {
  // Top margin for letterhead text (to clear the seal)
  // Seal is 1" tall starting at 0.5", so seal bottom is at 1.5"
  // Add small gap, letterhead should start around 0.5" from top (centered on seal)
  topMargin: 36,     // 0.5" from top of content area
  
  // Space after letterhead before SSIC block
  afterSpacing: 14.4, // One line height
};

// Subject line configuration
export const PDF_SUBJECT = {
  maxLineLength: 57, // Maximum characters per line (per SECNAV M-5216.5)
  continuationIndent: 36, // 0.5" for continuation lines (matches tabStop1)
};

// Line spacing
export const PDF_SPACING = {
  paragraph: 12,     // Space after paragraphs
  emptyLine: 14.4,   // Height of empty line (12pt font with leading)
  lineHeight: 1.2,   // Line height multiplier
};

// Calculate content width (page width minus margins)
export const PDF_CONTENT_WIDTH = PDF_PAGE.width - PDF_MARGINS.left - PDF_MARGINS.right;

// Header offset for Word compatibility
// Word: header="708" TWIPs = 35.4pt - distance from top of page to header content
export const PDF_HEADER_OFFSET = 35.4;
