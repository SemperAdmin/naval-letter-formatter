/**
 * PDF Settings for Naval Letter Generation
 * 
 * FINAL CORRECTED VALUES - Precisely matched against Word document
 *
 * Word Document Key Settings:
 * - pgMar: top="0", right="1440", bottom="1440", left="1440", header="708"
 * - Seal: 458700 EMUs from page edge (0.5"), size 914400 EMUs (1")
 * - Seal uses wrapSquare - text wraps around it
 * 
 * Measurements: 1 inch = 72 points = 1440 TWIPs = 914400 EMUs
 */

// Page dimensions
export const PDF_PAGE = {
  width: 612,        // 8.5 inches
  height: 792,       // 11 inches
  orientation: 'portrait' as const,
};

// Page margins - matches Word: left/right/bottom = 1"
// Top margin is 0 in Word, but content starts after header area
export const PDF_MARGINS = {
  top: 72,           // 1" - standard top margin for body content
  bottom: 72,        // 1"
  left: 72,          // 1"
  right: 72,         // 1"
};

// Font sizes in points
export const PDF_FONT_SIZES = {
  title: 10,         // Header title (UNITED STATES MARINE CORPS) - sz="20" half-pts
  unitLines: 8,      // Unit address lines - sz="16" half-pts
  body: 12,          // Body text - sz="24" half-pts
};

// Colors
export const PDF_COLORS = {
  usmc: '#000000',   // Black for USMC
  don: '#002D72',    // Navy blue for DON
};

// DoD Seal dimensions and position (from Word header2.xml)
// Positioned relative to PAGE edge, not margin
export const PDF_SEAL = {
  width: 72,         // 1" (914400 EMUs)
  height: 72,        // 1"
  offsetX: 36,       // 0.5" from page left edge (458700 EMUs)
  offsetY: 36,       // 0.5" from page top edge
};

// Letterhead positioning
// In Word, letterhead is centered text that wraps around the seal
// The seal occupies 0.5" to 1.5" horizontally
// Letterhead text is centered on the page, but the left portion is blocked by seal
export const PDF_LETTERHEAD = {
  // Vertical position - align with seal (seal top is at 0.5")
  // Word header="708" TWIPs = 35.4pt from page top for header content start
  topMargin: 36,     // Start at 0.5" from page top (aligns with seal top)
};

// Indentation positions in points
export const PDF_INDENTS = {
  // Tab stop for From/To/Via/Subj/Ref/Encl labels
  // Word: w:pos="720" TWIPs = 36pt = 0.5"
  tabStop1: 36,

  // Tab stop 2 for Via/Ref numbering  
  // Word: w:pos="1046" TWIPs = 52.3pt
  tabStop2: 52.3,

  // SSIC/Code/Date block position
  // Word: w:ind w:left="7920" TWIPs = 396pt from left margin edge
  // This means 5.5" from left margin = 4.5" indent from content area
  // In react-pdf with 1" margins, content width is 6.5"
  // Position from left margin: 396 - 72 = 324pt
  ssicBlock: 324,

  // Signature block indent
  // Word: w:ind w:left="4680" TWIPs = 234pt = 3.25"
  signature: 234,

  // Reference/Enclosure hanging indent
  refHangingTimes: 54,    // 1080 TWIPs
  refHangingCourier: 79.2, // 1584 TWIPs

  // Paragraph level spacing (0.25" per level)
  levelSpacing: 18,  // 360 TWIPs

  // Copy-to indent
  copyTo: 36,
};

// Paragraph tab stops for 8-level numbering
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
  emptyLine: 14.4,   // Height of one empty line
};

// Content width
export const PDF_CONTENT_WIDTH = PDF_PAGE.width - PDF_MARGINS.left - PDF_MARGINS.right;
