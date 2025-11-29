/**
 * Form Validation Utilities
 * Pure validation functions for naval letter form fields
 */

export interface ValidationResult {
  isValid: boolean;
  message: string;
}

/**
 * Validates SSIC (Standard Subject Identification Code) format
 * Must be 4-5 digits
 */
export function validateSSIC(value: string): ValidationResult {
  const ssicPattern = /^\d{4,5}$/;

  if (!value) {
    return { isValid: false, message: '' };
  }

  if (ssicPattern.test(value)) {
    return { isValid: true, message: 'Valid SSIC format' };
  }

  let message = 'SSIC must be 4-5 digits';
  if (value.length < 4) {
    message = `SSIC must be 4-5 digits (currently ${value.length})`;
  } else if (value.length > 5) {
    message = 'SSIC too long (max 5 digits)';
  } else {
    message = 'SSIC must contain only numbers';
  }

  return { isValid: false, message };
}

/**
 * Validates subject line format
 * Must be in ALL CAPS
 */
export function validateSubject(value: string): ValidationResult {
  if (!value) {
    return { isValid: false, message: '' };
  }

  if (value === value.toUpperCase()) {
    return { isValid: true, message: 'Perfect! Subject is in ALL CAPS' };
  }

  return { isValid: false, message: 'Subject must be in ALL CAPS' };
}

/**
 * Validates From/To field format
 * Requires minimum length to ensure field is filled out
 */
export function validateFromTo(value: string): ValidationResult {
  if (!value || value.trim().length === 0) {
    return { isValid: false, message: '' };
  }

  if (value.trim().length < 5) {
    return { isValid: false, message: 'Please enter a complete From/To address' };
  }

  return { isValid: true, message: 'Valid format' };
}
