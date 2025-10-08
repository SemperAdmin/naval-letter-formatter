import { Paragraph, TextRun, TabStopType, AlignmentType } from 'docx';

interface ParagraphData {
    id: number;
    level: number;
    content: string;
}

// 1 inch = 1440 TWIPs. All values are in TWIPs.
// These specs define the tab stop positions for each level's citation
// and where the text following the citation should begin.
const NAVAL_TAB_STOPS = {
    // Level 1: "1." at 0", text at 0.25"
    1: { citation: 0, text: 360 },
    // Level 2: "a." at 0.25", text at 0.5"
    2: { citation: 360, text: 720 },
    // Level 3: "(1)" at 0.5", text at 0.75"
    3: { citation: 720, text: 1080 },
    // Level 4: "(a)" at 0.75", text at 1.0"
    4: { citation: 1080, text: 1440 },
    // Levels 5-8 continue the pattern
    5: { citation: 1440, text: 1800 },
    6: { citation: 1800, text: 2160 },
    7: { citation: 2160, text: 2520 },
    8: { citation: 2520, text: 2880 },
};


/**
 * Generates the correct citation string (e.g., "1.", "a.", "(1)") for a given paragraph.
 * This function calculates the count based on preceding sibling paragraphs at the same level.
 */
function generateCitation(
  paragraph: ParagraphData,
  index: number,
  allParagraphs: ParagraphData[]
): { citation: string } {
    const { level } = paragraph;
    
    // Find the list of siblings at the same level that belong to the same parent.
    let listStartIndex = 0;
    if (level > 1) {
        // Search backwards from the current paragraph to find the parent.
        for (let i = index - 1; i >= 0; i--) {
            if (allParagraphs[i].level < level) {
                listStartIndex = i + 1;
                break;
            }
        }
    }

    // Count position within that list of siblings.
    let count = 0;
    for (let i = listStartIndex; i <= index; i++) {
        const p = allParagraphs[i];
        // Only count paragraphs at the same level within the same sibling group.
        if (p.level === level) {
             if (p.content.trim() || p.id === paragraph.id) {
                count++;
            }
        }
    }
    
    if (count === 0) count = 1;

    let citation = '';
    switch (level) {
        case 1: citation = `${count}.`; break;
        case 2: citation = `${String.fromCharCode(96 + count)}.`; break;
        case 3: citation = `(${count})`; break;
        case 4: citation = `(${String.fromCharCode(96 + count)})`; break;
        // Per SECNAV M-5216.5, levels 5-8 citations are underlined
        case 5: citation = `${count}.`; break; 
        case 6: citation = `${String.fromCharCode(96 + count)}.`; break;
        case 7: citation = `(${count})`; break;
        case 8: citation = `(${String.fromCharCode(96 + count)})`; break;
        default: citation = '';
    }

    return { citation };
}


export function createFormattedParagraph(
  paragraph: ParagraphData,
  index: number,
  allParagraphs: ParagraphData[],
  font: string = "Times New Roman"
): Paragraph {
    const { content, level } = paragraph;
    const { citation } = generateCitation(paragraph, index, allParagraphs);
    const spec = NAVAL_TAB_STOPS[level as keyof typeof NAVAL_TAB_STOPS];
    
    const isCourier = font === "Courier New";

    // Build citation runs with proper formatting
    let citationRuns: TextRun[];
    
    // Underline letters at levels 2 and 4 per regulation
    if (level === 2 || level === 4) {
        if (!citation.includes('(')) { // e.g. 1. or a.
             citationRuns = [new TextRun({ text: citation, font: font, size: 24, underline: {} })];
        } else { // e.g. (1) or (a)
             citationRuns = [
                new TextRun({ text: "(", font: font, size: 24 }),
                new TextRun({ text: citation.replace(/[()]/g, ''), font: font, size: 24, underline: {} }),
                new TextRun({ text: ")", font: font, size: 24 }),
            ];
        }
    } else {
        citationRuns = [new TextRun({ text: citation, font: font, size: 24 })];
    }
    
    // For Courier New, use non-breaking spaces instead of tabs
    if (isCourier) {
        // Calculate leading spaces based on level using non-breaking spaces
        // Level 1: 0, Level 2: 4, Level 3: 8, Level 4: 12, Level 5: 16, Level 6: 20, Level 7: 24, Level 8: 28
        const indentSpaces = '\u00A0'.repeat((level - 1) * 4); // 4 non-breaking spaces per level
        
        // Determine spacing after citation: 2 spaces for periods, 1 space for parentheses
        const spacesAfterCitation = citation.endsWith('.') ? '\u00A0\u00A0' : '\u00A0';
        
        return new Paragraph({
            children: [
                new TextRun({ text: indentSpaces, font: font, size: 24 }),
                ...citationRuns,
                new TextRun({ text: spacesAfterCitation + content, font: font, size: 24 })
            ],
            alignment: AlignmentType.LEFT,
        });
    }
    
    // For Times New Roman, use tabs (original behavior)
    // Handle Level 1 separately: no initial tab, citation starts at 0"
    if (level === 1) {
        return new Paragraph({
            children: [
                ...citationRuns,
                new TextRun({ text: `\t${content}`, font: font, size: 24 }),
            ],
            tabStops: [
                { type: TabStopType.LEFT, position: spec.text },
            ],
            alignment: AlignmentType.LEFT,
        });
    }

    // Levels 2–8: use two tabs for standard hanging indent
    return new Paragraph({
        children: [
            new TextRun({ text: '\t' }), // First tab
            ...citationRuns,
            new TextRun({ text: `\t${content}`, font: font, size: 24 }),
        ],
        tabStops: [
            { type: TabStopType.LEFT, position: spec.citation },
            { type: TabStopType.LEFT, position: spec.text },
        ],
        alignment: AlignmentType.LEFT,
    });
}
