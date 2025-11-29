/**
 * Enhanced Save Utilities
 * 
 * Provides enhanced saving capabilities that integrate with both
 * localStorage and NLDP export functionality.
 */

import { FormData, ParagraphData } from '../lib/nldp-format';
import { createNLDPFile, generateNLDPFilename } from '../lib/nldp-utils';
import { saveAs } from 'file-saver';

export interface EnhancedSaveOptions {
  /** Whether to also create an NLDP backup file */
  createNLDPBackup?: boolean;
  /** Author information for NLDP file */
  author?: {
    name?: string;
    unit?: string;
  };
  /** Whether to include personal info in NLDP export */
  includePersonalInfo?: boolean;
}

/**
 * Enhanced save function that saves to localStorage and optionally creates NLDP backup
 */
export async function enhancedSave(
  formData: FormData,
  vias: string[],
  references: string[],
  enclosures: string[],
  copyTos: string[],
  paragraphs: ParagraphData[],
  options: EnhancedSaveOptions = {}
): Promise<{ success: boolean; error?: string; nldpFilename?: string }> {
  
  try {
    // Create the saved letter object (existing format)
    const newLetter = {
      ...formData,
      id: new Date().toISOString(),
      savedAt: new Date().toLocaleString(),
      vias: vias.filter(v => v.trim() !== ''),
      references: references.filter(r => r.trim() !== ''),
      enclosures: enclosures.filter(e => e.trim() !== ''),
      copyTos: copyTos.filter(c => c.trim() !== ''),
      paragraphs: paragraphs.filter(p => p.content.trim() !== '')
    };

    // Save to localStorage (existing functionality)
    const saved = localStorage.getItem('navalLetters');
    const existingLetters = saved ? JSON.parse(saved) : [];
    const updatedLetters = [newLetter, ...existingLetters].slice(0, 10);
    localStorage.setItem('navalLetters', JSON.stringify(updatedLetters));

    let nldpFilename: string | undefined;

    // Optionally create NLDP backup
    if (options.createNLDPBackup) {
      const nldpConfig = {
        author: {
          name: options.author?.name || '',
          unit: options.author?.unit || '',
          email: undefined
        },
        package: {
          title: `Auto-backup: ${formData.subj || 'Naval Letter'}`,
          description: `Automatic backup created on ${new Date().toLocaleDateString()}`,
          tags: ['backup', 'auto-save']
        },
        includePersonalInfo: options.includePersonalInfo || false
      };

      const nldpContent = await createNLDPFile(
        formData,
        vias,
        references,
        enclosures,
        copyTos,
        paragraphs,
        nldpConfig
      );

      nldpFilename = generateNLDPFilename(formData.subj, formData.documentType);
      const blob = new Blob([nldpContent], { type: 'application/json' });
      saveAs(blob, nldpFilename);
    }

    return { 
      success: true, 
      nldpFilename 
    };

  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown save error' 
    };
  }
}

/**
 * Quick NLDP export function for one-click backup
 */
export async function quickNLDPExport(
  formData: FormData,
  vias: string[],
  references: string[],
  enclosures: string[],
  copyTos: string[],
  paragraphs: ParagraphData[],
  authorName?: string,
  authorUnit?: string
): Promise<{ success: boolean; error?: string; filename?: string }> {
  
  try {
    const nldpConfig = {
      author: {
        name: authorName || 'Unknown User',
        unit: authorUnit || '',
        email: undefined
      },
      package: {
        title: `Quick Export: ${formData.subj || 'Naval Letter'}`,
        description: `Quick export created on ${new Date().toLocaleDateString()}`,
        tags: ['quick-export']
      },
      includePersonalInfo: false
    };

    const nldpContent = await createNLDPFile(
      formData,
      vias,
      references,
      enclosures,
      copyTos,
      paragraphs,
      nldpConfig
    );

    const filename = generateNLDPFilename(formData.subj, formData.documentType);
    const blob = new Blob([nldpContent], { type: 'application/json' });
    saveAs(blob, filename);

    return { 
      success: true, 
      filename 
    };

  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Export failed' 
    };
  }
}