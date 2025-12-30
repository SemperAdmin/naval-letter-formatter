import { Font } from '@react-pdf/renderer';

/**
 * Register Liberation fonts for PDF generation
 * Liberation fonts are metrically compatible with Times New Roman and Courier New
 *
 * - Liberation Serif → Times New Roman equivalent
 * - Liberation Mono → Courier New equivalent
 */
export function registerPDFFonts() {
  // Liberation Serif (Times New Roman equivalent)
  Font.register({
    family: 'Liberation Serif',
    fonts: [
      { src: '/fonts/LiberationSerif-Regular.ttf', fontWeight: 'normal' },
      { src: '/fonts/LiberationSerif-Bold.ttf', fontWeight: 'bold' },
    ],
  });

  // Liberation Mono (Courier New equivalent)
  Font.register({
    family: 'Liberation Mono',
    src: '/fonts/LiberationMono-Regular.ttf',
  });

  // Disable hyphenation to match Word behavior
  Font.registerHyphenationCallback((word) => [word]);
}

/**
 * Get the PDF font family name based on the body font setting
 */
export function getPDFBodyFont(bodyFont: 'times' | 'courier'): string {
  return bodyFont === 'courier' ? 'Liberation Mono' : 'Liberation Serif';
}

/**
 * PDF font family constants
 */
export const PDF_FONTS = {
  SERIF: 'Liberation Serif',
  MONO: 'Liberation Mono',
} as const;
