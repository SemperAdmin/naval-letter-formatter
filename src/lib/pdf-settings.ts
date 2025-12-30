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

// Page margins
// Word document: top="0", right="1440", bottom="1440", left="1440"
// But we need to account for where content actually starts
export const PDF_MARGINS = {
  top: 0,            // 0" - we handle positioning manually for header
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

// DoD Seal dimensions and position
// Word header2.xml shows:
// wp:positionH: wp:posOffset="458700" EMUs = 0.5" from page edge
// wp:positionV: wp:posOffset="458700" EMUs = 0.5" from page edge
// wp:extent cx="914400" cy="914400" EMUs = 1" x 1"
export const PDF_SEAL = {
  width: 72,         // 1 inch
  height: 72,        // 1 inch
  offsetX: 36,       // 0.5" from page edge (458700 / 914400 * 72)
  offsetY: 36,       // 0.5" from page edge
};

// Letterhead positioning
// The seal is 1" tall, positioned 0.5" from top
// Seal vertical center is at 0.5" + 0.5" = 1.0" from page top
// Letterhead text should vertically center around the seal
export const PDF_LETTERHEAD = {
  // Top position for letterhead text to align with seal center
  // Seal center is at 72pt (1") from page top
  // With 4 lines of header text (~40pt total height), start around 52pt
  topPosition: 52,   // Approximately 0.72" from page top
  
  // Space after letterhead (before SSIC block)
  afterSpacing: 14.4,
};

// Indentation positions in points (converted from TWIPs)
export const PDF_INDENTS = {
  // Tab stop 1 for From/To/Via/Subj/Ref/Encl labels
  // Word: w:pos="720" TWIPs = 36pt = 0.5"
  tabStop1: 36,

  // Tab stop 2 for Via/Ref numbering
  // Word: w:pos="1046" TWIPs = 52.3pt
  tabStop2: 52.3,

  // SSIC/Code/Date block - left indent from left margin
  // Word: w:ind w:left="7920" TWIPs = 396pt = 5.5" from left margin edge
  // Since left margin is 1", this is 5.5" from left margin = 4.5" from content edge
  // In react-pdf with 1" left margin, use: 396 - 72 = 324pt from content left
  ssicBlock: 324,

  // Signature block indent
  // Word: w:ind w:left="4680" TWIPs = 234pt = 3.25" from left margin
  signature: 234,

  // Reference/Enclosure hanging indent (Times)
  // Word: w:ind w:left="1080" w:hanging="1080" = 54pt
  refHangingTimes: 54,

  // Reference/Enclosure hanging indent (Courier)
  refHangingCourier: 79.2,

  // Paragraph level indentation (0.25" per level)
  // Word: Level 1 tab at 360 TWIPs = 18pt
  levelSpacing: 18,

  // Copy-to indent
  copyTo: 36,
};

// Paragraph tab stops for 8-level numbering (SECNAV M-5216.5)
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

// Subject line configuration
export const PDF_SUBJECT = {
  maxLineLength: 57,
  continuationIndent: 36,
};

// Line spacing
export const PDF_SPACING = {
  paragraph: 12,
  emptyLine: 14.4,
  lineHeight: 1.2,
};

// Calculate content width (page width minus margins)
export const PDF_CONTENT_WIDTH = PDF_PAGE.width - PDF_MARGINS.left - PDF_MARGINS.right;

// First page content start position (after letterhead area)
// Seal bottom is at 1.5" (108pt), add some space = ~115pt
export const PDF_FIRST_PAGE_CONTENT_START = 115;
