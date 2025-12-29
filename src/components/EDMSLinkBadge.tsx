/**
 * EDMS Link Badge Component
 *
 * Visual indicator displayed when the NLF is launched from an EDMS system.
 * Shows the linked EDMS record ID and provides a tooltip with more details.
 */

'use client';

import { EDMSContext } from '../hooks/useEDMSContext';
import { Badge } from './ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from './ui/tooltip';

interface EDMSLinkBadgeProps {
  edmsContext: EDMSContext;
}

export function EDMSLinkBadge({ edmsContext }: EDMSLinkBadgeProps) {
  // Don't render anything if not linked to EDMS
  if (!edmsContext.isLinked) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            className="cursor-help"
            style={{
              backgroundColor: '#1e40af',
              color: 'white',
              border: '1px solid #3b82f6',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              fontSize: '0.75rem',
              fontWeight: 600
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            EDMS: {edmsContext.edmsId}
          </Badge>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          style={{
            backgroundColor: '#1f2937',
            color: 'white',
            border: '1px solid #374151',
            padding: '8px 12px',
            maxWidth: '300px'
          }}
        >
          <div style={{ fontSize: '0.8rem' }}>
            <p style={{ margin: '0 0 4px 0', fontWeight: 600 }}>
              Linked to EDMS Record
            </p>
            <p style={{ margin: '0', color: '#9ca3af' }}>
              Record ID: {edmsContext.edmsId}
            </p>
            {edmsContext.unitCode && (
              <p style={{ margin: '4px 0 0 0', color: '#9ca3af' }}>
                Unit: {edmsContext.unitCode}
              </p>
            )}
            <p style={{ margin: '8px 0 0 0', fontSize: '0.7rem', color: '#6b7280' }}>
              Document will be saved to EDMS when generated
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
