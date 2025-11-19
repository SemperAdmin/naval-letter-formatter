/**
 * Copy To Section Component
 * Manages the list of copy-to addressees with dynamic add/remove functionality
 */

import React, { useState, useEffect } from 'react';

interface CopyToSectionProps {
  copyTos: string[];
  setCopyTos: (copies: string[]) => void;
}

export function CopyToSection({ copyTos, setCopyTos }: CopyToSectionProps) {
  const [showCopy, setShowCopy] = useState(false);

  useEffect(() => {
    setShowCopy(copyTos.some(c => c.trim() !== ''));
  }, [copyTos]);

  const addItem = () => setCopyTos([...copyTos, '']);
  const removeItem = (index: number) => setCopyTos(copyTos.filter((_, i) => i !== index));
  const updateItem = (index: number, value: string) => setCopyTos(copyTos.map((item, i) => i === index ? value : item));

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <label style={{ display: 'block', fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
        <i className="fas fa-copy" style={{ marginRight: '8px' }}></i>
        Copy To?
      </label>
      <div className="radio-group">
        <label style={{ display: 'flex', alignItems: 'center' }}>
          <input
            type="radio"
            name="ifCopy"
            value="yes"
            checked={showCopy}
            onChange={() => setShowCopy(true)}
            style={{ marginRight: '8px', transform: 'scale(1.25)' }}
          />
          <span style={{ fontSize: '1.1rem' }}>Yes</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center' }}>
          <input
            type="radio"
            name="ifCopy"
            value="no"
            checked={!showCopy}
            onChange={() => { setShowCopy(false); setCopyTos(['']); }}
            style={{ marginRight: '8px', transform: 'scale(1.25)' }}
          />
          <span style={{ fontSize: '1.1rem' }}>No</span>
        </label>
      </div>

      {showCopy && (
        <div className="dynamic-section">
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>
            <i className="fas fa-mail-bulk" style={{ marginRight: '8px' }}></i>
            Enter Addressee(s):
          </label>
          {copyTos.map((copy, index) => (
            <div key={index} className="input-group">
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
                  <i className="fas fa-plus" style={{ marginRight: '4px' }}></i>
                  Add
                </button>
              ) : (
                <button
                  className="btn btn-danger"
                  type="button"
                  onClick={() => removeItem(index)}
                >
                  <i className="fas fa-trash" style={{ marginRight: '4px' }}></i>
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
