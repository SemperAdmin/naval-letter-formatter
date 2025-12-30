import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from '@react-pdf/renderer';
import { FormData, ParagraphData } from '@/types';
import { getPDFBodyFont, PDF_FONTS } from '@/lib/pdf-fonts';
import {
  PDF_PAGE,
  PDF_MARGINS,
  PDF_FONT_SIZES,
  PDF_COLORS,
  PDF_INDENTS,
  PDF_PARAGRAPH_TABS,
  PDF_SEAL,
  PDF_SUBJECT,
  PDF_CONTENT_WIDTH,
} from '@/lib/pdf-settings';
import { getPDFSealDataUrl } from '@/lib/pdf-seal';
import { parseAndFormatDate } from '@/lib/date-utils';
import { splitSubject } from '@/lib/naval-format-utils';

interface NavalLetterPDFProps {
  formData: FormData;
  vias: string[];
  references: string[];
  enclosures: string[];
  copyTos: string[];
  paragraphs: ParagraphData[];
}

// Create styles
const createStyles = (bodyFont: 'times' | 'courier', headerType: 'USMC' | 'DON') => {
  const fontFamily = getPDFBodyFont(bodyFont);
  const headerColor = headerType === 'DON' ? PDF_COLORS.don : PDF_COLORS.usmc;

  return StyleSheet.create({
    page: {
      paddingTop: PDF_MARGINS.top,
      paddingBottom: PDF_MARGINS.bottom,
      paddingLeft: PDF_MARGINS.left,
      paddingRight: PDF_MARGINS.right,
      fontFamily: fontFamily,
      fontSize: PDF_FONT_SIZES.body,
    },
    // Header/Letterhead styles
    seal: {
      position: 'absolute',
      top: PDF_SEAL.offsetY,
      left: PDF_SEAL.offsetX,
      width: PDF_SEAL.width,
      height: PDF_SEAL.height,
    },
    letterhead: {
      marginTop: 36, // Space for seal
      marginBottom: 12,
    },
    headerTitle: {
      fontFamily: PDF_FONTS.SERIF,
      fontSize: PDF_FONT_SIZES.title,
      fontWeight: 'bold',
      textAlign: 'center',
      color: headerColor,
    },
    headerLine: {
      fontFamily: PDF_FONTS.SERIF,
      fontSize: PDF_FONT_SIZES.unitLines,
      textAlign: 'center',
      color: headerColor,
    },
    // Address block (SSIC, Code, Date)
    addressBlock: {
      marginLeft: PDF_INDENTS.ssicBlock - PDF_MARGINS.left,
      marginBottom: 12,
    },
    addressLine: {
      fontFamily: fontFamily,
      fontSize: PDF_FONT_SIZES.body,
    },
    // From/To/Via section
    fromToSection: {
      marginBottom: 0,
    },
    fromToLine: {
      flexDirection: 'row',
      fontFamily: fontFamily,
      fontSize: PDF_FONT_SIZES.body,
    },
    fromToLabel: {
      width: PDF_INDENTS.tabStop1,
    },
    // Subject line
    subjectSection: {
      marginTop: 12,
      marginBottom: 12,
    },
    subjectLine: {
      flexDirection: 'row',
      fontFamily: fontFamily,
      fontSize: PDF_FONT_SIZES.body,
    },
    subjectLabel: {
      width: PDF_INDENTS.tabStop1,
    },
    subjectContinuation: {
      marginLeft: PDF_INDENTS.tabStop1,
    },
    // References and Enclosures
    refEnclSection: {
      marginBottom: 12,
    },
    refEnclLine: {
      flexDirection: 'row',
      fontFamily: fontFamily,
      fontSize: PDF_FONT_SIZES.body,
    },
    refEnclLabel: {
      width: PDF_INDENTS.tabStop1,
    },
    refEnclContent: {
      flex: 1,
    },
    // Body paragraphs
    bodySection: {
      marginBottom: 12,
    },
    paragraphRow: {
      flexDirection: 'row',
      marginBottom: 12,
      fontFamily: fontFamily,
      fontSize: PDF_FONT_SIZES.body,
    },
    // Signature block
    signatureBlock: {
      marginTop: 24,
      marginLeft: PDF_INDENTS.signature - PDF_MARGINS.left,
    },
    signatureLine: {
      fontFamily: fontFamily,
      fontSize: PDF_FONT_SIZES.body,
    },
    // Copy to section
    copyToSection: {
      marginTop: 12,
    },
    copyToLabel: {
      fontFamily: fontFamily,
      fontSize: PDF_FONT_SIZES.body,
    },
    copyToLine: {
      marginLeft: PDF_INDENTS.copyTo,
      fontFamily: fontFamily,
      fontSize: PDF_FONT_SIZES.body,
    },
    // Empty line
    emptyLine: {
      height: 14.4,
    },
    // Page header (for page 2+)
    pageHeader: {
      marginBottom: 12,
    },
    // Footer
    footer: {
      position: 'absolute',
      bottom: 36,
      left: 0,
      right: 0,
      textAlign: 'center',
      fontSize: PDF_FONT_SIZES.body,
      fontFamily: fontFamily,
    },
  });
};

