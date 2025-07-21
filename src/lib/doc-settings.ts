import { Paragraph, TextRun, AlignmentType, TabStopType } from "docx";

// Constants for SECNAV M-5216.5 compliance
export const DOC_SETTINGS = {
  font: "Times New Roman",
  fontSize: 24, // 12pt
  pageMargins: {
    top: 0,         // No top margin
    bottom: 1440,   // 1" bottom
    left: 1440,     // 1" left
    right: 1440,    // 1" right
  },
  spacing: {
    after: 120      // 6pt spacing after paragraphs
  },
  pageSize: {
      width: 12240,   // 8.5 inches in TWIPs (8.5 * 1440)
      height: 15840,  // 11 inches in TWIPs (11 * 1440)
  }
};

// Tab stop positions in TWIPs
export const TAB_STOPS = {
  first: 720,   // 0.5"
  second: 1046, // 0.726"
};

// Indentation values
export const INDENTS = {
  subject: 720,         // 0.5"
  hanging: 360,         // 0.25"
  date: 7920,           // 5.5"
  signature: 4680       // 3.25"
};

// Helper to create subject line with correct indentation and tab stop
export const createSubjectLine = (subject: string) => {
    return new Paragraph({
        children: [
            new TextRun({
                text: "Subj:\t",
                font: "Times New Roman",
                size: 24,
            }),
            new TextRun({
                text: subject.toUpperCase(),
                font: "Times New Roman",
                size: 24,
            }),
        ],
        tabStops: [
            { type: TabStopType.LEFT, position: TAB_STOPS.first }, // Aligns with Encl:
        ],
        indent: {
            left: 0, // No hanging indent
        },
    });
};


// Helper to create From/To/Via lines with correct indentation and tab stop
export const createFromToViaLine = (label: string, value: string) => {
  return new Paragraph({
    children: [
      new TextRun({
        text: `${label}:\t${value}`,
        font: "Times New Roman",
        size: 24
      }),
    ],
    tabStops: [
      { type: TabStopType.LEFT, position: 720 },
    ],
    indent: {
      left: 720,
      hanging: 360
    },
    spacing: { after: 120 }
  });
};

// Helper to create date line
export const createDateLine = (date: string) => {
  return new Paragraph({
    children: [
      new TextRun({
        text: date,
        font: "Times New Roman",
        size: 24
      }),
    ],
    alignment: AlignmentType.LEFT,
    indent: {
      left: INDENTS.date
    },
    spacing: { after: 120 }
  });
};

// Helper to create signature block
export const createSignatureBlock = (name: string, delegation: string | null = null) => {
  const lines = [
    new TextRun({
      text: name,
      font: "Times New Roman",
      size: 24
    })
  ];
  if (delegation) {
    lines.push(
      new TextRun({
        text: `\n${delegation}`,
        font: "Times New Roman",
        size: 24,
        break: 1
      })
    );
  }

  return new Paragraph({
    children: lines,
    alignment: AlignmentType.LEFT,
    indent: {
      left: INDENTS.signature
    },
    spacing: { after: 120 }
  });
};