import { ImageRun, HorizontalPositionRelativeFrom, VerticalPositionRelativeFrom, convertInchesToTwip } from 'docx';
import { DOD_SEAL_DETAILED, NAVY_SEAL_BLUE } from './dod-seal-data';

async function dataUrlToArrayBuffer(dataUrl: string): Promise<ArrayBuffer> {
  const response = await fetch(dataUrl);
  return response.arrayBuffer();
}

/**
 * Get the appropriate seal buffer based on header type
 * @param headerType - 'USMC' for Marine Corps (black DoD seal) or 'DON' for Navy (blue seal)
 * @returns ArrayBuffer containing the seal image data
 */
export async function getDoDSealBuffer(headerType: 'USMC' | 'DON' = 'USMC'): Promise<ArrayBuffer> {
  // Use Navy blue seal for DON, DoD seal for USMC
  const sealData = (headerType === 'DON' && NAVY_SEAL_BLUE && !NAVY_SEAL_BLUE.includes('YOUR_NAVY_SEAL_BASE64_DATA_HERE'))
    ? NAVY_SEAL_BLUE
    : DOD_SEAL_DETAILED;
  return dataUrlToArrayBuffer(sealData);
}

/**
 * Create an ImageRun with the appropriate seal based on header type
 * @param headerType - 'USMC' for Marine Corps (black DoD seal) or 'DON' for Navy (blue seal)
 * @returns ImageRun configured for document header
 */
export async function createDoDSeal(headerType: 'USMC' | 'DON' = 'USMC'): Promise<ImageRun> {
  // Use Navy blue seal for DON, DoD seal for USMC
  const sealData = (headerType === 'DON' && NAVY_SEAL_BLUE && !NAVY_SEAL_BLUE.includes('YOUR_NAVY_SEAL_BASE64_DATA_HERE'))
    ? NAVY_SEAL_BLUE
    : DOD_SEAL_DETAILED;
  const sealBuffer = await dataUrlToArrayBuffer(sealData);

  return new ImageRun({
    data: sealBuffer,
    transformation: {
      width: 96,
      height: 96,
    },
    floating: {
      horizontalPosition: {
        relative: HorizontalPositionRelativeFrom.PAGE,
        offset: 458700  // 0.5 inches from left edge
      },
      verticalPosition: {
        relative: VerticalPositionRelativeFrom.PAGE,
        offset: 458700  // 0.5 inches from top edge
      },
    },
  });
}

/**
 * Synchronous version - converts base64 seal data to ArrayBuffer
 * @param headerType - 'USMC' for Marine Corps (black DoD seal) or 'DON' for Navy (blue seal)
 * @returns ArrayBuffer containing the seal image data
 */
export function getDoDSealBufferSync(headerType: 'USMC' | 'DON' = 'USMC'): ArrayBuffer {
  // Use Navy blue seal for DON, DoD seal for USMC
  const sealData = (headerType === 'DON' && NAVY_SEAL_BLUE && !NAVY_SEAL_BLUE.includes('YOUR_NAVY_SEAL_BASE64_DATA_HERE'))
    ? NAVY_SEAL_BLUE
    : DOD_SEAL_DETAILED;

  // Extract base64 data from data URL
  const base64Data = sealData.split(',')[1];
  if (!base64Data) {
    throw new Error('Invalid base64 data');
  }

  // Convert base64 to ArrayBuffer
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}
