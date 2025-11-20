/**
 * StickyActionBar Component
 *
 * A persistent action bar that stays visible while scrolling, providing
 * quick access to key actions: Save, Import, Export, Clear, and Generate.
 */

"use client"

import * as React from "react"

interface StickyActionBarProps {
  onSaveDraft: () => void;
  onImport: () => void;
  onExport: () => void;
  onClearForm: () => void;
  onGenerate: () => void;
  isGenerating: boolean;
  isValid: boolean;
  lastSaved?: string; // Timestamp of last save
}

export function StickyActionBar({
  onSaveDraft,
  onImport,
  onExport,
  onClearForm,
  onGenerate,
  isGenerating,
  isValid,
  lastSaved
}: StickyActionBarProps) {
  const [showLabels, setShowLabels] = React.useState(true);

  // Detect scroll to minimize bar on mobile
  React.useEffect(() => {
    const handleResize = () => {
      setShowLabels(window.innerWidth >= 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      <style jsx>{`
        .sticky-action-bar {
          position: sticky;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          border-bottom: 3px solid #b8860b;
          padding: 12px 20px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        .action-bar-title {
          color: #b8860b;
          font-weight: 600;
          font-size: 1.1rem;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .action-bar-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .action-bar-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .action-bar-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .action-bar-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .action-bar-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .action-bar-btn i {
          font-size: 16px;
        }

        .action-bar-btn-primary {
          background: linear-gradient(135deg, #b8860b, #ffd700);
          color: #1a1a2e;
          border: none;
          font-weight: 600;
          padding: 10px 20px;
        }

        .action-bar-btn-primary:hover:not(:disabled) {
          background: linear-gradient(135deg, #ffd700, #ffed4e);
          box-shadow: 0 4px 12px rgba(184, 134, 11, 0.4);
        }

        .action-bar-btn-primary:disabled {
          background: #6c757d;
          color: rgba(255, 255, 255, 0.6);
        }

        .action-bar-btn-danger {
          background: rgba(220, 53, 69, 0.2);
          border-color: rgba(220, 53, 69, 0.4);
        }

        .action-bar-btn-danger:hover:not(:disabled) {
          background: rgba(220, 53, 69, 0.3);
          border-color: rgba(220, 53, 69, 0.6);
        }

        .last-saved {
          color: rgba(255, 255, 255, 0.7);
          font-size: 12px;
          font-style: italic;
          margin-left: 8px;
        }

        .loading-spinner {
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 2px solid rgba(26, 26, 46, 0.3);
          border-top: 2px solid #1a1a2e;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .sticky-action-bar {
            padding: 8px 12px;
            gap: 6px;
          }

          .action-bar-title {
            font-size: 0.9rem;
          }

          .action-bar-btn {
            padding: 8px 10px;
            font-size: 0;
          }

          .action-bar-btn i {
            margin: 0;
            font-size: 18px;
          }

          .action-bar-btn-primary {
            padding: 10px 12px;
          }

          .last-saved {
            display: none;
          }
        }

        @media (max-width: 480px) {
          .action-bar-title span {
            display: none;
          }

          .action-bar-actions {
            gap: 4px;
          }

          .action-bar-btn {
            padding: 8px;
          }
        }
      `}</style>

      <div className="sticky-action-bar">
        <div className="action-bar-title">
          <i className="fas fa-anchor"></i>
          <span>Naval Letter Generator</span>
          {lastSaved && <span className="last-saved">Saved {lastSaved}</span>}
        </div>

        <div className="action-bar-actions">
          <button
            className="action-bar-btn"
            onClick={onSaveDraft}
            title="Save Draft"
            type="button"
          >
            <i className="fas fa-save"></i>
            {showLabels && <span>Save</span>}
          </button>

          <button
            className="action-bar-btn"
            onClick={onImport}
            title="Import Data Package"
            type="button"
          >
            <i className="fas fa-file-import"></i>
            {showLabels && <span>Import</span>}
          </button>

          <button
            className="action-bar-btn"
            onClick={onExport}
            title="Export Data Package"
            type="button"
          >
            <i className="fas fa-file-export"></i>
            {showLabels && <span>Export</span>}
          </button>

          <button
            className="action-bar-btn action-bar-btn-danger"
            onClick={onClearForm}
            title="Clear Form"
            type="button"
          >
            <i className="fas fa-redo"></i>
            {showLabels && <span>Clear</span>}
          </button>

          <button
            className="action-bar-btn action-bar-btn-primary"
            onClick={onGenerate}
            disabled={!isValid || isGenerating}
            title={isValid ? "Generate Document" : "Fix validation errors to generate"}
            type="button"
          >
            {isGenerating ? (
              <>
                <span className="loading-spinner"></span>
                {showLabels && <span>Generating...</span>}
              </>
            ) : (
              <>
                <i className="fas fa-file-download"></i>
                {showLabels && <span>Generate</span>}
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
