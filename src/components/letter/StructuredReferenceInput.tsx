/**
 * Structured Reference Input Component
 * Provides a three-field input for basic letter references (Who, Type, Date)
 * Used in endorsement document type
 */

import React from 'react';
import { parseAndFormatDate } from '@/lib/date-utils';
import { REFERENCE_TYPES, COMMON_ORIGINATORS } from '@/lib/constants';
import { FormData } from '@/types';

export interface StructuredReferenceInputProps {
  formData: Pick<FormData, 'referenceWho' | 'referenceType' | 'referenceDate' | 'basicLetterReference' | 'endorsementLevel'>;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
}

export function StructuredReferenceInput({ formData, setFormData }: StructuredReferenceInputProps) {
  const generateReferenceString = (who: string, type: string, date: string): string => {
    if (!who || !type || !date) return '';
    return `${who}'s ${type} dtd ${date}`;
  };

  const updateReference = (field: 'who' | 'type' | 'date', value: string) => {
    const newWho = field === 'who' ? value : formData.referenceWho;
    const newType = field === 'type' ? value : formData.referenceType;
    const newDate = field === 'date' ? value : formData.referenceDate;

    const fullReference = generateReferenceString(newWho, newType, newDate);

    setFormData((prev: FormData) => ({
      ...prev,
      referenceWho: newWho,
      referenceType: newType,
      referenceDate: newDate,
      basicLetterReference: fullReference
    }));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = parseAndFormatDate(e.target.value);
    updateReference('date', formatted);
  };

  return (
    <div className="sri-container">
      <div className="sri-header">
        Basic Letter Reference Components
      </div>

      <div className="sri-body">
        <div className="sri-info-box">
          <div className="sri-info-row">
            <span className="sri-info-label">Format:</span>
            <span className="sri-info-text">on [who]'s [type] dtd [date]</span>
          </div>
          <div className="sri-info-row">
            <span className="sri-info-label">Examples:</span>
            <span className="sri-info-text">on CO's ltr dtd 12 Jul 25 • on GySgt Admin's AA Form dtd 15 Aug 25</span>
          </div>
        </div>

        <div className="sri-grid">
          <div className="sri-field">
            <label className="sri-label">Who</label>
            <input
              type="text"
              className="sri-input"
              value={formData.referenceWho}
              onChange={(e) => updateReference('who', e.target.value)}
              placeholder="CO, GySgt Admin, etc."
              list="common-originators"
            />
            <datalist id="common-originators">
              {COMMON_ORIGINATORS.map(originator => (
                <option key={originator} value={originator} />
              ))}
            </datalist>
            <div className="sri-hint">Who originated the basic letter?</div>
          </div>

          <div className="sri-field">
            <label className="sri-label">Type</label>
            <select
              className="sri-select"
              value={formData.referenceType}
              onChange={(e) => updateReference('type', e.target.value)}
            >
              <option value="">Select type</option>
              {REFERENCE_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.value}</option>
              ))}
            </select>
            <div className="sri-hint">What type of document?</div>
          </div>

          <div className="sri-field">
            <label className="sri-label">Date</label>
            <input
              type="text"
              className="sri-input"
              value={formData.referenceDate}
              onChange={handleDateChange}
              onBlur={handleDateChange}
              placeholder="8 Jul 25"
            />
            <div className="sri-hint sri-hint-long">
              Accepts: YYYYMMDD, MM/DD/YYYY, YYYY-MM-DD, DD MMM YY, or "today". Auto-formats to Naval standard.
            </div>
          </div>
        </div>

        {formData.endorsementLevel && (
          <div className="sri-errors">
            {!formData.referenceWho && (
              <div className="sri-error">
                • Please specify who originated the basic letter
              </div>
            )}
            {!formData.referenceType && (
              <div className="sri-error">
                • Please select the document type
              </div>
            )}
            {!formData.referenceDate && (
              <div className="sri-error">
                • Please enter the document date
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
