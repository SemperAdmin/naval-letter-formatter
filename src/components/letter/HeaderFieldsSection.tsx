/**
 * Header Fields Section Component
 * Manages the core header fields including SSIC, From, To, Subject with validation
 */

import React from 'react';
import { FormData, ValidationState } from '@/types';
import { Combobox } from '@/components/ui/combobox';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { SSICTooltipContent, OriginatorCodeTooltipContent } from './TooltipContent';
import { SSICS } from '@/lib/ssic';
import { getTodaysDate } from '@/lib/date-utils';
import { numbersOnly, autoUppercase } from '@/lib/string-utils';
import { debugFormChange } from '@/lib/console-utils';

interface HeaderFieldsSectionProps {
  formData: Pick<FormData, 'ssic' | 'originatorCode' | 'date' | 'from' | 'to' | 'subj'>;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  validation: ValidationState;
  handleValidateSSIC: (value: string) => void;
  handleValidateSubject: (value: string) => void;
  handleValidateFromTo: (value: string, field: 'from' | 'to') => void;
}

export function HeaderFieldsSection({
  formData,
  setFormData,
  validation,
  handleValidateSSIC,
  handleValidateSubject,
  handleValidateFromTo
}: HeaderFieldsSectionProps) {
  const ssicComboboxData = SSICS.map((ssic, index) => ({
    value: `${ssic.code}-${index}`,
    label: `${ssic.code} - ${ssic.nomenclature}`,
    originalCode: ssic.code,
  }));

  const handleSsicSelect = (value: string) => {
    const selectedSsic = ssicComboboxData.find(ssic => ssic.value === value);
    if (selectedSsic) {
      setFormData(prev => ({
        ...prev,
        ssic: selectedSsic.originalCode,
      }));
      handleValidateSSIC(selectedSsic.originalCode);
    }
  };

  const clearSsicInfo = () => {
    setFormData(prev => ({ ...prev, ssic: '' }));
    handleValidateSSIC('');
  };

  const setTodaysDate = () => {
    const navyDate = getTodaysDate();
    setFormData(prev => ({ ...prev, date: navyDate }));
  };

  return (
    <div className="form-section">
      <div className="section-legend">
        <i className="fas fa-info-circle mr-2"></i>
        Header Information
      </div>

      <div className="input-group">
        <span className="input-group-text" style={{ minWidth: '150px' }}>
          <i className="fas fa-search mr-2"></i>
          Find SSIC:
        </span>
        <Combobox
          items={ssicComboboxData}
          onSelect={handleSsicSelect}
          placeholder="Search SSIC by subject..."
          searchMessage="No SSIC found."
          inputPlaceholder="Search nomenclatures..."
        />
        <button
          className="btn btn-danger"
          type="button"
          onClick={clearSsicInfo}
          title="Clear SSIC"
          style={{ borderRadius: '0 8px 8px 0' }}
        >
          <i className="fas fa-times"></i>
        </button>
      </div>

      <div className="input-group">
        <span className="input-group-text">
          <i className="fas fa-hashtag mr-2"></i>
          SSIC:
          <InfoTooltip side="right" content={<SSICTooltipContent />} />
        </span>
        <input
          className={`form-control ${validation.ssic.isValid ? 'is-valid' : formData.ssic && !validation.ssic.isValid ? 'is-invalid' : ''}`}
          type="text"
          placeholder="e.g., 1650"
          value={formData.ssic}
          onChange={(e) => {
            const value = numbersOnly(e.target.value);
            setFormData(prev => ({ ...prev, ssic: value }));
            handleValidateSSIC(value);
          }}
          aria-invalid={formData.ssic && !validation.ssic.isValid}
          aria-describedby={validation.ssic.message ? "ssic-validation" : undefined}
        />
      </div>
      {validation.ssic.message && (
        <div
          id="ssic-validation"
          className={`feedback-message ${validation.ssic.isValid ? 'text-success' : 'text-danger'}`}
          role={validation.ssic.isValid ? "status" : "alert"}
        >
          <i className={`fas ${validation.ssic.isValid ? 'fa-check' : 'fa-exclamation-triangle'} mr-1`}></i>
          {validation.ssic.message}
        </div>
      )}

      <div className="input-group">
        <span className="input-group-text">
          <i className="fas fa-code mr-2"></i>
          Originator's Code:
          <InfoTooltip side="right" content={<OriginatorCodeTooltipContent />} />
        </span>
        <input
          className="form-control"
          type="text"
          placeholder="e.g., G-1"
          value={formData.originatorCode}
          onChange={(e) => setFormData(prev => ({ ...prev, originatorCode: autoUppercase(e.target.value) }))}
        />
      </div>

      <div className="input-group">
        <span className="input-group-text">
          <i className="fas fa-calendar-alt mr-2"></i>
          Date:
        </span>
        <input
          className="form-control"
          type="text"
          placeholder="e.g., 8 Jul 25, 2025-07-08, 07/08/2025, 20250708, or today"
          value={formData.date}
          onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
        />
        <button
          className="btn btn-primary"
          type="button"
          onClick={setTodaysDate}
          title="Use Today's Date"
        >
          <i className="fas fa-calendar-day"></i>
        </button>
      </div>
      <div className="text-sm text-gray-600 -mt-2 mb-4">
        <small>
          <i className="fas fa-info-circle mr-1"></i>
          Accepts: YYYYMMDD, MM/DD/YYYY, YYYY-MM-DD, DD MMM YY, or "today". Auto-formats to Naval standard.
        </small>
      </div>

      <div className="input-group">
        <span className="input-group-text">
          <i className="fas fa-user mr-2"></i>
          From:
        </span>
        <input
          className={`form-control ${validation.from.isValid ? 'is-valid' : formData.from && !validation.from.isValid ? 'is-invalid' : ''}`}
          type="text"
          placeholder="Commanding Officer, Marine Corps Base or Private Devil D. Dog 12345678790/0111 USMC"
          value={formData.from}
          onChange={(e) => {
            const value = e.target.value;
            setFormData(prev => ({ ...prev, from: value }));
            handleValidateFromTo(value, 'from');
          }}
          aria-invalid={formData.from && !validation.from.isValid}
          aria-describedby={validation.from.message ? "from-validation" : undefined}
        />
      </div>
      {validation.from.message && (
        <div
          id="from-validation"
          className={`feedback-message ${validation.from.isValid ? 'text-success' : 'text-warning'}`}
          role={validation.from.isValid ? "status" : "alert"}
        >
          <i className={`fas ${validation.from.isValid ? 'fa-check' : 'fa-exclamation-triangle'} mr-1`}></i>
          {validation.from.message}
        </div>
      )}

      <div className="input-group">
        <span className="input-group-text">
          <i className="fas fa-users mr-2"></i>
          To:
        </span>
        <input
          className={`form-control ${validation.to.isValid ? 'is-valid' : formData.to && !validation.to.isValid ? 'is-invalid' : ''}`}
          type="text"
          placeholder="Platoon Commander, 1st Platoon or Private Devil D. Dog 12345678790/0111 USMC"
          value={formData.to}
          onChange={(e) => {
            const value = e.target.value;
            setFormData(prev => ({ ...prev, to: value }));
            handleValidateFromTo(value, 'to');
          }}
          aria-invalid={formData.to && !validation.to.isValid}
          aria-describedby={validation.to.message ? "to-validation" : undefined}
        />
      </div>
      {validation.to.message && (
        <div
          id="to-validation"
          className={`feedback-message ${validation.to.isValid ? 'text-success' : 'text-warning'}`}
          role={validation.to.isValid ? "status" : "alert"}
        >
          <i className={`fas ${validation.to.isValid ? 'fa-check' : 'fa-exclamation-triangle'} mr-1`}></i>
          {validation.to.message}
        </div>
      )}

      <div className="input-group">
        <span className="input-group-text">
          <i className="fas fa-book mr-2"></i>
          Subject:
        </span>
        <input
          className={`form-control ${validation.subj.isValid ? 'is-valid' : formData.subj && !validation.subj.isValid ? 'is-invalid' : ''}`}
          type="text"
          placeholder="SUBJECT LINE IN ALL CAPS"
          value={formData.subj}
          onChange={(e) => {
            const value = autoUppercase(e.target.value);
            debugFormChange('Subject', value);
            setFormData(prev => ({ ...prev, subj: value }));
            handleValidateSubject(value);
          }}
          aria-invalid={formData.subj && !validation.subj.isValid}
          aria-describedby={validation.subj.message ? "subj-validation" : undefined}
        />
      </div>
      {validation.subj.message && (
        <div
          id="subj-validation"
          className={`feedback-message ${validation.subj.isValid ? 'text-success' : 'text-warning'}`}
          role={validation.subj.isValid ? "status" : "alert"}
        >
          <i className={`fas ${validation.subj.isValid ? 'fa-check' : 'fa-exclamation-triangle'} mr-1`}></i>
          {validation.subj.message}
        </div>
      )}
    </div>
  );
}
