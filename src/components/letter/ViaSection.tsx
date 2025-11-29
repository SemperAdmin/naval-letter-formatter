/**
 * Via Section Component
 * Manages the list of via addressees with dynamic add/remove functionality
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ViaSectionProps {
  vias: string[];
  setVias: (vias: string[]) => void;
}

export function ViaSection({ vias, setVias }: ViaSectionProps) {
  const [showVia, setShowVia] = useState(false);

  useEffect(() => {
    setShowVia(vias.some(v => v.trim() !== ''));
  }, [vias]);

  const addItem = useCallback(() => setVias(v => [...v, '']), [setVias]);
  const removeItem = useCallback((index: number) => setVias(v => v.filter((_, i) => i !== index)), [setVias]);
  const updateItem = useCallback((index: number, value: string) => setVias(v => v.map((item, i) => i === index ? value : item)), [setVias]);

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-lg font-semibold">
          <i className="fas fa-route mr-2"></i>
          Via
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-6">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="ifVia"
              value="yes"
              checked={showVia}
              onChange={() => setShowVia(true)}
              className="mr-2 scale-125"
            />
            <span className="text-base">Yes</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="ifVia"
              value="no"
              checked={!showVia}
              onChange={() => { setShowVia(false); setVias(['']); }}
              className="mr-2 scale-125"
            />
            <span className="text-base">No</span>
          </label>
        </div>

        {showVia && (
          <div className="space-y-3">
            <label className="block font-semibold mb-2">
              <i className="fas fa-route mr-2"></i>
              Enter Via Addressee(s):
            </label>
            {vias.map((via, index) => (
              <div key={`via-${index}`} className="flex w-full">
                <span className="flex min-w-[60px] items-center justify-center flex-shrink-0 rounded-l-lg border-2 border-[#b8860b] bg-gradient-to-br from-[#b8860b] to-[#ffd700] text-center font-semibold text-white">
                  ({index + 1})
                </span>
                <input
                  className="flex-1 min-w-0 px-4 py-3 text-base border-2 border-l-0 border-gray-300 bg-gray-50 transition-all focus:border-[#b8860b] focus:bg-white focus:ring-2 focus:ring-[#b8860b]/10 focus:outline-none"
                  type="text"
                  placeholder="🚀 Enter via information (e.g., Commanding Officer, 1st Marine Division)"
                  value={via}
                  onChange={(e) => updateItem(index, e.target.value)}
                />
                {index === vias.length - 1 ? (
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
