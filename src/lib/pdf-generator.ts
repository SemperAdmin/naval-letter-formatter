import { pdf } from '@react-pdf/renderer';
import { FormData, ParagraphData } from '@/types';
import { registerPDFFonts } from './pdf-fonts';
import NavalLetterPDF from '@/components/pdf/NavalLetterPDF';
import React from 'react';
import { openBlobInNewTab } from './blob-utils';
import { addSignatureField } from './pdf-signature-field';
import { logError } from './console-utils';

// Track if fonts have been registered
let fontsRegistered = false;

/**
 * Generate a PDF blob from the naval letter data
 * Includes a digital signature field for CAC/PKI signing in Adobe Reader
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

  // Generate initial PDF blob
  const initialBlob = await pdf(document).toBlob();

  // Try to add digital signature field for CAC signing
  try {
    const pdfBytes = await initialBlob.arrayBuffer();

    // Pass signer name to help locate where to place the signature field
    const signedPdfBytes = await addSignatureField(pdfBytes, {
      signerName: formData.sig,
    });
    return new Blob([signedPdfBytes], { type: 'application/pdf' });
  } catch (error) {
    // If signature field addition fails, return the original PDF
    logError('PDF Signature Field', error);
    return initialBlob;
  }
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

  // Open in new tab for download with proper filename
  openBlobInNewTab(blob, filename);
}
