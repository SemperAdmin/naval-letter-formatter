/**
 * StickyActionBar Component
 *
 * A persistent action bar that stays visible while scrolling, providing
 * quick access to key actions: Save, Load, Import, Export, Clear, and Generate.
 */

"use client"

import * as React from "react"

interface SavedLetter {
  id: string;
  savedAt: string;
  subj: string;
}

interface StickyActionBarProps {
  onSaveDraft: () => void;
  onLoadDraft: (letterId: string) => void;
  onImport: () => void;
  onExport: () => void;
  onClearForm: () => void;
  onGenerate: () => void;
  isGenerating: boolean;
  isValid: boolean;
  lastSaved?: string; // Timestamp of last save
  savedLetters: SavedLetter[];
  onLoadTemplateUrl: (url: string) => void;
}

export function StickyActionBar({
  onSaveDraft,
  onLoadDraft,
  onImport,
  onExport,
  onClearForm,
  onGenerate,
  isGenerating,
  isValid,
  lastSaved,
  savedLetters,
  onLoadTemplateUrl
}: StickyActionBarProps) {
  const [showLabels, setShowLabels] = React.useState(true);
  const [showLoadDropdown, setShowLoadDropdown] = React.useState(false);
  const [showTemplateDropdown, setShowTemplateDropdown] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const templateDropdownRef = React.useRef<HTMLDivElement>(null);
  const [activeTemplateType, setActiveTemplateType] = React.useState<'global' | 'unit'>('global');
  const [globalTemplates, setGlobalTemplates] = React.useState<Array<{ id: string; title: string; description?: string; documentType?: string; url: string }>>([]);
  const [unitTemplates, setUnitTemplates] = React.useState<Array<{ id: string; title: string; description?: string; unitName?: string; unitCode?: string; documentType?: string; url: string }>>([]);
  const [templateError, setTemplateError] = React.useState('');
  const [templateLoading, setTemplateLoading] = React.useState(false);

  // Detect scroll to minimize bar on mobile
  React.useEffect(() => {
    const handleResize = () => {
      setShowLabels(window.innerWidth >= 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowLoadDropdown(false);
      }
      if (templateDropdownRef.current && !templateDropdownRef.current.contains(event.target as Node)) {
        setShowTemplateDropdown(false);
      }
    };

    if (showLoadDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showLoadDropdown, showTemplateDropdown]);

  // Load template indexes
  React.useEffect(() => {
    const loadIndexes = async () => {
      try {
        const [g, u] = await Promise.all([
          fetch('/templates/global/index.json').then(r => r.ok ? r.json() : []),
          fetch('/templates/unit/index.json').then(r => r.ok ? r.json() : []),
        ]);
        setGlobalTemplates(Array.isArray(g) ? g : []);
        setUnitTemplates(Array.isArray(u) ? u : []);
      } catch (e) {
        setTemplateError('Failed to load template indexes');
      }
    };
    loadIndexes();
  }, []);

  const handleLoadClick = (letterId: string) => {
    onLoadDraft(letterId);
    setShowLoadDropdown(false);
  };

  const formatRelativeTime = (savedAt: string): string => {
    try {
      const now = new Date();
      const saved = new Date(savedAt);
      const diffMs = now.getTime() - saved.getTime();
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 1) return 'just now';
      if (diffMins === 1) return '1 min ago';
      if (diffMins < 60) return `${diffMins} mins ago`;

      const diffHours = Math.floor(diffMins / 60);
      if (diffHours === 1) return '1 hour ago';
      if (diffHours < 24) return `${diffHours} hours ago`;

      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return 'yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;

      return saved.toLocaleDateString();
    } catch {
      return savedAt;
    }
  };

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

        .load-dropdown-container {
          position: relative;
          display: inline-block;
        }

        .load-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          background: white;
          border: 2px solid #b8860b;
          border-radius: 8px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
          min-width: 320px;
          max-width: 400px;
          max-height: 400px;
          overflow-y: auto;
          z-index: 1000;
        }

        .template-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          background: white;
          border: 2px solid #b8860b;
          border-radius: 8px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
          min-width: 360px;
          max-width: 480px;
          max-height: 420px;
          overflow-y: auto;
          z-index: 1000;
        }

        .load-dropdown-header {
          padding: 12px 16px;
          border-bottom: 1px solid #dee2e6;
          background: #f8f9fa;
          font-weight: 600;
          color: #495057;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .load-dropdown-item {
          padding: 12px 16px;
          cursor: pointer;
          border-bottom: 1px solid #f0f0f0;
          transition: background 0.2s ease;
        }

        .load-dropdown-item:hover {
          background: #f8f9fa;
        }

        .load-dropdown-item:last-child {
          border-bottom: none;
        }

        .load-item-title {
          font-weight: 600;
          color: #1a1a2e;
          margin-bottom: 4px;
          font-size: 14px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .load-item-time {
          font-size: 12px;
          color: #6c757d;
        }

        .load-dropdown-empty {
          padding: 24px 16px;
          text-align: center;
          color: #6c757d;
          font-size: 14px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .load-dropdown {
            min-width: 280px;
            max-width: 320px;
            right: 0;
            left: auto;
          }
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

          <div className="load-dropdown-container" ref={dropdownRef}>
            <button
              className="action-bar-btn"
              onClick={() => setShowLoadDropdown(!showLoadDropdown)}
              title="Load Saved Draft"
              type="button"
            >
              <i className="fas fa-folder-open"></i>
              {showLabels && <span>Load</span>}
              <i className={`fas fa-chevron-${showLoadDropdown ? 'up' : 'down'}`} style={{ fontSize: '12px', marginLeft: '4px' }}></i>
            </button>

            {showLoadDropdown && (
              <div className="load-dropdown">
                <div className="load-dropdown-header">
                  <i className="fas fa-history"></i>
                  <span>Saved Drafts ({savedLetters.length})</span>
                </div>
                {savedLetters.length === 0 ? (
                  <div className="load-dropdown-empty">
                    <i className="fas fa-inbox" style={{ fontSize: '32px', opacity: '0.3', marginBottom: '8px' }}></i>
                    <div>No saved drafts yet</div>
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>Save your work to see it here</div>
                  </div>
                ) : (
                  savedLetters.map((letter) => (
                    <div
                      key={letter.id}
                      className="load-dropdown-item"
                      onClick={() => handleLoadClick(letter.id)}
                    >
                      <div className="load-item-title">
                        {letter.subj || 'Untitled Draft'}
                      </div>
                      <div className="load-item-time">
                        <i className="fas fa-clock" style={{ marginRight: '4px' }}></i>
                        {formatRelativeTime(letter.savedAt)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="load-dropdown-container" ref={templateDropdownRef}>
            <button
              className="action-bar-btn"
              onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
              title="Load from Template"
              type="button"
            >
              <i className="fas fa-file-alt"></i>
              {showLabels && <span>Templates</span>}
              <i className={`fas fa-chevron-${showTemplateDropdown ? 'up' : 'down'}`} style={{ fontSize: '12px', marginLeft: '4px' }}></i>
            </button>

            {showTemplateDropdown && (
              <div className="template-dropdown">
                <div className="load-dropdown-header">
                  <i className="fas fa-file-alt"></i>
                  <span>Templates</span>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                    <button
                      className="action-bar-btn"
                      type="button"
                      onClick={() => setActiveTemplateType('global')}
                      style={{ padding: '6px 10px', fontSize: '12px', background: activeTemplateType==='global' ? '#ffd700' : 'rgba(255,255,255,0.1)', color: activeTemplateType==='global' ? '#1a1a2e' : 'white' }}
                    >Global</button>
                    <button
                      className="action-bar-btn"
                      type="button"
                      onClick={() => setActiveTemplateType('unit')}
                      style={{ padding: '6px 10px', fontSize: '12px', background: activeTemplateType==='unit' ? '#ffd700' : 'rgba(255,255,255,0.1)', color: activeTemplateType==='unit' ? '#1a1a2e' : 'white' }}
                    >Unit</button>
                  </div>
                </div>

                {templateError && (
                  <div className="load-dropdown-empty" style={{ color: '#dc3545' }}>{templateError}</div>
                )}

                {templateLoading && (
                  <div className="load-dropdown-empty"><span className="loading-spinner"></span> Loading...</div>
                )}

                {(!templateError && !templateLoading) && (
                  <>
                    {activeTemplateType === 'global' && (globalTemplates.length === 0 ? (
                      <div className="load-dropdown-empty">No global templates</div>
                    ) : (
                      globalTemplates.map(t => (
                        <div key={t.id} className="load-dropdown-item" onClick={() => { setTemplateLoading(true); onLoadTemplateUrl(t.url); setShowTemplateDropdown(false); setTemplateLoading(false); }}>
                          <div className="load-item-title">{t.title}</div>
                          {t.description && (<div className="load-item-time">{t.description}</div>)}
                        </div>
                      ))
                    ))}

                    {activeTemplateType === 'unit' && (unitTemplates.length === 0 ? (
                      <div className="load-dropdown-empty">No unit templates</div>
                    ) : (
                      unitTemplates.map(t => (
                        <div key={t.id} className="load-dropdown-item" onClick={() => { setTemplateLoading(true); onLoadTemplateUrl(t.url); setShowTemplateDropdown(false); setTemplateLoading(false); }}>
                          <div className="load-item-title">{t.title}</div>
                          {t.description && (<div className="load-item-time">{t.description}</div>)}
                        </div>
                      ))
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

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
