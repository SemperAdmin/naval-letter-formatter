/**
 * References Section Component
 * Manages the list of document references with dynamic add/remove functionality
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormData } from '@/types';

interface ReferencesSectionProps {
  references: string[];
  setReferences: (refs: string[]) => void;
  formData: FormData;
  setFormData: (data: FormData) => void;
}

export function ReferencesSection({ references, setReferences, formData, setFormData }: ReferencesSectionProps) {
  const [showRef, setShowRef] = useState(false);

  useEffect(() => {
    setShowRef(references.some(r => r.trim() !== ''));
  }, [references]);

  const addItem = () => setReferences([...references, '']);
  const removeItem = (index: number) => setReferences(references.filter((_, i) => i !== index));
  const updateItem = (index: number, value: string) => setReferences(references.map((item, i) => i === index ? value : item));

  const getReferenceLetter = (index: number, startingLevel: string): string => {
    const startCharCode = startingLevel.charCodeAt(0);
    return String.fromCharCode(startCharCode + index);
  };

  const generateReferenceOptions = () => {
    return Array.from({ length: 26 }, (_, i) => String.fromCharCode(97 + i)).map(letter => ({
      value: letter,
      label: `Start with reference (${letter})`
    }));
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-lg font-semibold">
          <i className="fas fa-book mr-2"></i>
          References
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-6">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="ifRef"
              value="yes"
              checked={showRef}
              onChange={() => setShowRef(true)}
              className="mr-2 scale-125"
            />
            <span className="text-base">Yes</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="ifRef"
              value="no"
              checked={!showRef}
              onChange={() => { setShowRef(false); setReferences(['']); }}
              className="mr-2 scale-125"
            />
            <span className="text-base">No</span>
          </label>
        </div>

        {showRef && (
          <div className="space-y-4">
            {formData.documentType === 'endorsement' && (
              <>
                <div className="mt-2 p-3 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 rounded-r-lg mb-4">
                  <div className="flex">
                    <div className="py-1"><i className="fas fa-exclamation-triangle fa-lg mr-3"></i></div>
                    <div>
                      <p className="font-bold">Endorsement Reference Rules</p>
                      <p className="text-sm">Only add NEW references not mentioned in the basic letter or previous endorsements. Continue the lettering sequence from the last reference.</p>
                    </div>
                  </div>
                </div>
                <div className="input-group">
                  <span className="input-group-text">Starting Reference:</span>
                  <select
                    className="form-control"
                    value={formData.startingReferenceLevel}
                    onChange={(e) => setFormData({ ...formData, startingReferenceLevel: e.target.value })}
                  >
                    {generateReferenceOptions().map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
              </>
            )}
            <label className="block font-semibold mb-2">
              <i className="fas fa-bookmark mr-2"></i>
              Enter Reference(s):
            </label>
            {references.map((ref, index) => (
              <div key={index} className="input-group" style={{ width: '100%', display: 'flex' }}>
                <span className="input-group-text" style={{
                  minWidth: '60px',
                  justifyContent: 'center',
                  alignItems: 'center',
                  display: 'flex',
                  background: 'linear-gradient(135deg, #b8860b, #ffd700)',
                  color: 'white',
                  fontWeight: '600',
                  borderRadius: '8px 0 0 8px',
                  border: '2px solid #b8860b',
                  flexShrink: 0,
                  textAlign: 'center'
                }}>
                  ({getReferenceLetter(index, formData.startingReferenceLevel)})
                </span>
                <input
                  className="form-control"
                  type="text"
                  placeholder="📚 Enter reference information (e.g., NAVADMIN 123/24, OPNAVINST 5000.1)"
                  value={ref}
                  onChange={(e) => updateItem(index, e.target.value)}
                  style={{
                    fontSize: '1rem',
                    padding: '12px 16px',
                    border: '2px solid #e0e0e0',
                    borderLeft: 'none',
                    borderRadius: '0',
                    transition: 'all 0.3s ease',
                    backgroundColor: '#fafafa',
                    flex: '1',
                    minWidth: '0'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#b8860b';
                    e.target.style.backgroundColor = '#fff';
                    e.target.style.boxShadow = '0 0 0 3px rgba(184, 134, 11, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e0e0e0';
                    e.target.style.backgroundColor = '#fafafa';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                {index === references.length - 1 ? (
                  <button
                    className="btn btn-primary"
                    type="button"
                    onClick={addItem}
                    style={{
                      borderRadius: '0 8px 8px 0',
                      flexShrink: 0,
                      background: 'linear-gradient(135deg, #b8860b, #ffd700)',
                      border: '2px solid #b8860b',
                      color: 'white',
                      fontWeight: '600',
                      padding: '8px 16px',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      (e.target as HTMLButtonElement).style.background = 'linear-gradient(135deg, #ffd700, #b8860b)';
                      (e.target as HTMLButtonElement).style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLButtonElement).style.background = 'linear-gradient(135deg, #b8860b, #ffd700)';
                      (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
                    }}
                  >
                    <i className="fas fa-plus" style={{ marginRight: '4px' }}></i>
                    Add
                  </button>
                ) : (
                  <button
                    className="btn btn-danger"
                    type="button"
                    onClick={() => removeItem(index)}
                    style={{
                      borderRadius: '0 8px 8px 0',
                      flexShrink: 0
                    }}
                  >
                    <i className="fas fa-trash" style={{ marginRight: '4px' }}></i>
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
