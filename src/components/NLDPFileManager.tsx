/**
 * NLDP File Manager Component
 * 
 * Provides UI controls for importing and exporting Naval Letter Data Packages,
 * with proper error handling and user feedback.
 */

import React, { useState, useRef } from 'react';
import { useNLDP } from '../hooks/useNLDP';
import { NLDPExportConfig, FormData, ParagraphData } from '../lib/nldp-format';

interface NLDPFileManagerProps {
  // Current application state
  formData: FormData;
  vias: string[];
  references: string[];
  enclosures: string[];
  copyTos: string[];
  paragraphs: ParagraphData[];

  // Callbacks to update application state
  onDataImported: (
    formData: FormData,
    vias: string[],
    references: string[],
    enclosures: string[],
    copyTos: string[],
    paragraphs: ParagraphData[]
  ) => void;

  // Optional styling
  className?: string;

  // Optional refs for external triggering
  fileInputRef?: React.RefObject<HTMLInputElement>;
  exportButtonRef?: React.RefObject<HTMLButtonElement>;
}

export function NLDPFileManager({
  formData,
  vias,
  references,
  enclosures,
  copyTos,
  paragraphs,
  onDataImported,
  className = '',
  fileInputRef: externalFileInputRef,
  exportButtonRef: externalExportButtonRef
}: NLDPFileManagerProps) {
  
  const {
    exportToNLDP,
    importFromNLDP,
    triggerFileImport,
    isExporting,
    isImporting,
    lastError,
    lastSuccess,
    clearMessages
  } = useNLDP();

  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportConfig, setExportConfig] = useState<NLDPExportConfig>({
    author: {
      name: '',
      unit: '',
      email: ''
    },
    package: {
      title: '',
      description: '',
      tags: []
    },
    includePersonalInfo: false
  });

  const internalFileInputRef = useRef<HTMLInputElement>(null);
  const internalExportButtonRef = useRef<HTMLButtonElement>(null);

  // Use external refs if provided, otherwise use internal refs
  const fileInputRef = externalFileInputRef || internalFileInputRef;
  const exportButtonRef = externalExportButtonRef || internalExportButtonRef;

  // Handle file import
  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const result = await importFromNLDP(file);

    if (result.success && result.data) {
      onDataImported(
        result.data.formData,
        result.data.vias,
        result.data.references,
        result.data.enclosures,
        result.data.copyTos,
        result.data.paragraphs
      );
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle export
  const handleExport = async () => {
    if (!exportConfig.package.title.trim()) {
      alert('Please enter a title for the data package');
      return;
    }

    await exportToNLDP(
      formData,
      vias,
      references,
      enclosures,
      copyTos,
      paragraphs,
      exportConfig
    );
    
    setShowExportDialog(false);
  };

  // Auto-populate export config with current data
  const prepareExport = () => {
    setExportConfig(prev => ({
      ...prev,
      package: {
        ...prev.package,
        title: prev.package.title || `${formData.subj || 'Naval Letter'} Data Package`,
        description: prev.package.description || `Data package for correspondence: ${formData.subj || 'Untitled'}`
      }
    }));
    setShowExportDialog(true);
  };

  return (
    <div className={`nldp-file-manager ${className}`}>
      <style jsx>{`
        .nldp-file-manager {
          background: #f8f9fa;
          border: 2px solid #dee2e6;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
        }
        
        .nldp-header {
          display: flex;
          align-items: center;
          margin-bottom: 15px;
          font-weight: 600;
          color: #495057;
        }
        
        .nldp-buttons {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 15px;
        }
        
        .nldp-btn {
          display: flex;
          align-items: center;
          padding: 10px 16px;
          border: none;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 14px;
        }
        
        .nldp-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .nldp-btn-primary {
          background: linear-gradient(135deg, #007bff, #0056b3);
          color: white;
        }
        
        .nldp-btn-primary:hover:not(:disabled) {
          background: linear-gradient(135deg, #0056b3, #004085);
          transform: translateY(-1px);
        }
        
        .nldp-btn-secondary {
          background: linear-gradient(135deg, #6c757d, #545b62);
          color: white;
        }
        
        .nldp-btn-secondary:hover:not(:disabled) {
          background: linear-gradient(135deg, #545b62, #434a50);
          transform: translateY(-1px);
        }
        
        .nldp-btn i {
          margin-right: 6px;
        }
        
        .nldp-status {
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 13px;
          margin-top: 10px;
        }
        
        .nldp-success {
          background: #d4edda;
          border: 1px solid #c3e6cb;
          color: #155724;
        }
        
        .nldp-error {
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          color: #721c24;
        }
        
        .nldp-dialog-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        
        .nldp-dialog {
          background: white;
          border-radius: 12px;
          padding: 24px;
          max-width: 500px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
        }
        
        .nldp-dialog h3 {
          margin: 0 0 20px 0;
          color: #495057;
        }
        
        .nldp-form-group {
          margin-bottom: 16px;
        }
        
        .nldp-form-group label {
          display: block;
          margin-bottom: 6px;
          font-weight: 500;
          color: #495057;
        }
        
        .nldp-form-group input,
        .nldp-form-group textarea {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #ced4da;
          border-radius: 6px;
          font-size: 14px;
        }
        
        .nldp-form-group textarea {
          resize: vertical;
          min-height: 80px;
        }
        
        .nldp-checkbox {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .nldp-dialog-buttons {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 20px;
        }
        
        .hidden-input {
          display: none;
        }
        
        .loading-spinner {
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-right: 6px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
          .nldp-buttons {
            flex-direction: column;
          }
          
          .nldp-dialog {
            width: 95%;
            padding: 16px;
          }
        }
      `}</style>

      <div className="nldp-header">
        <i className="fas fa-share-alt" style={{ marginRight: '8px' }}></i>
        Data Package Sharing
      </div>

      <p style={{ fontSize: '14px', color: '#6c757d', marginBottom: '15px' }}>
        Share your letter data with other users or import shared data packages.
      </p>

      <div className="nldp-buttons">
        <button
          ref={exportButtonRef}
          className="nldp-btn nldp-btn-primary"
          onClick={prepareExport}
          disabled={isExporting}
        >
          {isExporting && <span className="loading-spinner"></span>}
          <i className="fas fa-download"></i>
          Export Data Package
        </button>

        <button
          className="nldp-btn nldp-btn-secondary"
          onClick={() => fileInputRef.current?.click()}
          disabled={isImporting}
        >
          {isImporting && <span className="loading-spinner"></span>}
          <i className="fas fa-upload"></i>
          Import Data Package
        </button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept=".nldp"
          onChange={handleFileImport}
          className="hidden-input"
        />
      </div>

      {/* Status Messages */}
      {lastSuccess && (
        <div className="nldp-status nldp-success">
          <i className="fas fa-check-circle" style={{ marginRight: '6px' }}></i>
          {lastSuccess}
          <button
            onClick={clearMessages}
            style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      )}

      {lastError && (
        <div className="nldp-status nldp-error">
          <i className="fas fa-exclamation-circle" style={{ marginRight: '6px' }}></i>
          {lastError}
          <button
            onClick={clearMessages}
            style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Export Dialog */}
      {showExportDialog && (
        <div className="nldp-dialog-overlay" onClick={() => setShowExportDialog(false)}>
          <div className="nldp-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Export Data Package</h3>
            
            <div className="nldp-form-group">
              <label>Package Title *</label>
              <input
                type="text"
                value={exportConfig.package.title}
                onChange={(e) => setExportConfig(prev => ({
                  ...prev,
                  package: { ...prev.package, title: e.target.value }
                }))}
                placeholder="Enter a descriptive title for this package"
              />
            </div>
            
            <div className="nldp-form-group">
              <label>Description</label>
              <textarea
                value={exportConfig.package.description}
                onChange={(e) => setExportConfig(prev => ({
                  ...prev,
                  package: { ...prev.package, description: e.target.value }
                }))}
                placeholder="Optional description of the package contents"
              />
            </div>
            
            <div className="nldp-form-group">
              <label>Your Name</label>
              <input
                type="text"
                value={exportConfig.author.name}
                onChange={(e) => setExportConfig(prev => ({
                  ...prev,
                  author: { ...prev.author, name: e.target.value }
                }))}
                placeholder="Your name (optional)"
              />
            </div>
            
            <div className="nldp-form-group">
              <label>Unit/Organization</label>
              <input
                type="text"
                value={exportConfig.author.unit}
                onChange={(e) => setExportConfig(prev => ({
                  ...prev,
                  author: { ...prev.author, unit: e.target.value }
                }))}
                placeholder="Your unit or organization (optional)"
              />
            </div>
            
            <div className="nldp-form-group">
              <label className="nldp-checkbox">
                <input
                  type="checkbox"
                  checked={exportConfig.includePersonalInfo}
                  onChange={(e) => setExportConfig(prev => ({
                    ...prev,
                    includePersonalInfo: e.target.checked
                  }))}
                />
                Include personal information in export
              </label>
            </div>
            
            <div className="nldp-dialog-buttons">
              <button
                className="nldp-btn nldp-btn-secondary"
                onClick={() => setShowExportDialog(false)}
              >
                Cancel
              </button>
              <button
                className="nldp-btn nldp-btn-primary"
                onClick={handleExport}
                disabled={isExporting || !exportConfig.package.title.trim()}
              >
                {isExporting && <span className="loading-spinner"></span>}
                Export
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}