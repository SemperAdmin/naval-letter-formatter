/**
 * Application constants for Naval Letter Generator
 */

/**
 * Reference type options for naval correspondence
 * Used in reference input dropdowns
 */
export const REFERENCE_TYPES = [
  { value: 'ltr', label: 'Letter (ltr)' },
  { value: 'msg', label: 'Message (msg)' },
  { value: 'memo', label: 'Memorandum (memo)' },
  { value: 'AA Form', label: 'Administrative Action Form (AA Form)' },
  { value: 'request', label: 'Request' },
  { value: 'report', label: 'Report' },
  { value: 'instruction', label: 'Instruction' },
  { value: 'notice', label: 'Notice' },
  { value: 'order', label: 'Order' },
  { value: 'directive', label: 'Directive' },
  { value: 'endorsement', label: 'Endorsement' }
];

/**
 * Common originators ("who") for reference autocomplete/suggestions
 * Used in structured reference input
 */
export const COMMON_ORIGINATORS = [
  'CO',
  'XO',
  'CMC',
  'S-1',
  '1stSgt',
  'CNO',
  'SECNAV',
  'LCpl Semper Admin'
];
