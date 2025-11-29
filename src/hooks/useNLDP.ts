/**
 * React Hook for Naval Letter Data Package (NLDP) Operations
 * 
 * Provides functionality for exporting, importing, and managing NLDP files
 * with proper error handling and user feedback.
 */

import { useState, useCallback } from 'react';
import { saveAs } from 'file-saver';
import { 
  createNLDPFile, 
  importNLDPFile, 
  generateNLDPFilename,
  sanitizeImportedData,
  validateNLDPFile
} from '../lib/nldp-utils';
import { 
  NLDPExportConfig, 
  NLDPImportResult, 
  NLDPDataPayload,
  FormData,
  ParagraphData,
  NLDP_FILE_EXTENSION,
  NLDP_MIME_TYPE 
} from '../lib/nldp-format';

export interface UseNLDPResult {
  // Export functionality
  exportToNLDP: (
    formData: FormData,
    vias: string[],
    references: string[],
    enclosures: string[],
    copyTos: string[],
    paragraphs: ParagraphData[],
    config: NLDPExportConfig
  ) => Promise<void>;
  
  // Import functionality
  importFromNLDP: (file: File) => Promise<NLDPImportResult>;
  importFromText: (content: string) => NLDPImportResult;
  
  // File handling
  triggerFileImport: () => void;
  
  // State
  isExporting: boolean;
  isImporting: boolean;
  lastError: string | null;
  lastSuccess: string | null;
  
  // Clear messages
  clearMessages: () => void;
}

export function useNLDP(): UseNLDPResult {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastSuccess, setLastSuccess] = useState<string | null>(null);

  const clearMessages = useCallback(() => {
    setLastError(null);
    setLastSuccess(null);
  }, []);

  const exportToNLDP = useCallback(async (
    formData: FormData,
    vias: string[],
    references: string[],
    enclosures: string[],
    copyTos: string[],
    paragraphs: ParagraphData[],
    config: NLDPExportConfig
  ) => {
    setIsExporting(true);
    setLastError(null);
    setLastSuccess(null);

    try {
      // Validate that we have some content to export
      if (!formData.subj && paragraphs.every(p => !p.content.trim())) {
        throw new Error('Cannot export empty document. Please add a subject or content first.');
      }

      // Create the NLDP file content
      const nldpContent = await createNLDPFile(
        formData,
        vias,
        references,
        enclosures,
        copyTos,
        paragraphs,
        config
      );

      // Generate filename
      const filename = generateNLDPFilename(formData.subj, formData.documentType);
      
      // Create and download file
      const blob = new Blob([nldpContent], { type: NLDP_MIME_TYPE });
      saveAs(blob, filename);
      
      setLastSuccess(`Successfully exported to ${filename}`);
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown export error';
      setLastError(`Export failed: ${message}`);
      console.error('NLDP Export Error:', error);
    } finally {
      setIsExporting(false);
    }
  }, []);

  const importFromNLDP = useCallback(async (file: File): Promise<NLDPImportResult> => {
    setIsImporting(true);
    setLastError(null);
    setLastSuccess(null);

    try {
      // Validate file extension
      if (!file.name.toLowerCase().endsWith(NLDP_FILE_EXTENSION)) {
        const result: NLDPImportResult = {
          success: false,
          errors: [`Invalid file type. Expected ${NLDP_FILE_EXTENSION} file.`],
          warnings: []
        };
        setLastError(result.errors[0]);
        return result;
      }

      // Read file content
      const fileContent = await file.text();
      
      // Import and validate
      const result = importNLDPFile(fileContent);
      
      if (result.success && result.data) {
        // Sanitize the imported data
        result.data = sanitizeImportedData(result.data);
        setLastSuccess(`Successfully imported ${file.name}`);
      } else {
        setLastError(`Import failed: ${result.errors.join(', ')}`);
      }
      
      return result;
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown import error';
      const result: NLDPImportResult = {
        success: false,
        errors: [message],
        warnings: []
      };
      setLastError(`Import failed: ${message}`);
      console.error('NLDP Import Error:', error);
      return result;
    } finally {
      setIsImporting(false);
    }
  }, []);

  const importFromText = useCallback((content: string): NLDPImportResult => {
    setLastError(null);
    setLastSuccess(null);

    try {
      const result = importNLDPFile(content);
      
      if (result.success && result.data) {
        result.data = sanitizeImportedData(result.data);
        setLastSuccess('Successfully imported from text');
      } else {
        setLastError(`Import failed: ${result.errors.join(', ')}`);
      }
      
      return result;
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown import error';
      const result: NLDPImportResult = {
        success: false,
        errors: [message],
        warnings: []
      };
      setLastError(`Import failed: ${message}`);
      return result;
    }
  }, []);

  const triggerFileImport = useCallback(() => {
    // Create a hidden file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = NLDP_FILE_EXTENSION;
    input.style.display = 'none';
    
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        await importFromNLDP(file);
      }
      // Clean up
      document.body.removeChild(input);
    };
    
    document.body.appendChild(input);
    input.click();
  }, [importFromNLDP]);

  return {
    exportToNLDP,
    importFromNLDP,
    importFromText,
    triggerFileImport,
    isExporting,
    isImporting,
    lastError,
    lastSuccess,
    clearMessages
  };
}