
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Document, Packer, Paragraph, TextRun, AlignmentType, TabStopType, Header, ImageRun, VerticalPositionRelativeFrom, HorizontalPositionRelativeFrom, Footer, PageNumber, IParagraphOptions, convertInchesToTwip, TextWrappingType } from 'docx';
import { saveAs } from 'file-saver';
import { getDoDSealBufferSync } from '@/lib/dod-seal';
import { DOC_SETTINGS } from '@/lib/doc-settings';
import { createFormattedParagraph } from '@/lib/paragraph-formatter';
import { UNITS, Unit } from '@/lib/units';
import { SSICS } from '@/lib/ssic';
import { Combobox } from '@/components/ui/combobox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { configureConsole, logError, debugUserAction, debugFormChange } from '@/lib/console-utils';
import { NLDPFileManager } from '../components/NLDPFileManager';


interface ParagraphData {
  id: number;
  level: number;
  content: string;
  acronymError?: string;
}

type EndorsementLevel = 'FIRST' | 'SECOND' | 'THIRD' | 'FOURTH' | 'FIFTH' | 'SIXTH' | '';

interface FormData {
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

interface SavedLetter extends FormData {
  id: string;
  savedAt: string;
  vias: string[];
  references: string[];
  enclosures: string[];
  copyTos: string[];
  paragraphs: ParagraphData[];
}


interface ValidationState {
  ssic: { isValid: boolean; message: string; };
  subj: { isValid: boolean; message: string; };
  from: { isValid: boolean; message: string; };
  to: { isValid: boolean; message: string; };
}

// Helper function to get the body font based on user selection
const getBodyFont = (bodyFont: 'times' | 'courier'): string => {
  return bodyFont === 'courier' ? 'Courier New' : 'Times New Roman';
};


// Helper functions for Courier New spacing
const getFromToSpacing = (label: string, bodyFont: 'times' | 'courier'): string => {
  if (bodyFont === 'courier') {
    if (label === 'From') return 'From:  '; // 2 spaces
    if (label === 'To') return 'To:    '; // 4 spaces
  }
  return `${label}:\t`; // Tab for Times New Roman
};

const getViaSpacing = (index: number, bodyFont: 'times' | 'courier'): string => {
  if (bodyFont === 'courier') {
    return index === 0 
      ? `Via:\u00A0\u00A0\u00A0(${index + 1})\u00A0` // 3 spaces before, 1 space after
      : `\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0(${index + 1})\u00A0`; // 7 spaces before, 1 space after
  }
  return index === 0 ? `Via:\t(${index + 1})\t` : `\t(${index + 1})\t`;
};

const getSubjSpacing = (bodyFont: 'times' | 'courier'): string => {
  return bodyFont === 'courier' ? 'Subj:  ' : 'Subj:\t'; // 2 spaces or tab
};

const getRefSpacing = (letter: string, index: number, bodyFont: 'times' | 'courier'): string => {
  if (bodyFont === 'courier') {
    return index === 0 
      ? `Ref:\u00A0\u00A0\u00A0(${letter})\u00A0` // 3 spaces before, 1 space after
      : `\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0(${letter})\u00A0`; // 7 spaces before, 1 space after
  }
  return index === 0 ? `Ref:\t(${letter})\t` : `\t(${letter})\t`;
};

const getEnclSpacing = (number: number, index: number, bodyFont: 'times' | 'courier'): string => {
  if (bodyFont === 'courier') {
    return index === 0 
      ? `Encl:\u00A0\u00A0(${number})\u00A0` // 2 spaces before, 1 space after
      : `\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0(${number})\u00A0`; // 7 spaces before, 1 space after
  }
  return index === 0 ? `Encl:\t(${number})\t` : `\t(${number})\t`;
};

const getCopyToSpacing = (bodyFont: 'times' | 'courier'): string => {
  return bodyFont === 'courier' ? 'Copy to:  ' : 'Copy to:'; // 2 spaces for Courier
};

// Helper to split string into chunks without breaking words
const splitSubject = (str: string, chunkSize: number): string[] => {
  const chunks: string[] = [];
  if (!str) return chunks;
  let i = 0;
  while (i < str.length) {
    let chunk = str.substring(i, i + chunkSize);
    if (i + chunkSize < str.length && str[i + chunkSize] !== ' ' && chunk.includes(' ')) {
      const lastSpaceIndex = chunk.lastIndexOf(' ');
      if (lastSpaceIndex > -1) {
        chunk = chunk.substring(0, lastSpaceIndex);
        i += chunk.length + 1;
      } else {
        i += chunkSize;
      }
    } else {
      i += chunkSize;
    }
    chunks.push(chunk.trim());
  }
  return chunks;
};


// ===============================
// REFERENCE TYPE OPTIONS
// ===============================

const REFERENCE_TYPES = [
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

// Common "who" examples for autocomplete/suggestions
const COMMON_ORIGINATORS = [
  'CO',
  'XO',
  'CMC',
  'S-1',
  '1stSgt',
  'CNO',
  'SECNAV',
  'LCpl Semper Admin'
];


// ===============================
// STRUCTURED REFERENCE INPUT COMPONENT
// ===============================

interface StructuredReferenceInputProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
}

function StructuredReferenceInput({ formData, setFormData }: StructuredReferenceInputProps) {
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

  const parseAndFormatDate = (dateString: string) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // If already in Naval format, return as-is
    const navalPattern = /^\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{2}$/i;
    if (navalPattern.test(dateString)) {
      return dateString;
    }

    let date: Date | null = null;

    // Handle various date formats
    if (dateString.toLowerCase() === 'today' || dateString.toLowerCase() === 'now') {
      date = new Date();
    } else if (/^\d{8}$/.test(dateString)) {
      const year = dateString.substring(0, 4);
      const month = dateString.substring(4, 6);
      const day = dateString.substring(6, 8);
      date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    } else if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(dateString)) {
      date = new Date(dateString);
    } else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString)) {
      const parts = dateString.split('/');
      date = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
    } else {
      try {
        const parsedDate = new Date(dateString);
        if (!isNaN(parsedDate.getTime())) {
          date = parsedDate;
        }
      } catch (e) {
        // ignore invalid date strings
      }
    }

    if (!date || isNaN(date.getTime())) {
      return dateString; // Return original if can't parse
    }

    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear().toString().slice(-2);

    return `${day} ${month} ${year}`;
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


// --- New Components for References and Enclosures ---

interface ReferencesProps {
  references: string[];
  setReferences: (refs: string[]) => void;
  formData: FormData;
  setFormData: (data: FormData) => void;
}

