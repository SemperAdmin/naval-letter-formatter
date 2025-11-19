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
              <div key={index} className="flex w-full">
                <span className="flex min-w-[60px] items-center justify-center flex-shrink-0 rounded-l-lg border-2 border-[#b8860b] bg-gradient-to-br from-[#b8860b] to-[#ffd700] text-center font-semibold text-white">
                  ({getReferenceLetter(index, formData.startingReferenceLevel)})
                </span>
                <input
                  className="flex-1 min-w-0 px-4 py-3 text-base border-2 border-l-0 border-gray-300 bg-gray-50 transition-all focus:border-[#b8860b] focus:bg-white focus:ring-2 focus:ring-[#b8860b]/10 focus:outline-none"
                  type="text"
                  placeholder="📚 Enter reference information (e.g., NAVADMIN 123/24, OPNAVINST 5000.1)"
                  value={ref}
                  onChange={(e) => updateItem(index, e.target.value)}
                />
                {index === references.length - 1 ? (
                  <button
                    className="flex-shrink-0 rounded-r-lg border-2 border-[#b8860b] bg-gradient-to-br from-[#b8860b] to-[#ffd700] px-4 py-2 font-semibold text-white transition-all hover:from-[#ffd700] hover:to-[#b8860b] hover:-translate-y-px"
                    type="button"
                    onClick={addItem}
                  >
                    <i className="fas fa-plus mr-1"></i>
                    Add
                  </button>
                ) : (
                  <button
                    className="flex-shrink-0 rounded-r-lg bg-gradient-to-r from-red-600 to-red-500 px-4 py-2 font-semibold text-white transition-all hover:from-red-700 hover:to-red-600"
                    type="button"
                    onClick={() => removeItem(index)}
                  >
                    <i className="fas fa-trash mr-1"></i>
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
