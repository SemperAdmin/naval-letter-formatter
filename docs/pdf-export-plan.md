# PDF Export Feature Implementation Plan

## Overview
Add PDF export as an optional format alongside the existing Word (.docx) export. The PDF must match the Word document formatting exactly to comply with SECNAV M-5216.5 standards for naval correspondence.

## Font Strategy

### Open-Source Font Selection
Since proprietary fonts (Times New Roman, Courier New) are not available, we'll use **Liberation Fonts** which are metrically compatible:

| Proprietary Font | Open-Source Replacement | Metric Match |
|------------------|------------------------|--------------|
| Times New Roman | Liberation Serif | ✓ Exact |
| Courier New | Liberation Mono | ✓ Exact |

**Source**: [Liberation Fonts GitHub](https://github.com/liberationfonts/liberation-fonts)

Liberation fonts were specifically designed by Ascender Corporation (commissioned by Red Hat) to have identical character widths and heights to their Microsoft counterparts, ensuring documents maintain the same layout.

### Font Files Required
Download TTF files from the Liberation Fonts releases:
- `LiberationSerif-Regular.ttf`
- `LiberationSerif-Bold.ttf`
- `LiberationMono-Regular.ttf`

Store in: `public/fonts/`

---

## Technical Implementation

### Library Selection
**@react-pdf/renderer** - React component-based PDF generation
- Supports TTF font embedding
- CSS Flexbox-like styling for precise positioning
- Built-in page break and header/footer support

Reference: [react-pdf.org/fonts](https://react-pdf.org/fonts)

### New Dependencies
```json
{
  "@react-pdf/renderer": "^3.4.0"
}
```

---

## File Structure

```
src/
├── lib/
│   ├── pdf-generator.ts           # Main export function (mirrors generateDocument)
│   ├── pdf-settings.ts            # PDF settings (mirrors doc-settings.ts)
│   └── pdf-fonts.ts               # Font registration
│
├── components/
│   └── pdf/
│       ├── NavalLetterPDF.tsx     # Main document component
│       ├── PDFLetterhead.tsx      # Header with seal + unit info
│       ├── PDFAddressBlock.tsx    # SSIC, Code, Date
│       ├── PDFFromToSection.tsx   # From, To, Via
│       ├── PDFSubjectLine.tsx     # Subject with wrapping
│       ├── PDFReferences.tsx      # References section
│       ├── PDFEnclosures.tsx      # Enclosures section
│       ├── PDFBodyParagraph.tsx   # Body paragraphs with 8-level numbering
│       ├── PDFSignatureBlock.tsx  # Signature and delegation
│       ├── PDFCopyTo.tsx          # Copy to section
│       └── PDFPageHeader.tsx      # Page 2+ header (subject line)
│
└── app/
    └── page.tsx                   # Updated with export dropdown
```

---

## Implementation Phases

### Phase 1: Foundation
1. Install @react-pdf/renderer
2. Download and add Liberation font files to `public/fonts/`
3. Create `pdf-fonts.ts` with font registration
4. Create `pdf-settings.ts` with measurements (convert TWIPs to points)
5. Create basic `NavalLetterPDF.tsx` component structure

### Phase 2: Letterhead & Header Block
1. Implement `PDFLetterhead.tsx`
   - DoD seal image embedding (96×96px)
   - Centered title ("UNITED STATES MARINE CORPS" / "DEPARTMENT OF THE NAVY")
   - Unit address lines (line1, line2, line3)
   - Handle USMC (black) vs DON (navy blue #002D72) colors
2. Implement `PDFAddressBlock.tsx`
   - Right-aligned SSIC, Originator Code, Date
   - Position at 5.5" from left margin

### Phase 3: Address & Subject Sections
1. Implement `PDFFromToSection.tsx`
   - From/To/Via lines with proper spacing
   - Handle single vs. multiple Via entries
   - Times vs. Courier spacing differences
2. Implement `PDFSubjectLine.tsx`
   - "Subj:" prefix with proper indentation
   - 57-character line wrapping
   - Continuation line indentation

### Phase 4: References & Enclosures
1. Implement `PDFReferences.tsx`
   - "Ref: (a)" format with hanging indent
   - Letter progression (a, b, c...)
2. Implement `PDFEnclosures.tsx`
   - "Encl: (1)" format with hanging indent
   - Number progression (1, 2, 3...)

### Phase 5: Body Paragraphs
1. Implement `PDFBodyParagraph.tsx`
   - 8-level paragraph numbering per SECNAV M-5216.5
   - Levels 1-4: Standard citations (1., a., (1), (a))
   - Levels 5-8: Underlined numbers/letters (not punctuation)
   - Proper indentation for each level
   - Handle both Times and Courier font spacing

### Phase 6: Signature & Copy To
1. Implement `PDFSignatureBlock.tsx`
   - 3.25" left indent
   - Name in UPPERCASE
   - Delegation text (By direction, Acting, For)
2. Implement `PDFCopyTo.tsx`
   - "Copy to:" label
   - Indented recipient list

### Phase 7: Page Headers/Footers
1. Implement `PDFPageHeader.tsx`
   - Subject line on page 2+
   - First page: DoD seal only
2. Implement page footer
   - Centered page numbers
   - First page handling (empty for basic, numbered for endorsement)

### Phase 8: Integration
1. Update `generateDocument` function to support PDF option
2. Create dropdown UI on Generate button
3. Implement `generatePDF()` function
4. Test side-by-side with Word output for formatting match

### Phase 9: Endorsement Support
1. Extend PDF components for endorsement format
2. Handle endorsement-specific elements:
   - Endorsement identification line
   - Starting page number
   - Different footer behavior

---

## Measurement Conversions

The Word document uses TWIPs (1/1440 inch). PDF uses points (1/72 inch).

**Conversion: 1 point = 20 TWIPs** (or TWIPs / 20 = points)

| Element | TWIPs | Points | Inches |
|---------|-------|--------|--------|
| Page width | 12240 | 612 | 8.5" |
| Page height | 15840 | 792 | 11" |
| Side margins | 1440 | 72 | 1" |
| Bottom margin | 1440 | 72 | 1" |
| Top margin | 0 | 0 | 0" |
| Tab stop 1 | 720 | 36 | 0.5" |
| Tab stop 2 | 1046 | 52.3 | 0.726" |
| SSIC indent | 7920 | 396 | 5.5" |
| Signature indent | 4680 | 234 | 3.25" |
| Ref hanging indent (Times) | 1080 | 54 | 0.75" |
| Ref hanging indent (Courier) | 1584 | 79.2 | 1.1" |
| Para level spacing | 360 | 18 | 0.25" |

### Font Sizes
| Word Size (half-points) | Points | Usage |
|------------------------|--------|-------|
| 24 | 12pt | Body text |
| 20 | 10pt | Header title |
| 16 | 8pt | Unit lines |

---

## UI Changes

### Generate Button Dropdown
Replace single "Generate" button with a dropdown menu:

```
┌─────────────────────────┐
│  Generate ▼             │
├─────────────────────────┤
│  📄 Word Document (.docx)│
│  📑 PDF Document (.pdf) │
└─────────────────────────┘
```

### Component Updates
- Modify `StickyActionBar.tsx` to accept dropdown props
- Or create new `GenerateDropdown.tsx` component

---

## Testing Checklist

### Visual Comparison
- [ ] Header text matches (font, size, centering)
- [ ] DoD seal position and size matches
- [ ] SSIC/Code/Date alignment matches
- [ ] From/To/Via spacing matches
- [ ] Subject line wrapping matches
- [ ] Reference/Enclosure hanging indents match
- [ ] All 8 paragraph levels match
- [ ] Signature block position matches
- [ ] Page numbers match
- [ ] Page 2+ header matches

### Font Verification
- [ ] Liberation Serif renders identically to Times New Roman
- [ ] Liberation Mono renders identically to Courier New
- [ ] Character widths produce same line breaks
- [ ] Bold text renders correctly

### Edge Cases
- [ ] Very long subject lines (multiple wraps)
- [ ] Many references (>26 = beyond 'z')
- [ ] Deep paragraph nesting (level 8)
- [ ] Multiple pages
- [ ] Empty optional fields

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Font rendering differences between browsers | Test in Chrome, Firefox, Safari, Edge |
| PDF file size with embedded fonts | Consider font subsetting |
| @react-pdf/renderer SSR issues | Use dynamic import with ssr: false |
| Liberation fonts slight visual differences | Acceptable since metrics match; document layout identical |

---

## Success Criteria

1. PDF output matches Word output when printed side-by-side
2. All SECNAV M-5216.5 formatting requirements met
3. Both Times and Courier font options work correctly
4. Basic letters and endorsements both supported
5. Export dropdown is intuitive and matches existing UI style
6. File downloads with correct naming convention

---

## Future Enhancements (Post-MVP)
- DoD PKI digital signing integration (original goal)
- PDF/A compliance for long-term archiving
- Batch export (Word + PDF together)
- Print preview mode
