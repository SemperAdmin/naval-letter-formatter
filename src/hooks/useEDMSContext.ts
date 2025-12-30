/**
 * React Hook for EDMS (Electronic Document Management System) Context
 *
 * Detects when the NLF is launched from an EDMS system via URL parameters
 * and provides context for optional integration features.
 *
 * URL Parameters:
 * - edmsId: Unique identifier of the EDMS record (request_id)
 * - unitCode: Unit code for auto-selection (unit_uic)
 * - returnUrl: URL to redirect back to EDMS after completion
 * - supabaseUrl: Supabase project URL for API calls
 * - supabaseKey: Supabase anon key for authentication
 * - mode: 'edit' to load existing letter, 'new' or omitted for new letter
 * - fileUrl: URL to fetch existing letter JSON (required when mode=edit)
 */

'use client';

import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';

export type EDMSMode = 'new' | 'edit';

export interface EDMSContext {
  /** Whether the NLF was launched from an EDMS system */
  isLinked: boolean;
  /** EDMS record identifier (request_id) */
  edmsId: string | null;
  /** Unit code for auto-selection (unit_uic) */
  unitCode: string | null;
  /** URL to return to after completion */
  returnUrl: string | null;
  /** Supabase project URL */
  supabaseUrl: string | null;
  /** Supabase anon key */
  supabaseKey: string | null;
  /** Mode: 'new' for new letter, 'edit' for editing existing */
  mode: EDMSMode;
  /** URL to fetch existing letter data (for edit mode) */
  fileUrl: string | null;
  /** Document ID being edited (for updates) */
  documentId: string | null;
}

/**
 * Helper to decode URL-encoded strings (handles double-encoding)
 */
function decodeUrlParam(value: string | null): string | null {
  if (!value) return null;
  try {
    let decoded = value;
    while (decoded.includes('%')) {
      const newDecoded = decodeURIComponent(decoded);
      if (newDecoded === decoded) break;
      decoded = newDecoded;
    }
    return decoded;
  } catch {
    return value;
  }
}

/**
 * Hook to detect and manage EDMS launch context
 *
 * When the NLF is launched from an EDMS system, URL parameters are used
 * to establish a connection. This hook extracts those parameters and
 * provides a consistent interface for EDMS integration.
 *
 * @example
 * // Standalone launch (no EDMS)
 * // URL: https://nlf.example.com/
 * // Returns: { isLinked: false, edmsId: null, ... }
 *
 * @example
 * // EDMS launch with Supabase
 * // URL: https://nlf.example.com/?edmsId=req-123&unitCode=M00001&returnUrl=...&supabaseUrl=https://xxx.supabase.co&supabaseKey=eyJ...
 * // Returns: { isLinked: true, edmsId: 'req-123', supabaseUrl: 'https://xxx.supabase.co', ... }
 */
export function useEDMSContext(): EDMSContext {
  const searchParams = useSearchParams();

  const edmsContext = useMemo(() => {
    const edmsId = searchParams.get('edmsId');
    const unitCode = searchParams.get('unitCode');
    const returnUrl = decodeUrlParam(searchParams.get('returnUrl'));
    const supabaseUrl = decodeUrlParam(searchParams.get('supabaseUrl'));
    const supabaseKey = searchParams.get('supabaseKey');
    const modeParam = searchParams.get('mode');
    const fileUrl = decodeUrlParam(searchParams.get('fileUrl'));
    const documentId = searchParams.get('documentId');

    // Determine mode: 'edit' if explicitly set and fileUrl provided, otherwise 'new'
    const mode: EDMSMode = (modeParam === 'edit' && fileUrl) ? 'edit' : 'new';

    return {
      isLinked: !!edmsId,
      edmsId,
      unitCode,
      returnUrl,
      supabaseUrl,
      supabaseKey,
      mode,
      fileUrl,
      documentId
    };
  }, [searchParams]);

  return edmsContext;
}

/**
 * Type guard to check if EDMS context has required fields for Supabase API calls
 */
export function isValidEDMSContext(context: EDMSContext): context is EDMSContext & {
  edmsId: string;
  supabaseUrl: string;
  supabaseKey: string;
} {
  return !!(context.isLinked && context.edmsId && context.supabaseUrl && context.supabaseKey);
}

/**
 * Type guard to check if context has return URL for navigation
 */
export function hasReturnUrl(context: EDMSContext): context is EDMSContext & {
  returnUrl: string;
} {
  return !!context.returnUrl;
}

/**
 * Type guard to check if context is in edit mode with valid fileUrl
 */
export function isEditMode(context: EDMSContext): context is EDMSContext & {
  mode: 'edit';
  fileUrl: string;
} {
  return context.mode === 'edit' && !!context.fileUrl;
}
