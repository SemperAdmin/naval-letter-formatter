/**
 * Structured Reference Input Component
 * Provides a three-field input for basic letter references (Who, Type, Date)
 * Used in endorsement document type
 */

import React from 'react';
import { parseAndFormatDate } from '@/lib/date-utils';
import { REFERENCE_TYPES, COMMON_ORIGINATORS } from '@/lib/constants';

// Note: FormData interface is defined in parent component
// Using a local interface to avoid circular dependencies
interface FormDataProps {
  referenceWho: string;
  referenceType: string;
  referenceDate: string;
  basicLetterReference: string;
  endorsementLevel: string;
}

export interface StructuredReferenceInputProps {
  formData: FormDataProps;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
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

    setFormData((prev: any) => ({
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
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{
        background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
        color: 'white',
        padding: '12px 16px',
        borderRadius: '8px 8px 0 0',
        fontWeight: '600',
        fontSize: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        Basic Letter Reference Components
      </div>

      <div style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        padding: '16px'
      }}>
        <div style={{
          background: '#dbeafe',
          border: '1px solid #93c5fd',
          borderRadius: '6px',
          padding: '12px',
          marginBottom: '16px'
        }}>
          <div style={{ marginBottom: '8px' }}>
            <span style={{ fontWeight: '600', color: '#1e40af' }}>Format:</span>
            <span style={{ color: '#1e40af', marginLeft: '8px' }}>on [who]'s [type] dtd [date]</span>
          </div>
          <div>
            <span style={{ fontWeight: '600', color: '#1e40af' }}>Examples:</span>
            <span style={{ color: '#1e40af', marginLeft: '8px' }}>on CO's ltr dtd 12 Jul 25 • on GySgt Admin's AA Form dtd 15 Aug 25</span>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '20px',
          marginBottom: '16px',
          width: '100%',
          minWidth: 0
        }}>
          <div style={{ minWidth: 0, width: '100%' }}>
            <label style={{
              display: 'block',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '4px'
            }}>Who</label>
            <input
              type="text"
              value={formData.referenceWho}
              onChange={(e) => updateReference('who', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
                minWidth: 0
              }}
              placeholder="CO, GySgt Admin, etc."
              list="common-originators"
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
                e.target.style.boxShadow = 'none';
              }}
            />
            <datalist id="common-originators">{COMMON_ORIGINATORS.map(originator => (<option key={originator} value={originator} />))}</datalist>
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', wordWrap: 'break-word' }}>Who originated the basic letter?</div>
          </div>

          <div style={{ minWidth: 0, width: '100%' }}>
            <label style={{
              display: 'block',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '4px'
            }}>Type</label>
            <select
              value={formData.referenceType}
              onChange={(e) => updateReference('type', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                background: 'white',
                boxSizing: 'border-box',
                minWidth: 0
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
                e.target.style.boxShadow = 'none';
              }}
            >
              <option value="">Select type</option>{REFERENCE_TYPES.map(type => (<option key={type.value} value={type.value}>{type.value}</option>))}
            </select>
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', wordWrap: 'break-word' }}>What type of document?</div>
          </div>

          <div style={{ minWidth: 0, width: '100%' }}>
            <label style={{
              display: 'block',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '4px'
            }}>Date</label>
            <input
              type="text"
              value={formData.referenceDate}
              onChange={handleDateChange}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
                minWidth: 0
              }}
              placeholder="8 Jul 25"
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
                e.target.style.boxShadow = 'none';
                handleDateChange(e);
              }}
            />
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', wordWrap: 'break-word', lineHeight: '1.3' }}>Accepts: YYYYMMDD, MM/DD/YYYY, YYYY-MM-DD, DD MMM YY, or "today". Auto-formats to Naval standard.</div>
          </div>
        </div>

        {formData.endorsementLevel && (
          <div style={{ marginTop: '12px' }}>
            {!formData.referenceWho && (
              <div style={{ color: '#dc2626', fontSize: '14px', marginBottom: '4px' }}>
                • Please specify who originated the basic letter
              </div>
            )}
            {!formData.referenceType && (
              <div style={{ color: '#dc2626', fontSize: '14px', marginBottom: '4px' }}>
                • Please select the document type
              </div>
            )}
            {!formData.referenceDate && (
              <div style={{ color: '#dc2626', fontSize: '14px', marginBottom: '4px' }}>
                • Please enter the document date
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