const ReferencesSection = ({ references, setReferences, formData, setFormData }: ReferencesProps) => {
  const [showRef, setShowRef] = useState(false);

  useEffect(() => {
    setShowRef(references.some(r => r.trim() !== ''));
  }, [references]);

  const addItem = () => setReferences([...references, '']);
  const removeItem = (index: number) => setReferences(references.filter((_, i) => i !== index));
  const updateItem = (index: number, value: string) => setReferences(references.map((item, i) => i === index ? value : item));

  const getReferenceLetter = (index: number, startingLevel: string): string => {
    const startCharCode = startingLevel.charCodeAt(0);
    return String.fromCharCode(startCharCode + index);
  };

  const generateReferenceOptions = () => {
    return Array.from({ length: 26 }, (_, i) => String.fromCharCode(97 + i)).map(letter => ({
      value: letter,
      label: `Start with reference (${letter})`
    }));
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-lg font-semibold">
          <i className="fas fa-book mr-2"></i>
          References
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-6">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="ifRef"
              value="yes"
              checked={showRef}
              onChange={() => setShowRef(true)}
              className="mr-2 scale-125"
            />
            <span className="text-base">Yes</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="ifRef"
              value="no"
              checked={!showRef}
              onChange={() => { setShowRef(false); setReferences(['']); }}
              className="mr-2 scale-125"
            />
            <span className="text-base">No</span>
          </label>
        </div>

        {showRef && (
          <div className="space-y-4">
            {formData.documentType === 'endorsement' && (
              <>
                <div className="mt-2 p-3 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 rounded-r-lg mb-4">
                  <div className="flex">
                    <div className="py-1"><i className="fas fa-exclamation-triangle fa-lg mr-3"></i></div>
                    <div>
                      <p className="font-bold">Endorsement Reference Rules</p>
                      <p className="text-sm">Only add NEW references not mentioned in the basic letter or previous endorsements. Continue the lettering sequence from the last reference.</p>
                    </div>
                  </div>
                </div>
                <div className="input-group">
                  <span className="input-group-text">Starting Reference:</span>
                  <select
                    className="form-control"
                    value={formData.startingReferenceLevel}
                    onChange={(e) => setFormData({ ...formData, startingReferenceLevel: e.target.value })}
                  >
                    {generateReferenceOptions().map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
              </>
            )}
            <label className="block font-semibold mb-2">
              <i className="fas fa-bookmark mr-2"></i>
              Enter Reference(s):
            </label>
            {references.map((ref, index) => (
              <div key={index} className="input-group" style={{ width: '100%', display: 'flex' }}>
                <span className="input-group-text" style={{
                  minWidth: '60px',
                  justifyContent: 'center',
                  alignItems: 'center',
                  display: 'flex',
                  background: 'linear-gradient(135deg, #b8860b, #ffd700)',
                  color: 'white',
                  fontWeight: '600',
                  borderRadius: '8px 0 0 8px',
                  border: '2px solid #b8860b',
                  flexShrink: 0,
                  textAlign: 'center'
                }}>
                  ({getReferenceLetter(index, formData.startingReferenceLevel)})
                </span>
                <input
                  className="form-control"
                  type="text"
                  placeholder="📚 Enter reference information (e.g., NAVADMIN 123/24, OPNAVINST 5000.1)"
                  value={ref}
                  onChange={(e) => updateItem(index, e.target.value)}
                  style={{
                    fontSize: '1rem',
                    padding: '12px 16px',
                    border: '2px solid #e0e0e0',
                    borderLeft: 'none',
                    borderRadius: '0',
                    transition: 'all 0.3s ease',
                    backgroundColor: '#fafafa',
                    flex: '1',
                    minWidth: '0'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#b8860b';
                    e.target.style.backgroundColor = '#fff';
                    e.target.style.boxShadow = '0 0 0 3px rgba(184, 134, 11, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e0e0e0';
                    e.target.style.backgroundColor = '#fafafa';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                {index === references.length - 1 ? (
                  <button
                    className="btn btn-primary"
                    type="button"
                    onClick={addItem}
                    style={{
                      borderRadius: '0 8px 8px 0',
                      flexShrink: 0,
                      background: 'linear-gradient(135deg, #b8860b, #ffd700)',
                      border: '2px solid #b8860b',
                      color: 'white',
                      fontWeight: '600',
                      padding: '8px 16px',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      (e.target as HTMLButtonElement).style.background = 'linear-gradient(135deg, #ffd700, #b8860b)';
                      (e.target as HTMLButtonElement).style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLButtonElement).style.background = 'linear-gradient(135deg, #b8860b, #ffd700)';
                      (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
                    }}
                  >
                    <i className="fas fa-plus" style={{ marginRight: '4px' }}></i>
                    Add
                  </button>
                ) : (
                  <button
                    className="btn btn-danger"
                    type="button"
                    onClick={() => removeItem(index)}
                    style={{
                      borderRadius: '0 8px 8px 0',
                      flexShrink: 0
                    }}
                  >
                    <i className="fas fa-trash" style={{ marginRight: '4px' }}></i>
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};


interface EnclosuresProps {
  enclosures: string[];
  setEnclosures: (encls: string[]) => void;
  formData: FormData;
  setFormData: (data: FormData) => void;
  getEnclosureNumber: (index: number, startingNumber: string) => number;
  generateEnclosureOptions: () => Array<{ value: string, label: string }>;
}

const EnclosuresSection = ({ enclosures, setEnclosures, formData, setFormData, getEnclosureNumber, generateEnclosureOptions }: EnclosuresProps) => {
  const [showEncl, setShowEncl] = useState(false);

  useEffect(() => {
    setShowEncl(enclosures.some(e => e.trim() !== ''));
  }, [enclosures]);

  const addItem = () => setEnclosures([...enclosures, '']);
  const removeItem = (index: number) => setEnclosures(enclosures.filter((_, i) => i !== index));
  const updateItem = (index: number, value: string) => setEnclosures(enclosures.map((item, i) => i === index ? value : item));

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-lg font-semibold">
          <i className="fas fa-paperclip mr-2"></i>
          Enclosures
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-6">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="ifEncl"
              value="yes"
              checked={showEncl}
              onChange={() => setShowEncl(true)}
              className="mr-2 scale-125"
            />
            <span className="text-base">Yes</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="ifEncl"
              value="no"
              checked={!showEncl}
              onChange={() => { setShowEncl(false); setEnclosures(['']); }}
              className="mr-2 scale-125"
            />
            <span className="text-base">No</span>
          </label>
        </div>

        {showEncl && (
          <div className="space-y-4">
            {formData.documentType === 'endorsement' && (
              <>
                <div className="mt-2 p-3 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 rounded-r-lg mb-4">
                  <div className="flex">
                    <div className="py-1"><i className="fas fa-exclamation-triangle fa-lg mr-3"></i></div>
                    <div>
                      <p className="font-bold">Endorsement Enclosure Rules</p>
                      <p className="text-sm">Only add NEW enclosures not mentioned in the basic letter or previous endorsements. Continue the numbering sequence from the last enclosure.</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                  <span className="font-medium text-gray-700 whitespace-nowrap">Starting Enclosure:</span>
                  <select
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.startingEnclosureNumber}
                    onChange={(e) => setFormData({ ...formData, startingEnclosureNumber: e.target.value })}
                  >
                    {generateEnclosureOptions().map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
              </>
            )}

            <div className="space-y-3">
              <h4 className="font-semibold text-gray-700 flex items-center">
                <i className="fas fa-paperclip mr-2"></i>
                Enter Enclosure(s):
              </h4>
              {enclosures.map((encl, index) => (
                <div key={index} className="flex items-stretch rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md">
                  <div className="flex items-center justify-center px-4 py-3 bg-gradient-to-r from-yellow-600 to-yellow-500 text-white font-bold text-center min-w-[60px] border-r-2 border-yellow-700">
                    ({getEnclosureNumber(index, formData.startingEnclosureNumber)})
                  </div>
                  <input
                    className="flex-1 px-4 py-3 border-0 focus:outline-none focus:ring-0 bg-gray-50 hover:bg-white focus:bg-white transition-colors text-gray-700 placeholder-gray-400"
                    type="text"
                    placeholder="📎 Enter enclosure details (e.g., Training Certificate, Medical Records)"
                    value={encl}
                    onChange={(e) => updateItem(index, e.target.value)}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#b8860b';
                      e.target.style.backgroundColor = '#fff';
                      e.target.style.boxShadow = '0 0 0 3px rgba(184, 134, 11, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e9ecef';
                      e.target.style.backgroundColor = '#f8f9fa';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  {index === enclosures.length - 1 ? (
                    <button
                      className="px-4 py-3 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-700 hover:to-yellow-600 text-white font-semibold transition-all duration-200 border-l-2 border-yellow-700 flex items-center"
                      type="button"
                      onClick={addItem}
                      onMouseEnter={(e) => {
                        (e.target as HTMLButtonElement).style.background = 'linear-gradient(135deg, #ffd700, #b8860b)';
                        (e.target as HTMLButtonElement).style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        (e.target as HTMLButtonElement).style.background = 'linear-gradient(135deg, #b8860b, #ffd700)';
                        (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
                      }}
                    >
                      <i className="fas fa-plus mr-2"></i>
                      Add
                    </button>
                  ) : (
                    <button
                      className="px-4 py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-semibold transition-all duration-200 border-l-2 border-red-700 flex items-center"
                      type="button"
                      onClick={() => removeItem(index)}
                    >
                      <i className="fas fa-trash mr-2"></i>
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};


export default function NavalLetterGenerator() {
  // Configure console to suppress browser extension errors
  useEffect(() => {
    configureConsole();
  }, []);

const [formData, setFormData] = useState<FormData>({
    documentType: 'basic',
    endorsementLevel: '',
    basicLetterReference: '',
    referenceWho: '',
    referenceType: '',
    referenceDate: '',
    startingReferenceLevel: 'a',
    startingEnclosureNumber: '1',
    line1: '', line2: '', line3: '', ssic: '', originatorCode: '', date: '', from: '', to: '', subj: '', sig: '', delegationText: '',
    startingPageNumber: 1,
    previousPackagePageCount: 0,
    headerType: 'USMC',
    bodyFont: 'times',
  });

  const [validation, setValidation] = useState<ValidationState>({
    ssic: { isValid: false, message: '' },
    subj: { isValid: false, message: '' },
    from: { isValid: false, message: '' },
    to: { isValid: false, message: '' }
  });

  const [showVia, setShowVia] = useState(false);
  const [showRef, setShowRef] = useState(false);
  const [showEncl, setShowEncl] = useState(false);
  const [showCopy, setShowCopy] = useState(false);
  const [showDelegation, setShowDelegation] = useState(false);

  const [vias, setVias] = useState<string[]>(['']);
  const [references, setReferences] = useState<string[]>(['']);
  const [enclosures, setEnclosures] = useState<string[]>(['']);
  const [copyTos, setCopyTos] = useState<string[]>(['']);

  const [paragraphs, setParagraphs] = useState<ParagraphData[]>([{ id: 1, level: 1, content: '', acronymError: '' }]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedLetters, setSavedLetters] = useState<SavedLetter[]>([]);

  // Add voice recognition state
  const [voiceRecognition, setVoiceRecognition] = useState<any>(null);
  const [activeVoiceInput, setActiveVoiceInput] = useState<number | null>(null);

  // Add useRef to track values without causing re-renders
  const activeVoiceInputRef = useRef<number | null>(null);
  const paragraphsRef = useRef<ParagraphData[]>(paragraphs);
  
  // Update refs when state changes
  useEffect(() => {
    activeVoiceInputRef.current = activeVoiceInput;
  }, [activeVoiceInput]);
  
  useEffect(() => {
    paragraphsRef.current = paragraphs;
  }, [paragraphs]);

  // Helper functions for references and enclosures
  const getReferenceLetter = (index: number, startingLevel: string): string => {
    const startCharCode = startingLevel.charCodeAt(0);
    return String.fromCharCode(startCharCode + index);
  };

  const getEnclosureNumber = (index: number, startingNumber: string): number => {
    return parseInt(startingNumber, 10) + index;
  };

  const generateReferenceOptions = () => {
    return Array.from({ length: 26 }, (_, i) => String.fromCharCode(97 + i)).map(letter => ({
      value: letter,
      label: `Start with reference (${letter})`
    }));
  };

  const generateEnclosureOptions = () => {
    return Array.from({ length: 20 }, (_, i) => i + 1).map(num => ({
      value: num.toString(),
      label: `Start with enclosure (${num})`
    }));
  };

  // Load saved letters from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('navalLetters');
      if (saved) {
        setSavedLetters(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Failed to load saved letters from localStorage", error);
    }
  }, []);


  // Set today's date on component mount
  useEffect(() => {
    setTodaysDate();
  }, []);

  const saveLetter = () => {
    debugUserAction('Save Letter', {
      subject: formData.subj.substring(0, 30) + (formData.subj.length > 30 ? '...' : ''),
      paragraphCount: paragraphs.length
    });
    
    const newLetter: SavedLetter = {
      ...formData,
      id: new Date().toISOString(), // Unique ID
      savedAt: new Date().toLocaleString(),
      vias,
      references,
      enclosures,
      copyTos,
      paragraphs,
    };

    const updatedLetters = [newLetter, ...savedLetters].slice(0, 10); // Keep max 10 saves
    setSavedLetters(updatedLetters);
    localStorage.setItem('navalLetters', JSON.stringify(updatedLetters));
  };

  const loadLetter = (letterId: string) => {
    debugUserAction('Load Letter', { letterId });
    
    const letterToLoad = savedLetters.find(l => l.id === letterId);
    if (letterToLoad) {
      setFormData({
        documentType: letterToLoad.documentType || 'basic',
        endorsementLevel: letterToLoad.endorsementLevel || '',
        basicLetterReference: letterToLoad.basicLetterReference || '',
        referenceWho: letterToLoad.referenceWho || '',
        referenceType: letterToLoad.referenceType || '',
        referenceDate: letterToLoad.referenceDate || '',
        startingReferenceLevel: letterToLoad.startingReferenceLevel || 'a',
        startingEnclosureNumber: letterToLoad.startingEnclosureNumber || '1',
        line1: letterToLoad.line1,
        line2: letterToLoad.line2,
        line3: letterToLoad.line3,
        ssic: letterToLoad.ssic,
        originatorCode: letterToLoad.originatorCode,
        date: letterToLoad.date,
        from: letterToLoad.from,
        to: letterToLoad.to,
        subj: letterToLoad.subj,
        sig: letterToLoad.sig,
        delegationText: letterToLoad.delegationText,
        startingPageNumber: letterToLoad.startingPageNumber || 1,
        previousPackagePageCount: letterToLoad.previousPackagePageCount || 0,
      });
      setVias(letterToLoad.vias);
      setReferences(letterToLoad.references);
      setEnclosures(letterToLoad.enclosures);
      setCopyTos(letterToLoad.copyTos);
      setParagraphs(letterToLoad.paragraphs);

      // Also update the UI toggles
      setShowVia(letterToLoad.vias.some(v => v.trim() !== ''));
      setShowRef(letterToLoad.references.some(r => r.trim() !== ''));
      setShowEncl(letterToLoad.enclosures.some(e => e.trim() !== ''));
      setShowCopy(letterToLoad.copyTos.some(c => c.trim() !== ''));
      setShowDelegation(!!letterToLoad.delegationText);

      // Re-validate fields after loading
      validateSSIC(letterToLoad.ssic);
      validateSubject(letterToLoad.subj);
      validateFromTo(letterToLoad.from, 'from');
      validateFromTo(letterToLoad.to, 'to');
    }
  };


  // Validation Functions
  const validateSSIC = (value: string) => {
    const ssicPattern = /^\d{4,5}$/;
    if (!value) {
      setValidation(prev => ({ ...prev, ssic: { isValid: false, message: '' } }));
      return;
    }

    if (ssicPattern.test(value)) {
      setValidation(prev => ({ ...prev, ssic: { isValid: true, message: 'Valid SSIC format' } }));
    } else {
      let message = 'SSIC must be 4-5 digits';
      if (value.length < 4) {
        message = `SSIC must be 4-5 digits (currently ${value.length})`;
      } else if (value.length > 5) {
        message = 'SSIC too long (max 5 digits)';
      } else {
        message = 'SSIC must contain only numbers';
      }
      setValidation(prev => ({ ...prev, ssic: { isValid: false, message } }));
    }
  };

  const validateSubject = (value: string) => {
    if (!value) {
      setValidation(prev => ({ ...prev, subj: { isValid: false, message: '' } }));
      return;
    }

    if (value === value.toUpperCase()) {
      setValidation(prev => ({ ...prev, subj: { isValid: true, message: 'Perfect! Subject is in ALL CAPS' } }));
    } else {
      setValidation(prev => ({ ...prev, subj: { isValid: false, message: 'Subject must be in ALL CAPS' } }));
    }
  };

  const validateFromTo = (value: string, field: 'from' | 'to') => {
    if (value.length <= 5) {
      setValidation(prev => ({ ...prev, [field]: { isValid: false, message: '' } }));
      return;
    }

    const validPatterns = [
      /^(Commanding Officer|Chief of|Commander|Private|Corporal|Sergeant|Lieutenant|Captain|Major|Colonel|General)/i,
      /^(Private|Corporal|Sergeant|Lieutenant|Captain|Major|Colonel|General)\s[A-Za-z\s\.]+\s\d{10}\/\d{4}\s(USMC|USN)$/i,
      /^(Secretary|Under Secretary|Assistant Secretary)/i
    ];

    const isValid = validPatterns.some(pattern => pattern.test(value));

    if (isValid) {
      setValidation(prev => ({ ...prev, [field]: { isValid: true, message: 'Valid naval format' } }));
    } else {
      setValidation(prev => ({ ...prev, [field]: { isValid: false, message: 'Use proper naval format: "Commanding Officer, Unit Name" or "Rank First M. Last 1234567890/MOS USMC"' } }));
    }
  };

  const setTodaysDate = () => {
    const today = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const navyDate = today.getDate() + ' ' + months[today.getMonth()] + ' ' + today.getFullYear().toString().slice(-2);
    setFormData(prev => ({ ...prev, date: navyDate }));
  };

  const parseAndFormatDate = (dateString: string) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // If already in Naval format, return as-is
    const navalPattern = /^\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{2}$/i;
    if (navalPattern.test(dateString)) {
      return dateString;
    }

    let date: Date | null = null;

    // Handle various date formats
    if (dateString.toLowerCase() === 'today' || dateString.toLowerCase() === 'now') {
      date = new Date();
    } else if (/^\d{8}$/.test(dateString)) {
      const year = dateString.substring(0, 4);
      const month = dateString.substring(4, 6);
      const day = dateString.substring(6, 8);
      date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    } else if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(dateString)) {
      date = new Date(dateString);
    } else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString)) {
      const parts = dateString.split('/');
      date = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
    } else {
      try {
        const parsedDate = new Date(dateString);
        if (!isNaN(parsedDate.getTime())) {
          date = parsedDate;
        }
      } catch (e) {
        // ignore invalid date strings
      }
    }

    if (!date || isNaN(date.getTime())) {
      return dateString; // Return original if can't parse
    }

    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear().toString().slice(-2);

    return `${day} ${month} ${year}`;
  };

  const handleDocumentTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newType = e.target.value as 'basic' | 'endorsement';
    setFormData(prev => ({
      ...prev,
      documentType: newType,
      // Reset endorsement fields if switching back to basic
      endorsementLevel: newType === 'basic' ? '' : prev.endorsementLevel,
      basicLetterReference: newType === 'basic' ? '' : prev.basicLetterReference,
      referenceWho: newType === 'basic' ? '' : prev.referenceWho,
      referenceType: newType === 'basic' ? '' : prev.referenceType,
      referenceDate: newType === 'basic' ? '' : prev.referenceDate,
      startingReferenceLevel: 'a',
      startingEnclosureNumber: '1',
      startingPageNumber: 1,
      previousPackagePageCount: 0,
    }));
  };

  const handleEndorsementLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const level = e.target.value as EndorsementLevel;

    const levelMap: Record<string, number> = {
      'FIRST': 1, 'SECOND': 2, 'THIRD': 3, 'FOURTH': 4, 'FIFTH': 5, 'SIXTH': 6, 'RECEIVING': 1
    };

    const prevPages = levelMap[level] ? levelMap[level] - 1 : 0;
    const refStart = String.fromCharCode('a'.charCodeAt(0) + (levelMap[level] || 1) - 1);
    const enclStart = (levelMap[level] || 1).toString();

    setFormData(prev => ({
      ...prev,
      endorsementLevel: level,
      startingReferenceLevel: refStart,
      startingEnclosureNumber: enclStart,
      previousPackagePageCount: prevPages,
      startingPageNumber: (prev.previousPackagePageCount || 0) + 1
    }));
  };

  const numbersOnly = (value: string) => {
    return value.replace(/\D/g, '');
  };

  const autoUppercase = (value: string) => {
    return value.toUpperCase();
  };

  const addItem = (setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter((prev: string[]) => [...prev, '']);
  };

  const removeItem = (index: number, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter((prev: string[]) => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, value: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter((prev: string[]) => prev.map((item: string, i: number) => i === index ? value : item));
  };


  const addParagraph = (type: 'main' | 'sub' | 'same' | 'up', afterId: number) => {
    debugUserAction(`Add Paragraph (${type})`, { afterId, currentLevel: paragraphs.find(p => p.id === afterId)?.level });
    
    const currentParagraph = paragraphs.find(p => p.id === afterId);
    if (!currentParagraph) return;

    let newLevel = 1;
    switch (type) {
      case 'main': newLevel = 1; break;
      case 'same': newLevel = currentParagraph.level; break;
      case 'sub': newLevel = Math.min(currentParagraph.level + 1, 8); break;
      case 'up': newLevel = Math.max(currentParagraph.level - 1, 1); break;
    }

    const newId = (paragraphs.length > 0 ? Math.max(...paragraphs.map(p => p.id)) : 0) + 1;
    const currentIndex = paragraphs.findIndex(p => p.id === afterId);
    const newParagraphs = [...paragraphs];
    newParagraphs.splice(currentIndex + 1, 0, { id: newId, level: newLevel, content: '' });

    // Validate numbering after adding
    const numberingErrors = validateParagraphNumbering(newParagraphs);
    // Note: Allow addition even with numbering issues - user may be building structure

    setParagraphs(newParagraphs);
  };

  const removeParagraph = (id: number) => {
    debugUserAction('Remove Paragraph', { id, paragraphCount: paragraphs.length });
    
    if (paragraphs.length <= 1) {
      if (paragraphs[0].id === id) {
        updateParagraphContent(id, '');
        return;
      }
    }

    const newParagraphs = paragraphs.filter(p => p.id !== id);

    // Validate numbering after removal
    const numberingErrors = validateParagraphNumbering(newParagraphs);
    if (numberingErrors.length > 0) {
      // Show confirmation dialog for potentially problematic removals
      const proceed = window.confirm(
        `Removing this paragraph may create numbering issues:\n\n${numberingErrors.join('\n')}\n\nDo you want to proceed?`
      );
      if (!proceed) return;
    }

    setParagraphs(newParagraphs);
  };

  const validateAcronyms = useCallback((allParagraphs: ParagraphData[]) => {
    const fullText = allParagraphs.map(p => p.content).join('\n');
    const definedAcronyms = new Set<string>();

    // Regex to find explicit definitions: e.g., "Full Name (ACRONYM)"
    const acronymDefinitionRegex = /\b[A-Za-z\s]+?\s+\(([A-Z]{2,})\)/g;

    let match;
    while ((match = acronymDefinitionRegex.exec(fullText)) !== null) {
      definedAcronyms.add(match[1]);
    }

    const globallyDefined = new Set<string>();
    const finalParagraphs = allParagraphs.map(p => {
      let error = '';
      // Find all potential acronyms (2+ capital letters in a row)
      const potentialAcronyms = p.content.match(/\b[A-Z]{2,}\b/g) || [];

      for (const acronym of potentialAcronyms) {
        const isDefined = globallyDefined.has(acronym);
        // Check if the acronym is being defined *in this paragraph*
        const definitionPattern = new RegExp(`\\b([A-Za-z][a-z]+(?:\\s[A-Za-z][a-z]+)*)\\s*\\(\\s*${acronym}\\s*\\)`);
        const isDefiningNow = definitionPattern.test(p.content);

        if (!isDefined && !isDefiningNow) {
          error = `Acronym "${acronym}" used without being defined first. Please define it as "Full Name (${acronym})".`;
          break; // Stop after the first error in the paragraph
        }
        if (isDefiningNow) {
          globallyDefined.add(acronym);
        }
      }
      return { ...p, acronymError: error };
    });

    setParagraphs(finalParagraphs);
  }, []);


  const updateParagraphContent = (id: number, content: string) => {
    debugFormChange(`Paragraph ${id}`, `"${content.substring(0, 50)}${content.length > 50 ? '...' : '"'}`);
    
    // Only replace non-breaking spaces and line breaks, preserve regular spaces (ASCII 32)
    const cleanedContent = content
      .replace(/\u00A0/g, ' ')  // Replace non-breaking spaces with regular spaces
      .replace(/\u2007/g, ' ')  // Replace figure spaces with regular spaces
      .replace(/\u202F/g, ' ')  // Replace narrow non-breaking spaces with regular spaces
      .replace(/[\r\n]/g, ' '); // Replace line breaks with spaces

    const newParagraphs = paragraphs.map(p => p.id === id ? { ...p, content: cleanedContent } : p)
    setParagraphs(newParagraphs);
    validateAcronyms(newParagraphs);
  };

  // Voice Recognition Functions
  const initializeVoiceRecognition = useCallback(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onresult = function(event: any) {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript && activeVoiceInputRef.current !== null) {
          const currentParagraph = paragraphsRef.current.find(p => p.id === activeVoiceInputRef.current);
          if (currentParagraph) {
            const newContent = currentParagraph.content + (currentParagraph.content ? ' ' : '') + finalTranscript;
            updateParagraphContent(activeVoiceInputRef.current, newContent);
          }
        }
      };

      recognition.onerror = function(event: any) {
        logError('Voice Recognition', event.error);
        setActiveVoiceInput(null);
      };
      
      recognition.onend = function() {
        setActiveVoiceInput(null);
      };
      
      setVoiceRecognition(recognition);
    }
  }, []); // Empty dependency array - only initialize once

  const toggleVoiceInput = (paragraphId: number) => {
    if (!voiceRecognition) {
      alert('Voice recognition not supported in this browser');
      return;
    }
    
    if (activeVoiceInput === paragraphId) {
      voiceRecognition.stop();
      setActiveVoiceInput(null);
    } else {
      if (activeVoiceInput !== null) {
        voiceRecognition.stop();
      }
      setActiveVoiceInput(paragraphId);
      voiceRecognition.start();
    }
  };

  // Initialize voice recognition on component mount
  useEffect(() => {
    initializeVoiceRecognition();
  }, []); // Empty dependency array - only run once on mount

  const moveParagraphUp = (id: number) => {
    const currentIndex = paragraphs.findIndex(p => p.id === id);
    if (currentIndex > 0) {
      const currentPara = paragraphs[currentIndex];
      const paraAbove = paragraphs[currentIndex - 1];

      // Prevent a sub-paragraph from moving above its parent
      if (currentPara.level > paraAbove.level) {
        return;
      }

      const newParagraphs = [...paragraphs];
      [newParagraphs[currentIndex - 1], newParagraphs[currentIndex]] = [newParagraphs[currentIndex], newParagraphs[currentIndex - 1]];
      setParagraphs(newParagraphs);
    }
  };

  const moveParagraphDown = (id: number) => {
    const currentIndex = paragraphs.findIndex(p => p.id === id);
    if (currentIndex < paragraphs.length - 1) {
      const newParagraphs = [...paragraphs];
      [newParagraphs[currentIndex], newParagraphs[currentIndex + 1]] = [newParagraphs[currentIndex + 1], newParagraphs[currentIndex]];
      setParagraphs(newParagraphs);
    }
  };

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

  /**
   * Generates the correct citation string (e.g., "1.", "a.", "(1)") for a given paragraph for UI display.
   */
  const getUiCitation = (paragraph: ParagraphData, index: number, allParagraphs: ParagraphData[]): string => {
    const { level } = paragraph;

    // Helper to get the citation for a single level
    const getCitationPart = (targetLevel: number, parentIndex: number) => {
      let listStartIndex = 0;
      if (targetLevel > 1) {
        for (let i = parentIndex - 1; i >= 0; i--) {
          if (allParagraphs[i].level < targetLevel) {
            listStartIndex = i + 1;
            break;
          }
        }
      }

      let count = 0;
      for (let i = listStartIndex; i <= parentIndex; i++) {
        if (allParagraphs[i].level === targetLevel) {
          count++;
        }
      }

      switch (targetLevel) {
        case 1: return `${count}.`;
        case 2: return `${String.fromCharCode(96 + count)}`;
        case 3: return `(${count})`;
        case 4: return `(${String.fromCharCode(96 + count)})`;
        case 5: return `${count}.`;
        case 6: return `${String.fromCharCode(96 + count)}.`;
        case 7: return `(${count})`;
        case 8: return `(${String.fromCharCode(96 + count)})`;
        default: return '';
      }
    };

    if (level === 1) {
      return getCitationPart(1, index);
    }
    if (level === 2) {
      let parentCitation = '';
      for (let i = index - 1; i >= 0; i--) {
        if (allParagraphs[i].level === 1) {
          parentCitation = getCitationPart(1, i).replace('.', '');
          break;
        }
      }
      return `${parentCitation}${getCitationPart(2, index)}`;
    }

    // Build the hierarchical citation for deeper levels
    let citationPath = [];
    let parentLevel = level - 1;

    // Look backwards to find all ancestors
    for (let i = index - 1; i >= 0; i--) {
      const p = allParagraphs[i];
      if (p.level === parentLevel) {
        citationPath.unshift(getCitationPart(p.level, i).replace(/[.()]/g, ''));
        parentLevel--;
        if (parentLevel === 0) break;
      }
    }

    // Add the current level's citation
    citationPath.push(getCitationPart(level, index));

    return citationPath.join('');
  }

  /**
   * Validates paragraph numbering rules:
   * - If there's a paragraph 1a, there must be a paragraph 1b
   * - If there's a paragraph 1a(1), there must be a paragraph 1a(2), etc.
   */
  const validateParagraphNumbering = useCallback((allParagraphs: ParagraphData[]): string[] => {
    const errors: string[] = [];
    const levelGroups: { [key: string]: number[] } = {};

    // Group paragraphs by their parent hierarchy
    allParagraphs.forEach((paragraph, index) => {
      const { level } = paragraph;

      // Build the parent path for this paragraph
      let parentPath = '';
      let currentLevel = level - 1;

      // Find all parent levels
      for (let i = index - 1; i >= 0 && currentLevel > 0; i--) {
        if (allParagraphs[i].level === currentLevel) {
          const citation = getUiCitation(allParagraphs[i], i, allParagraphs);
          parentPath = citation.replace(/[.()]/g, '') + parentPath;
          currentLevel--;
        }
      }

      // Create a key for this level group
      const groupKey = `${parentPath}_level${level}`;

      if (!levelGroups[groupKey]) {
        levelGroups[groupKey] = [];
      }
      levelGroups[groupKey].push(index);
    });

    // Check each group for proper numbering
    Object.entries(levelGroups).forEach(([groupKey, indices]) => {
      if (indices.length === 1) {
        const index = indices[0];
        const paragraph = allParagraphs[index];
        const citation = getUiCitation(paragraph, index, allParagraphs);

        // Skip level 1 paragraphs as they can be standalone
        if (paragraph.level > 1) {
          errors.push(`Paragraph ${citation} requires at least one sibling paragraph at the same level.`);
        }
      }
    });

    return errors;
  }, []);

  const generateBasicLetter = async () => {
    // Get the appropriate seal based on header type (DON = blue, USMC = black)
    let sealBuffer = null;
    try {
      sealBuffer = getDoDSealBufferSync(formData.headerType as 'USMC' | 'DON');
      console.log('Seal buffer created successfully for', formData.headerType, ', size:', sealBuffer.byteLength);
    } catch (error) {
      console.error('Error processing seal image:', error);
      sealBuffer = null; // Fallback to no image if conversion fails
    }

    const content = [];

content.push(new Paragraph({
      children: [new TextRun({ 
        text: formData.headerType === 'USMC' ? "UNITED STATES MARINE CORPS" : "DEPARTMENT OF THE NAVY", 
        bold: true, 
        font: "Times New Roman", 
        size: 20,
        color: formData.headerType === 'DON' ? "002D72" : "000000"
      })],
      alignment: AlignmentType.CENTER
    }));
if (formData.line1) content.push(new Paragraph({ children: [new TextRun({ text: formData.line1, font: "Times New Roman", size: 16, color: formData.headerType === 'DON' ? "002D72" : "000000" })], alignment: AlignmentType.CENTER }));
    if (formData.line2) content.push(new Paragraph({ children: [new TextRun({ text: formData.line2, font: "Times New Roman", size: 16, color: formData.headerType === 'DON' ? "002D72" : "000000" })], alignment: AlignmentType.CENTER }));
    if (formData.line3) content.push(new Paragraph({ children: [new TextRun({ text: formData.line3, font: "Times New Roman", size: 16, color: formData.headerType === 'DON' ? "002D72" : "000000" })], alignment: AlignmentType.CENTER }));
    content.push(new Paragraph({ text: "" }));
    const bodyFont = getBodyFont(formData.bodyFont);
    
    content.push(new Paragraph({ children: [new TextRun({ text: formData.ssic || "", font: bodyFont, size: 24 })], alignment: AlignmentType.LEFT, indent: { left: 7920 } }));
    content.push(new Paragraph({ children: [new TextRun({ text: formData.originatorCode || "", font: bodyFont, size: 24 })], alignment: AlignmentType.LEFT, indent: { left: 7920 } }));
    const formattedDate = parseAndFormatDate(formData.date || "");
    content.push(new Paragraph({ children: [new TextRun({ text: formattedDate, font: bodyFont, size: 24 })], alignment: AlignmentType.LEFT, indent: { left: 7920 } }));
    content.push(new Paragraph({ text: "" }));
    const fromText = getFromToSpacing('From', formData.bodyFont) + formData.from;
    const toText = getFromToSpacing('To', formData.bodyFont) + formData.to;
    
    if (formData.bodyFont === 'courier') {
      content.push(new Paragraph({ children: [new TextRun({ text: fromText, font: bodyFont, size: 24 })], alignment: AlignmentType.LEFT }));
      content.push(new Paragraph({ children: [new TextRun({ text: toText, font: bodyFont, size: 24 })], alignment: AlignmentType.LEFT }));
    } else {
      content.push(new Paragraph({ children: [new TextRun({ text: fromText, font: bodyFont, size: 24 })], tabStops: [{ type: TabStopType.LEFT, position: 720 }] }));
      content.push(new Paragraph({ children: [new TextRun({ text: toText, font: bodyFont, size: 24 })], tabStops: [{ type: TabStopType.LEFT, position: 720 }] }));
    }

const viasWithContent = vias.filter(via => via.trim());
if (viasWithContent.length > 0) {
  viasWithContent.forEach((via, i) => {
    let viaText;
    if (viasWithContent.length === 1) {
      // Single via: no number placeholder
      if (formData.bodyFont === 'courier') {
        viaText = 'Via:\u00A0\u00A0\u00A0' + via; // Just "Via:   " with 3 spaces
      } else {
        viaText = 'Via:\t' + via;
      }
    } else {
      // Multiple vias: use numbered placeholders
      viaText = getViaSpacing(i, formData.bodyFont) + via;
    }
    
    if (formData.bodyFont === 'courier') {
      content.push(new Paragraph({ children: [new TextRun({ text: viaText, font: bodyFont, size: 24 })], alignment: AlignmentType.LEFT }));
    } else {
      content.push(new Paragraph({ children: [new TextRun({ text: viaText, font: bodyFont, size: 24 })], tabStops: [{ type: TabStopType.LEFT, position: 720 }, { type: TabStopType.LEFT, position: 1046 }] }));
    }
  });
}

    // Always add the hard space after From/To/Via section, before Subject
    content.push(new Paragraph({ text: "" }));

    const formattedSubjLines = splitSubject(formData.subj.toUpperCase(), 57);
    const subjPrefix = getSubjSpacing(formData.bodyFont);
    
    if (formattedSubjLines.length === 0) {
      if (formData.bodyFont === 'courier') {
        content.push(new Paragraph({ children: [new TextRun({ text: subjPrefix, font: bodyFont, size: 24 })], alignment: AlignmentType.LEFT }));
      } else {
        content.push(new Paragraph({ children: [new TextRun({ text: subjPrefix, font: bodyFont, size: 24 })], tabStops: [{ type: TabStopType.LEFT, position: 720 }] }));
      }
    } else {
      if (formData.bodyFont === 'courier') {
        content.push(new Paragraph({ children: [new TextRun({ text: subjPrefix + formattedSubjLines[0], font: bodyFont, size: 24 })], alignment: AlignmentType.LEFT }));
        for (let i = 1; i < formattedSubjLines.length; i++) {
          content.push(new Paragraph({ children: [new TextRun({ text: '       ' + formattedSubjLines[i], font: bodyFont, size: 24 })], alignment: AlignmentType.LEFT }));
        }
      } else {
        content.push(new Paragraph({ children: [new TextRun({ text: subjPrefix, font: bodyFont, size: 24 }), new TextRun({ text: formattedSubjLines[0], font: bodyFont, size: 24 })], tabStops: [{ type: TabStopType.LEFT, position: 720 }] }));
        for (let i = 1; i < formattedSubjLines.length; i++) {
          content.push(new Paragraph({ children: [new TextRun({ text: "\t" + formattedSubjLines[i], font: bodyFont, size: 24 })], tabStops: [{ type: TabStopType.LEFT, position: 720 }] }));
        }
      }
    }
    content.push(new Paragraph({ text: "" }));

    const refsWithContent = references.filter(ref => ref.trim());
    if (refsWithContent.length > 0) {
      refsWithContent.forEach((ref, i) => {
        const refLetter = String.fromCharCode('a'.charCodeAt(0) + i);
        const refText = getRefSpacing(refLetter, i, formData.bodyFont) + ref;
        
        if (formData.bodyFont === 'courier') {
          content.push(new Paragraph({ children: [new TextRun({ text: refText, font: bodyFont, size: 24 })], alignment: AlignmentType.LEFT }));
        } else {
          content.push(new Paragraph({ children: [new TextRun({ text: refText, font: bodyFont, size: 24 })], tabStops: [{ type: TabStopType.LEFT, position: 720 }, { type: TabStopType.LEFT, position: 1046 }] }));
        }
      });
    }

    const enclsWithContent = enclosures.filter(encl => encl.trim());
    if (enclsWithContent.length > 0) {
      if (refsWithContent.length > 0) content.push(new Paragraph({ text: "" }));
      enclsWithContent.forEach((encl, i) => {
        const enclText = getEnclSpacing(i + 1, i, formData.bodyFont) + encl;
        
        if (formData.bodyFont === 'courier') {
          content.push(new Paragraph({ children: [new TextRun({ text: enclText, font: bodyFont, size: 24 })], alignment: AlignmentType.LEFT }));
        } else {
          content.push(new Paragraph({ children: [new TextRun({ text: enclText, font: bodyFont, size: 24 })], tabStops: [{ type: TabStopType.LEFT, position: 720 }, { type: TabStopType.LEFT, position: 1046 }] }));
        }
      });
    }
    if (refsWithContent.length > 0 || enclsWithContent.length > 0) content.push(new Paragraph({ text: "" }));

    paragraphs.filter(p => p.content.trim()).forEach((p, i, all) => {
      content.push(createFormattedParagraph(p, i, all, bodyFont));
      content.push(new Paragraph({ text: "" }));
    });

    if (formData.sig) {
      content.push(new Paragraph({ text: "" }), new Paragraph({ text: "" }));
      content.push(new Paragraph({ children: [new TextRun({ text: formData.sig.toUpperCase(), font: bodyFont, size: 24 })], alignment: AlignmentType.LEFT, indent: { left: 4680 } }));
      if (formData.delegationText) {
        content.push(new Paragraph({ children: [new TextRun({ text: formData.delegationText, font: bodyFont, size: 24 })], alignment: AlignmentType.LEFT, indent: { left: 4680 } }));
      }
    }

    const copiesWithContent = copyTos.filter(copy => copy.trim());
    if (copiesWithContent.length > 0) {
      const copyToText = getCopyToSpacing(formData.bodyFont);
      content.push(new Paragraph({ text: "" }), new Paragraph({ children: [new TextRun({ text: copyToText, font: bodyFont, size: 24 })], alignment: AlignmentType.LEFT }));
      
      copiesWithContent.forEach(copy => {
        if (formData.bodyFont === 'courier') {
          content.push(new Paragraph({ children: [new TextRun({ text: '       ' + copy, font: bodyFont, size: 24 })], alignment: AlignmentType.LEFT }));
        } else {
          content.push(new Paragraph({ children: [new TextRun({ text: copy, font: bodyFont, size: 24 })], indent: { left: 720 } }));
        }
      });
    }

    const headerParagraphs: Paragraph[] = [];
    const headerFormattedLines = splitSubject(formData.subj.toUpperCase(), 57);
    const headerSubjPrefix = getSubjSpacing(formData.bodyFont);
    
    if (headerFormattedLines.length === 0) {
      if (formData.bodyFont === 'courier') {
        headerParagraphs.push(new Paragraph({ children: [new TextRun({ text: headerSubjPrefix, font: bodyFont, size: 24 })], alignment: AlignmentType.LEFT }));
      } else {
        headerParagraphs.push(new Paragraph({ children: [new TextRun({ text: headerSubjPrefix, font: bodyFont, size: 24 })], tabStops: [{ type: TabStopType.LEFT, position: 720 }] }));
      }
    } else {
      if (formData.bodyFont === 'courier') {
        headerParagraphs.push(new Paragraph({ children: [new TextRun({ text: headerSubjPrefix + headerFormattedLines[0], font: bodyFont, size: 24 })], alignment: AlignmentType.LEFT }));
        for (let i = 1; i < headerFormattedLines.length; i++) {
          headerParagraphs.push(new Paragraph({ children: [new TextRun({ text: '       ' + headerFormattedLines[i], font: bodyFont, size: 24 })], alignment: AlignmentType.LEFT }));
        }
      } else {
        headerParagraphs.push(new Paragraph({ children: [new TextRun({ text: headerSubjPrefix, font: bodyFont, size: 24 }), new TextRun({ text: headerFormattedLines[0], font: bodyFont, size: 24 })], tabStops: [{ type: TabStopType.LEFT, position: 720 }] }));
        for (let i = 1; i < headerFormattedLines.length; i++) {
          headerParagraphs.push(new Paragraph({ children: [new TextRun({ text: "\t" + headerFormattedLines[i], font: bodyFont, size: 24 })], tabStops: [{ type: TabStopType.LEFT, position: 720 }] }));
        }
      }
    }
    headerParagraphs.push(new Paragraph({ text: "" }));

    return new Document({
      creator: "by Semper Admin",
      title: formData.subj || "Naval Letter",
      description: "Generated Naval Letter Format",
      sections: [{
        properties: {
          page: {
            margin: DOC_SETTINGS.pageMargins,
            size: DOC_SETTINGS.pageSize,
            pageNumbers: {
              start: 1,
              formatType: "decimal" as any,
            },
          },
          titlePage: true
        },
        headers: {
          first: new Header({ children: sealBuffer ? [new Paragraph({ children: [new ImageRun({ data: sealBuffer, transformation: { width: 96, height: 96 }, floating: { horizontalPosition: { relative: HorizontalPositionRelativeFrom.PAGE, offset: 458700 }, verticalPosition: { relative: VerticalPositionRelativeFrom.PAGE, offset: 458700 }, wrap: { type: TextWrappingType.SQUARE } } })] })] : [] }),
          default: new Header({ children: headerParagraphs })
        },
        footers: {
          first: new Footer({ children: [] }),
          default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], font: bodyFont, size: 24 })] })] })
        },
        children: content
      }]
    });
  };

  const generateEndorsement = async () => {
    if (!formData.endorsementLevel || !formData.basicLetterReference) {
      alert("Endorsement Level and Basic Letter Reference are required for generating an endorsement.");
      return null;
    }

    // Get the appropriate seal based on header type (DON = blue, USMC = black)
    let sealBuffer = null;
    try {
      sealBuffer = getDoDSealBufferSync(formData.headerType as 'USMC' | 'DON');
      console.log('Seal buffer created successfully for', formData.headerType, ', size:', sealBuffer.byteLength);
    } catch (error) {
      console.error('Error processing seal image:', error);
      sealBuffer = null; // Fallback to no image if conversion fails
    }

const content = [];
    const bodyFont = getBodyFont(formData.bodyFont);

    // Letterhead
    content.push(new Paragraph({
      children: [new TextRun({ text: formData.headerType === 'USMC' ? "UNITED STATES MARINE CORPS" : "DEPARTMENT OF THE NAVY", bold: true, font: "Times New Roman", size: 20, color: formData.headerType === 'DON' ? "002D72" : "000000" })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 0 },
    }));
    if (formData.line1) content.push(new Paragraph({ children: [new TextRun({ text: formData.line1, font: "Times New Roman", size: 16, color: formData.headerType === 'DON' ? "002D72" : "000000" })], alignment: AlignmentType.CENTER, spacing: { after: 0 } }));
    if (formData.line2) content.push(new Paragraph({ children: [new TextRun({ text: formData.line2, font: "Times New Roman", size: 16, color: formData.headerType === 'DON' ? "002D72" : "000000" })], alignment: AlignmentType.CENTER, spacing: { after: 0 } }));
    if (formData.line3) content.push(new Paragraph({ children: [new TextRun({ text: formData.line3, font: "Times New Roman", size: 16, color: formData.headerType === 'DON' ? "002D72" : "000000" })], alignment: AlignmentType.CENTER, spacing: { after: 0 } }));
    content.push(new Paragraph({ text: "" }));

    // SSIC, Code, Date block
    content.push(new Paragraph({ children: [new TextRun({ text: formData.ssic || "", font: bodyFont, size: 24 })], alignment: AlignmentType.LEFT, indent: { left: 7920 } }));
    content.push(new Paragraph({ children: [new TextRun({ text: formData.originatorCode || "", font: bodyFont, size: 24 })], alignment: AlignmentType.LEFT, indent: { left: 7920 } }));
    const formattedDate = parseAndFormatDate(formData.date || "");
content.push(new Paragraph({ children: [new TextRun({ text: formattedDate, font: bodyFont, size: 24 })], alignment: AlignmentType.LEFT, indent: { left: 7920 } }));
    content.push(new Paragraph({ text: "" }));

    // Endorsement Identification Line
    content.push(new Paragraph({
      children: [
        new TextRun({ text: `${formData.endorsementLevel} ENDORSEMENT on ${formData.basicLetterReference}`, font: bodyFont, size: 24 })
      ],
      alignment: AlignmentType.LEFT,
    }));
    content.push(new Paragraph({ text: "" }));

    // From/To/Via section
    const fromText = getFromToSpacing('From', formData.bodyFont) + formData.from;
    const toText = getFromToSpacing('To', formData.bodyFont) + formData.to;
    
    if (formData.bodyFont === 'courier') {
      content.push(new Paragraph({ children: [new TextRun({ text: fromText, font: bodyFont, size: 24 })], alignment: AlignmentType.LEFT }));
      content.push(new Paragraph({ children: [new TextRun({ text: toText, font: bodyFont, size: 24 })], alignment: AlignmentType.LEFT }));
    } else {
      content.push(new Paragraph({ children: [new TextRun({ text: fromText, font: bodyFont, size: 24 })], tabStops: [{ type: TabStopType.LEFT, position: 720 }] }));
      content.push(new Paragraph({ children: [new TextRun({ text: toText, font: bodyFont, size: 24 })], tabStops: [{ type: TabStopType.LEFT, position: 720 }] }));
    }
const viasWithContent = vias.filter(via => via.trim());
if (viasWithContent.length > 0) {
  viasWithContent.forEach((via, i) => {
    let viaText;
    if (viasWithContent.length === 1) {
      // Single via: no number placeholder
      if (formData.bodyFont === 'courier') {
        viaText = 'Via:\u00A0\u00A0\u00A0' + via; // Just "Via:   " with 3 spaces
      } else {
        viaText = 'Via:\t' + via;
      }
    } else {
      // Multiple vias: use numbered placeholders
      viaText = getViaSpacing(i, formData.bodyFont) + via;
    }
    
    if (formData.bodyFont === 'courier') {
      content.push(new Paragraph({ children: [new TextRun({ text: viaText, font: bodyFont, size: 24 })], alignment: AlignmentType.LEFT }));
    } else {
      content.push(new Paragraph({ children: [new TextRun({ text: viaText, font: bodyFont, size: 24 })], tabStops: [{ type: TabStopType.LEFT, position: 720 }, { type: TabStopType.LEFT, position: 1046 }] }));
    }
  });
}
    content.push(new Paragraph({ text: "" }));

// Subject line
const formattedSubjLines = splitSubject(formData.subj.toUpperCase(), 57);
const subjPrefix = getSubjSpacing(formData.bodyFont);

if (formattedSubjLines.length === 0) {
  if (formData.bodyFont === 'courier') {
    content.push(new Paragraph({ children: [new TextRun({ text: subjPrefix, font: bodyFont, size: 24 })], alignment: AlignmentType.LEFT }));
  } else {
    content.push(new Paragraph({ children: [new TextRun({ text: subjPrefix, font: bodyFont, size: 24 })], tabStops: [{ type: TabStopType.LEFT, position: 720 }] }));
  }
} else {
  if (formData.bodyFont === 'courier') {
    content.push(new Paragraph({ children: [new TextRun({ text: subjPrefix + formattedSubjLines[0], font: bodyFont, size: 24 })], alignment: AlignmentType.LEFT }));
    for (let i = 1; i < formattedSubjLines.length; i++) {
      content.push(new Paragraph({ children: [new TextRun({ text: '       ' + formattedSubjLines[i], font: bodyFont, size: 24 })], alignment: AlignmentType.LEFT }));
    }
  } else {
    content.push(new Paragraph({ children: [new TextRun({ text: subjPrefix, font: bodyFont, size: 24 }), new TextRun({ text: formattedSubjLines[0], font: bodyFont, size: 24 })], tabStops: [{ type: TabStopType.LEFT, position: 720 }] }));
    for (let i = 1; i < formattedSubjLines.length; i++) {
      content.push(new Paragraph({ children: [new TextRun({ text: "\t" + formattedSubjLines[i], font: bodyFont, size: 24 })], tabStops: [{ type: TabStopType.LEFT, position: 720 }] }));
    }
  }
}
content.push(new Paragraph({ text: "" }));

// CONTINUATION References
const refsWithContent = references.filter(ref => ref.trim());
if (refsWithContent.length > 0) {
  const startCharCode = formData.startingReferenceLevel.charCodeAt(0);
  refsWithContent.forEach((ref, i) => {
    const refLetter = String.fromCharCode(startCharCode + i);
    const refText = getRefSpacing(refLetter, i, formData.bodyFont) + ref;
    
    if (formData.bodyFont === 'courier') {
      content.push(new Paragraph({ children: [new TextRun({ text: refText, font: bodyFont, size: 24 })], alignment: AlignmentType.LEFT }));
    } else {
      content.push(new Paragraph({ children: [new TextRun({ text: refText, font: bodyFont, size: 24 })], tabStops: [{ type: TabStopType.LEFT, position: 720 }, { type: TabStopType.LEFT, position: 1046 }] }));
    }
  });
}

// CONTINUATION Enclosures
const enclsWithContent = enclosures.filter(encl => encl.trim());
if (enclsWithContent.length > 0) {
  if (refsWithContent.length > 0) content.push(new Paragraph({ text: "" }));
  const startEnclNum = parseInt(formData.startingEnclosureNumber, 10);
  enclsWithContent.forEach((encl, i) => {
    const enclNum = startEnclNum + i;
    const enclText = getEnclSpacing(enclNum, i, formData.bodyFont) + encl;
    
    if (formData.bodyFont === 'courier') {
      content.push(new Paragraph({ children: [new TextRun({ text: enclText, font: bodyFont, size: 24 })], alignment: AlignmentType.LEFT }));
    } else {
      content.push(new Paragraph({ children: [new TextRun({ text: enclText, font: bodyFont, size: 24 })], tabStops: [{ type: TabStopType.LEFT, position: 720 }, { type: TabStopType.LEFT, position: 1046 }] }));
    }
  });
}
    if (refsWithContent.length > 0 || enclsWithContent.length > 0) content.push(new Paragraph({ text: "" }));

    // Body, Signature, Copy To sections (same logic as basic letter)
    paragraphs.filter(p => p.content.trim()).forEach((p, i, all) => {
      content.push(createFormattedParagraph(p, i, all, bodyFont));
      content.push(new Paragraph({ text: "" }));
    });

    if (formData.sig) {
      content.push(new Paragraph({ text: "" }), new Paragraph({ text: "" }));
      content.push(new Paragraph({ children: [new TextRun({ text: formData.sig.toUpperCase(), font: bodyFont, size: 24 })], alignment: AlignmentType.LEFT, indent: { left: 4680 } }));
      if (formData.delegationText) {
        content.push(new Paragraph({ children: [new TextRun({ text: formData.delegationText, font: bodyFont, size: 24 })], alignment: AlignmentType.LEFT, indent: { left: 4680 } }));
      }
    }

    const copiesWithContent = copyTos.filter(copy => copy.trim());
    if (copiesWithContent.length > 0) {
      const copyToText = getCopyToSpacing(formData.bodyFont);
      content.push(new Paragraph({ text: "" }), new Paragraph({ children: [new TextRun({ text: copyToText, font: bodyFont, size: 24 })], alignment: AlignmentType.LEFT }));
      
      copiesWithContent.forEach(copy => {
        if (formData.bodyFont === 'courier') {
          content.push(new Paragraph({ children: [new TextRun({ text: '       ' + copy, font: bodyFont, size: 24 })], alignment: AlignmentType.LEFT }));
        } else {
          content.push(new Paragraph({ children: [new TextRun({ text: copy, font: bodyFont, size: 24 })], indent: { left: 720 } }));
        }
      });
    }

    const headerParagraphs: Paragraph[] = [];
    const headerFormattedLines = splitSubject(formData.subj.toUpperCase(), 57);
    const headerSubjPrefix = getSubjSpacing(formData.bodyFont);
    
    if (headerFormattedLines.length === 0) {
      if (formData.bodyFont === 'courier') {
        headerParagraphs.push(new Paragraph({ children: [new TextRun({ text: headerSubjPrefix, font: bodyFont, size: 24 })], alignment: AlignmentType.LEFT }));
      } else {
        headerParagraphs.push(new Paragraph({ children: [new TextRun({ text: headerSubjPrefix, font: bodyFont, size: 24 })], tabStops: [{ type: TabStopType.LEFT, position: 720 }] }));
      }
    } else {
      if (formData.bodyFont === 'courier') {
        headerParagraphs.push(new Paragraph({ children: [new TextRun({ text: headerSubjPrefix + headerFormattedLines[0], font: bodyFont, size: 24 })], alignment: AlignmentType.LEFT }));
        for (let i = 1; i < headerFormattedLines.length; i++) {
          headerParagraphs.push(new Paragraph({ children: [new TextRun({ text: '       ' + headerFormattedLines[i], font: bodyFont, size: 24 })], alignment: AlignmentType.LEFT }));
        }
      } else {
        headerParagraphs.push(new Paragraph({ children: [new TextRun({ text: headerSubjPrefix, font: bodyFont, size: 24 }), new TextRun({ text: headerFormattedLines[0], font: bodyFont, size: 24 })], tabStops: [{ type: TabStopType.LEFT, position: 720 }] }));
        for (let i = 1; i < headerFormattedLines.length; i++) {
          headerParagraphs.push(new Paragraph({ children: [new TextRun({ text: "\t" + headerFormattedLines[i], font: bodyFont, size: 24 })], tabStops: [{ type: TabStopType.LEFT, position: 720 }] }));
        }
      }
    }
    headerParagraphs.push(new Paragraph({ text: "" }));

    return new Document({
      creator: "by Semper Admin",
      title: `${formData.endorsementLevel} ENDORSEMENT`,
      description: "Generated Naval Endorsement Format",
      sections: [{
        properties: {
          page: {
            margin: DOC_SETTINGS.pageMargins,
            size: DOC_SETTINGS.pageSize,
            pageNumbers: {
              start: formData.startingPageNumber,
              formatType: "decimal" as any,
            },
          },
          titlePage: true
        },
        headers: {
          first: new Header({ children: sealBuffer ? [new Paragraph({ children: [new ImageRun({ data: sealBuffer, transformation: { width: 96, height: 96 }, floating: { horizontalPosition: { relative: HorizontalPositionRelativeFrom.PAGE, offset: 458700 }, verticalPosition: { relative: VerticalPositionRelativeFrom.PAGE, offset: 458700 }, wrap: { type: TextWrappingType.SQUARE } } })] })] : [] }),
          default: new Header({ children: headerParagraphs })
        },
        footers: {
          first: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], font: bodyFont, size: 24 })] })] }),
          default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], font: bodyFont, size: 24 })] })] })
        },
        children: content
      }]
    });
  }

  const generateDocument = async () => {
    debugUserAction('Generate Document', {
      documentType: formData.documentType,
      paragraphCount: paragraphs.length,
      subject: formData.subj.substring(0, 30) + (formData.subj.length > 30 ? '...' : '')
    });
    
    setIsGenerating(true);
    try {
      saveLetter(); // Save the current state before generating

      let doc;
      let filename;

      if (formData.documentType === 'endorsement') {
        doc = await generateEndorsement();
        filename = `${formData.endorsementLevel}_ENDORSEMENT_on_${formData.subj || 'letter'}_Page${formData.startingPageNumber}.docx`;
      } else {
        doc = await generateBasicLetter();
        filename = `${formData.subj || "NavalLetter"}.docx`;
      }

      if (doc) {
        const blob = await Packer.toBlob(doc);
        saveAs(blob, filename);
        debugUserAction('Document Generated Successfully', { filename });
      }

    } catch (error) {
      logError("Document Generation", error);
      alert("Error generating document: " + (error as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  const unitComboboxData = UNITS.map(unit => ({
    value: `${unit.uic}-${unit.ruc}-${unit.mcc}`, // Create a truly unique value
    label: `${unit.unitName} (RUC: ${unit.ruc}, MCC: ${unit.mcc})`,
    ...unit,
  }));

  const handleUnitSelect = (value: string) => {
    const selectedUnit = unitComboboxData.find(unit => unit.value === value);
    if (selectedUnit) {
      setFormData(prev => ({
        ...prev,
        line1: selectedUnit.unitName.toUpperCase(),
        line2: selectedUnit.streetAddress.toUpperCase(),
        line3: `${selectedUnit.cityState} ${selectedUnit.zip}`.toUpperCase(),
      }));
    }
  };

  const clearUnitInfo = () => {
    setFormData(prev => ({ ...prev, line1: '', line2: '', line3: '' }));
  };

  const ssicComboboxData = SSICS.map((ssic, index) => ({
    value: `${ssic.code}-${index}`, // Make value unique by appending index
    label: `${ssic.code} - ${ssic.nomenclature}`,
    originalCode: ssic.code, // Keep the original code for populating the form
  }));

  const handleSsicSelect = (value: string) => {
    const selectedSsic = ssicComboboxData.find(ssic => ssic.value === value);
    if (selectedSsic) {
      setFormData(prev => ({
        ...prev,
        ssic: selectedSsic.originalCode,
      }));
      validateSSIC(selectedSsic.originalCode);
    }
  };

  const clearSsicInfo = () => {
    setFormData(prev => ({ ...prev, ssic: '' }));
    validateSSIC('');
  };


  return (
    <div>
      {/* Font Awesome CSS */}
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

      {/* Custom CSS */}
      <style jsx>{`
        .naval-gradient-bg {
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          min-height: 100vh;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        .main-container {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);
<<<<<<< HEAD
          margin: 20px;
=======
          margin: auto;
>>>>>>> 2751f197e1a8aec38b5783b814fe3d6032fc2617
          padding: 30px;
          max-width: 1200px;
          margin-left: auto;
          margin-right: auto;
        }
        
        .main-title {
          background: linear-gradient(45deg, #b8860b, #ffd700);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-weight: bold;
          font-size: 2.5rem;
          text-align: center;
          margin-bottom: 40px;
        }
        
        .form-section {
          background: rgba(248, 249, 250, 0.8);
          border-radius: 15px;
          padding: 25px;
          margin-bottom: 25px;
          border: 2px solid rgba(184, 134, 11, 0.2);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }
        
        .section-legend {
          background: linear-gradient(45deg, #b8860b, #ffd700);
          color: white;
          text-shadow: 0 0 3px #0066cc, 0 0 6px #0066cc;
          padding: 8px 16px;
          border-radius: 10px;
          font-weight: bold;
          margin-bottom: 20px;
          display: block;
          font-size: 1.1rem;
          text-align: center;
          width: fit-content;
          margin-left: auto;
          margin-right: auto;
        }
        
        .input-group {
          display: flex;
          margin-bottom: 1rem;
        }
        
        .input-group-text {
          background: linear-gradient(45deg, #b8860b, #ffd700);
          color: white;
          text-shadow: 0 0 3px #0066cc, 0 0 6px #0066cc;
          border: none;
          font-weight: 600;
          white-space: nowrap;
          border-radius: 8px 0 0 8px;
          padding: 0 12px;
          display: flex;
          align-items: center;
        }
        
        .form-control {
          flex: 1;
          border-width: 2px;
          border-style: solid;
          border-color: #e9ecef;
          border-radius: 0 8px 8px 0;
          padding: 12px;
          transition: all 0.3s ease;
        }
        
        .form-control:focus {
          border-color: #b8860b;
          box-shadow: 0 0 0 0.2rem rgba(184, 134, 11, 0.25);
        }
        
        .input-group .input-group-text + .form-control { 
          border-radius: 0; 
        } 
        
        .input-group .form-control:last-of-type { 
          border-radius: 0 8px 8px 0; 
        }
        
        .is-valid {
          border-left: 4px solid #28a745 !important;
          background-color: rgba(40, 167, 69, 0.05);
        }

        .is-invalid {
          border-left: 4px solid #dc3545 !important;
          background-color: rgba(220, 53, 69, 0.05);
        }

        .feedback-message {
          font-size: 0.875rem;
          margin-top: 5px;
          padding: 5px 10px;
          border-radius: 4px;
        }

        .text-success {
          color: #28a745 !important;
        }

        .text-danger {
          color: #dc3545 !important;
        }

        .text-warning {
          color: #ffc107 !important;
        }

        .text-info {
          color: #17a2b8 !important;
        }
        
        .btn {
          border-radius: 8px;
          padding: 10px 20px;
          font-weight: 600;
          transition: all 0.3s ease;
          border: none;
        }
        
        .btn-primary {
          background: linear-gradient(45deg, #b8860b, #ffd700);
          color: white;
          text-shadow: 0 0 3px #0066cc, 0 0 6px #0066cc;
        }
        
        .btn-primary:hover {
          background: linear-gradient(45deg, #996c09, #e6c200);
          transform: translateY(-2px);
        }
        
        .btn-success {
          background: linear-gradient(45deg, #28a745, #20c997);
          color: white;
          text-shadow: 0 0 3px #0066cc, 0 0 6px #0066cc;
        }
        
        .btn-success:hover {
          background: linear-gradient(45deg, #218838, #1da88a);
          transform: translateY(-2px);
        }
        
        .btn-danger {
          background: linear-gradient(45deg, #dc3545, #c82333);
          color: white;
          text-shadow: 0 0 3px #0066cc, 0 0 6px #0066cc;
        }
        
        .btn-danger:hover {
          background: linear-gradient(45deg, #c82333, #a71e2a);
          transform: translateY(-2px);
        }
        
        .generate-btn {
          background: linear-gradient(45deg, #28a745, #20c997);
          color: white;
          text-shadow: 0 0 3px #0066cc, 0 0 6px #0066cc;
          border: none;
          padding: 15px 30px;
          font-size: 1.2rem;
          font-weight: bold;
          border-radius: 12px;
          display: block;
          margin: 30px auto;
          min-width: 250px;
        }
        
        .generate-btn:hover {
          background: linear-gradient(45deg, #218838, #1da88a);
          transform: translateY(-3px);
        }
        
        .generate-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }
        
        .radio-group {
          display: flex;
          gap: 20px;
          margin-top: 10px;
        }
        
        .dynamic-section {
          background: rgba(255, 255, 255, 0.9);
          border-radius: 10px;
          padding: 20px;
          margin-bottom: 15px;
          border-left: 4px solid #b8860b;
        }
        
        .paragraph-container {
          margin-bottom: 20px;
          padding: 15px;
          border: 1px solid #ddd;
          border-radius: 8px;
          position: relative;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
        }
        
        .paragraph-container[data-level="1"] {
          margin-left: 0px;
          border-left: 4px solid #007bff;
          background: rgba(0, 123, 255, 0.05);
        }
        
        .paragraph-container[data-level="2"] {
          margin-left: 30px;
          border-left: 4px solid #ffc107;
          background: rgba(255, 193, 7, 0.05);
        }
        
        .paragraph-container[data-level="3"] {
          margin-left: 60px;
          border-left: 4px solid #28a745;
          background: rgba(40, 167, 69, 0.05);
        }
        
        .paragraph-container[data-level="4"] {
          margin-left: 90px;
          border-left: 4px solid #17a2b8;
          background: rgba(23, 162, 184, 0.05);
        }
        
        .paragraph-container[data-level="5"] {
          margin-left: 120px;
          border-left: 4px solid #6f42c1;
          background: rgba(111, 66, 193, 0.05);
        }
        
        .paragraph-container[data-level="6"] {
          margin-left: 150px;
          border-left: 4px solid #e83e8c;
          background: rgba(232, 62, 140, 0.05);
        }
        
        .paragraph-container[data-level="7"] {
          margin-left: 180px;
          border-left: 4px solid #fd7e14;
          background: rgba(253, 126, 20, 0.05);
        }
        
        .paragraph-container[data-level="8"] {
          margin-left: 210px;
          border-left: 4px solid #dc3545;
          background: rgba(220, 53, 69, 0.05);
        }
        
        .paragraph-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        
        .paragraph-level-badge {
          background: linear-gradient(45deg, #b8860b, #ffd700);
          color: white;
          text-shadow: 0 0 3px #0066cc, 0 0 6px #0066cc;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: bold;
          margin-right: 10px;
        }
        
        .paragraph-number-preview {
          font-family: monospace;
          color: #666;
          font-size: 1.1rem;
          font-weight: bold;
        }
        
        .btn-smart-main { 
          background: #007bff; 
          color: white;
          text-shadow: 0 0 3px #0066cc, 0 0 6px #0066cc;
          margin-right: 8px;
          margin-bottom: 4px;
        }
        .btn-smart-sub { 
          background: #ffc107; 
          color: #212529; 
          margin-right: 8px;
          margin-bottom: 4px;
        }
        .btn-smart-same { 
          background: #28a745; 
          color: white;
          text-shadow: 0 0 3px #0066cc, 0 0 6px #0066cc;
          margin-right: 8px;
          margin-bottom: 4px;
        }
        .btn-smart-up { 
          background: #17a2b8; 
          color: white;
          text-shadow: 0 0 3px #0066cc, 0 0 6px #0066cc;
          margin-right: 8px;
          margin-bottom: 4px;
        }
        
        .invalid-structure {
          border-left: 4px solid #dc3545 !important;
          background-color: rgba(220, 53, 69, 0.1) !important;
        }

        .structure-error {
          margin-top: 10px;
          padding: 8px 12px;
          background-color: rgba(220, 53, 69, 0.1);
          border: 1px solid #dc3545;
          border-radius: 4px;
          font-size: 0.85rem;
          color: #dc3545;
        }
        
        .acronym-error {
          margin-top: 10px;
          padding: 8px 12px;
          background-color: rgba(255, 193, 7, 0.1);
          border: 1px solid #ffc107;
          border-radius: 4px;
          font-size: 0.85rem;
          color: #856404;
        }

        .validation-summary {
          border-left: 4px solid #ffc107;
          background-color: rgba(255, 193, 7, 0.1);
          padding: 15px;
          margin-top: 20px;
          border-radius: 8px;
        }

        .validation-summary h6 {
          color: #856404;
          margin-bottom: 10px;
        }

        .validation-summary ul {
          padding-left: 20px;
        }

        .saved-letter-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 15px;
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            margin-bottom: 10px;
            transition: background-color 0.2s ease;
        }

        .saved-letter-item:hover {
            background-color: #e9ecef;
        }
        
        .saved-letter-info {
            flex-grow: 1;
        }

        .saved-letter-info strong {
            display: block;
            font-size: 1rem;
            color: #495057;
        }

        .saved-letter-info small {
            font-size: 0.8rem;
            color: #6c757d;
        }

        .saved-letter-actions button {
            margin-left: 10px;
        }
        
        @media (max-width: 768px) {
          .main-container { margin: 10px !important; padding: 15px !important; }
          .main-title { font-size: 1.75rem !important; }
          .form-section { padding: 15px !important; margin-bottom: 20px !important; }
          .section-legend { font-size: 0.95rem !important; padding: 10px 15px !important; }
          .input-group { flex-direction: column !important; align-items: stretch !important; }
          .input-group-text { min-width: 100% !important; width: 100% !important; border-radius: 8px 8px 0 0 !important; padding: 10px 12px !important; font-size: 0.9rem !important; text-align: left !important; }
          .form-control { border-radius: 0 0 8px 8px !important; min-height: 44px !important; font-size: 16px !important; }
          .radio-group { flex-direction: column !important; gap: 10px !important; }
          .btn { font-size: 0.85rem !important; padding: 10px 16px !important; min-height: 44px !important; }
          .generate-btn { font-size: 1rem !important; padding: 12px 20px !important; width: 100% !important; }
          .btn-smart-main, .btn-smart-sub, .btn-smart-same, .btn-smart-up { font-size: 0.75rem !important; padding: 6px 10px !important; margin-right: 4px !important; margin-bottom: 6px !important; min-width: 80px !important; }
          .paragraph-container { padding: 12px !important; }
          .paragraph-container[data-level="2"] { margin-left: 15px !important; }
          .paragraph-container[data-level="3"] { margin-left: 30px !important; }
          .paragraph-container[data-level="4"] { margin-left: 45px !important; }
          body { overflow-x: hidden !important; }
          .main-container, .form-section, .input-group { max-width: 100% !important; overflow-x: hidden !important; }
          button, input, select, textarea { min-height: 44px !important; }
        }

        @media (max-width: 576px) {
          .main-container { margin: 5px !important; padding: 10px !important; }
          .main-title { font-size: 1.5rem !important; }
          .btn-smart-main, .btn-smart-sub, .btn-smart-same, .btn-smart-up { width: 100% !important; margin-right: 0 !important; }
        }
      `}</style>

      <div className="naval-gradient-bg">
        <div className="main-container">
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <img src="https://yt3.googleusercontent.com/KxVUCCrrOygiNK4sof8n_pGMIjEu3w0M3eY7pFWPmD20xjBzHFjbXgtSBzor8UBuwg6pWsBI=s160-c-k-c0x00ffffff-no-rj" alt="Semper Admin Logo" style={{ width: '100px', height: '100px', margin: '0 auto', borderRadius: '50%' }} />
            <h1 className="main-title" style={{ marginBottom: '0', marginTop: '10px' }}>
              {
                {
                  'basic': 'Naval Letter Generator',
                  'endorsement': 'New-Page Endorsement Generator'
                }[formData.documentType]
              }
            </h1>
            <p style={{ marginTop: '0', fontSize: '1.2rem', color: '#6c757d' }}>by Semper Admin</p>
            <p style={{ marginTop: '10px', fontSize: '0.85rem', color: '#9ca3af', fontStyle: 'italic', opacity: '0.8' }}>Last Updated: 20251020</p>
          </div>

          {/* Document Type Selector */}
          <div className="form-section">
            <div className="section-legend">
              <i className="fas fa-file-alt" style={{ marginRight: '8px' }}></i>
              Choose Document Type
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '1rem' }}>
              {/* Basic Letter Card */}
              <button
                type="button"
                className={`btn ${formData.documentType === 'basic'
                  ? 'btn-primary'
                  : 'btn-outline-secondary'
                  }`}
                onClick={() => setFormData(prev => ({ ...prev, documentType: 'basic' }))}
                style={{
                  padding: '20px',
                  height: 'auto',
                  textAlign: 'left',
                  border: formData.documentType === 'basic' ? '3px solid #007bff' : '2px solid #dee2e6',
                  borderRadius: '12px',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  background: formData.documentType === 'basic'
                    ? 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)'
                    : 'white',
                  color: formData.documentType === 'basic' ? 'white' : '#495057',
                  boxShadow: formData.documentType === 'basic'
                    ? '0 8px 25px rgba(0, 123, 255, 0.3)'
                    : '0 2px 10px rgba(0, 0, 0, 0.1)'
                }}
                onMouseEnter={(e) => {
                  if (formData.documentType !== 'basic') {
                    e.currentTarget.style.borderColor = '#007bff';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 123, 255, 0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (formData.documentType !== 'basic') {
                    e.currentTarget.style.borderColor = '#dee2e6';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                  <div style={{
                    fontSize: '2.5rem',
                    opacity: 0.9,
                    minWidth: '60px'
                  }}>
                    📄
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '1.25rem',
                      fontWeight: 'bold',
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      Basic Letter
                      {formData.documentType === 'basic' && (
                        <i className="fas fa-check-circle" style={{ color: 'white', marginLeft: 'auto' }}></i>
                      )}
                    </div>
                    <div style={{
                      fontSize: '0.95rem',
                      opacity: 0.9,
                      marginBottom: '10px',
                      lineHeight: '1.4'
                    }}>
                      The standard format for routine correspondence and official communications.
                    </div>
                    <div style={{
                      fontSize: '0.85rem',
                      opacity: 0.8,
                      fontStyle: 'italic'
                    }}>
                      ✓ Most common format
                    </div>
                  </div>
                </div>
              </button>

              {/* New-Page Endorsement Card */}
              <button
                type="button"
                className={`btn ${formData.documentType === 'endorsement'
                  ? 'btn-success'
                  : 'btn-outline-secondary'
                  }`}
                onClick={() => setFormData(prev => ({ ...prev, documentType: 'endorsement' }))}
                style={{
                  padding: '20px',
                  height: 'auto',
                  textAlign: 'left',
                  border: formData.documentType === 'endorsement' ? '3px solid #28a745' : '2px solid #dee2e6',
                  borderRadius: '12px',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  background: formData.documentType === 'endorsement'
                    ? 'linear-gradient(135deg, #28a745 0%, #1e7e34 100%)'
                    : 'white',
                  color: formData.documentType === 'endorsement' ? 'white' : '#495057',
                  boxShadow: formData.documentType === 'endorsement'
                    ? '0 8px 25px rgba(40, 167, 69, 0.3)'
                    : '0 2px 10px rgba(0, 0, 0, 0.1)'
                }}
                onMouseEnter={(e) => {
                  if (formData.documentType !== 'endorsement') {
                    e.currentTarget.style.borderColor = '#28a745';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(40, 167, 69, 0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (formData.documentType !== 'endorsement') {
                    e.currentTarget.style.borderColor = '#dee2e6';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                  <div style={{
                    fontSize: '2.5rem',
                    opacity: 0.9,
                    minWidth: '60px'
                  }}>
                    📝
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '1.25rem',
                      fontWeight: 'bold',
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      New-Page Endorsement
                      {formData.documentType === 'endorsement' && (
                        <i className="fas fa-check-circle" style={{ color: 'white', marginLeft: 'auto' }}></i>
                      )}
                    </div>
                    <div style={{
                      fontSize: '0.95rem',
                      opacity: 0.9,
                      marginBottom: '10px',
                      lineHeight: '1.4'
                    }}>
                      Forwards correspondence on a new page. Use for longer comments and formal endorsements.
                    </div>
                    <div style={{
                      fontSize: '0.85rem',
                      opacity: 0.8,
                      fontStyle: 'italic'
                    }}>
                      → For forwarding documents
                    </div>
                  </div>
                </div>
              </button>
            </div>

<div style={{ fontSize: '0.875rem', color: '#6c757d', marginTop: '-10px', marginBottom: '1rem' }}>
              <small>
                <i className="fas fa-info-circle" style={{ marginRight: '4px' }}></i>
                Select the type of document you want to create. Basic letters are for routine correspondence, while endorsements forward existing documents.
              </small>
            </div>

<div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #dee2e6' }}>
              <label style={{ display: 'block', fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                <i className="fas fa-building" style={{ marginRight: '8px' }}></i>
                Header Type
              </label>
              <div className="radio-group">
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="headerType"
                    value="USMC"
                    checked={formData.headerType === 'USMC'}
                    onChange={(e) => {
                      setFormData({ ...formData, headerType: 'USMC' });
                      debugFormChange('Header Type', 'USMC');
                    }}
                    style={{ marginRight: '8px', transform: 'scale(1.25)', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '1.1rem' }}>United States Marine Corps</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="headerType"
                    value="DON"
                    checked={formData.headerType === 'DON'}
                    onChange={(e) => {
                      setFormData({ ...formData, headerType: 'DON' });
                      debugFormChange('Header Type', 'DON');
                    }}
                    style={{ marginRight: '8px', transform: 'scale(1.25)', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '1.1rem' }}>Department of the Navy</span>
                </label>
              </div>
            </div>

            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #dee2e6' }}>
              <label style={{ display: 'block', fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                <i className="fas fa-font" style={{ marginRight: '8px' }}></i>
                Body Font
              </label>
              <div className="radio-group">
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="bodyFont"
                    value="times"
                    checked={formData.bodyFont === 'times'}
                    onChange={(e) => {
                      setFormData({ ...formData, bodyFont: 'times' });
                      debugFormChange('Body Font', 'Times New Roman');
                    }}
                    style={{ marginRight: '8px', transform: 'scale(1.25)', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '1.1rem' }}>Times New Roman</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="bodyFont"
                    value="courier"
                    checked={formData.bodyFont === 'courier'}
                    onChange={(e) => {
                      setFormData({ ...formData, bodyFont: 'courier' });
                      debugFormChange('Body Font', 'Courier New');
                    }}
                    style={{ marginRight: '8px', transform: 'scale(1.25)', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '1.1rem' }}>Courier New</span>
                </label>
              </div>
            </div>
          </div>

          {/* Endorsement-Specific Fields */}
          {(formData.documentType === 'endorsement') && (
            <div className="form-section">
              <div className="section-legend" style={{ background: 'linear-gradient(45deg, #0d47a1, #1976d2)', border: '2px solid rgba(25, 118, 210, 0.3)' }}>
                <i className="fas fa-file-signature" style={{ marginRight: '8px' }}></i>
                Endorsement Details
              </div>

              <div className="input-group">
                <span className="input-group-text" style={{ background: 'linear-gradient(45deg, #0d47a1, #1976d2)' }}>
                  <i className="fas fa-sort-numeric-up" style={{ marginRight: '8px' }}></i>
                  Endorsement Level:
                </span>
                <select
                  className="form-control"
                  value={formData.endorsementLevel}
                  onChange={handleEndorsementLevelChange}
                  required
                >
                  <option value="" disabled>Select endorsement level...</option>
                  <>
                    <option value="FIRST">FIRST ENDORSEMENT</option>
                    <option value="SECOND">SECOND ENDORSEMENT</option>
                    <option value="THIRD">THIRD ENDORSEMENT</option>
                    <option value="FOURTH">FOURTH ENDORSEMENT</option>
                    <option value="FIFTH">FIFTH ENDORSEMENT</option>
                    <option value="SIXTH">SIXTH ENDORSEMENT</option>
                  </>
                </select>
              </div>

              {formData.endorsementLevel && (
                <StructuredReferenceInput formData={formData} setFormData={setFormData} />
              )}



              {formData.endorsementLevel && (
                <div style={{ marginTop: '1rem' }}>
                  {/* Page Numbering Section */}
                  <div style={{
                    backgroundColor: '#fef3c7',
                    border: '1px solid #fbbf24',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    marginBottom: '1rem'
                  }}>
                    <h4 style={{
                      fontWeight: '500',
                      color: '#92400e',
                      marginBottom: '0.5rem',
                      fontSize: '1rem'
                    }}>Page Numbering</h4>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#92400e',
                        marginBottom: '0.25rem'
                      }}>
                        Last Page # of Previous Document
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.previousPackagePageCount}
                        onChange={(e) => {
                          const newPrevCount = parseInt(e.target.value) || 0;
                          setFormData(prev => ({
                            ...prev,
                            previousPackagePageCount: newPrevCount,
                            startingPageNumber: newPrevCount + 1
                          }))
                        }}
                        style={{
                          width: '100%',
                          padding: '0.5rem 0.75rem',
                          border: '1px solid #fbbf24',
                          borderRadius: '0.375rem',
                          fontSize: '1rem'
                        }}
                      />
                      <p style={{
                        fontSize: '0.75rem',
                        color: '#92400e',
                        marginTop: '0.25rem'
                      }}>
                        Enter the last page number of the document you are endorsing.
                      </p>
                    </div>
                    <div style={{
                      marginTop: '0.75rem',
                      padding: '0.5rem',
                      backgroundColor: '#fde68a',
                      borderRadius: '4px'
                    }}>
                      <strong style={{ color: '#92400e' }}>
                        Your {formData.endorsementLevel} endorsement will start on page {formData.startingPageNumber}.
                      </strong>
                    </div>
                  </div>
                </div>
              )}
              <div style={{
                marginTop: '1rem',
                padding: '0.75rem',
                backgroundColor: '#dbeafe',
                borderLeft: '4px solid #3b82f6',
                color: '#1e40af',
                borderRadius: '0 0.5rem 0.5rem 0'
              }}>
                <div style={{ display: 'flex' }}>
                  <div style={{ paddingTop: '0.25rem' }}><i className="fas fa-info-circle" style={{ fontSize: '1.125rem', marginRight: '0.5rem' }}></i></div>
                  <div>
                    <p style={{ fontWeight: 'bold', margin: 0 }}>Endorsement Mode</p>
                    <p style={{ fontSize: '0.875rem', margin: 0 }}>Endorsements forward the original letter. The "From" field becomes the endorsing command, and the "To" field is the next destination.</p>
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* Unit Information Section */}
          <div className="form-section">
            <div className="section-legend">
              <i className="fas fa-building" style={{ marginRight: '8px' }}></i>
              Unit Information
            </div>

            <div className="input-group">
              <span className="input-group-text" style={{ minWidth: '150px' }}>
                <i className="fas fa-search" style={{ marginRight: '8px' }}></i>
                Find Unit:
              </span>
              <Combobox
                items={unitComboboxData}
                onSelect={handleUnitSelect}
                placeholder="Search for a unit..."
                searchMessage="No unit found."
                inputPlaceholder="Search units by name, RUC, MCC..."
              />
              <button
                className="btn btn-danger"
                type="button"
                onClick={clearUnitInfo}
                title="Clear Unit Information"
                style={{ borderRadius: '0 8px 8px 0' }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="input-group">
              <span className="input-group-text">
                <i className="fas fa-building" style={{ marginRight: '8px' }}></i>
                Unit Name:
              </span>
              <input
                className="form-control"
                type="text"
                placeholder="e.g., HEADQUARTERS, 1ST MARINE DIVISION"
                value={formData.line1}
                onChange={(e) => setFormData(prev => ({ ...prev, line1: autoUppercase(e.target.value) }))}
              />
            </div>

            <div className="input-group">
              <span className="input-group-text">
                <i className="fas fa-road" style={{ marginRight: '8px' }}></i>
                Address Line 1:
              </span>
              <input
                className="form-control"
                type="text"
                placeholder="e.g., BOX 5555"
                value={formData.line2}
                onChange={(e) => setFormData(prev => ({ ...prev, line2: autoUppercase(e.target.value) }))}
              />
            </div>

            <div className="input-group">
              <span className="input-group-text">
                <i className="fas fa-map" style={{ marginRight: '8px' }}></i>
                Address Line 2:
              </span>
              <input
                className="form-control"
                type="text"
                placeholder="e.g., CAMP PENDLETON, CA 92055-5000"
                value={formData.line3}
                onChange={(e) => setFormData(prev => ({ ...prev, line3: autoUppercase(e.target.value) }))}
              />
            </div>
          </div>

          {/* Header Information */}
          <div className="form-section">
            <div className="section-legend">
              <i className="fas fa-info-circle" style={{ marginRight: '8px' }}></i>
              Header Information
            </div>

            <div className="input-group">
              <span className="input-group-text" style={{ minWidth: '150px' }}>
                <i className="fas fa-search" style={{ marginRight: '8px' }}></i>
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
                <i className="fas fa-hashtag" style={{ marginRight: '8px' }}></i>
                SSIC:
              </span>
              <input
                className={`form-control ${validation.ssic.isValid ? 'is-valid' : formData.ssic && !validation.ssic.isValid ? 'is-invalid' : ''}`}
                type="text"
                placeholder="e.g., 1650"
                value={formData.ssic}
                onChange={(e) => {
                  const value = numbersOnly(e.target.value);
                  setFormData(prev => ({ ...prev, ssic: value }));
                  validateSSIC(value);
                }}
              />
            </div>
            {validation.ssic.message && (
              <div className={`feedback-message ${validation.ssic.isValid ? 'text-success' : 'text-danger'}`}>
                <i className={`fas ${validation.ssic.isValid ? 'fa-check' : 'fa-exclamation-triangle'}`} style={{ marginRight: '4px' }}></i>
                {validation.ssic.message}
              </div>
            )}

            <div className="input-group">
              <span className="input-group-text">
                <i className="fas fa-code" style={{ marginRight: '8px' }}></i>
                Originator's Code:
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
              <i className="fas fa-calendar-alt" style={{ marginRight: '8px' }}></i>
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
            <div style={{ fontSize: '0.875rem', color: '#6c757d', marginTop: '-10px', marginBottom: '1rem' }}>
              <small>
                <i className="fas fa-info-circle" style={{ marginRight: '4px' }}></i>
                Accepts: YYYYMMDD, MM/DD/YYYY, YYYY-MM-DD, DD MMM YY, or "today". Auto-formats to Naval standard.
              </small>
            </div>

            <div className="input-group">
              <span className="input-group-text">
                <i className="fas fa-user" style={{ marginRight: '8px' }}></i>
                From:
              </span>
              <input
                className={`form-control ${validation.from.isValid ? 'is-valid' : formData.from && !validation.from.isValid ? 'is-invalid' : ''}`}
                type="text"
                placeholder="Commanding Officer, Marine Corps Base or Private Devil D. Dog 12345678790/0111 USMC"
                value={formData.from}
                onChange={(e) => setFormData(prev => ({ ...prev, from: e.target.value }))}
                onBlur={(e) => validateFromTo(e.target.value, 'from')}
              />
            </div>
            {validation.from.message && (
              <div className={`feedback-message ${validation.from.isValid ? 'text-success' : 'text-warning'}`}>
                <i className={`fas ${validation.from.isValid ? 'fa-check' : 'fa-exclamation-triangle'}`} style={{ marginRight: '4px' }}></i>
                {validation.from.message}
              </div>
            )}

            <div className="input-group">
              <span className="input-group-text">
                <i className="fas fa-users" style={{ marginRight: '8px' }}></i>
                To:
              </span>
              <input
                className={`form-control ${validation.to.isValid ? 'is-valid' : formData.to && !validation.to.isValid ? 'is-invalid' : ''}`}
                type="text"
                placeholder="Platoon Commander, 1st Platoon or Private Devil D. Dog 12345678790/0111 USMC"
                value={formData.to}
                onChange={(e) => setFormData(prev => ({ ...prev, to: e.target.value }))}
                onBlur={(e) => validateFromTo(e.target.value, 'to')}
              />
            </div>
            {validation.to.message && (
              <div className={`feedback-message ${validation.to.isValid ? 'text-success' : 'text-warning'}`}>
                <i className={`fas ${validation.to.isValid ? 'fa-check' : 'fa-exclamation-triangle'}`} style={{ marginRight: '4px' }}></i>
                {validation.to.message}
              </div>
            )}

            <div className="input-group">
              <span className="input-group-text">
                <i className="fas fa-book" style={{ marginRight: '8px' }}></i>
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
                  validateSubject(value);
                }}
              />
            </div>
            {validation.subj.message && (
              <div className={`feedback-message ${validation.subj.isValid ? 'text-success' : 'text-warning'}`}>
                <i className={`fas ${validation.subj.isValid ? 'fa-check' : 'fa-exclamation-triangle'}`} style={{ marginRight: '4px' }}></i>
                {validation.subj.message}
              </div>
            )}
          </div>

          {/* Optional Items Section */}
          <div className="form-section">
            <div className="section-legend">
              <i className="fas fa-plus-circle" style={{ marginRight: '8px' }}></i>
              Optional Items
            </div>

            <Card style={{ marginBottom: '1.5rem' }}>
              <CardHeader>
                <CardTitle style={{ fontSize: '1.1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                  <i className="fas fa-route" style={{ marginRight: '8px' }}></i>
                  Via
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="radio-group">
                  <label style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                      type="radio"
                      name="ifVia"
                      value="yes"
                      checked={showVia}
                      onChange={() => setShowVia(true)}
                      style={{ marginRight: '8px', transform: 'scale(1.25)' }}
                    />
                    <span style={{ fontSize: '1.1rem' }}>Yes</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                      type="radio"
                      name="ifVia"
                      value="no"
                      checked={!showVia}
                      onChange={() => setShowVia(false)}
                      style={{ marginRight: '8px', transform: 'scale(1.25)' }}
                    />
                    <span style={{ fontSize: '1.1rem' }}>No</span>
                  </label>
                </div>

                {showVia && (
                  <div className="dynamic-section">
                    <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>
                      <i className="fas fa-route" style={{ marginRight: '8px' }}></i>
                      Enter Via Addressee(s):
                    </label>
                    {vias.map((via, index) => (
                      <div key={index} className="input-group" style={{ width: '100%', display: 'flex' }}>
                        <span className="input-group-text" style={{
                          minWidth: '60px',
                          justifyContent: 'center',
                          alignItems: 'center',
                          display: 'flex',
                          background: 'linear-gradient(135deg, #b8860b, #ffd700)',
                          color: 'white',
                          fontWeight: '600',
                          borderRadius: '8px 0 0 8px',
                          border: '2px solid #b8860b',
                          flexShrink: 0,
                          textAlign: 'center'
                        }}>
                          ({index + 1})
                        </span>
                        <input
                          className="form-control"
                          type="text"
                          placeholder="🚀 Enter via information (e.g., Commanding Officer, 1st Marine Division)"
                          value={via}
                          onChange={(e) => updateItem(index, e.target.value, setVias)}
                          style={{
                            fontSize: '1rem',
                            padding: '12px 16px',
                            border: '2px solid #e0e0e0',
                            borderLeft: 'none',
                            borderRadius: '0',
                            transition: 'all 0.3s ease',
                            backgroundColor: '#fafafa',
                            flex: '1',
                            minWidth: '0'
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = '#b8860b';
                            e.target.style.backgroundColor = '#fff';
                            e.target.style.boxShadow = '0 0 0 3px rgba(184, 134, 11, 0.1)';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = '#e0e0e0';
                            e.target.style.backgroundColor = '#fafafa';
                            e.target.style.boxShadow = 'none';
                          }}
                        />
                        {index === vias.length - 1 ? (
                          <button
                            className="btn btn-primary"
                            type="button"
                            onClick={() => addItem(setVias)}
                            style={{
                              borderRadius: '0 8px 8px 0',
                              flexShrink: 0,
                              background: 'linear-gradient(135deg, #b8860b, #ffd700)',
                              border: '2px solid #b8860b',
                              color: 'white',
                              fontWeight: '600',
                              padding: '8px 16px',
                              transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                              (e.target as HTMLButtonElement).style.background = 'linear-gradient(135deg, #ffd700, #b8860b)';
                              (e.target as HTMLButtonElement).style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={(e) => {
                              (e.target as HTMLButtonElement).style.background = 'linear-gradient(135deg, #b8860b, #ffd700)';
                              (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
                            }}
                          >
                            <i className="fas fa-plus" style={{ marginRight: '4px' }}></i>
                            Add
                          </button>
                        ) : (
                          <button
                            className="btn btn-danger"
                            type="button"
                            onClick={() => removeItem(index, setVias)}
                            style={{
                              borderRadius: '0 8px 8px 0',
                              flexShrink: 0
                            }}
                          >
                            <i className="fas fa-trash" style={{ marginRight: '4px' }}></i>
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card style={{ marginBottom: '1.5rem' }}>
              <CardHeader>
                <CardTitle style={{ fontSize: '1.1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                  <i className="fas fa-book" style={{ marginRight: '8px' }}></i>
                  References
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="radio-group">
                  <label style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                      type="radio"
                      name="ifRef"
                      value="yes"
                      checked={showRef}
                      onChange={() => setShowRef(true)}
                      style={{ marginRight: '8px', transform: 'scale(1.25)' }}
                    />
                    <span style={{ fontSize: '1.1rem' }}>Yes</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                      type="radio"
                      name="ifRef"
                      value="no"
                      checked={!showRef}
                      onChange={() => { setShowRef(false); setReferences(['']); }}
                      style={{ marginRight: '8px', transform: 'scale(1.25)' }}
                    />
                    <span style={{ fontSize: '1.1rem' }}>No</span>
                  </label>
                </div>

                {showRef && (
                  <div className="dynamic-section">
                    {formData.documentType === 'endorsement' && (
                      <>
                        <div className="mt-2 p-3 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 rounded-r-lg mb-4">
                          <div className="flex">
                            <div className="py-1"><i className="fas fa-exclamation-triangle fa-lg mr-3"></i></div>
                            <div>
                              <p className="font-bold">Endorsement Reference Rules</p>
                              <p className="text-sm">Only add NEW references not mentioned in the basic letter or previous endorsements. Continue the lettering sequence from the last reference.</p>
                            </div>
                          </div>
                        </div>
                        <div className="input-group">
                          <span className="input-group-text">Starting Reference:</span>
                          <select
                            className="form-control"
                            value={formData.startingReferenceLevel}
                            onChange={(e) => setFormData({ ...formData, startingReferenceLevel: e.target.value })}
                          >
                            {generateReferenceOptions().map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                          </select>
                        </div>
                      </>
                    )}
                    <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>
                      <i className="fas fa-bookmark" style={{ marginRight: '8px' }}></i>
                      Enter Reference(s):
                    </label>
                    {references.map((ref, index) => (
                      <div key={index} className="input-group" style={{ width: '100%', display: 'flex' }}>
                        <span className="input-group-text" style={{
                          minWidth: '60px',
                          justifyContent: 'center',
                          alignItems: 'center',
                          display: 'flex',
                          background: 'linear-gradient(135deg, #b8860b, #ffd700)',
                          color: 'white',
                          fontWeight: '600',
                          borderRadius: '8px 0 0 8px',
                          border: '2px solid #b8860b',
                          flexShrink: 0,
                          textAlign: 'center'
                        }}>
                          ({getReferenceLetter(index, formData.startingReferenceLevel)})
                        </span>
                        <input
                          className="form-control"
                          type="text"
                          placeholder="📚 Enter reference information (e.g., NAVADMIN 123/24, OPNAVINST 5000.1)"
                          value={ref}
                          onChange={(e) => updateItem(index, e.target.value, setReferences)}
                          style={{
                            fontSize: '1rem',
                            padding: '12px 16px',
                            border: '2px solid #e0e0e0',
                            borderLeft: 'none',
                            borderRadius: '0',
                            transition: 'all 0.3s ease',
                            backgroundColor: '#fafafa',
                            flex: '1',
                            minWidth: '0'
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = '#b8860b';
                            e.target.style.backgroundColor = '#fff';
                            e.target.style.boxShadow = '0 0 0 3px rgba(184, 134, 11, 0.1)';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = '#e0e0e0';
                            e.target.style.backgroundColor = '#fafafa';
                            e.target.style.boxShadow = 'none';
                          }}
                        />
                        {index === references.length - 1 ? (
                          <button
                            className="btn btn-primary"
                            type="button"
                            onClick={() => addItem(setReferences)}
                            style={{
                              borderRadius: '0 8px 8px 0',
                              flexShrink: 0,
                              background: 'linear-gradient(135deg, #b8860b, #ffd700)',
                              border: '2px solid #b8860b',
                              color: 'white',
                              fontWeight: '600',
                              padding: '8px 16px',
                              transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                              (e.target as HTMLButtonElement).style.background = 'linear-gradient(135deg, #ffd700, #b8860b)';
                              (e.target as HTMLButtonElement).style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={(e) => {
                              (e.target as HTMLButtonElement).style.background = 'linear-gradient(135deg, #b8860b, #ffd700)';
                              (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
                            }}
                          >
                            <i className="fas fa-plus" style={{ marginRight: '4px' }}></i>
                            Add
                          </button>
                        ) : (
                          <button
                            className="btn btn-danger"
                            type="button"
                            onClick={() => removeItem(index, setReferences)}
                            style={{
                              borderRadius: '0 8px 8px 0',
                              flexShrink: 0
                            }}
                          >
                            <i className="fas fa-trash" style={{ marginRight: '4px' }}></i>
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card style={{ marginBottom: '1.5rem' }}>
              <CardHeader>
                <CardTitle style={{ fontSize: '1.1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                  <i className="fas fa-paperclip" style={{ marginRight: '8px' }}></i>
                  Enclosures
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="radio-group">
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="ifEncl"
                      value="yes"
                      checked={showEncl}
                      onChange={() => setShowEncl(true)}
                      style={{ marginRight: '8px', transform: 'scale(1.25)', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '1.1rem', cursor: 'pointer' }}>Yes</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="ifEncl"
                      value="no"
                      checked={!showEncl}
                      onChange={() => { setShowEncl(false); setEnclosures(['']); }}
                      style={{ marginRight: '8px', transform: 'scale(1.25)', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '1.1rem', cursor: 'pointer' }}>No</span>
                  </label>
                </div>

                {showEncl && (
                  <div className="dynamic-section">
                    {formData.documentType === 'endorsement' && (
                      <>
                        <div style={{ marginTop: '0.5rem', padding: '0.75rem', backgroundColor: '#fef3c7', borderLeft: '4px solid #f59e0b', color: '#92400e', borderRadius: '0 0.5rem 0.5rem 0', marginBottom: '1rem' }}>
                          <div style={{ display: 'flex' }}>
                            <div style={{ paddingTop: '0.25rem' }}><i className="fas fa-exclamation-triangle" style={{ fontSize: '1.125rem', marginRight: '0.75rem' }}></i></div>
                            <div>
                              <p style={{ fontWeight: 'bold', margin: 0 }}>Endorsement Enclosure Rules</p>
                              <p style={{ fontSize: '0.875rem', margin: 0 }}>Only add NEW enclosures not mentioned in the basic letter or previous endorsements. Continue the numbering sequence from the last enclosure.</p>
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem', border: '1px solid #e5e7eb', marginBottom: '1rem' }}>
                          <span style={{ fontWeight: '500', color: '#374151', whiteSpace: 'nowrap' }}>Starting Enclosure:</span>
                          <select
                            style={{ flex: 1, padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', outline: 'none' }}
                            value={formData.startingEnclosureNumber}
                            onChange={(e) => setFormData({ ...formData, startingEnclosureNumber: e.target.value })}
                            onFocus={(e) => {
                              e.target.style.borderColor = '#3b82f6';
                              e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.5)';
                            }}
                            onBlur={(e) => {
                              e.target.style.borderColor = '#d1d5db';
                              e.target.style.boxShadow = 'none';
                            }}
                          >
                            {generateEnclosureOptions().map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                          </select>
                        </div>
                      </>
                    )}
                    <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>
                      <i className="fas fa-paperclip" style={{ marginRight: '8px' }}></i>
                      Enter Enclosure(s):
                    </label>
                    {enclosures.map((encl, index) => (
                      <div key={index} className="input-group" style={{ width: '100%', display: 'flex' }}>
                        <span className="input-group-text" style={{
                          backgroundColor: '#f59e0b',
                          color: 'white',
                          fontWeight: 'bold',
                          borderColor: '#f59e0b',
                          minWidth: '60px',
                          justifyContent: 'center',
                          borderRadius: '8px 0 0 8px'
                        }}>
                          ({getEnclosureNumber(index, formData.startingEnclosureNumber)})
                        </span>
                        <input
                          className="form-control"
                          type="text"
                          placeholder="📎 Enter enclosure details (e.g., Training Certificate, Medical Records)"
                          value={encl}
                          onChange={(e) => {
                            const newEnclosures = [...enclosures];
                            newEnclosures[index] = e.target.value;
                            setEnclosures(newEnclosures);
                          }}
                          style={{
                            borderRadius: '0',
                            borderLeft: 'none',
                            borderRight: 'none'
                          }}
                        />
                        {index === enclosures.length - 1 ? (
                          <button
                            className="btn btn-primary"
                            type="button"
                            onClick={() => setEnclosures([...enclosures, ''])}
                            style={{
                              borderRadius: '0 8px 8px 0',
                              flexShrink: 0
                            }}
                          >
                            <i className="fas fa-plus" style={{ marginRight: '4px' }}></i>
                            Add
                          </button>
                        ) : (
                          <button
                            className="btn btn-danger"
                            type="button"
                            onClick={() => {
                              const newEnclosures = enclosures.filter((_, i) => i !== index);
                              setEnclosures(newEnclosures.length > 0 ? newEnclosures : ['']);
                            }}
                            style={{
                              borderRadius: '0 8px 8px 0',
                              flexShrink: 0
                            }}
                          >
                            <i className="fas fa-trash" style={{ marginRight: '4px' }}></i>
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

          </div>

          {/* Body Paragraphs Section */}
          <div className="form-section">
            <div className="section-legend">
              <i className="fas fa-paragraph" style={{ marginRight: '8px' }}></i>
              Body Paragraphs
            </div>

            <div>
              {(() => {
                const numberingErrors = validateParagraphNumbering(paragraphs);
                if (numberingErrors.length > 0) {
                  return (
                    <div style={{
                      backgroundColor: '#fff3cd',
                      border: '1px solid #ffeaa7',
                      borderRadius: '8px',
                      padding: '12px',
                      marginBottom: '16px'
                    }}>
                      <div style={{ fontWeight: 'bold', color: '#856404', marginBottom: '8px' }}>
                        <i className="fas fa-exclamation-triangle" style={{ marginRight: '8px' }}></i>
                        Paragraph Numbering Issues:
                      </div>
                      {numberingErrors.map((error, index) => (
                        <div key={index} style={{ color: '#856404', fontSize: '0.9rem' }}>
                          • {error}
                        </div>
                      ))}
                      <div style={{ marginTop: '8px', fontSize: '0.85rem', color: '#6c757d' }}>
                        <strong>Rule:</strong> If there's a paragraph 1a, there must be a paragraph 1b; if there's a paragraph 1a(1), there must be a paragraph 1a(2), etc.
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
              {paragraphs.map((paragraph, index) => {
                const citation = getUiCitation(paragraph, index, paragraphs);
                return (
                  <div
                    key={paragraph.id}
                    className='paragraph-container'
                    data-level={paragraph.level}
                  >
                    <div className="paragraph-header">
                      <div>
                        <span className="paragraph-level-badge">Level {paragraph.level} {citation}</span>
                      </div>
                      <div>
                        {index > 0 && (
                          <button
                            className="btn btn-sm"
                            style={{ background: '#f8f9fa', border: '1px solid #dee2e6', marginRight: '4px' }}
                            onClick={() => moveParagraphUp(paragraph.id)}
                            title="Move Up"
                          >
                            ↑
                          </button>
                        )}
                        <button
                          className="btn btn-sm"
                          style={{ background: '#f8f9fa', border: '1px solid #dee2e6' }}
                          onClick={() => moveParagraphDown(paragraph.id)}
                          disabled={index === paragraphs.length - 1}
                          title="Move Down"
                        >
                          ↓
                        </button>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '12px' }}>  
                      <textarea 
                        className="form-control" 
                        rows={4}
                        placeholder="Enter your paragraph content here..."
                        value={paragraph.content}
                        onChange={(e) => updateParagraphContent(paragraph.id, e.target.value)}
                        style={{ flex: 1 }}
                      />
                      
                      <button
                        className={`btn btn-sm ${activeVoiceInput === paragraph.id ? 'btn-danger' : 'btn-outline-primary'}`}
                        onClick={() => toggleVoiceInput(paragraph.id)}
                        title={activeVoiceInput === paragraph.id ? 'Stop Recording' : 'Start Voice Input'}
                        style={{ 
                          minWidth: '100px',
                          height: '38px',
                          fontSize: '12px'
                        }}
                      >
                        {activeVoiceInput === paragraph.id ? (
                          <>
                            🔴 Recording...
                          </>
                        ) : (
                          <>
                            🎤 Voice Input
                          </>
                        )}
                      </button>
                    </div>

                    {paragraph.acronymError && (
                      <div className="acronym-error">
                        <i className="fas fa-exclamation-triangle" style={{ marginRight: '4px' }}></i>
                        <small>{paragraph.acronymError}</small>
                      </div>
                    )}


                    <div>
                      <button
                        className="btn btn-smart-main btn-sm"
                        onClick={() => addParagraph('main', paragraph.id)}
                      >
                        Main Paragraph
                      </button>
                      {paragraph.level < 8 && (
                        <button
                          className="btn btn-smart-sub btn-sm"
                          onClick={() => addParagraph('sub', paragraph.id)}
                        >
                          Sub-paragraph
                        </button>
                      )}

                      {paragraph.level > 1 && (
                        <button
                          className="btn btn-smart-same btn-sm"
                          onClick={() => addParagraph('same', paragraph.id)}
                        >
                          Same
                        </button>
                      )}

                      {paragraph.level > 2 && (
                        <button
                          className="btn btn-smart-up btn-sm"
                          onClick={() => addParagraph('up', paragraph.id)}
                        >
                          One Up
                        </button>
                      )}

                      {paragraphs.length > 1 && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => removeParagraph(paragraph.id)}
                          style={{ marginLeft: '8px' }}
                        >
                          Delete
                        </button>
                      )}

                    </div>
                  </div>
                );
              })}
            </div>

          </div>

          {/* Closing Block Section */}
          <div className="form-section">
            <div className="section-legend">
              <i className="fas fa-signature" style={{ marginRight: '8px' }}></i>
              Closing Block
            </div>

            <div className="input-group">
              <span className="input-group-text">
                <i className="fas fa-pen-fancy" style={{ marginRight: '8px' }}></i>
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

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                <i className="fas fa-user-tie" style={{ marginRight: '8px' }}></i>
                Delegation of Signature Authority?
              </label>
              <div className="radio-group">
                <label style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="radio"
                    name="ifDelegation"
                    value="yes"
                    checked={showDelegation}
                    onChange={() => setShowDelegation(true)}
                    style={{ marginRight: '8px', transform: 'scale(1.25)' }}
                  />
                  <span style={{ fontSize: '1.1rem' }}>Yes</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="radio"
                    name="ifDelegation"
                    value="no"
                    checked={!showDelegation}
                    onChange={() => setShowDelegation(false)}
                    style={{ marginRight: '8px', transform: 'scale(1.25)' }}
                  />
                  <span style={{ fontSize: '1.1rem' }}>No</span>
                </label>
              </div>

              {showDelegation && (
                <div className="dynamic-section">
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>
                    <i className="fas fa-user-tie" style={{ marginRight: '8px' }}></i>
                    Delegation Authority Type:
                  </label>

                  <div style={{ marginBottom: '1rem' }}>
                    <select
                      className="form-control"
                      style={{ marginBottom: '8px' }}
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
                      <i className="fas fa-edit" style={{ marginRight: '8px' }}></i>
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

                  <div style={{
                    marginTop: '12px',
                    padding: '12px',
                    backgroundColor: 'rgba(23, 162, 184, 0.1)',
                    borderRadius: '8px',
                    border: '1px solid #17a2b8',
                    fontSize: '0.85rem'
                  }}>
                    <strong style={{ color: '#17a2b8' }}>
                      <i className="fas fa-info-circle" style={{ marginRight: '4px' }}></i>
                      Examples:
                    </strong>
                    <br />
                    <div style={{ marginTop: '4px', color: '#17a2b8' }}>
                      • <strong>By direction:</strong> For routine correspondence when specifically authorized<br />
                      • <strong>Acting:</strong> When temporarily succeeding to command or appointed to replace an official<br />
                      • <strong>Deputy Acting:</strong> For deputy positions acting in absence<br />
                      • <strong>For:</strong> When signing for an absent official (hand-written "for" before typed name)
                    </div>
                  </div>
                </div>
              )}
            </div>

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
                    onChange={() => setShowCopy(false)}
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
                        onChange={(e) => updateItem(index, e.target.value, setCopyTos)}
                      />
                      {index === copyTos.length - 1 ? (
                        <button
                          className="btn btn-primary"
                          type="button"
                          onClick={() => addItem(setCopyTos)}
                        >
                          <i className="fas fa-plus" style={{ marginRight: '4px' }}></i>
                          Add
                        </button>
                      ) : (
                        <button
                          className="btn btn-danger"
                          type="button"
                          onClick={() => removeItem(index, setCopyTos)}
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
          </div>

          {/* Saved Letters Section */}
          {savedLetters.length > 0 && (
            <div className="form-section">
              <div className="section-legend">
                <i className="fas fa-save" style={{ marginRight: '8px' }}></i>
                Saved Versions
              </div>
              {savedLetters.map(letter => (
                <div key={letter.id} className="saved-letter-item">
                  <div className="saved-letter-info">
                    <strong>{letter.subj || "Untitled"}</strong>
                    <small>Saved: {letter.savedAt}</small>
                  </div>
                  <div className="saved-letter-actions">
                    <button className="btn btn-sm btn-success" onClick={() => loadLetter(letter.id)}>
                      <i className="fas fa-upload" style={{ marginRight: '4px' }}></i>
                      Load
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* NLDP File Manager Section */}
          <NLDPFileManager
            formData={formData}
            vias={vias}
            references={references}
            enclosures={enclosures}
            copyTos={copyTos}
            paragraphs={paragraphs}
            onDataImported={(importedFormData, importedVias, importedReferences, importedEnclosures, importedCopyTos, importedParagraphs) => {
              debugUserAction('Import NLDP Data', {
                subject: importedFormData.subj.substring(0, 30) + (importedFormData.subj.length > 30 ? '...' : ''),
                paragraphCount: importedParagraphs.length
              });
                        
              // Update all form data
              setFormData(importedFormData);
              setVias(importedVias);
              setReferences(importedReferences);
              setEnclosures(importedEnclosures);
              setCopyTos(importedCopyTos);
              setParagraphs(importedParagraphs);
                        
              // Update UI toggles based on imported data
              setShowVia(importedVias.some(v => v.trim() !== ''));
              setShowRef(importedReferences.some(r => r.trim() !== ''));
              setShowEncl(importedEnclosures.some(e => e.trim() !== ''));
              setShowCopy(importedCopyTos.some(c => c.trim() !== ''));
              setShowDelegation(!!importedFormData.delegationText);
                        
              // Re-validate fields after loading
              validateSSIC(importedFormData.ssic);
              validateSubject(importedFormData.subj);
              validateFromTo(importedFormData.from, 'from');
              validateFromTo(importedFormData.to, 'to');
            }}
          />

          {/* Generate Button */}
          <div style={{ textAlign: 'center' }}>
            <button
              className="generate-btn"
              onClick={generateDocument}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <span style={{
                    display: 'inline-block',
                    width: '20px',
                    height: '20px',
                    border: '2px solid white',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    marginRight: '8px'
                  }}></span>
                  Generating Document...
                </>
              ) : (
                <>
                  <i className="fas fa-file-download" style={{ marginRight: '8px' }}></i>
                  Generate Document
                </>
              )}
            </button>
          </div>

          {/* Footer */}
          <div style={{
            marginTop: '32px',
            textAlign: 'center',
            fontSize: '0.875rem',
            color: '#6c757d'
          }}>
            <p>
              <i className="fas fa-shield-alt" style={{ marginRight: '4px' }}></i>
              DoW Seal automatically included • Format compliant with SECNAV M-5216.5
            </p>
            <p style={{ marginTop: '8px' }}>
              <a href="https://linktr.ee/semperadmin" target="_blank" rel="noopener noreferrer" style={{ color: '#b8860b', textDecoration: 'none' }}>
                Connect with Semper Admin
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Spinning animation for loading */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
