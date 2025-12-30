import { pdf } from '@react-pdf/renderer';
import { FormData, ParagraphData } from '@/types';
import { registerPDFFonts } from './pdf-fonts';
import NavalLetterPDF from '@/components/pdf/NavalLetterPDF';
import React from 'react';

// Track if fonts have been registered
let fontsRegistered = false;

/**
 * Generate a PDF blob from the naval letter data
 */
export async function generatePDFBlob(
  formData: FormData,
  vias: string[],
  references: string[],
  enclosures: string[],
  copyTos: string[],
  paragraphs: ParagraphData[]
): Promise<Blob> {
  // Register fonts once
  if (!fontsRegistered) {
    registerPDFFonts();
    fontsRegistered = true;
  }

  // Create the PDF document element
  const document = React.createElement(NavalLetterPDF, {
    formData,
    vias,
    references,
    enclosures,
    copyTos,
    paragraphs,
  });

  // Generate PDF blob
  const blob = await pdf(document).toBlob();
  return blob;
}

/**
 * Generate and download a PDF file
 */
export async function downloadPDF(
  formData: FormData,
  vias: string[],
  references: string[],
  enclosures: string[],
  copyTos: string[],
  paragraphs: ParagraphData[]
): Promise<void> {
  const blob = await generatePDFBlob(
    formData,
    vias,
    references,
    enclosures,
    copyTos,
    paragraphs
  );

  // Create filename (same convention as Word but with .pdf)
  let filename: string;
  if (formData.documentType === 'endorsement') {
    filename = `${formData.endorsementLevel}_ENDORSEMENT_on_${formData.subj || 'letter'}_Page${formData.startingPageNumber}.pdf`;
  } else {
    filename = `${formData.subj || 'NavalLetter'}.pdf`;
  }

  // Open in new tab for download
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank', 'noopener,noreferrer');

  // Clean up the blob URL after a delay (give time for new tab to load)
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
