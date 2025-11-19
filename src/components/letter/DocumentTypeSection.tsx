/**
 * Document Type Section Component
 * Manages document type selection (Basic/Endorsement), header type, and body font
 */

import React from 'react';
import { FormData, EndorsementLevel } from '@/types';
import { StructuredReferenceInput } from './StructuredReferenceInput';
import { debugFormChange } from '@/lib/console-utils';

interface DocumentTypeSectionProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
}

export function DocumentTypeSection({
  formData,
  setFormData
}: DocumentTypeSectionProps) {
  const handleEndorsementLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const level = e.target.value as EndorsementLevel;

    const levelMap: Record<string, number> = {
      'FIRST': 1, 'SECOND': 2, 'THIRD': 3, 'FOURTH': 4, 'FIFTH': 5, 'SIXTH': 6, 'RECEIVING': 1
    };

    const prevPages = levelMap[level] ? levelMap[level] - 1 : 0;
    const refStart = String.fromCharCode('a'.charCodeAt(0) + (levelMap[level] || 1) - 1);
    const enclStart = (levelMap[level] || 1).toString();

    setFormData(prev => ({
      ...prev,
      endorsementLevel: level,
      startingReferenceLevel: refStart,
      startingEnclosureNumber: enclStart,
      previousPackagePageCount: prevPages,
      startingPageNumber: (prev.previousPackagePageCount || 0) + 1
    }));
  };

  return (
    <>
      {/* Document Type Selector */}
      <div className="form-section">
        <div className="section-legend">
          <i className="fas fa-file-alt mr-2"></i>
          Choose Document Type
        </div>

        <div className="grid grid-cols-2 gap-5 mb-4">
          {/* Basic Letter Card */}
          <button
            type="button"
            className={`btn ${formData.documentType === 'basic' ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setFormData(prev => ({ ...prev, documentType: 'basic' }))}
            style={{
              padding: '20px',
              height: 'auto',
              textAlign: 'left',
              border: formData.documentType === 'basic' ? '3px solid #007bff' : '2px solid #dee2e6',
              borderRadius: '12px',
              transition: 'all 0.3s ease',
              position: 'relative',
              background: formData.documentType === 'basic' ? 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)' : 'white',
              color: formData.documentType === 'basic' ? 'white' : '#495057',
              boxShadow: formData.documentType === 'basic' ? '0 8px 25px rgba(0, 123, 255, 0.3)' : '0 2px 10px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div className="flex items-start gap-4">
              <div className="text-4xl opacity-90 min-w-[60px]">📄</div>
              <div className="flex-1">
                <div className="text-xl font-bold mb-2 flex items-center gap-2">
                  Basic Letter
                  {formData.documentType === 'basic' && (
                    <i className="fas fa-check-circle ml-auto"></i>
                  )}
                </div>
                <div className="text-base opacity-90 mb-2 leading-normal">
                  The standard format for routine correspondence and official communications.
                </div>
                <div className="text-sm opacity-80 italic">
                  ✓ Most common format
                </div>
              </div>
            </div>
          </button>

          {/* New-Page Endorsement Card */}
          <button
            type="button"
            className={`btn ${formData.documentType === 'endorsement' ? 'btn-success' : 'btn-outline-secondary'}`}
            onClick={() => setFormData(prev => ({ ...prev, documentType: 'endorsement' }))}
            style={{
              padding: '20px',
              height: 'auto',
              textAlign: 'left',
              border: formData.documentType === 'endorsement' ? '3px solid #28a745' : '2px solid #dee2e6',
              borderRadius: '12px',
              transition: 'all 0.3s ease',
              position: 'relative',
              background: formData.documentType === 'endorsement' ? 'linear-gradient(135deg, #28a745 0%, #1e7e34 100%)' : 'white',
              color: formData.documentType === 'endorsement' ? 'white' : '#495057',
              boxShadow: formData.documentType === 'endorsement' ? '0 8px 25px rgba(40, 167, 69, 0.3)' : '0 2px 10px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div className="flex items-start gap-4">
              <div className="text-4xl opacity-90 min-w-[60px]">📝</div>
              <div className="flex-1">
                <div className="text-xl font-bold mb-2 flex items-center gap-2">
                  New-Page Endorsement
                  {formData.documentType === 'endorsement' && (
                    <i className="fas fa-check-circle ml-auto"></i>
                  )}
                </div>
                <div className="text-base opacity-90 mb-2 leading-normal">
                  Forwards correspondence on a new page. Use for longer comments and formal endorsements.
                </div>
                <div className="text-sm opacity-80 italic">
                  → For forwarding documents
                </div>
              </div>
            </div>
          </button>
        </div>

        <div className="text-sm text-gray-600 -mt-2 mb-4">
          <small>
            <i className="fas fa-info-circle mr-1"></i>
            Select the type of document you want to create. Basic letters are for routine correspondence, while endorsements forward existing documents.
          </small>
        </div>

        <div className="mt-5 pt-5 border-t border-gray-300">
          <label className="block text-lg font-bold mb-2">
            <i className="fas fa-building mr-2"></i>
            Header Type
          </label>
          <div className="radio-group">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="headerType"
                value="USMC"
                checked={formData.headerType === 'USMC'}
                onChange={(e) => {
                  setFormData({ ...formData, headerType: 'USMC' });
                  debugFormChange('Header Type', 'USMC');
                }}
                className="mr-2 scale-125 cursor-pointer"
              />
              <span className="text-base">United States Marine Corps</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="headerType"
                value="DON"
                checked={formData.headerType === 'DON'}
                onChange={(e) => {
                  setFormData({ ...formData, headerType: 'DON' });
                  debugFormChange('Header Type', 'DON');
                }}
                className="mr-2 scale-125 cursor-pointer"
              />
              <span className="text-base">Department of the Navy</span>
            </label>
          </div>
        </div>

        <div className="mt-5 pt-5 border-t border-gray-300">
          <label className="block text-lg font-bold mb-2">
            <i className="fas fa-font mr-2"></i>
            Body Font
          </label>
          <div className="radio-group">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="bodyFont"
                value="times"
                checked={formData.bodyFont === 'times'}
                onChange={(e) => {
                  setFormData({ ...formData, bodyFont: 'times' });
                  debugFormChange('Body Font', 'Times New Roman');
                }}
                className="mr-2 scale-125 cursor-pointer"
              />
              <span className="text-base">Times New Roman</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="bodyFont"
                value="courier"
                checked={formData.bodyFont === 'courier'}
                onChange={(e) => {
                  setFormData({ ...formData, bodyFont: 'courier' });
                  debugFormChange('Body Font', 'Courier New');
                }}
                className="mr-2 scale-125 cursor-pointer"
              />
              <span className="text-base">Courier New</span>
            </label>
          </div>
        </div>
      </div>

      {/* Endorsement-Specific Fields */}
      {(formData.documentType === 'endorsement') && (
        <div className="form-section">
          <div className="section-legend" style={{ background: 'linear-gradient(45deg, #0d47a1, #1976d2)', border: '2px solid rgba(25, 118, 210, 0.3)' }}>
            <i className="fas fa-file-signature mr-2"></i>
            Endorsement Details
          </div>

          <div className="input-group">
            <span className="input-group-text" style={{ background: 'linear-gradient(45deg, #0d47a1, #1976d2)' }}>
              <i className="fas fa-sort-numeric-up mr-2"></i>
              Endorsement Level:
            </span>
            <select
              className="form-control"
              value={formData.endorsementLevel}
              onChange={handleEndorsementLevelChange}
              required
            >
              <option value="" disabled>Select endorsement level...</option>
              <option value="FIRST">FIRST ENDORSEMENT</option>
              <option value="SECOND">SECOND ENDORSEMENT</option>
              <option value="THIRD">THIRD ENDORSEMENT</option>
              <option value="FOURTH">FOURTH ENDORSEMENT</option>
              <option value="FIFTH">FIFTH ENDORSEMENT</option>
              <option value="SIXTH">SIXTH ENDORSEMENT</option>
            </select>
          </div>

          {formData.endorsementLevel && (
            <StructuredReferenceInput formData={formData} setFormData={setFormData} />
          )}

          {formData.endorsementLevel && (
            <div className="mt-4">
              {/* Page Numbering Section */}
              <div className="bg-yellow-100 border border-yellow-400 rounded-lg p-3 mb-4">
                <h4 className="font-medium text-yellow-900 mb-2 text-base">Page Numbering</h4>
                <div>
                  <label className="block text-sm font-medium text-yellow-900 mb-1">
                    Last Page # of Previous Document
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.previousPackagePageCount}
                    onChange={(e) => {
                      const newPrevCount = parseInt(e.target.value) || 0;
                      setFormData(prev => ({
                        ...prev,
                        previousPackagePageCount: newPrevCount,
                        startingPageNumber: newPrevCount + 1
                      }))
                    }}
                    className="w-full px-3 py-2 border border-yellow-400 rounded text-base"
                  />
                  <p className="text-xs text-yellow-900 mt-1">
                    Enter the last page number of the document you are endorsing.
                  </p>
                </div>
                <div className="mt-3 p-2 bg-yellow-200 rounded">
                  <strong className="text-yellow-900">
                    Your {formData.endorsementLevel} endorsement will start on page {formData.startingPageNumber}.
                  </strong>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 p-3 bg-blue-100 border-l-4 border-blue-500 text-blue-900 rounded-r-lg">
            <div className="flex">
              <div className="pt-1"><i className="fas fa-info-circle text-lg mr-2"></i></div>
              <div>
                <p className="font-bold m-0">Endorsement Mode</p>
                <p className="text-sm m-0">Endorsements forward the original letter. The "From" field becomes the endorsing command, and the "To" field is the next destination.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
