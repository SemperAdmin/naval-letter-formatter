/**
 * Naval Letter Data Package (NLDP) Format Specification
 * Version 1.0.0
 * 
 * This module defines the structure and utilities for the NLDP file format,
 * which enables sharing of naval correspondence data between users.
 */

// Current format version - increment for breaking changes
export const NLDP_FORMAT_VERSION = '1.0.0';

// File extension and MIME type
export const NLDP_FILE_EXTENSION = '.nldp';
export const NLDP_MIME_TYPE = 'application/json';

// Metadata interface for data package files
export interface NLDPMetadata {
  /** Unique identifier for this data package */
  packageId: string;
  /** Version of the NLDP format specification */
  formatVersion: string;
  /** Date and time when the package was created (ISO 8601) */
  createdAt: string;
  /** Author information */
  author: {
    /** Display name or username */
    name?: string;
    /** Unit or organization */
    unit?: string;
    /** Email address (optional) */
    email?: string;
  };
  /** Package metadata */
  package: {
    /** Descriptive title for the data package */
    title: string;
    /** Optional description */
    description?: string;
    /** Subject line from the letter (for quick identification) */
    subject: string;
    /** Document type */
    documentType: 'basic' | 'endorsement';
    /** Tags for categorization */
    tags?: string[];
  };
  /** Validation checksums for data integrity */
  checksums: {
    /** SHA-256 hash of the data payload */
    dataHash: string;
    /** CRC32 checksum for quick validation */
    crc32: string;
  };
}

// Re-export existing interfaces for the data payload
export interface ParagraphData {
  id: number;
  level: number;
  content: string;
  acronymError?: string;
}

export interface FormData {
  documentType: 'basic' | 'endorsement';
  endorsementLevel: 'FIRST' | 'SECOND' | 'THIRD' | 'FOURTH' | 'FIFTH' | 'SIXTH' | '';
  basicLetterReference: string;
  referenceWho: string;
  referenceType: string;
  referenceDate: string;
  startingReferenceLevel: string;
  startingEnclosureNumber: string;
  line1: string;
  line2: string;
  line3: string;
  ssic: string;
  originatorCode: string;
  date: string;
  from: string;
  to: string;
  subj: string;
  sig: string;
  delegationText: string;
  startingPageNumber: number;
  previousPackagePageCount: number;
}

// Data payload interface - the actual correspondence data
export interface NLDPDataPayload {
  /** Form data containing all correspondence fields */
  formData: FormData;
  /** Array of via entries */
  vias: string[];
  /** Array of reference entries */
  references: string[];
  /** Array of enclosure entries */
  enclosures: string[];
  /** Array of copy-to entries */
  copyTos: string[];
  /** Array of paragraph data */
  paragraphs: ParagraphData[];
}

// Complete NLDP file structure
export interface NLDPFile {
  /** File format metadata */
  metadata: NLDPMetadata;
  /** Actual correspondence data */
  data: NLDPDataPayload;
}

// Validation result interface
export interface NLDPValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  formatVersion?: string;
  isCompatible: boolean;
}

// Import result interface
export interface NLDPImportResult {
  success: boolean;
  data?: NLDPDataPayload;
  metadata?: NLDPMetadata;
  errors: string[];
  warnings: string[];
}

// Export configuration interface
export interface NLDPExportConfig {
  author: {
    name?: string;
    unit?: string;
    email?: string;
  };
  package: {
    title: string;
    description?: string;
    tags?: string[];
  };
  includePersonalInfo?: boolean;
  compression?: boolean;
}
