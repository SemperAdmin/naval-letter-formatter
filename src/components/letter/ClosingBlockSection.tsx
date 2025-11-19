/**
 * Closing Block Section Component
 * Manages signature name and delegation of signature authority
 */

import React, { useState, useEffect } from 'react';
import { FormData } from '@/types';
import { autoUppercase } from '@/lib/string-utils';
import { CopyToSection } from './CopyToSection';

interface ClosingBlockSectionProps {
  formData: Pick<FormData, 'sig' | 'delegationText'>;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  copyTos: string[];
  setCopyTos: (copies: string[]) => void;
}

export function ClosingBlockSection({
  formData,
  setFormData,
  copyTos,
  setCopyTos
}: ClosingBlockSectionProps) {
  const [showDelegation, setShowDelegation] = useState(false);

  useEffect(() => {
    setShowDelegation(!!formData.delegationText);
  }, [formData.delegationText]);

  const updateDelegationType = (value: string) => {
    let delegationText = '';
    switch (value) {
      case 'by_direction': delegationText = 'By direction'; break;
      case 'acting_commander': delegationText = 'Acting'; break;
      case 'acting_title': delegationText = 'Acting'; break;
      case 'signing_for': delegationText = 'For'; break;
    }
    setFormData(prev => ({ ...prev, delegationText }));
  };

  return (
    <div className="form-section">
      <div className="section-legend">
        <i className="fas fa-signature mr-2"></i>
        Closing Block
      </div>

      <div className="input-group">
        <span className="input-group-text">
          <i className="fas fa-pen-fancy mr-2"></i>
          Signature Name:
        </span>
        <input
          className="form-control"
          type="text"
          placeholder="F. M. LASTNAME"
          value={formData.sig}
          onChange={(e) => setFormData(prev => ({ ...prev, sig: autoUppercase(e.target.value) }))}
        />
      </div>

      <div className="mb-6">
        <label className="block text-lg font-bold mb-2">
          <i className="fas fa-user-tie mr-2"></i>
          Delegation of Signature Authority?
        </label>
        <div className="radio-group">
          <label className="flex items-center">
            <input
              type="radio"
              name="ifDelegation"
              value="yes"
              checked={showDelegation}
              onChange={() => setShowDelegation(true)}
              className="mr-2 scale-125"
            />
            <span className="text-base">Yes</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="ifDelegation"
              value="no"
              checked={!showDelegation}
              onChange={() => setShowDelegation(false)}
              className="mr-2 scale-125"
            />
            <span className="text-base">No</span>
          </label>
        </div>

        {showDelegation && (
          <div className="dynamic-section">
            <label className="block font-semibold mb-2">
              <i className="fas fa-user-tie mr-2"></i>
              Delegation Authority Type:
            </label>

            <div className="mb-4">
              <select
                className="form-control mb-2"
                onChange={(e) => updateDelegationType(e.target.value)}
              >
                <option value="">Select delegation type...</option>
                <option value="by_direction">By direction</option>
                <option value="acting_commander">Acting for Commander/CO/OIC</option>
                <option value="acting_title">Acting for Official by Title</option>
                <option value="signing_for">Signing "For" an Absent Official</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div className="input-group">
              <span className="input-group-text">
                <i className="fas fa-edit mr-2"></i>
                Delegation Text:
              </span>
              <input
                className="form-control"
                type="text"
                placeholder="Enter delegation authority text (e.g., By direction, Acting, etc.)"
                value={formData.delegationText}
                onChange={(e) => setFormData(prev => ({ ...prev, delegationText: e.target.value }))}
              />
            </div>

            <div className="mt-3 p-3 bg-cyan-50 rounded-lg border border-cyan-500 text-sm">
              <strong className="text-cyan-700">
                <i className="fas fa-info-circle mr-1"></i>
                Examples:
              </strong>
              <br />
              <div className="mt-1 text-cyan-700">
                • <strong>By direction:</strong> For routine correspondence when specifically authorized<br />
                • <strong>Acting:</strong> When temporarily succeeding to command or appointed to replace an official<br />
                • <strong>Deputy Acting:</strong> For deputy positions acting in absence<br />
                • <strong>For:</strong> When signing for an absent official (hand-written "for" before typed name)
              </div>
            </div>
          </div>
        )}
      </div>

      <CopyToSection copyTos={copyTos} setCopyTos={setCopyTos} />
    </div>
  );
}
