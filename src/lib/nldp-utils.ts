/**
 * Naval Letter Data Package (NLDP) Utilities
 * 
 * Core utilities for creating, validating, and processing NLDP files.
 * Handles data integrity, version compatibility, and error management.
 */

import { 
  NLDPFile, 
  NLDPDataPayload, 
  NLDPMetadata, 
  NLDPValidationResult, 
  NLDPImportResult,
  NLDPExportConfig,
  NLDP_FORMAT_VERSION,
  NLDP_FILE_EXTENSION,
  FormData,
  ParagraphData
} from './nldp-format';

// Simple CRC32 implementation for data integrity checking
function crc32(data: string): string {
  const table = new Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    }
    table[i] = c;
  }
  
  let crc = 0 ^ (-1);
  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ data.charCodeAt(i)) & 0xFF];
  }
  return ((crc ^ (-1)) >>> 0).toString(16).toUpperCase();
}

// Simple SHA-256 hash implementation (browser-compatible)
async function sha256(data: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generates a unique package ID
 */
function generatePackageId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `nldp_${timestamp}_${random}`;
}

/**
 * Validates NLDP file structure and content
 */
export function validateNLDPFile(fileContent: string): NLDPValidationResult {
  const result: NLDPValidationResult = {
    isValid: false,
    errors: [],
    warnings: [],
    isCompatible: false
  };

  try {
    // Parse JSON
    const nldpFile: NLDPFile = JSON.parse(fileContent);
    
    // Check required top-level properties
    if (!nldpFile.metadata || !nldpFile.data) {
      result.errors.push('Invalid NLDP file structure: missing metadata or data');
      return result;
    }

    // Validate metadata
    const { metadata, data } = nldpFile;
    
    if (!metadata.packageId) {
      result.errors.push('Missing package ID');
    }
    
    if (!metadata.formatVersion) {
      result.errors.push('Missing format version');
    } else {
      result.formatVersion = metadata.formatVersion;
      
      // Check version compatibility
      const [major, minor] = metadata.formatVersion.split('.').map(Number);
      const [currentMajor, currentMinor] = NLDP_FORMAT_VERSION.split('.').map(Number);
      
      if (major > currentMajor) {
        result.errors.push(`Incompatible format version: ${metadata.formatVersion} (current: ${NLDP_FORMAT_VERSION})`);
      } else if (major === currentMajor && minor > currentMinor) {
        result.warnings.push(`Newer minor version: ${metadata.formatVersion} (current: ${NLDP_FORMAT_VERSION})`);
        result.isCompatible = true;
      } else {
        result.isCompatible = true;
      }
    }
    
    if (!metadata.createdAt) {
      result.errors.push('Missing creation date');
    }
    
    if (!metadata.package?.title) {
      result.errors.push('Missing package title');
    }
    
    if (!metadata.package?.subject) {
      result.errors.push('Missing subject');
    }

    // Validate data payload
    if (!data.formData) {
      result.errors.push('Missing form data');
    } else {
      // Check required form fields
      const requiredFields = ['documentType', 'ssic', 'date', 'from', 'to', 'subj'];
      for (const field of requiredFields) {
        if (!data.formData[field as keyof FormData]) {
          result.warnings.push(`Missing or empty required field: ${field}`);
        }
      }
    }
    
    if (!Array.isArray(data.paragraphs)) {
      result.errors.push('Invalid paragraphs data');
    } else if (data.paragraphs.length === 0) {
      result.warnings.push('No paragraphs found in document');
    }

    // Validate arrays
    const arrayFields = ['vias', 'references', 'enclosures', 'copyTos'];
    for (const field of arrayFields) {
      if (!Array.isArray(data[field as keyof NLDPDataPayload])) {
        result.errors.push(`Invalid ${field} data - must be array`);
      }
    }

    // Verify data integrity if checksums are present
    if (metadata.checksums) {
      try {
        const dataString = JSON.stringify(data);
        const calculatedCrc = crc32(dataString);
        
        if (metadata.checksums.crc32 && metadata.checksums.crc32 !== calculatedCrc) {
          result.errors.push('Data integrity check failed: CRC32 mismatch');
        }
      } catch (error) {
        result.warnings.push('Could not verify data integrity');
      }
    }

    result.isValid = result.errors.length === 0;
    
  } catch (error) {
    result.errors.push(`Failed to parse NLDP file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

/**
 * Creates an NLDP file from current application data
 */
export async function createNLDPFile(
  formData: FormData,
  vias: string[],
  references: string[],
  enclosures: string[],
  copyTos: string[],
  paragraphs: ParagraphData[],
  config: NLDPExportConfig
): Promise<string> {
  
  const dataPayload: NLDPDataPayload = {
    formData,
    vias: vias.filter(v => v.trim() !== ''),
    references: references.filter(r => r.trim() !== ''),
    enclosures: enclosures.filter(e => e.trim() !== ''),
    copyTos: copyTos.filter(c => c.trim() !== ''),
    paragraphs: paragraphs.filter(p => p.content.trim() !== '')
  };

  // Calculate checksums
  const dataString = JSON.stringify(dataPayload);
  const dataHash = await sha256(dataString);
  const crc32Hash = crc32(dataString);

  const metadata: NLDPMetadata = {
    packageId: generatePackageId(),
    formatVersion: NLDP_FORMAT_VERSION,
    createdAt: new Date().toISOString(),
    author: {
      name: config.author.name,
      unit: config.author.unit,
      email: config.includePersonalInfo ? config.author.email : undefined
    },
    package: {
      title: config.package.title,
      description: config.package.description,
      subject: formData.subj || 'Untitled Letter',
      documentType: formData.documentType,
      tags: config.package.tags
    },
    checksums: {
      dataHash,
      crc32: crc32Hash
    }
  };

  const nldpFile: NLDPFile = {
    metadata,
    data: dataPayload
  };

  return JSON.stringify(nldpFile, null, 2);
}

/**
 * Imports data from an NLDP file
 */
export function importNLDPFile(fileContent: string): NLDPImportResult {
  const result: NLDPImportResult = {
    success: false,
    errors: [],
    warnings: []
  };

  // First validate the file
  const validation = validateNLDPFile(fileContent);
  result.errors = [...validation.errors];
  result.warnings = [...validation.warnings];

  if (!validation.isValid) {
    return result;
  }

  if (!validation.isCompatible) {
    result.errors.push('File format is not compatible with current version');
    return result;
  }

  try {
    const nldpFile: NLDPFile = JSON.parse(fileContent);
    result.data = nldpFile.data;
    result.metadata = nldpFile.metadata;
    result.success = true;
  } catch (error) {
    result.errors.push(`Failed to import file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

/**
 * Generates a suggested filename for an NLDP export
 */
export function generateNLDPFilename(subject: string, documentType: string): string {
  // Clean subject for filename
  const cleanSubject = subject
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .substring(0, 50); // Limit length
  
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const docTypePrefix = documentType === 'endorsement' ? 'ENDORSE' : 'LETTER';
  
  return `${docTypePrefix}_${cleanSubject}_${timestamp}${NLDP_FILE_EXTENSION}`;
}

/**
 * Validates that imported data is safe and won't break the application
 */
export function sanitizeImportedData(data: NLDPDataPayload): NLDPDataPayload {
  const sanitized: NLDPDataPayload = {
    formData: {
      // Ensure all required fields exist with defaults
      documentType: data.formData.documentType || 'basic',
      endorsementLevel: data.formData.endorsementLevel || '',
      basicLetterReference: data.formData.basicLetterReference || '',
      referenceWho: data.formData.referenceWho || '',
      referenceType: data.formData.referenceType || '',
      referenceDate: data.formData.referenceDate || '',
      startingReferenceLevel: data.formData.startingReferenceLevel || 'a',
      startingEnclosureNumber: data.formData.startingEnclosureNumber || '1',
      line1: data.formData.line1 || '',
      line2: data.formData.line2 || '',
      line3: data.formData.line3 || '',
      ssic: data.formData.ssic || '',
      originatorCode: data.formData.originatorCode || '',
      date: data.formData.date || '',
      from: data.formData.from || '',
      to: data.formData.to || '',
      subj: data.formData.subj || '',
      sig: data.formData.sig || '',
      delegationText: data.formData.delegationText || '',
      startingPageNumber: data.formData.startingPageNumber || 1,
      previousPackagePageCount: data.formData.previousPackagePageCount || 0
    },
    vias: Array.isArray(data.vias) ? data.vias.filter(v => typeof v === 'string') : [],
    references: Array.isArray(data.references) ? data.references.filter(r => typeof r === 'string') : [],
    enclosures: Array.isArray(data.enclosures) ? data.enclosures.filter(e => typeof e === 'string') : [],
    copyTos: Array.isArray(data.copyTos) ? data.copyTos.filter(c => typeof c === 'string') : [],
    paragraphs: Array.isArray(data.paragraphs) 
      ? data.paragraphs
          .filter(p => p && typeof p.content === 'string')
          .map((p, index) => ({
            id: p.id || index + 1,
            level: Math.max(1, Math.min(8, p.level || 1)), // Clamp level between 1-8
            content: p.content || '',
            acronymError: p.acronymError || ''
          }))
      : [{ id: 1, level: 1, content: '', acronymError: '' }]
  };

  return sanitized;
}
