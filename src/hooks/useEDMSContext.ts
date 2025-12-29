/**
 * React Hook for EDMS (Electronic Document Management System) Context
 *
 * Detects when the NLF is launched from an EDMS system via URL parameters
 * and provides context for optional integration features.
 *
 * URL Parameters:
 * - edmsId: Unique identifier of the EDMS record
 * - unitCode: Unit code for auto-selection (RUC code)
 * - returnUrl: URL to redirect back to EDMS after completion
 * - token: Authentication token for EDMS API calls
 */

'use client';

import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';

export interface EDMSContext {
  /** Whether the NLF was launched from an EDMS system */
  isLinked: boolean;
  /** EDMS record identifier */
  edmsId: string | null;
  /** Unit code for auto-selection (RUC code) */
  unitCode: string | null;
  /** URL to return to after completion */
  returnUrl: string | null;
  /** Authentication token for EDMS API */
  token: string | null;
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
 * // EDMS launch
 * // URL: https://nlf.example.com/?edmsId=REC-2024-001&unitCode=12345&returnUrl=https://edms.example.com/record/REC-2024-001&token=abc123
 * // Returns: { isLinked: true, edmsId: 'REC-2024-001', unitCode: '12345', ... }
 */
export function useEDMSContext(): EDMSContext {
  const searchParams = useSearchParams();

  const edmsContext = useMemo(() => {
    const edmsId = searchParams.get('edmsId');
    const unitCode = searchParams.get('unitCode');
    const returnUrl = searchParams.get('returnUrl');
    const token = searchParams.get('token');

    return {
      isLinked: !!edmsId,
      edmsId,
      unitCode,
      returnUrl,
      token
    };
  }, [searchParams]);

  return edmsContext;
}

/**
 * Type guard to check if EDMS context has all required fields for API calls
 */
export function isValidEDMSContext(context: EDMSContext): context is EDMSContext & {
  edmsId: string;
  returnUrl: string;
  token: string;
} {
  return !!(context.isLinked && context.edmsId && context.returnUrl && context.token);
}
