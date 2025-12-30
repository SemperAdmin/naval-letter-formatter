
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Document, Packer, Paragraph, TextRun, AlignmentType, TabStopType, Header, ImageRun, VerticalPositionRelativeFrom, HorizontalPositionRelativeFrom, Footer, PageNumber, IParagraphOptions, convertInchesToTwip, TextWrappingType } from 'docx';
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
import { ParagraphSection } from '@/components/letter/ParagraphSection';
import { HeaderFieldsSection } from '@/components/letter/HeaderFieldsSection';
import { ClosingBlockSection } from '@/components/letter/ClosingBlockSection';
import { DocumentTypeSection } from '@/components/letter/DocumentTypeSection';
import { CollapsibleFormSection } from '@/components/ui/collapsible-form-section';
import { ValidationSummary } from '@/components/ui/validation-summary';
import { StickyActionBar, ExportFormat } from '@/components/ui/sticky-action-bar';
import { downloadPDF } from '@/lib/pdf-generator';
import { FormData, ParagraphData, SavedLetter, ValidationState } from '@/types';
import '../styles/letter-form.css';
import { importNLDPFile, sanitizeImportedData } from '@/lib/nldp-utils';
import { resolvePublicPath } from '@/lib/path-utils';
import { useEDMSContext, isEditMode } from '@/hooks/useEDMSContext';
import { sendToEDMS } from '@/lib/edms-service';
import { EDMSLinkBadge } from '@/components/EDMSLinkBadge';
import { ReturnToEDMSDialog } from '@/components/ReturnToEDMSDialog';
import { Suspense } from 'react';


