/**
 * Naval letter formatting utilities
 * Handles font selection and spacing for Times New Roman vs Courier New
 */

/**
 * Gets the font name based on user selection
 *
 * @param bodyFont - The font type selection
 * @returns Full font name
 */
export function getBodyFont(bodyFont: 'times' | 'courier'): string {
  return bodyFont === 'courier' ? 'Courier New' : 'Times New Roman';
}

/**
 * Gets proper spacing for From/To labels
 *
 * @param label - "From" or "To"
 * @param bodyFont - The font type
 * @returns Formatted label with appropriate spacing
 */
export function getFromToSpacing(label: string, bodyFont: 'times' | 'courier'): string {
  if (bodyFont === 'courier') {
    if (label === 'From') return 'From:  '; // 2 spaces
    if (label === 'To') return 'To:    '; // 4 spaces
  }
  return `${label}:\t`; // Tab for Times New Roman
}

/**
 * Gets proper spacing for Via entries
 *
 * @param index - Index of the via entry
 * @param bodyFont - The font type
 * @returns Formatted via label with spacing
 */
export function getViaSpacing(index: number, bodyFont: 'times' | 'courier'): string {
  if (bodyFont === 'courier') {
    return index === 0
      ? `Via:\u00A0\u00A0\u00A0(${index + 1})\u00A0` // 3 spaces before, 1 space after
      : `\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0(${index + 1})\u00A0`; // 7 spaces before, 1 space after
  }
  return index === 0 ? `Via:\t(${index + 1})\t` : `\t(${index + 1})\t`;
}

/**
 * Gets proper spacing for Subject label
 *
 * @param bodyFont - The font type
 * @returns Formatted subject label with spacing
 */
export function getSubjSpacing(bodyFont: 'times' | 'courier'): string {
  return bodyFont === 'courier' ? 'Subj:  ' : 'Subj:\t'; // 2 spaces or tab
}

/**
 * Gets proper spacing for Reference entries
 *
 * @param letter - Reference letter (a, b, c, etc.)
 * @param index - Index of the reference
 * @param bodyFont - The font type
 * @returns Formatted reference label with spacing
 */
export function getRefSpacing(letter: string, index: number, bodyFont: 'times' | 'courier'): string {
  if (bodyFont === 'courier') {
    return index === 0
      ? `Ref:\u00A0\u00A0\u00A0(${letter})\u00A0` // 3 spaces before, 1 space after
      : `\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0(${letter})\u00A0`; // 7 spaces before, 1 space after
  }
  // Times: tab to position "(a)", then single space before text
  return index === 0 ? `Ref:\t(${letter}) ` : `\t(${letter}) `;
}

/**
 * Gets proper spacing for Enclosure entries
 *
 * @param number - Enclosure number
 * @param index - Index of the enclosure
 * @param bodyFont - The font type
 * @returns Formatted enclosure label with spacing
 */
export function getEnclSpacing(number: number, index: number, bodyFont: 'times' | 'courier'): string {
  if (bodyFont === 'courier') {
    return index === 0
      ? `Encl:\u00A0\u00A0(${number})\u00A0` // 2 spaces before, 1 space after
      : `\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0(${number})\u00A0`; // 7 spaces before, 1 space after
  }
  // Times: tab to position "(1)", then single space before text
  return index === 0 ? `Encl:\t(${number}) ` : `\t(${number}) `;
}

/**
 * Gets proper spacing for Copy To label
 *
 * @param bodyFont - The font type
 * @returns Formatted copy to label with spacing
 */
export function getCopyToSpacing(bodyFont: 'times' | 'courier'): string {
  return bodyFont === 'courier' ? 'Copy to:  ' : 'Copy to:'; // 2 spaces for Courier
}

/**
 * Splits a string into chunks without breaking words
 * Used for subject line wrapping
 *
 * @param str - The string to split
 * @param chunkSize - Maximum characters per chunk
 * @returns Array of string chunks
 */
export function splitSubject(str: string, chunkSize: number): string[] {
  const chunks: string[] = [];
  if (!str) return chunks;

  let i = 0;
  while (i < str.length) {
    let chunk = str.substring(i, i + chunkSize);

    // Don't break words - find last space if we're not at the end
    if (i + chunkSize < str.length && str[i + chunkSize] !== ' ' && chunk.includes(' ')) {
      const lastSpaceIndex = chunk.lastIndexOf(' ');
      if (lastSpaceIndex > -1) {
        chunk = chunk.substring(0, lastSpaceIndex);
        i += chunk.length + 1; // +1 to skip the space
      } else {
        i += chunkSize;
      }
    } else {
      i += chunkSize;
    }

    chunks.push(chunk.trim());
  }

  return chunks;
}
