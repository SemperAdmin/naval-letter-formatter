/**
 * Enclosures Section Component
 * Manages the list of document enclosures with dynamic add/remove functionality
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormData } from '@/types';

interface EnclosuresSectionProps {
  enclosures: string[];
  setEnclosures: (encls: string[]) => void;
  formData: FormData;
  setFormData: (data: FormData) => void;
}

export function EnclosuresSection({ enclosures, setEnclosures, formData, setFormData }: EnclosuresSectionProps) {
  const [showEncl, setShowEncl] = useState(false);

  useEffect(() => {
    setShowEncl(enclosures.some(e => e.trim() !== ''));
  }, [enclosures]);

  const addItem = () => setEnclosures([...enclosures, '']);
  const removeItem = (index: number) => setEnclosures(enclosures.filter((_, i) => i !== index));
  const updateItem = (index: number, value: string) => setEnclosures(enclosures.map((item, i) => i === index ? value : item));

  const getEnclosureNumber = (index: number, startingNumber: string): number => {
    return parseInt(startingNumber, 10) + index;
  };

  const generateEnclosureOptions = () => {
    return Array.from({ length: 20 }, (_, i) => {
      const num = i + 1;
      return {
        value: num.toString(),
        label: `Start with enclosure (${num})`
      };
    });
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-lg font-semibold">
          <i className="fas fa-paperclip mr-2"></i>
          Enclosures
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-6">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="ifEncl"
              value="yes"
              checked={showEncl}
              onChange={() => setShowEncl(true)}
              className="mr-2 scale-125"
            />
            <span className="text-base">Yes</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="ifEncl"
              value="no"
              checked={!showEncl}
              onChange={() => { setShowEncl(false); setEnclosures(['']); }}
              className="mr-2 scale-125"
            />
            <span className="text-base">No</span>
          </label>
        </div>

        {showEncl && (
          <div className="space-y-4">
            {formData.documentType === 'endorsement' && (
              <>
                <div className="mt-2 p-3 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 rounded-r-lg mb-4">
                  <div className="flex">
                    <div className="py-1"><i className="fas fa-exclamation-triangle fa-lg mr-3"></i></div>
                    <div>
                      <p className="font-bold">Endorsement Enclosure Rules</p>
                      <p className="text-sm">Only add NEW enclosures not mentioned in the basic letter or previous endorsements. Continue the numbering sequence from the last enclosure.</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                  <span className="font-medium text-gray-700 whitespace-nowrap">Starting Enclosure:</span>
                  <select
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.startingEnclosureNumber}
                    onChange={(e) => setFormData({ ...formData, startingEnclosureNumber: e.target.value })}
                  >
                    {generateEnclosureOptions().map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
              </>
            )}

            <div className="space-y-3">
              <h4 className="font-semibold text-gray-700 flex items-center">
                <i className="fas fa-paperclip mr-2"></i>
                Enter Enclosure(s):
              </h4>
              {enclosures.map((encl, index) => (
                <div key={index} className="flex items-stretch rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all duration-200 shadow-sm hover:shadow-md">
                  <div className="flex items-center justify-center px-4 py-3 bg-gradient-to-r from-yellow-600 to-yellow-500 text-white font-bold text-center min-w-[60px] border-r-2 border-yellow-700">
                    ({getEnclosureNumber(index, formData.startingEnclosureNumber)})
                  </div>
                  <input
                    className="flex-1 px-4 py-3 border-0 focus:outline-none focus:ring-0 bg-gray-50 hover:bg-white focus:bg-white transition-colors text-gray-700 placeholder-gray-400"
                    type="text"
                    placeholder="📎 Enter enclosure details (e.g., Training Certificate, Medical Records)"
                    value={encl}
                    onChange={(e) => updateItem(index, e.target.value)}
                  />
                  {index === enclosures.length - 1 ? (
                    <button
                      className="px-4 py-3 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-700 hover:to-yellow-600 hover:-translate-y-px text-white font-semibold transition-all duration-200 border-l-2 border-yellow-700 flex items-center"
                      type="button"
                      onClick={addItem}
                    >
                      <i className="fas fa-plus mr-2"></i>
                      Add
                    </button>
                  ) : (
                    <button
                      className="px-4 py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-semibold transition-all duration-200 border-l-2 border-red-700 flex items-center"
                      type="button"
                      onClick={() => removeItem(index)}
                    >
                      <i className="fas fa-trash mr-2"></i>
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