// Inner component that uses useSearchParams (requires Suspense boundary)
function NavalLetterGeneratorInner() {
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

  // Sticky action bar state
  const [lastSaved, setLastSaved] = useState<string>('');

  // Notification state for better error handling
  const [notification, setNotification] = useState<{ message: string; type: 'error' | 'success' | 'info' } | null>(null);

  // Auto-dismiss notifications after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // EDMS Integration - detect if launched from EDMS system
  const edmsContext = useEDMSContext();
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [edmsError, setEdmsError] = useState<string | null>(null);
  const [isLoadingFromEDMS, setIsLoadingFromEDMS] = useState(false);

  // Unit selection state (moved here for EDMS auto-selection)
  const [currentUnitCode, setCurrentUnitCode] = useState<string | undefined>(undefined);
  const [currentUnitName, setCurrentUnitName] = useState<string | undefined>(undefined);

  // Add useRef to track values without causing re-renders
  const activeVoiceInputRef = useRef<number | null>(null);
  const paragraphsRef = useRef<ParagraphData[]>(paragraphs);
  const importFileInputRef = useRef<HTMLInputElement>(null);
  const exportButtonRef = useRef<HTMLButtonElement>(null);
  
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
    setFormData(prev => ({ ...prev, date: getTodaysDate() }));
  }, []);

  // Auto-select unit if launched from EDMS with unitCode parameter
  useEffect(() => {
    if (edmsContext.isLinked && edmsContext.unitCode) {
      // Find unit by RUC code (unitCode from EDMS)
      const matchedUnit = UNITS.find(u => u.ruc === edmsContext.unitCode);
      if (matchedUnit) {
        setFormData(prev => ({
          ...prev,
          line1: matchedUnit.unitName.toUpperCase(),
          line2: matchedUnit.streetAddress.toUpperCase(),
          line3: `${matchedUnit.cityState} ${matchedUnit.zip}`.toUpperCase(),
        }));
        setCurrentUnitCode(matchedUnit.ruc);
        setCurrentUnitName(matchedUnit.unitName.toUpperCase());
        debugUserAction('EDMS Auto-Select Unit', { unitCode: edmsContext.unitCode, unitName: matchedUnit.unitName });
      }
    }
  }, [edmsContext.isLinked, edmsContext.unitCode]);

  // Load existing letter data when in edit mode
  useEffect(() => {
    if (isEditMode(edmsContext)) {
      setIsLoadingFromEDMS(true);
      debugUserAction('EDMS Edit Mode', { fileUrl: edmsContext.fileUrl, documentId: edmsContext.documentId });

      fetch(edmsContext.fileUrl)
        .then(res => {
          if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
          return res.json();
        })
        .then(letterData => {
          // Map the EDMS letter data to NLF form structure
          setFormData(prev => ({
            ...prev,
            ssic: letterData.ssic || '',
            subj: letterData.subject || '',
            from: letterData.from || '',
            to: letterData.to || '',
            date: letterData.date || prev.date,
            sig: letterData.signature || '',
            originatorCode: letterData.originatorCode || '',
            documentType: letterData.letterType || 'basic',
            headerType: letterData.headerType || 'USMC',
            line1: letterData.unit?.line1 || prev.line1,
            line2: letterData.unit?.line2 || prev.line2,
            line3: letterData.unit?.line3 || prev.line3,
          }));

          // Load arrays
          if (letterData.via?.length) setVias(letterData.via);
          if (letterData.references?.length) setReferences(letterData.references);
          if (letterData.enclosures?.length) setEnclosures(letterData.enclosures);
          if (letterData.copyTos?.length) setCopyTos(letterData.copyTos);
          if (letterData.paragraphs?.length) setParagraphs(letterData.paragraphs);

          // Show refs/enclosures sections if they have content
          setShowRef(letterData.references?.some((r: string) => r.trim() !== '') || false);
          setShowEncl(letterData.enclosures?.some((e: string) => e.trim() !== '') || false);

          // Re-validate fields after loading
          if (letterData.ssic) handleValidateSSIC(letterData.ssic);
          if (letterData.subject) handleValidateSubject(letterData.subject);
          if (letterData.from) handleValidateFromTo(letterData.from, 'from');
          if (letterData.to) handleValidateFromTo(letterData.to, 'to');

          setNotification({ message: 'Letter loaded from EDMS', type: 'success' });
          debugUserAction('EDMS Letter Loaded', { subject: letterData.subject });
        })
        .catch(err => {
          console.error('Failed to load letter from EDMS:', err);
          setNotification({ message: `Failed to load letter: ${err.message}`, type: 'error' });
        })
        .finally(() => {
          setIsLoadingFromEDMS(false);
        });
    }
  }, [edmsContext.mode, edmsContext.fileUrl]);

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

    // Update last saved indicator
    setLastSaved('just now');
  };

  // Helper function to format relative time
  const formatRelativeTime = (timestamp: string): string => {
    if (!timestamp) return '';

    const now = new Date();
    const saved = new Date(timestamp);
    const diffMs = now.getTime() - saved.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'just now';
    if (diffMins === 1) return '1 min ago';
    if (diffMins < 60) return `${diffMins} mins ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;

    return 'today';
  };

  // Sticky action bar handlers
  const handleSaveDraft = () => {
    saveLetter();
  };

  const handleImport = () => {
    // Trigger the file input in NLDPFileManager
    importFileInputRef.current?.click();
  };

  const handleExport = () => {
    // Trigger the export button in NLDPFileManager
    exportButtonRef.current?.click();
  };

  const handleClearForm = () => {
    if (confirm('Are you sure you want to clear the form? Any unsaved changes will be lost.')) {
      // Reset to initial state
      setFormData({
        documentType: 'basic',
        endorsementLevel: '',
        basicLetterReference: '',
        referenceWho: '',
        referenceType: '',
        referenceDate: '',
        startingReferenceLevel: 'a',
        startingEnclosureNumber: '1',
        line1: '', line2: '', line3: '', ssic: '', originatorCode: '', date: getTodaysDate(), from: '', to: '', subj: '', sig: '', delegationText: '',
        startingPageNumber: 1,
        previousPackagePageCount: 0,
        headerType: 'USMC',
        bodyFont: 'times',
      });
      setVias(['']);
      setReferences(['']);
      setEnclosures(['']);
      setCopyTos(['']);
      setParagraphs([{ id: 1, level: 1, content: '', acronymError: '' }]);
      setShowRef(false);
      setShowEncl(false);
      setLastSaved('');

      debugUserAction('Clear Form', {});
    }
  };

  // Calculate if form is valid
  // For endorsements, also require endorsementLevel and basicLetterReference
  const isEndorsementValid = formData.documentType !== 'endorsement' ||
                              (!!formData.endorsementLevel && !!formData.basicLetterReference);

  const isFormValid = validation.ssic.isValid &&
                      validation.subj.isValid &&
                      validation.from.isValid &&
                      validation.to.isValid &&
                      isEndorsementValid;

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
          // Courier: hanging indent at ~11 chars (1584 twips at 12pt)
          content.push(new Paragraph({ children: [new TextRun({ text: refText, font: bodyFont, size: 24 })], alignment: AlignmentType.LEFT, indent: { left: 1584, hanging: 1584 } }));
        } else {
          // Times: tab at 720 for "(a)", hanging indent for continuation
          content.push(new Paragraph({ children: [new TextRun({ text: refText, font: bodyFont, size: 24 })], tabStops: [{ type: TabStopType.LEFT, position: 720 }], indent: { left: 1080, hanging: 1080 } }));
        }
      });
    }

    const enclsWithContent = enclosures.filter(encl => encl.trim());
    if (enclsWithContent.length > 0) {
      if (refsWithContent.length > 0) content.push(new Paragraph({ text: "" }));
      enclsWithContent.forEach((encl, i) => {
        const enclText = getEnclSpacing(i + 1, i, formData.bodyFont) + encl;

        if (formData.bodyFont === 'courier') {
          // Courier: hanging indent at ~11 chars (1584 twips at 12pt)
          content.push(new Paragraph({ children: [new TextRun({ text: enclText, font: bodyFont, size: 24 })], alignment: AlignmentType.LEFT, indent: { left: 1584, hanging: 1584 } }));
        } else {
          // Times: tab at 720 for "(1)", hanging indent for continuation
          content.push(new Paragraph({ children: [new TextRun({ text: enclText, font: bodyFont, size: 24 })], tabStops: [{ type: TabStopType.LEFT, position: 720 }], indent: { left: 1080, hanging: 1080 } }));
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
      // Courier: hanging indent at ~11 chars (1584 twips at 12pt)
      content.push(new Paragraph({ children: [new TextRun({ text: refText, font: bodyFont, size: 24 })], alignment: AlignmentType.LEFT, indent: { left: 1584, hanging: 1584 } }));
    } else {
      // Times: tab at 720 for "(a)", hanging indent for continuation
      content.push(new Paragraph({ children: [new TextRun({ text: refText, font: bodyFont, size: 24 })], tabStops: [{ type: TabStopType.LEFT, position: 720 }], indent: { left: 1080, hanging: 1080 } }));
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
      // Courier: hanging indent at ~11 chars (1584 twips at 12pt)
      content.push(new Paragraph({ children: [new TextRun({ text: enclText, font: bodyFont, size: 24 })], alignment: AlignmentType.LEFT, indent: { left: 1584, hanging: 1584 } }));
    } else {
      // Times: tab at 720 for "(1)", hanging indent for continuation
      content.push(new Paragraph({ children: [new TextRun({ text: enclText, font: bodyFont, size: 24 })], tabStops: [{ type: TabStopType.LEFT, position: 720 }], indent: { left: 1080, hanging: 1080 } }));
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

  // Helper function to handle EDMS submission after document generation
  const handleEdmsSubmission = async () => {
    if (!edmsContext.isLinked) return;

    const ssicMatch = SSICS.find(s => s.code === formData.ssic);
    const ssicTitle = ssicMatch ? ssicMatch.title : '';

    const result = await sendToEDMS(
      formData,
      vias,
      references,
      enclosures,
      copyTos,
      paragraphs,
      edmsContext,
      ssicTitle
    );

    if (result.success) {
      debugUserAction('EDMS Send Success', { edmsId: edmsContext.edmsId });
      setEdmsError(null);
    } else {
      debugUserAction('EDMS Send Failed', { error: result.error });
      setEdmsError(result.error || 'Failed to send to EDMS');
    }
    setShowReturnDialog(true);
  };

  const generateDocument = async (format: ExportFormat = 'docx') => {
    debugUserAction('Generate Document', {
      documentType: formData.documentType,
      paragraphCount: paragraphs.length,
      subject: formData.subj.substring(0, 30) + (formData.subj.length > 30 ? '...' : ''),
      format
    });

    setIsGenerating(true);
    try {
      saveLetter(); // Save the current state before generating

      // Handle PDF export
      if (format === 'pdf') {
        await downloadPDF(
          formData,
          vias,
          references,
          enclosures,
          copyTos,
          paragraphs
        );
        debugUserAction('PDF Generated Successfully', { format: 'pdf' });
        await handleEdmsSubmission();
        return;
      }

      // Handle Word export
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
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => URL.revokeObjectURL(url), 1000);

        debugUserAction('Document Generated Successfully', { filename });
        await handleEdmsSubmission();
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
      setCurrentUnitCode(selectedUnit.ruc);
      setCurrentUnitName(selectedUnit.unitName.toUpperCase());
    }
  };

  const clearUnitInfo = () => {
    setFormData(prev => ({ ...prev, line1: '', line2: '', line3: '' }));
    setCurrentUnitCode(undefined);
    setCurrentUnitName(undefined);
  };

  return (
    <div>
      {/* Font Awesome CSS */}
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

      {/* Notification Bar */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          maxWidth: '500px',
          width: '90%',
          padding: '12px 16px',
          borderRadius: '8px',
          backgroundColor: notification.type === 'error' ? '#dc3545' : notification.type === 'success' ? '#28a745' : '#17a2b8',
          color: 'white',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          animation: 'slideDown 0.3s ease-out'
        }}>
          <span style={{ flex: 1 }}>
            <i className={`fas fa-${notification.type === 'error' ? 'exclamation-circle' : notification.type === 'success' ? 'check-circle' : 'info-circle'}`} style={{ marginRight: '8px' }}></i>
            {notification.message}
          </span>
          <button
            onClick={() => setNotification(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontSize: '18px',
              padding: '0 0 0 12px'
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Sticky Action Bar */}
      <StickyActionBar
        onSaveDraft={handleSaveDraft}
        onLoadDraft={loadLetter}
        onImport={handleImport}
        onExport={handleExport}
        onClearForm={handleClearForm}
        onGenerate={generateDocument}
        isGenerating={isGenerating}
        isValid={isFormValid}
        lastSaved={lastSaved}
        savedLetters={savedLetters}
        onLoadTemplateUrl={async (url: string) => {
          try {
            const res = await fetch(resolvePublicPath(url));
            const text = await res.text();
            const result = importNLDPFile(text);
            if (!result.success || !result.data) {
              setNotification({
                message: (result.errors && result.errors[0]) || 'Invalid template',
                type: 'error'
              });
              return;
            }
            const sanitized = sanitizeImportedData(result.data);
            setFormData(prev => ({ ...prev, ...sanitized.formData }));
            setVias(sanitized.vias);
            setReferences(sanitized.references);
            setEnclosures(sanitized.enclosures);
            setCopyTos(sanitized.copyTos);
            setParagraphs(sanitized.paragraphs);

            // Run validation on loaded template data
            handleValidateSSIC(sanitized.formData.ssic || '');
            handleValidateSubject(sanitized.formData.subj || '');
            handleValidateFromTo(sanitized.formData.from || '', 'from');
            handleValidateFromTo(sanitized.formData.to || '', 'to');

            setNotification({ message: 'Template loaded successfully', type: 'success' });
          } catch (e: any) {
            setNotification({
              message: e?.message || 'Failed to load template',
              type: 'error'
            });
          }
        }}
        currentUnitCode={currentUnitCode}
        currentUnitName={currentUnitName}
      />

      <div className="naval-gradient-bg">
        <div className="main-container">
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <img src="https://yt3.googleusercontent.com/KxVUCCrrOygiNK4sof8n_pGMIjEu3w0M3eY7pFWPmD20xjBzHFjbXgtSBzor8UBuwg6pWsBI=s160-c-k-c0x00ffffff-no-rj" alt="Semper Admin Logo" style={{ width: '100px', height: '100px', margin: '0 auto', borderRadius: '50%' }} />
            <h1 className="main-title" style={{ marginBottom: '0', marginTop: '10px' }}>
              Naval Letter Formatter
            </h1>
            <p style={{ marginTop: '0', fontSize: '1.2rem', color: '#6c757d' }}>by Semper Admin</p>
            <p style={{ marginTop: '10px', fontSize: '0.85rem', color: '#9ca3af', fontStyle: 'italic', opacity: '0.8' }}>Last Updated: 20251129</p>
            {/* EDMS Link Indicator - shows when launched from EDMS */}
            {edmsContext.isLinked && (
              <div style={{ marginTop: '12px' }}>
                <EDMSLinkBadge edmsContext={edmsContext} />
              </div>
            )}
          </div>

          <DocumentTypeSection formData={formData} setFormData={setFormData} />


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
          <HeaderFieldsSection
            formData={formData}
            setFormData={setFormData}
            validation={validation}
            handleValidateSSIC={handleValidateSSIC}
            handleValidateSubject={handleValidateSubject}
            handleValidateFromTo={handleValidateFromTo}
          />

          {/* Optional Items Section */}
          <CollapsibleFormSection
            title="Optional Items"
            icon="fas fa-plus-circle"
            defaultExpanded={false}
          >
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

          </CollapsibleFormSection>

          {/* Body Paragraphs Section */}
          <ParagraphSection
            paragraphs={paragraphs}
            activeVoiceInput={activeVoiceInput}
            validateParagraphNumbering={validateParagraphNumbering}
            getUiCitation={getUiCitation}
            moveParagraphUp={moveParagraphUp}
            moveParagraphDown={moveParagraphDown}
            updateParagraphContent={updateParagraphContent}
            toggleVoiceInput={toggleVoiceInput}
            addParagraph={addParagraph}
            removeParagraph={removeParagraph}
          />

          {/* Closing Block Section */}
          <ClosingBlockSection
            formData={formData}
            setFormData={setFormData}
            copyTos={copyTos}
            setCopyTos={setCopyTos}
          />

          {/* Hidden NLDP File Manager - used by sticky action bar refs */}
          <div style={{ display: 'none' }}>
            <NLDPFileManager
              formData={formData}
              vias={vias}
              references={references}
              enclosures={enclosures}
              copyTos={copyTos}
              paragraphs={paragraphs}
              fileInputRef={importFileInputRef}
              exportButtonRef={exportButtonRef}
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

                // Re-validate fields after loading
                handleValidateSSIC(importedFormData.ssic);
                handleValidateSubject(importedFormData.subj);
                handleValidateFromTo(importedFormData.from, 'from');
                handleValidateFromTo(importedFormData.to, 'to');
              }}
            />
          </div>

          {/* Validation Summary */}
          <ValidationSummary validation={validation} />

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

      {/* EDMS Return Dialog - shown after generating when linked to EDMS */}
      <ReturnToEDMSDialog
        open={showReturnDialog}
        returnUrl={edmsContext.returnUrl}
        onClose={() => setShowReturnDialog(false)}
        edmsError={edmsError}
      />
    </div>
  );
}

// Main export with Suspense boundary for useSearchParams
export default function NavalLetterGenerator() {
  return (
    <Suspense fallback={
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#1a1a2e',
        color: '#b8860b'
      }}>
        Loading Naval Letter Formatter...
      </div>
    }>
      <NavalLetterGeneratorInner />
    </Suspense>
  );
}
