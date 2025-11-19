/**
 * Copy To Section Component
 * Manages the list of copy-to addressees with dynamic add/remove functionality
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CopyToSectionProps {
  copyTos: string[];
  setCopyTos: (copies: string[]) => void;
}

export function CopyToSection({ copyTos, setCopyTos }: CopyToSectionProps) {
  const [showCopy, setShowCopy] = useState(false);

  useEffect(() => {
    setShowCopy(copyTos.some(c => c.trim() !== ''));
  }, [copyTos]);

  const addItem = useCallback(() => setCopyTos(c => [...c, '']), [setCopyTos]);
  const removeItem = useCallback((index: number) => setCopyTos(c => c.filter((_, i) => i !== index)), [setCopyTos]);
  const updateItem = useCallback((index: number, value: string) => setCopyTos(c => c.map((item, i) => i === index ? value : item)), [setCopyTos]);

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-lg font-semibold">
          <i className="fas fa-copy mr-2"></i>
          Copy To
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-6">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="ifCopy"
              value="yes"
              checked={showCopy}
              onChange={() => setShowCopy(true)}
              className="mr-2 scale-125"
            />
            <span className="text-base">Yes</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="ifCopy"
              value="no"
              checked={!showCopy}
              onChange={() => { setShowCopy(false); setCopyTos(['']); }}
              className="mr-2 scale-125"
            />
            <span className="text-base">No</span>
          </label>
        </div>

        {showCopy && (
          <div className="space-y-3">
            <label className="block font-semibold mb-2">
              <i className="fas fa-mail-bulk mr-2"></i>
              Enter Addressee(s):
            </label>
            {copyTos.map((copy, index) => (
              <div key={`copy-${index}-${copy.substring(0, 20)}`} className="input-group">
                <input
                  className="form-control"
                  type="text"
                  placeholder="Enter copy to information"
                  value={copy}
                  onChange={(e) => updateItem(index, e.target.value)}
                />
                {index === copyTos.length - 1 ? (
                  <button
                    className="btn btn-primary"
                    type="button"
                    onClick={addItem}
                  >
                    <i className="fas fa-plus mr-1"></i>
                    Add
                  </button>
                ) : (
                  <button
                    className="btn btn-danger"
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
