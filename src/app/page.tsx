
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
import { parseAndFormatDate, getTodaysDate } from '@/lib/date-utils';
import { getBodyFont, getFromToSpacing, getViaSpacing, getSubjSpacing, getRefSpacing, getEnclSpacing, getCopyToSpacing, splitSubject } from '@/lib/naval-format-utils';
import { numbersOnly, autoUppercase } from '@/lib/string-utils';
import { REFERENCE_TYPES, COMMON_ORIGINATORS } from '@/lib/constants';
import { validateSSIC, validateSubject, validateFromTo, ValidationResult } from '@/lib/validation-utils';
import { loadSavedLetters, saveLetterToStorage, findLetterById } from '@/lib/storage-utils';
import { StructuredReferenceInput } from '@/components/letter/StructuredReferenceInput';
import { ReferencesSection } from '@/components/letter/ReferencesSection';
import { EnclosuresSection } from '@/components/letter/EnclosuresSection';
import { CopyToSection } from '@/components/letter/CopyToSection';
import { ViaSection } from '@/components/letter/ViaSection';
import { FormData, ParagraphData, SavedLetter, ValidationState } from '@/types';
import '../styles/letter-form.css';


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

  const [showRef, setShowRef] = useState(false);
  const [showEncl, setShowEncl] = useState(false);
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
    const letters = loadSavedLetters();
    setSavedLetters(letters);
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

    const now = new Date();
    const newLetter: SavedLetter = {
      ...formData,
      id: now.toISOString(),
      savedAt: now.toLocaleString(),
      vias,
      references,
      enclosures,
      copyTos,
      paragraphs,
    };

    const updatedLetters = saveLetterToStorage(newLetter, savedLetters);
    setSavedLetters(updatedLetters);
  };

  const loadLetter = (letterId: string) => {
    debugUserAction('Load Letter', { letterId });

    const letterToLoad = findLetterById(letterId, savedLetters);
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
      setShowRef(letterToLoad.references.some(r => r.trim() !== ''));
      setShowEncl(letterToLoad.enclosures.some(e => e.trim() !== ''));
      setShowDelegation(!!letterToLoad.delegationText);

      // Re-validate fields after loading
      handleValidateSSIC(letterToLoad.ssic);
      handleValidateSubject(letterToLoad.subj);
      handleValidateFromTo(letterToLoad.from, 'from');
      handleValidateFromTo(letterToLoad.to, 'to');
    }
  };


  // Validation wrapper functions that update state
  const handleValidateSSIC = (value: string) => {
    const result = validateSSIC(value);
    setValidation(prev => ({ ...prev, ssic: result }));
  };

  const handleValidateSubject = (value: string) => {
    const result = validateSubject(value);
    setValidation(prev => ({ ...prev, subj: result }));
  };

  const handleValidateFromTo = (value: string, field: 'from' | 'to') => {
    const result = validateFromTo(value);
    setValidation(prev => ({ ...prev, [field]: result }));
  };

  const setTodaysDate = () => {
    const navyDate = getTodaysDate();
    setFormData(prev => ({ ...prev, date: navyDate }));
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
      handleValidateSSIC(selectedSsic.originalCode);
    }
  };

  const clearSsicInfo = () => {
    setFormData(prev => ({ ...prev, ssic: '' }));
    handleValidateSSIC('');
  };


  return (
    <div>
      {/* Font Awesome CSS */}
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

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
                  handleValidateSSIC(value);
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
                onBlur={(e) => handleValidateFromTo(e.target.value, 'from')}
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
                onBlur={(e) => handleValidateFromTo(e.target.value, 'to')}
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
                  handleValidateSubject(value);
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

            <ViaSection vias={vias} setVias={setVias} />

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

            <CopyToSection copyTos={copyTos} setCopyTos={setCopyTos} />
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
              setShowRef(importedReferences.some(r => r.trim() !== ''));
              setShowEncl(importedEnclosures.some(e => e.trim() !== ''));
              setShowDelegation(!!importedFormData.delegationText);
                        
              // Re-validate fields after loading
              handleValidateSSIC(importedFormData.ssic);
              handleValidateSubject(importedFormData.subj);
              handleValidateFromTo(importedFormData.from, 'from');
              handleValidateFromTo(importedFormData.to, 'to');
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
    </div>
  );
}
