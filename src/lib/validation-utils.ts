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
 * Must follow naval correspondence format
 */
export function validateFromTo(value: string): ValidationResult {
  if (value.length <= 5) {
    return { isValid: false, message: '' };
  }

  const validPatterns = [
    /^(Commanding Officer|Chief of|Commander|Private|Corporal|Sergeant|Lieutenant|Captain|Major|Colonel|General)/i,
    /^(Private|Corporal|Sergeant|Lieutenant|Captain|Major|Colonel|General)\s[A-Za-z\s\.]+\s\d{10}\/\d{4}\s(USMC|USN)$/i,
    /^(Secretary|Under Secretary|Assistant Secretary)/i
  ];

  const isValid = validPatterns.some(pattern => pattern.test(value));

  if (isValid) {
    return { isValid: true, message: 'Valid naval format' };
  }

  return {
    isValid: false,
    message: 'Use proper naval format: "Commanding Officer, Unit Name" or "Rank First M. Last 1234567890/MOS USMC"'
  };
}
