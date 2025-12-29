/**
 * EDMS (Electronic Document Management System) Integration Service
 *
 * Handles all communication with external EDMS systems.
 * This service is only used when the NLF is launched from an EDMS
 * system with valid context parameters.
 */

import { EDMSContext, isValidEDMSContext } from '../hooks/useEDMSContext';
import { FormData, ParagraphData } from '../types';

/**
 * Payload structure for EDMS attachment API
 */
export interface EDMSPayload {
  /** Schema version for forward compatibility */
  version: string;
  /** ISO timestamp of creation */
  createdAt: string;
  /** EDMS record identifier this attachment belongs to */
  edmsId: string;
  /** Standard Subject Identification Code */
  ssic: string;
  /** SSIC title/description (if available) */
  ssicTitle: string;
  /** Letter subject line */
  subject: string;
  /** From field */
  from: string;
  /** To field */
  to: string;
  /** Via routing (intermediate addressees) */
  via: string[];
  /** Letter body paragraphs */
  paragraphs: ParagraphData[];
  /** References list */
  references: string[];
  /** Enclosures list */
  enclosures: string[];
  /** Copy to distribution list */
  copyTos: string[];
  /** Document type: basic letter or endorsement */
  letterType: 'basic' | 'endorsement';
  /** Header type: USMC or DON */
  headerType: 'USMC' | 'DON';
  /** Originator code */
  originatorCode: string;
  /** Letter date */
  date: string;
  /** Signature block */
  signature: string;
  /** Unit information */
  unit: {
    line1: string;
    line2: string;
    line3: string;
  };
}

/**
 * Result of an EDMS send operation
 */
export interface EDMSSendResult {
  /** Whether the operation succeeded */
  success: boolean;
  /** Error message if failed */
  error?: string;
  /** Response data if successful */
  data?: {
    attachmentId?: string;
    message?: string;
  };
}

/**
 * Build the EDMS payload from letter form data
 */
export function buildEDMSPayload(
  formData: FormData,
  vias: string[],
  references: string[],
  enclosures: string[],
  copyTos: string[],
  paragraphs: ParagraphData[],
  edmsId: string,
  ssicTitle: string = ''
): EDMSPayload {
  return {
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
  };
}

/**
 * Generate a filename for the EDMS attachment
 */
export function generateEDMSFilename(ssic: string, subject: string): string {
  const sanitizedSubject = subject
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);
  const timestamp = Date.now();
  return `naval-letter-${ssic || 'draft'}-${sanitizedSubject || 'untitled'}-${timestamp}.json`;
}

/**
 * Send letter data to the EDMS system
 *
 * This function sends the structured letter data to the EDMS API endpoint.
 * The EDMS system can then store this as an attachment to the parent record.
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
  // Validate EDMS context
  if (!isValidEDMSContext(edmsContext)) {
    return {
      success: false,
      error: 'Invalid EDMS context: missing required fields (edmsId or returnUrl)'
    };
  }

  const payload = buildEDMSPayload(
    formData,
    vias,
    references,
    enclosures,
    copyTos,
    paragraphs,
    edmsContext.edmsId,
    ssicTitle
  );

  const filename = generateEDMSFilename(formData.ssic, formData.subj);

  try {
    // Construct the API endpoint URL
    const apiUrl = new URL('/api/attachments', edmsContext.returnUrl);

    const response = await fetch(apiUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        attachment: payload,
        filename,
        recordUpdates: {
          ssic: formData.ssic,
          subject: formData.subj,
          date: formData.date,
          from: formData.from,
          to: formData.to
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`EDMS responded with ${response.status}: ${errorText}`);
    }

    const data = await response.json().catch(() => ({}));

    return {
      success: true,
      data: {
        attachmentId: data.attachmentId,
        message: data.message || 'Successfully sent to EDMS'
      }
    };

  } catch (error) {
    // Handle network errors and other exceptions
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    // Log for debugging (in production, this would go to a logging service)
    console.error('[EDMS Service] Send failed:', errorMessage);

    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Check EDMS connection status
 *
 * Validates that the EDMS system is reachable and the token is valid.
 * This can be used to show connection status in the UI.
 */
export async function checkEDMSConnection(edmsContext: EDMSContext): Promise<{
  connected: boolean;
  error?: string;
}> {
  if (!isValidEDMSContext(edmsContext)) {
    return { connected: false, error: 'Invalid EDMS context' };
  }

  try {
    const healthUrl = new URL('/api/health', edmsContext.returnUrl);

    const response = await fetch(healthUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      // Short timeout for health check
      signal: AbortSignal.timeout(5000)
    });

    if (response.ok) {
      return { connected: true };
    }

    return {
      connected: false,
      error: `EDMS returned status ${response.status}`
    };

  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Connection failed'
    };
  }
}
