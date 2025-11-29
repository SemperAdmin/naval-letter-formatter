/**
 * Shared type definitions for the Naval Letter Formatter application
 */

export interface ParagraphData {
  id: number;
  level: number;
  content: string;
  acronymError?: string;
}

export type EndorsementLevel = 'FIRST' | 'SECOND' | 'THIRD' | 'FOURTH' | 'FIFTH' | 'SIXTH' | '';

export interface FormData {
  documentType: 'basic' | 'endorsement';
  endorsementLevel: EndorsementLevel;
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
  headerType: 'USMC' | 'DON';
  bodyFont: 'times' | 'courier';
}

export interface SavedLetter extends FormData {
  id: string;
  savedAt: string;
  vias: string[];
  references: string[];
  enclosures: string[];
  copyTos: string[];
  paragraphs: ParagraphData[];
}

export interface ValidationState {
  ssic: { isValid: boolean; message: string; };
  subj: { isValid: boolean; message: string; };
  from: { isValid: boolean; message: string; };
  to: { isValid: boolean; message: string; };
}
