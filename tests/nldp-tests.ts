/**
 * Unit Tests for NLDP (Naval Letter Data Package) Functionality
 * 
 * Tests core utilities, validation, import/export operations, and edge cases.
 */

import { 
  createNLDPFile, 
  importNLDPFile, 
  validateNLDPFile, 
  sanitizeImportedData,
  generateNLDPFilename 
} from '../src/lib/nldp-utils';
import { 
  NLDPFile, 
  NLDPDataPayload, 
  FormData, 
  ParagraphData,
  NLDP_FORMAT_VERSION 
} from '../src/lib/nldp-format';

// Mock crypto.subtle for testing environment
if (typeof global !== 'undefined' && !global.crypto) {
  global.crypto = {
    subtle: {
      digest: async (algorithm: string, data: ArrayBuffer) => {
        // Simple mock hash for testing
        const view = new Uint8Array(data);
        let hash = 0;
        for (let i = 0; i < view.length; i++) {
          hash = ((hash << 5) - hash + view[i]) & 0xffffffff;
        }
        const hashArray = new Array(32).fill(0).map((_, i) => 
          Math.abs(hash + i) % 256
        );
        return new Uint8Array(hashArray).buffer;
      }
    }
  } as any;
}

describe('NLDP Format Tests', () => {
  
  const mockFormData: FormData = {
    documentType: 'basic',
    endorsementLevel: '',
    basicLetterReference: '',
    referenceWho: '',
    referenceType: '',
    referenceDate: '',
    startingReferenceLevel: 'a',
    startingEnclosureNumber: '1',
    line1: 'TEST UNIT',
    line2: 'TEST ADDRESS',
    line3: 'TEST CITY, STATE 12345',
    ssic: '1500',
    originatorCode: '',
    date: '30 Aug 24',
    from: 'Test Sender',
    to: 'Test Recipient',
    subj: 'TEST SUBJECT',
    sig: 'Test Signature',
    delegationText: '',
    startingPageNumber: 1,
    previousPackagePageCount: 0
  };

  const mockParagraphs: ParagraphData[] = [
    { id: 1, level: 1, content: 'Test paragraph 1', acronymError: '' },
    { id: 2, level: 2, content: 'Test paragraph 2', acronymError: '' }
  ];

  const mockVias = ['Test Via'];
  const mockReferences = ['Test Reference'];
  const mockEnclosures = ['Test Enclosure'];
  const mockCopyTos = ['Test Copy To'];

  const mockConfig = {
    author: {
      name: 'Test Author',
      unit: 'Test Unit',
      email: 'test@example.com'
    },
    package: {
      title: 'Test Package',
      description: 'Test Description',
      tags: ['test']
    },
    includePersonalInfo: true
  };

  describe('NLDP File Creation', () => {
    
    test('should create valid NLDP file', async () => {
      const nldpContent = await createNLDPFile(
        mockFormData,
        mockVias,
        mockReferences,
        mockEnclosures,
        mockCopyTos,
        mockParagraphs,
        mockConfig
      );

      expect(nldpContent).toBeDefined();
      expect(() => JSON.parse(nldpContent)).not.toThrow();
      
      const parsed: NLDPFile = JSON.parse(nldpContent);
      expect(parsed.metadata).toBeDefined();
      expect(parsed.data).toBeDefined();
      expect(parsed.metadata.formatVersion).toBe(NLDP_FORMAT_VERSION);
    });

    test('should include all required metadata fields', async () => {
      const nldpContent = await createNLDPFile(
        mockFormData,
        mockVias,
        mockReferences,
        mockEnclosures,
        mockCopyTos,
        mockParagraphs,
        mockConfig
      );

      const parsed: NLDPFile = JSON.parse(nldpContent);
      const { metadata } = parsed;

      expect(metadata.packageId).toBeDefined();
      expect(metadata.formatVersion).toBe(NLDP_FORMAT_VERSION);
      expect(metadata.createdAt).toBeDefined();
      expect(metadata.author.name).toBe('Test Author');
      expect(metadata.package.title).toBe('Test Package');
      expect(metadata.checksums.dataHash).toBeDefined();
      expect(metadata.checksums.crc32).toBeDefined();
    });

    test('should include all data fields', async () => {
      const nldpContent = await createNLDPFile(
        mockFormData,
        mockVias,
        mockReferences,
        mockEnclosures,
        mockCopyTos,
        mockParagraphs,
        mockConfig
      );

      const parsed: NLDPFile = JSON.parse(nldpContent);
      const { data } = parsed;

      expect(data.formData).toEqual(mockFormData);
      expect(data.vias).toEqual(mockVias);
      expect(data.references).toEqual(mockReferences);
      expect(data.enclosures).toEqual(mockEnclosures);
      expect(data.copyTos).toEqual(mockCopyTos);
      expect(data.paragraphs).toEqual(mockParagraphs);
    });

    test('should filter out empty strings from arrays', async () => {
      const viasWithEmpty = ['Valid Via', '', '  ', 'Another Via'];
      
      const nldpContent = await createNLDPFile(
        mockFormData,
        viasWithEmpty,
        mockReferences,
        mockEnclosures,
        mockCopyTos,
        mockParagraphs,
        mockConfig
      );

      const parsed: NLDPFile = JSON.parse(nldpContent);
      expect(parsed.data.vias).toEqual(['Valid Via', 'Another Via']);
    });

    test('should filter out empty paragraphs', async () => {
      const paragraphsWithEmpty: ParagraphData[] = [
        { id: 1, level: 1, content: 'Valid content', acronymError: '' },
        { id: 2, level: 1, content: '', acronymError: '' },
        { id: 3, level: 1, content: '   ', acronymError: '' },
        { id: 4, level: 1, content: 'Another valid', acronymError: '' }
      ];
      
      const nldpContent = await createNLDPFile(
        mockFormData,
        mockVias,
        mockReferences,
        mockEnclosures,
        mockCopyTos,
        paragraphsWithEmpty,
        mockConfig
      );

      const parsed: NLDPFile = JSON.parse(nldpContent);
      expect(parsed.data.paragraphs).toHaveLength(2);
      expect(parsed.data.paragraphs[0].content).toBe('Valid content');
      expect(parsed.data.paragraphs[1].content).toBe('Another valid');
    });
  });

  describe('NLDP File Validation', () => {
    
    test('should validate correct NLDP file', async () => {
      const nldpContent = await createNLDPFile(
        mockFormData,
        mockVias,
        mockReferences,
        mockEnclosures,
        mockCopyTos,
        mockParagraphs,
        mockConfig
      );

      const validation = validateNLDPFile(nldpContent);
      expect(validation.isValid).toBe(true);
      expect(validation.isCompatible).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should reject invalid JSON', () => {
      const invalidJson = '{ invalid json }';
      const validation = validateNLDPFile(invalidJson);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors[0]).toContain('Failed to parse');
    });

    test('should reject missing metadata', () => {
      const invalidNldp = JSON.stringify({ data: mockFormData });
      const validation = validateNLDPFile(invalidNldp);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Invalid NLDP file structure: missing metadata or data');
    });

    test('should reject missing data', () => {
      const invalidNldp = JSON.stringify({ metadata: { packageId: 'test' } });
      const validation = validateNLDPFile(invalidNldp);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Invalid NLDP file structure: missing metadata or data');
    });

    test('should reject incompatible versions', () => {
      const futureVersion = {
        metadata: {
          packageId: 'test',
          formatVersion: '999.0.0',
          createdAt: new Date().toISOString(),
          author: { name: 'Test' },
          package: { title: 'Test', subject: 'Test', documentType: 'basic' },
          checksums: { dataHash: 'test', crc32: 'test' }
        },
        data: { formData: mockFormData, vias: [], references: [], enclosures: [], copyTos: [], paragraphs: [] }
      };

      const validation = validateNLDPFile(JSON.stringify(futureVersion));
      expect(validation.isValid).toBe(false);
      expect(validation.isCompatible).toBe(false);
    });

    test('should warn about missing required fields', () => {
      const incompleteFormData = { ...mockFormData, ssic: '', from: '', to: '' };
      const testData = {
        metadata: {
          packageId: 'test',
          formatVersion: NLDP_FORMAT_VERSION,
          createdAt: new Date().toISOString(),
          author: { name: 'Test' },
          package: { title: 'Test', subject: 'Test', documentType: 'basic' },
          checksums: { dataHash: 'test', crc32: 'test' }
        },
        data: { 
          formData: incompleteFormData, 
          vias: [], 
          references: [], 
          enclosures: [], 
          copyTos: [], 
          paragraphs: [] 
        }
      };

      const validation = validateNLDPFile(JSON.stringify(testData));
      expect(validation.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('NLDP File Import', () => {
    
    test('should import valid NLDP file', async () => {
      const nldpContent = await createNLDPFile(
        mockFormData,
        mockVias,
        mockReferences,
        mockEnclosures,
        mockCopyTos,
        mockParagraphs,
        mockConfig
      );

      const importResult = importNLDPFile(nldpContent);
      
      expect(importResult.success).toBe(true);
      expect(importResult.data).toBeDefined();
      expect(importResult.metadata).toBeDefined();
      expect(importResult.errors).toHaveLength(0);
    });

    test('should fail to import invalid file', () => {
      const invalidContent = '{ "invalid": "structure" }';
      const importResult = importNLDPFile(invalidContent);
      
      expect(importResult.success).toBe(false);
      expect(importResult.errors.length).toBeGreaterThan(0);
    });

    test('should fail to import incompatible version', () => {
      const futureVersion = {
        metadata: {
          packageId: 'test',
          formatVersion: '999.0.0',
          createdAt: new Date().toISOString(),
          author: { name: 'Test' },
          package: { title: 'Test', subject: 'Test', documentType: 'basic' },
          checksums: { dataHash: 'test', crc32: 'test' }
        },
        data: { formData: mockFormData, vias: [], references: [], enclosures: [], copyTos: [], paragraphs: [] }
      };

      const importResult = importNLDPFile(JSON.stringify(futureVersion));
      expect(importResult.success).toBe(false);
      expect(importResult.errors).toContain('File format is not compatible with current version');
    });
  });

  describe('Data Sanitization', () => {
    
    test('should sanitize missing form data fields', () => {
      const incompleteData: Partial<NLDPDataPayload> = {
        formData: {
          documentType: 'basic'
        } as FormData,
        paragraphs: []
      };

      const sanitized = sanitizeImportedData(incompleteData as NLDPDataPayload);
      
      expect(sanitized.formData.documentType).toBe('basic');
      expect(sanitized.formData.startingReferenceLevel).toBe('a');
      expect(sanitized.formData.startingEnclosureNumber).toBe('1');
      expect(sanitized.formData.startingPageNumber).toBe(1);
      expect(sanitized.formData.previousPackagePageCount).toBe(0);
    });

    test('should sanitize invalid arrays', () => {
      const badData: any = {
        formData: mockFormData,
        vias: 'not an array',
        references: null,
        enclosures: [123, 'valid string', null],
        copyTos: undefined,
        paragraphs: 'also not an array'
      };

      const sanitized = sanitizeImportedData(badData);
      
      expect(Array.isArray(sanitized.vias)).toBe(true);
      expect(Array.isArray(sanitized.references)).toBe(true);
      expect(Array.isArray(sanitized.enclosures)).toBe(true);
      expect(Array.isArray(sanitized.copyTos)).toBe(true);
      expect(Array.isArray(sanitized.paragraphs)).toBe(true);
      
      expect(sanitized.enclosures).toEqual(['valid string']);
    });

    test('should clamp paragraph levels to valid range', () => {
      const badParagraphs = [
        { id: 1, level: -5, content: 'Test 1' },
        { id: 2, level: 0, content: 'Test 2' },
        { id: 3, level: 5, content: 'Test 3' },
        { id: 4, level: 999, content: 'Test 4' }
      ];

      const testData: NLDPDataPayload = {
        formData: mockFormData,
        vias: [],
        references: [],
        enclosures: [],
        copyTos: [],
        paragraphs: badParagraphs as ParagraphData[]
      };

      const sanitized = sanitizeImportedData(testData);
      
      expect(sanitized.paragraphs[0].level).toBe(1); // Clamped from -5
      expect(sanitized.paragraphs[1].level).toBe(1); // Clamped from 0
      expect(sanitized.paragraphs[2].level).toBe(5); // Valid
      expect(sanitized.paragraphs[3].level).toBe(8); // Clamped from 999
    });

    test('should provide default paragraph if none exist', () => {
      const testData: NLDPDataPayload = {
        formData: mockFormData,
        vias: [],
        references: [],
        enclosures: [],
        copyTos: [],
        paragraphs: []
      };

      const sanitized = sanitizeImportedData(testData);
      
      expect(sanitized.paragraphs).toHaveLength(1);
      expect(sanitized.paragraphs[0]).toEqual({
        id: 1,
        level: 1,
        content: '',
        acronymError: ''
      });
    });
  });

  describe('Filename Generation', () => {
    
    test('should generate valid filename for basic letter', () => {
      const filename = generateNLDPFilename('Test Subject Line', 'basic');
      
      expect(filename).toMatch(/^LETTER_/);
      expect(filename).toContain('Test_Subject_Line');
      expect(filename).toMatch(/\d{4}-\d{2}-\d{2}/); // Date pattern
      expect(filename).toEndWith('.nldp');
    });

    test('should generate valid filename for endorsement', () => {
      const filename = generateNLDPFilename('Test Subject', 'endorsement');
      
      expect(filename).toMatch(/^ENDORSE_/);
      expect(filename).toContain('Test_Subject');
      expect(filename).toEndWith('.nldp');
    });

    test('should clean special characters from subject', () => {
      const filename = generateNLDPFilename('Test: Subject! (With) Special@Characters#', 'basic');
      
      expect(filename).not.toContain(':');
      expect(filename).not.toContain('!');
      expect(filename).not.toContain('@');
      expect(filename).not.toContain('#');
      expect(filename).toContain('Test_Subject_With_Special');
    });

    test('should limit subject length in filename', () => {
      const longSubject = 'A'.repeat(100);
      const filename = generateNLDPFilename(longSubject, 'basic');
      
      // Should be truncated to 50 chars plus prefix and suffix
      expect(filename.length).toBeLessThan(100);
      expect(filename).toContain('A'.repeat(50));
    });
  });
});

// Run tests if this file is executed directly
if (require.main === module) {
  console.log('Running NLDP unit tests...');
  console.log('Note: These tests require a test runner like Jest to execute properly.');
}