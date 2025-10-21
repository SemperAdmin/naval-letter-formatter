// Naval Letter Formatter - Seal Switching Logic
import { ImageRun, HorizontalPositionRelativeFrom, VerticalPositionRelativeFrom, convertInchesToTwip } from 'docx';
import { DOW_SEAL_BLACK, NAVY_SEAL_BLUE } from './seal-data';

/**
 * Letter head type options
 */
export type LetterheadType = 'dow' | 'navy';

/**
 * Converts a data URL to ArrayBuffer for use with docx
 */
async function dataUrlToArrayBuffer(dataUrl: string): Promise<ArrayBuffer> {
  const response = await fetch(dataUrl);
  return response.arrayBuffer();
}

/**
 * Gets the seal buffer for the selected letterhead type
 * @param letterheadType - The type of letterhead ('dow' or 'navy')
 * @returns ArrayBuffer containing the seal image data
 */
export async function getSealBuffer(letterheadType: LetterheadType = 'dow'): Promise<ArrayBuffer> {
  // Select the appropriate seal based on letterhead type
  // Fallback to DoW seal if Navy seal is not ready (placeholder check)
  const sealData = (letterheadType === 'navy' && NAVY_SEAL_BLUE && !NAVY_SEAL_BLUE.includes('PLACEHOLDER'))
    ? NAVY_SEAL_BLUE
    : DOW_SEAL_BLACK;

  return dataUrlToArrayBuffer(sealData);
}

/**
 * Creates a seal ImageRun for document generation
 * @param letterheadType - The type of letterhead ('dow' or 'navy')
 * @returns ImageRun configured with the appropriate seal
 */
export async function createSeal(letterheadType: LetterheadType = 'dow'): Promise<ImageRun> {
  // Select the appropriate seal based on letterhead type
  const sealData = (letterheadType === 'navy' && NAVY_SEAL_BLUE && !NAVY_SEAL_BLUE.includes('PLACEHOLDER'))
    ? NAVY_SEAL_BLUE
    : DOW_SEAL_BLACK;

  const sealBuffer = await dataUrlToArrayBuffer(sealData);

  return new ImageRun({
    data: sealBuffer,
    transformation: {
      width: convertInchesToTwip(0.067),
      height: convertInchesToTwip(0.067),
    },
    floating: {
      horizontalPosition: {
        relative: HorizontalPositionRelativeFrom.PAGE,
        offset: 458700
      },
      verticalPosition: {
        relative: VerticalPositionRelativeFrom.PAGE,
        offset: 458700
      },
    },
  });
}
