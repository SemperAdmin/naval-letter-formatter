/**
 * EDMS (Electronic Document Management System) Integration Service
 *
 * Handles communication with Supabase backend for EDMS integration.
 * This service is only used when the NLF is launched from an EDMS
 * system with valid Supabase context parameters.
 */

import { EDMSContext, isValidEDMSContext } from '../hooks/useEDMSContext';
import { FormData, ParagraphData } from '../types';

/**
 * Payload structure for the Supabase Edge Function
 */
export interface NLFPayload {
  attachment: {
    version: string;
    createdAt: string;
    edmsId: string;
    ssic: string;
    ssicTitle: string;
    subject: string;
    from: string;
    to: string;
    via: string[];
    paragraphs: ParagraphData[];
    references: string[];
    enclosures: string[];
    copyTos: string[];
    letterType: 'basic' | 'endorsement';
    headerType: 'USMC' | 'DON';
    originatorCode: string;
    date: string;
    signature: string;
    unit: {
      line1: string;
      line2: string;
      line3: string;
    };
  };
  filename: string;
  unitCode: string | null;
  recordUpdates: {
    ssic: string;
    subject: string;
  };
}

/**
 * Result of an EDMS send operation
 */
export interface EDMSSendResult {
  success: boolean;
  error?: string;
  data?: {
    documentId?: string;
    fileUrl?: string;
    message?: string;
  };
}

/**
 * Build the NLF payload for the Supabase Edge Function
 */
export function buildNLFPayload(
  formData: FormData,
  vias: string[],
  references: string[],
  enclosures: string[],
  copyTos: string[],
  paragraphs: ParagraphData[],
  edmsId: string,
  unitCode: string | null,
  ssicTitle: string = ''
): NLFPayload {
  const timestamp = Date.now();
  const sanitizedSubject = formData.subj
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);

  return {
    attachment: {
      version: '1.0',
      createdAt: new Date().toISOString(),
      edmsId,
      ssic: formData.ssic,
      ssicTitle,
      subject: formData.subj,
      from: formData.from,
      to: formData.to,
      via: vias.filter(v => v.trim() !== ''),
      paragraphs,
      references: references.filter(r => r.trim() !== ''),
      enclosures: enclosures.filter(e => e.trim() !== ''),
      copyTos: copyTos.filter(c => c.trim() !== ''),
      letterType: formData.documentType,
      headerType: formData.headerType,
      originatorCode: formData.originatorCode,
      date: formData.date,
      signature: formData.sig,
      unit: {
        line1: formData.line1,
        line2: formData.line2,
        line3: formData.line3
      }
    },
    filename: `naval-letter-${formData.ssic || 'draft'}-${sanitizedSubject || 'untitled'}-${timestamp}.json`,
    unitCode,
    recordUpdates: {
      ssic: formData.ssic,
      subject: formData.subj
    }
  };
}

/**
 * Send letter data to EDMS via Supabase Edge Function
 *
 * This function sends the structured letter data to the Supabase Edge Function
 * which handles:
 * 1. Uploading the JSON to Supabase Storage (edms-docs bucket)
 * 2. Creating a record in edms_documents table
 * 3. Updating the edms_requests record with ssic, subject, and document_ids
 *
 * @param formData - The letter form data
 * @param vias - Via routing list
 * @param references - References list
 * @param enclosures - Enclosures list
 * @param copyTos - Copy to distribution list
 * @param paragraphs - Letter body paragraphs
 * @param edmsContext - EDMS context from URL parameters
 * @param ssicTitle - Optional SSIC title for metadata
 * @returns Result object with success status and error if failed
 */
export async function sendToEDMS(
  formData: FormData,
  vias: string[],
  references: string[],
  enclosures: string[],
  copyTos: string[],
  paragraphs: ParagraphData[],
  edmsContext: EDMSContext,
  ssicTitle: string = ''
): Promise<EDMSSendResult> {
  // Validate EDMS context has Supabase credentials
  if (!isValidEDMSContext(edmsContext)) {
    return {
      success: false,
      error: 'Invalid EDMS context: missing required fields (edmsId, supabaseUrl, or supabaseKey)'
    };
  }

  const payload = buildNLFPayload(
    formData,
    vias,
    references,
    enclosures,
    copyTos,
    paragraphs,
    edmsContext.edmsId,
    edmsContext.unitCode,
    ssicTitle
  );

  try {
    // Call the Supabase Edge Function
    const edgeFunctionUrl = `${edmsContext.supabaseUrl}/functions/v1/receive-naval-letter`;

    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${edmsContext.supabaseKey}`,
        'apikey': edmsContext.supabaseKey
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `Edge function returned ${response.status}`);
    }

    const data = await response.json();

    return {
      success: true,
      data: {
        documentId: data.documentId,
        fileUrl: data.fileUrl,
        message: data.message || 'Successfully saved to EDMS'
      }
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('[EDMS Service] Send failed:', errorMessage);

    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Check if EDMS integration is properly configured
 */
export function isEDMSConfigured(edmsContext: EDMSContext): boolean {
  return isValidEDMSContext(edmsContext);
}
