/**
 * Return to EDMS Dialog Component
 *
 * Displayed after a letter is successfully generated and sent to EDMS.
 * Offers the user a choice to stay in NLF or return to the EDMS system.
 */

'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription
} from './ui/dialog';
import { Button } from './ui/button';

interface ReturnToEDMSDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** URL to return to EDMS */
  returnUrl: string | null;
  /** Callback when dialog is closed */
  onClose: () => void;
  /** Optional: Whether there was an EDMS error (document still generated) */
  edmsError?: string | null;
}

export function ReturnToEDMSDialog({
  open,
  returnUrl,
  onClose,
  edmsError
}: ReturnToEDMSDialogProps) {
  const handleReturn = () => {
    if (returnUrl) {
      window.location.href = returnUrl;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        style={{
          backgroundColor: '#1a1a2e',
          border: '1px solid #b8860b',
          color: 'white',
          maxWidth: '450px'
        }}
      >
        <DialogHeader>
          <DialogTitle
            style={{
              color: edmsError ? '#f59e0b' : '#b8860b',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {edmsError ? (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
                  <path d="M12 9v4" />
                  <path d="M12 17h.01" />
                </svg>
                Letter Generated with Warning
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <path d="m9 11 3 3L22 4" />
                </svg>
                Letter Saved Successfully
              </>
            )}
          </DialogTitle>
          <DialogDescription style={{ color: '#9ca3af', marginTop: '8px' }}>
            {edmsError ? (
              <>
                Your Word document has been generated and downloaded successfully.
                <br />
                <span style={{ color: '#f59e0b', marginTop: '8px', display: 'block' }}>
                  Note: Could not send to EDMS: {edmsError}
                </span>
              </>
            ) : (
              'Your letter has been generated as a Word document and the data has been sent to EDMS.'
            )}
          </DialogDescription>
        </DialogHeader>

        <div
          style={{
            backgroundColor: '#16213e',
            border: '1px solid #374151',
            borderRadius: '8px',
            padding: '12px',
            marginTop: '8px'
          }}
        >
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#d1d5db' }}>
            <strong>What would you like to do?</strong>
          </p>
          <ul
            style={{
              margin: '8px 0 0 0',
              paddingLeft: '20px',
              fontSize: '0.8rem',
              color: '#9ca3af'
            }}
          >
            <li>
              <strong>Return to EDMS</strong> - Continue working on your record
            </li>
            <li>
              <strong>Stay Here</strong> - Create another letter or make changes
            </li>
          </ul>
        </div>

        <DialogFooter style={{ marginTop: '16px', gap: '8px' }}>
          <Button
            variant="outline"
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              borderColor: '#6b7280',
              color: '#d1d5db'
            }}
          >
            Stay Here
          </Button>
          {returnUrl && (
            <Button
              onClick={handleReturn}
              style={{
                backgroundColor: '#b8860b',
                color: 'white',
                border: 'none'
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ marginRight: '6px' }}
              >
                <path d="m12 19-7-7 7-7" />
                <path d="M19 12H5" />
              </svg>
              Return to EDMS
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
