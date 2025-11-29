
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
    allParagraphs: ParagraphData[]
): Paragraph {
    const { level, content } = paragraph;
    const { citation } = generateCitation(paragraph, index, allParagraphs);
    
    const spec = NAVAL_TAB_STOPS[level as keyof typeof NAVAL_TAB_STOPS] || NAVAL_TAB_STOPS[1];
    const isUnderlined = level >= 5;

    // Build the citation run with potential underlining
    let citationRuns: TextRun[];
    if (isUnderlined) {
        if (level === 5 || level === 6) { // e.g. 1. or a.
             citationRuns = [new TextRun({ text: citation, font: "Times New Roman", size: 24, underline: {} })];
        } else { // e.g. (1) or (a)
             citationRuns = [
                new TextRun({ text: "(", font: "Times New Roman", size: 24 }),
                new TextRun({ text: citation.replace(/[()]/g, ''), font: "Times New Roman", size: 24, underline: {} }),
                new TextRun({ text: ")", font: "Times New Roman", size: 24 }),
            ];
        }
    } else {
        citationRuns = [new TextRun({ text: citation, font: "Times New Roman", size: 24 })];
    }
    
    // Handle Level 1 separately: no initial tab, citation starts at 0"
    if (level === 1) {
        return new Paragraph({
            children: [
                ...citationRuns,
                new TextRun({ text: `\t${content}`, font: "Times New Roman", size: 24 }),
            ],
            tabStops: [
                { type: TabStopType.LEFT, position: spec.text },
            ],
            alignment: AlignmentType.JUSTIFIED,
        });
    }

    // Levels 2–8: use two tabs for standard hanging indent
    return new Paragraph({
        children: [
            new TextRun({ text: '\t' }), // First tab
            ...citationRuns,
            new TextRun({ text: `\t${content}`, font: "Times New Roman", size: 24 }),
        ],
        tabStops: [
            { type: TabStopType.LEFT, position: spec.citation },
            { type: TabStopType.LEFT, position: spec.text },
        ],
        alignment: AlignmentType.JUSTIFIED,
    });
}
