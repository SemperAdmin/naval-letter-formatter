import { DOD_SEAL_DETAILED, NAVY_SEAL_BLUE } from './dod-seal-data';

/**
 * Get the appropriate seal data URL for PDF rendering
 * @param headerType - 'USMC' for Marine Corps (black DoD seal) or 'DON' for Navy (blue seal)
 * @returns Base64 data URL for the seal image
 */
export function getPDFSealDataUrl(headerType: 'USMC' | 'DON' = 'USMC'): string {
  // Use Navy blue seal for DON, DoD seal for USMC
  const sealData = (headerType === 'DON' && NAVY_SEAL_BLUE && !NAVY_SEAL_BLUE.includes('YOUR_NAVY_SEAL_BASE64_DATA_HERE'))
    ? NAVY_SEAL_BLUE
    : DOD_SEAL_DETAILED;

  return sealData;
}