/**
 * Generate citation string for a paragraph
 */
function generateCitation(
  paragraph: ParagraphData,
  index: number,
  allParagraphs: ParagraphData[]
): string {
  const { level } = paragraph;

  // Find the list of siblings at the same level that belong to the same parent
  let listStartIndex = 0;
  if (level > 1) {
    for (let i = index - 1; i >= 0; i--) {
      if (allParagraphs[i].level < level) {
        listStartIndex = i + 1;
        break;
      }
    }
  }

  // Count position within that list of siblings
  let count = 0;
  for (let i = listStartIndex; i <= index; i++) {
    const p = allParagraphs[i];
    if (p.level === level) {
      if (p.content.trim() || p.id === paragraph.id) {
        count++;
      }
    }
  }

  if (count === 0) count = 1;

  switch (level) {
    case 1: return `${count}.`;
    case 2: return `${String.fromCharCode(96 + count)}.`;
    case 3: return `(${count})`;
    case 4: return `(${String.fromCharCode(96 + count)})`;
    case 5: return `${count}.`;  // Underlined in rendering
    case 6: return `${String.fromCharCode(96 + count)}.`;
    case 7: return `(${count})`;
    case 8: return `(${String.fromCharCode(96 + count)})`;
    default: return '';
  }
}

/**
 * Render a body paragraph with proper indentation and numbering
 */
function ParagraphItem({
  paragraph,
  index,
  allParagraphs,
  bodyFont,
}: {
  paragraph: ParagraphData;
  index: number;
  allParagraphs: ParagraphData[];
  bodyFont: 'times' | 'courier';
}) {
  const citation = generateCitation(paragraph, index, allParagraphs);
  const level = paragraph.level;
  const tabs = PDF_PARAGRAPH_TABS[level as keyof typeof PDF_PARAGRAPH_TABS];
  const isUnderlined = level >= 5 && level <= 8;

  // For Courier, use fixed-width spacing
  if (bodyFont === 'courier') {
    const indentSpaces = '\u00A0'.repeat((level - 1) * 4);
    const spacesAfterCitation = citation.endsWith('.') ? '\u00A0\u00A0' : '\u00A0';

    return (
      <View style={{ flexDirection: 'row', marginBottom: 12 }}>
        <Text>
          {indentSpaces}
          {isUnderlined ? (
            <>
              <Text style={{ textDecoration: 'underline' }}>
                {citation.replace(/[().]/g, '')}
              </Text>
              {citation.includes('(') ? ')' : '.'}
            </>
          ) : (
            citation
          )}
          {spacesAfterCitation}
          {paragraph.content}
        </Text>
      </View>
    );
  }

  // For Times, use positioned layout
  return (
    <View style={{ flexDirection: 'row', marginBottom: 12 }}>
      <View style={{ width: tabs.citation }} />
      <View style={{ width: tabs.text - tabs.citation, flexShrink: 0 }}>
        {isUnderlined ? (
          <Text>
            {citation.includes('(') && '('}
            <Text style={{ textDecoration: 'underline' }}>
              {citation.replace(/[().]/g, '')}
            </Text>
            {citation.includes(')') ? ')' : '.'}
          </Text>
        ) : (
          <Text>{citation}</Text>
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text>{paragraph.content}</Text>
      </View>
    </View>
  );
}

/**
 * Main Naval Letter PDF Document Component
 */
export function NavalLetterPDF({
  formData,
  vias,
  references,
  enclosures,
  copyTos,
  paragraphs,
}: NavalLetterPDFProps) {
  const styles = createStyles(formData.bodyFont, formData.headerType);
  const sealDataUrl = getPDFSealDataUrl(formData.headerType);
  const formattedDate = parseAndFormatDate(formData.date || '');
  const fontFamily = getPDFBodyFont(formData.bodyFont);

  // Filter to only items with content
  const viasWithContent = vias.filter((v) => v.trim());
  const refsWithContent = references.filter((r) => r.trim());
  const enclsWithContent = enclosures.filter((e) => e.trim());
  const copiesWithContent = copyTos.filter((c) => c.trim());
  const paragraphsWithContent = paragraphs.filter((p) => p.content.trim());

  // Format subject lines
  const formattedSubjLines = splitSubject(formData.subj.toUpperCase(), PDF_SUBJECT.maxLineLength);

  // Spacing helpers for Courier
  const getFromToSpacing = (label: string): string => {
    if (formData.bodyFont === 'courier') {
      if (label === 'From') return 'From:  ';
      if (label === 'To') return 'To:    ';
    }
    return `${label}:`;
  };

  const getViaSpacing = (index: number, total: number): string => {
    if (formData.bodyFont === 'courier') {
      if (total === 1) {
        return 'Via:\u00A0\u00A0\u00A0';
      }
      return index === 0
        ? `Via:\u00A0\u00A0\u00A0(${index + 1})\u00A0`
        : `\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0(${index + 1})\u00A0`;
    }
    if (total === 1) {
      return 'Via:';
    }
    return index === 0 ? `Via:` : '';
  };

  return (
    <Document
      title={formData.subj || 'Naval Letter'}
      author="by Semper Admin"
      subject="Generated Naval Letter Format"
    >
      <Page size="LETTER" style={styles.page}>
        {/* DoD Seal */}
        <Image src={sealDataUrl} style={styles.seal} />

        {/* Letterhead */}
        <View style={styles.letterhead}>
          <Text style={styles.headerTitle}>
            {formData.headerType === 'USMC'
              ? 'UNITED STATES MARINE CORPS'
              : 'DEPARTMENT OF THE NAVY'}
          </Text>
          {formData.line1 && <Text style={styles.headerLine}>{formData.line1}</Text>}
          {formData.line2 && <Text style={styles.headerLine}>{formData.line2}</Text>}
          {formData.line3 && <Text style={styles.headerLine}>{formData.line3}</Text>}
        </View>

        {/* Empty line after letterhead */}
        <View style={styles.emptyLine} />

        {/* SSIC, Originator Code, Date */}
        <View style={styles.addressBlock}>
          <Text style={styles.addressLine}>{formData.ssic || ''}</Text>
          <Text style={styles.addressLine}>{formData.originatorCode || ''}</Text>
          <Text style={styles.addressLine}>{formattedDate}</Text>
        </View>

        {/* Empty line */}
        <View style={styles.emptyLine} />

        {/* From/To */}
        <View style={styles.fromToSection}>
          {formData.bodyFont === 'courier' ? (
            <>
              <Text style={styles.addressLine}>{getFromToSpacing('From')}{formData.from}</Text>
              <Text style={styles.addressLine}>{getFromToSpacing('To')}{formData.to}</Text>
            </>
          ) : (
            <>
              <View style={styles.fromToLine}>
                <Text style={styles.fromToLabel}>From:</Text>
                <Text>{formData.from}</Text>
              </View>
              <View style={styles.fromToLine}>
                <Text style={styles.fromToLabel}>To:</Text>
                <Text>{formData.to}</Text>
              </View>
            </>
          )}

          {/* Via entries */}
          {viasWithContent.map((via, i) => (
            formData.bodyFont === 'courier' ? (
              <Text key={i} style={styles.addressLine}>
                {getViaSpacing(i, viasWithContent.length)}{via}
              </Text>
            ) : (
              <View key={i} style={styles.fromToLine}>
                <Text style={styles.fromToLabel}>{i === 0 ? 'Via:' : ''}</Text>
                {viasWithContent.length > 1 ? (
                  <Text>({i + 1}) {via}</Text>
                ) : (
                  <Text>{via}</Text>
                )}
              </View>
            )
          ))}
        </View>

        {/* Empty line before subject */}
        <View style={styles.emptyLine} />

        {/* Subject */}
        <View style={styles.subjectSection}>
          {formData.bodyFont === 'courier' ? (
            <>
              <Text>Subj:  {formattedSubjLines[0] || ''}</Text>
              {formattedSubjLines.slice(1).map((line, i) => (
                <Text key={i} style={styles.subjectContinuation}>
                  {'       '}{line}
                </Text>
              ))}
            </>
          ) : (
            <>
              <View style={styles.subjectLine}>
                <Text style={styles.subjectLabel}>Subj:</Text>
                <Text>{formattedSubjLines[0] || ''}</Text>
              </View>
              {formattedSubjLines.slice(1).map((line, i) => (
                <Text key={i} style={{ marginLeft: PDF_INDENTS.tabStop1 }}>{line}</Text>
              ))}
            </>
          )}
        </View>

        {/* Empty line */}
        <View style={styles.emptyLine} />

        {/* References */}
        {refsWithContent.length > 0 && (
          <View style={styles.refEnclSection}>
            {refsWithContent.map((ref, i) => {
              const refLetter = String.fromCharCode('a'.charCodeAt(0) + i);
              if (formData.bodyFont === 'courier') {
                const prefix = i === 0
                  ? `Ref:\u00A0\u00A0\u00A0(${refLetter})\u00A0`
                  : `\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0(${refLetter})\u00A0`;
                return <Text key={i}>{prefix}{ref}</Text>;
              }
              return (
                <View key={i} style={styles.refEnclLine}>
                  <Text style={styles.refEnclLabel}>{i === 0 ? 'Ref:' : ''}</Text>
                  <Text>({refLetter}) {ref}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Enclosures */}
        {enclsWithContent.length > 0 && (
          <View style={styles.refEnclSection}>
            {refsWithContent.length > 0 && <View style={styles.emptyLine} />}
            {enclsWithContent.map((encl, i) => {
              const enclNum = i + 1;
              if (formData.bodyFont === 'courier') {
                const prefix = i === 0
                  ? `Encl:\u00A0\u00A0(${enclNum})\u00A0`
                  : `\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0(${enclNum})\u00A0`;
                return <Text key={i}>{prefix}{encl}</Text>;
              }
              return (
                <View key={i} style={styles.refEnclLine}>
                  <Text style={styles.refEnclLabel}>{i === 0 ? 'Encl:' : ''}</Text>
                  <Text>({enclNum}) {encl}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Empty line before body */}
        {(refsWithContent.length > 0 || enclsWithContent.length > 0) && (
          <View style={styles.emptyLine} />
        )}

        {/* Body paragraphs */}
        <View style={styles.bodySection}>
          {paragraphsWithContent.map((p, i) => (
            <ParagraphItem
              key={p.id}
              paragraph={p}
              index={i}
              allParagraphs={paragraphsWithContent}
              bodyFont={formData.bodyFont}
            />
          ))}
        </View>

        {/* Signature block */}
        {formData.sig && (
          <View style={styles.signatureBlock}>
            <View style={styles.emptyLine} />
            <View style={styles.emptyLine} />
            <Text style={styles.signatureLine}>{formData.sig.toUpperCase()}</Text>
            {formData.delegationText && (
              <Text style={styles.signatureLine}>{formData.delegationText}</Text>
            )}
          </View>
        )}

        {/* Copy to section */}
        {copiesWithContent.length > 0 && (
          <View style={styles.copyToSection}>
            <View style={styles.emptyLine} />
            <Text style={styles.copyToLabel}>
              {formData.bodyFont === 'courier' ? 'Copy to:  ' : 'Copy to:'}
            </Text>
            {copiesWithContent.map((copy, i) => (
              <Text key={i} style={styles.copyToLine}>
                {formData.bodyFont === 'courier' ? '       ' : ''}{copy}
              </Text>
            ))}
          </View>
        )}

        {/* Footer with page number - only on pages after first */}
        <Text
          style={styles.footer}
          render={({ pageNumber }) => (pageNumber > 1 ? pageNumber : '')}
          fixed
        />
      </Page>
    </Document>
  );
}

export default NavalLetterPDF;
