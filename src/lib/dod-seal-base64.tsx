'use client';

import { useState, useEffect } from 'react';
import { Document, Packer, Paragraph, TextRun, AlignmentType, TabStopType, Header, ImageRun, convertInchesToTwip, VerticalPositionAlign, HorizontalPositionAlign } from 'docx';
import { saveAs } from 'file-saver';

// Base64 encoded DOD seal image for document headers
export const DOD_SEAL_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAyKSURBVHic7Z17jFTVHcc/d2Z2Z3YfM7uzwC4sLw0gD0UQQbBYH1Cr1mrUmKqJaWxTm6ZJ09SmTdOkTdM0TZv0kbRN26Rp0/aP1tZaa6u1Wq3WR7WtilrfCgKCPJd97Mzuzs7O3Mf5949zZ2d2Z2YXZHaWJfeTnJx77rnn3t/93d/v/M453HsHhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEE';

interface ParagraphData {
  id: number;
  level: number;
  content: string;
}

interface FormData {
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
}

interface ValidationState {
  ssic: { isValid: boolean; message: string; };
  subj: { isValid: boolean; message: string; };
  from: { isValid: boolean; message: string; };
  to: { isValid: boolean; message: string; };
}

export default function NavalLetterGenerator() {
  const [formData, setFormData] = useState<FormData>({
    line1: '', line2: '', line3: '', ssic: '', originatorCode: '', date: '', from: '', to: '', subj: '', sig: '', delegationText: ''
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
  
  const [paragraphs, setParagraphs] = useState<ParagraphData[]>([{ id: 1, level: 1, content: '' }]);
  const [paragraphCounter, setParagraphCounter] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [structureErrors, setStructureErrors] = useState<string[]>([]);

  // Set today's date on component mount
  useEffect(() => {
    setTodaysDate();
  }, []);

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
       /^[A-Za-z\s]+ [A-Za-z\s\.]+ \d{10}\/\d{4} (USMC|USN)$/i,
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

  const handleDateChange = (value: string) => {
    const formatted = parseAndFormatDate(value);
    setFormData(prev => ({ ...prev, date: formatted }));
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

  const validateParagraphStructure = () => {
    const errors: string[] = [];
    const structure: { [key: number]: ParagraphData[] } = {};
    
    // Build structure map
    paragraphs.forEach((paragraph) => {
      if (paragraph.content.trim()) {
        if (!structure[paragraph.level]) {
          structure[paragraph.level] = [];
        }
        structure[paragraph.level].push(paragraph);
      }
    });

    // Validate naval correspondence rules
    Object.keys(structure).forEach(level => {
      const levelNum = parseInt(level);
      const levelParagraphs = structure[levelNum];
      
      if (levelParagraphs.length === 1 && levelNum > 1) {
        errors.push(`Level ${levelNum} has only one paragraph - naval format requires at least two subparagraphs`);
      }
    });

    setStructureErrors(errors);
    return errors.length === 0;
  };

  const addParagraph = (type: 'main' | 'sub' | 'same' | 'up', afterId: number) => {
    const currentParagraph = paragraphs.find(p => p.id === afterId);
    if (!currentParagraph) return;
    
    let newLevel = 1;
    switch(type) {
      case 'main': newLevel = 1; break;
      case 'same': newLevel = currentParagraph.level; break;
      case 'sub': newLevel = Math.min(currentParagraph.level + 1, 8); break;
      case 'up': newLevel = Math.max(currentParagraph.level - 1, 1); break;
    }
    
    const newCounter = paragraphCounter + 1;
    setParagraphCounter(newCounter);
    const currentIndex = paragraphs.findIndex(p => p.id === afterId);
    const newParagraphs = [...paragraphs];
    newParagraphs.splice(currentIndex + 1, 0, { id: newCounter, level: newLevel, content: '' });
    setParagraphs(newParagraphs);
    
    setTimeout(() => validateParagraphStructure(), 100);
  };

  const removeParagraph = (id: number) => {
    if (id === 1) return;
    setParagraphs(prev => prev.filter(p => p.id !== id));
    setTimeout(() => validateParagraphStructure(), 100);
  };

  const updateParagraphContent = (id: number, content: string) => {
    // Only remove non-breaking spaces and line breaks, but preserve regular spaces
    const cleanedContent = content
      .replace(/\u00A0/g, ' ')  // Replace non-breaking spaces with regular spaces
      .replace(/\u2007/g, ' ')  // Replace figure spaces with regular spaces
      .replace(/\u202F/g, ' ')  // Replace narrow non-breaking spaces with regular spaces
      .replace(/[\r\n]/g, ' '); // Replace line breaks with spaces
      // Removed: .replace(/\s+/g, ' ') and .trim() to allow regular spaces
      
    setParagraphs(prev => prev.map(p => p.id === id ? { ...p, content: cleanedContent } : p));
    setTimeout(() => validateParagraphStructure(), 100);
  };

  const moveParagraphUp = (id: number) => {
    const currentIndex = paragraphs.findIndex(p => p.id === id);
    if (currentIndex > 0) {
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

  const getLevelInfo = (level: number): { description: string; preview: string } => {
    const levelDescriptions: { [key: number]: { description: string; preview: string } } = {
      1: { description: "Main paragraphs", preview: "1., 2., 3." },
      2: { description: "Sub-paragraphs", preview: "a., b., c." },
      3: { description: "Sub-sub paragraphs", preview: "(1), (2), (3)" },
      4: { description: "Sub-sub-sub paragraphs", preview: "(a), (b), (c)" },
      5: { description: "Fourth level (underlined)", preview: "1̲., 2̲., 3̲." },
      6: { description: "Fifth level (underlined)", preview: "a̲., b̲., c̲." },
      7: { description: "Sixth level (underlined)", preview: "(1̲), (2̲), (3̲)" },
      8: { description: "Seventh level (underlined)", preview: "(a̲), (b̲), (c̲)" }
    };
    return levelDescriptions[level] || { description: "Unknown level", preview: "?" };
  };

  const updateDelegationType = (value: string) => {
    let delegationText = '';
    switch(value) {
      case 'by_direction': delegationText = 'By direction'; break;
      case 'acting_commander': delegationText = 'Acting'; break;
      case 'acting_title': delegationText = 'Acting'; break;
      case 'signing_for': delegationText = 'For'; break;
    }
    setFormData(prev => ({ ...prev, delegationText }));
  };

  const generateDocument = async () => {
    setIsGenerating(true);
    try {
      const sealResponse = await fetch("https://placehold.co/150x150.png");
      const sealBuffer = await sealResponse.arrayBuffer();


      // Validate structure before generating
      const isValidStructure = validateParagraphStructure();
      if (!isValidStructure) {
        const proceed = window.confirm(
          'Your document has naval correspondence format violations. ' +
          'Naval regulations require that subparagraphs appear in pairs (if there is a paragraph 1a, there must be a paragraph 1b). ' +
          '\n\nDo you want to generate the document anyway? ' +
          '\n\nClick Cancel to fix the formatting first, or OK to proceed with violations.'
        );
        if (!proceed) {
          setIsGenerating(false);
          return;
        }
      }

      const content = [];
      
      // Header - CENTERED
      content.push(new Paragraph({
        children: [new TextRun({
          text: "UNITED STATES MARINE CORPS",
          bold: true,
          font: "Times New Roman",
          size: 20,
        })],
        alignment: AlignmentType.CENTER
      }));
      
      // Unit lines - CENTERED
      if (formData.line1) {
        content.push(new Paragraph({
          children: [new TextRun({
            text: formData.line1,
            font: "Times New Roman",
            size: 16,
          })],
          alignment: AlignmentType.CENTER
        }));
      }
      
      if (formData.line2) {
        content.push(new Paragraph({
          children: [new TextRun({
            text: formData.line2,
            font: "Times New Roman",
            size: 16,
          })],
          alignment: AlignmentType.CENTER
        }));
      }
      
      if (formData.line3) {
        content.push(new Paragraph({
          children: [new TextRun({
            text: formData.line3,
            font: "Times New Roman",
            size: 16,
          })],
          alignment: AlignmentType.CENTER
        }));
      }
      
      // Single empty line after address lines, before SSIC
      content.push(new Paragraph({ text: "" }));

      // Sender symbols at 5.75 inches
      content.push(new Paragraph({
        children: [new TextRun({
          text: formData.ssic || "",
          font: "Times New Roman",
          size: 24
        })],
        alignment: AlignmentType.LEFT,
        indent: { left: 8280 }
      }));

      content.push(new Paragraph({
        children: [new TextRun({
          text: formData.originatorCode || "",
          font: "Times New Roman",
          size: 24
        })],
        alignment: AlignmentType.LEFT,
        indent: { left: 8280 }
      }));

      content.push(new Paragraph({
        children: [new TextRun({
          text: formData.date || "",
          font: "Times New Roman",
          size: 24
        })],
        alignment: AlignmentType.LEFT,
        indent: { left: 8280 }
      }));

      content.push(new Paragraph({ text: "" }));

      // From/To section
      content.push(new Paragraph({
        children: [new TextRun({
          text: "From:\t" + formData.from,
          font: "Times New Roman",
          size: 24
        })],
        tabStops: [{ type: TabStopType.LEFT, position: 720 }],
      }));

      content.push(new Paragraph({
        children: [new TextRun({
          text: "To:\t" + formData.to,
          font: "Times New Roman",
          size: 24
        })],
        tabStops: [{ type: TabStopType.LEFT, position: 720 }],
      }));

      // Via section
      const viasWithContent = vias.filter(via => via.trim());
      for (let i = 0; i < viasWithContent.length; i++) {
        let viaText;
        if (viasWithContent.length === 1) {
          viaText = "Via:\t" + viasWithContent[i];
        } else {
          viaText = i === 0 ? "Via:\t(" + (i+1) + ")\t" + viasWithContent[i] : "\t(" + (i+1) + ")\t" + viasWithContent[i];
        }
        
        content.push(new Paragraph({
          children: [new TextRun({
            text: viaText,
            font: "Times New Roman",
            size: 24
          })],
          tabStops: [
            { type: TabStopType.LEFT, position: 720 }, 
            { type: TabStopType.LEFT, position: 1046 }
          ],
        }));
      }

      content.push(new Paragraph({ text: "" }));

      // Subject
      content.push(new Paragraph({
        children: [new TextRun({
          text: "Subj:\t" + formData.subj.toUpperCase(),
          font: "Times New Roman",
          size: 24
        })],
        tabStops: [{ type: TabStopType.LEFT, position: 720 }],
      }));

      content.push(new Paragraph({ text: "" }));

      // References
      const refsWithContent = references.filter(ref => ref.trim());
      for (let i = 0; i < refsWithContent.length; i++) {
        const refLetter = String.fromCharCode(97 + i);
        const refText = i === 0 ? "Ref:\t(" + refLetter + ")\t" + refsWithContent[i] : "\t(" + refLetter + ")\t" + refsWithContent[i];
        content.push(new Paragraph({
          children: [new TextRun({
            text: refText,
            font: "Times New Roman",
            size: 24
          })],
          tabStops: [
            { type: TabStopType.LEFT, position: 720 },
            { type: TabStopType.LEFT, position: 1046 }
          ],
        }));
      }

      // Enclosures
      const enclsWithContent = enclosures.filter(encl => encl.trim());
      if (refsWithContent.length > 0 && enclsWithContent.length > 0) {
        content.push(new Paragraph({ text: "" }));
      }

      for (let i = 0; i < enclsWithContent.length; i++) {
        const enclText = i === 0 ? "Encl:\t(" + (i+1) + ")\t" + enclsWithContent[i] : "\t(" + (i+1) + ")\t" + enclsWithContent[i];
        content.push(new Paragraph({
          children: [new TextRun({
            text: enclText,
            font: "Times New Roman",
            size: 24
          })],
          tabStops: [
            { type: TabStopType.LEFT, position: 720 },
            { type: TabStopType.LEFT, position: 1046 }
          ],
        }));
      }

      content.push(new Paragraph({ text: "" }));

      // Body paragraphs
      let counters: { [key: string]: number } = { 
        level1: 0, level2: 0, level3: 0, level4: 0,
        level5: 0, level6: 0, level7: 0, level8: 0 
      };

      for (const paragraph of paragraphs) {
        if (paragraph.content.trim()) {
          const level = paragraph.level;
          let prefix = "";
          let indent = 0;
          let hanging = 0;

          // Reset counters for deeper levels
          for (let j = level + 1; j <= 8; j++) {
            counters[`level${j}`] = 0;
          }

          switch (level) {
            case 1: // 1.
                counters.level1++;
                prefix = `${counters.level1}.`;
                indent = 0; 
                hanging = 0;
                break;
            case 2: // a.
                counters.level2++;
                prefix = `${String.fromCharCode(96 + counters.level2)}.`;
                indent = 360; 
                hanging = 360;
                break;
            case 3: // (1)
                counters.level3++;
                prefix = `(${counters.level3})`;
                indent = 720;
                hanging = 360;
                break;
            case 4: // (a)
                counters.level4++;
                prefix = `(${String.fromCharCode(96 + counters.level4)})`;
                indent = 1080;
                hanging = 360;
                break;
            case 5: // 1)
                counters.level5++;
                prefix = `${counters.level5})`;
                indent = 1440; 
                hanging = 360;
                break;
            case 6: // a)
                counters.level6++;
                prefix = `${String.fromCharCode(96 + counters.level6)})`;
                indent = 1800;
                hanging = 360;
                break;
            case 7: // (a)
                counters.level7++;
                prefix = `(${String.fromCharCode(96 + counters.level7)})`;
                indent = 2160; 
                hanging = 360;
                break;
            case 8: // i.
                counters.level8++;
                const toRoman = (num: number) => {
                    const roman: { [key: string]: number } = {M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90, L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1};
                    let str = '';
                    for (let i of Object.keys(roman)) {
                        let q = Math.floor(num / roman[i]);
                        num -= q * roman[i];
                        str += i.repeat(q);
                    }
                    return str.toLowerCase();
                };
                prefix = `${toRoman(counters.level8)}.`;
                indent = 2520;
                hanging = 360;
                break;
          }

          // Create paragraph with proper formatting
          if (level >= 5 && level <= 8) { // Assuming old levels 5-8 logic is no longer needed with new spec
             content.push(new Paragraph({
              children: [new TextRun({
                text: prefix + "\t" + paragraph.content,
                font: "Times New Roman",
                size: 24
              })],
              tabStops: [{ type: TabStopType.LEFT, position: indent }],
              indent: { left: indent, hanging: hanging },
              spacing: { after: 120 }
            }));
          } else if (level >= 5) {
            // For levels 5-8, underline only the number/letter
            let textRuns = [];
            
            if (level === 5 || level === 6) {
              const numberOrLetter = level === 5 ? counters.level5.toString() : String.fromCharCode(96 + counters.level6);
              textRuns.push(
                new TextRun({
                  text: numberOrLetter,
                  font: "Times New Roman",
                  size: 24,
                  underline: {},
                }),
                new TextRun({
                  text: ". " + paragraph.content,
                  font: "Times New Roman",
                  size: 24
                })
              );
            } else {
              const numberOrLetter = level === 7 ? counters.level7.toString() : String.fromCharCode(96 + counters.level8);
              textRuns.push(
                new TextRun({
                  text: "(",
                  font: "Times New Roman",
                  size: 24
                }),
                new TextRun({
                  text: numberOrLetter,
                  font: "Times New Roman",
                  size: 24,
                  underline: {}
                }),
                new TextRun({
                  text: ") " + paragraph.content,
                  font: "Times New Roman",
                  size: 24
                })
              );
            }
            
            content.push(new Paragraph({
              children: textRuns,
              alignment: AlignmentType.LEFT,
              indent: { left: indent, hanging: hanging },
              spacing: { after: 120 }
            }));
          } else {
            content.push(new Paragraph({
              children: [new TextRun({
                text: prefix + "\t" + paragraph.content,
                font: "Times New Roman",
                size: 24
              })],
              tabStops: [{ type: TabStopType.LEFT, position: indent }],
              indent: { left: indent, hanging: hanging },
              spacing: { after: 120 }
            }));
          }
        }
      }

      // Signature
      if (formData.sig) {
        content.push(new Paragraph({ text: "" }));
        content.push(new Paragraph({ text: "" }));
        
        content.push(new Paragraph({
          children: [new TextRun({
            text: formData.sig,
            font: "Times New Roman",
            size: 24
          })],
          alignment: AlignmentType.LEFT,
          indent: { left: 4680 }
        }));
        
        if (formData.delegationText) {
          content.push(new Paragraph({
            children: [new TextRun({
              text: formData.delegationText,
              font: "Times New Roman",
              size: 24
            })],
            alignment: AlignmentType.LEFT,
            indent: { left: 4680 }
          }));
        }
      }

      // Copy to
      const copiesWithContent = copyTos.filter(copy => copy.trim());
      if (copiesWithContent.length > 0) {
        content.push(new Paragraph({ text: "" }));
        content.push(new Paragraph({
          children: [new TextRun({
            text: "Copy to:",
            font: "Times New Roman",
            size: 24
          })],
          alignment: AlignmentType.LEFT
        }));
        
        for (const copy of copiesWithContent) {
          content.push(new Paragraph({
            children: [new TextRun({
              text: copy,
              font: "Times New Roman",
              size: 24
            })],
            indent: { left: 720 }
          }));
        }
      }

      // Create document
      const doc = new Document({
        creator: "Naval Letter Generator",
        title: "Naval Letter",
        description: "Generated Naval Letter Format",
        sections: [{
          properties: {
            page: {
              margin: {
                top: 1440,
                bottom: 1440,
                right: 1440,
                left: 1440,
              },
              size: {
                width: 12240,
                height: 15840,
              },
            }
          },
          headers: {
            default: new Header({
              children: [
                new Paragraph({
                  children: [
                    new ImageRun({
                      data: sealBuffer,
                      transformation: {
                        width: convertInchesToTwip(0.5),
                        height: convertInchesToTwip(0.5),
                      },
                      floating: {
                        horizontalPosition: {
                          align: HorizontalPositionAlign.LEFT,
                          offset: convertInchesToTwip(0.5),
                        },
                        verticalPosition: {
                          align: VerticalPositionAlign.TOP,
                          offset: convertInchesToTwip(0.5),
                        },
                      },
                    }),
                  ],
                }),
              ],
            }),
          },
          children: content
        }]
      });

      // Generate and save
      const filename = (formData.subj || "NavalLetter") + ".docx";
      const buffer = await Packer.toBlob(doc);
      saveAs(buffer, filename);
      
    } catch (error) {
      console.error("Error generating document:", error);
      alert("Error generating document: " + (error as Error).message);
    } finally {
      setIsGenerating(false);
    }
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
          margin: 20px auto;
          padding: 30px;
          max-width: 1200px;
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
          margin-bottom: 1rem;
        }
        
        .input-group-text {
          background: linear-gradient(45deg, #b8860b, #ffd700);
          color: white;
          border: none;
          font-weight: 600;
          white-space: nowrap;
          border-radius: 8px 0 0 8px;
        }
        
        .form-control {
          border: 2px solid #e9ecef;
          border-radius: 0 8px 8px 0;
          padding: 12px;
          transition: all 0.3s ease;
        }
        
        .form-control:focus {
          border-color: #b8860b;
          box-shadow: 0 0 0 0.2rem rgba(184, 134, 11, 0.25);
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
        }
        
        .btn-primary:hover {
          background: linear-gradient(45deg, #996c09, #e6c200);
          transform: translateY(-2px);
        }
        
        .btn-success {
          background: linear-gradient(45deg, #28a745, #20c997);
          color: white;
        }
        
        .btn-success:hover {
          background: linear-gradient(45deg, #218838, #1da88a);
          transform: translateY(-2px);
        }
        
        .btn-danger {
          background: linear-gradient(45deg, #dc3545, #c82333);
          color: white;
        }
        
        .btn-danger:hover {
          background: linear-gradient(45deg, #c82333, #a71e2a);
          transform: translateY(-2px);
        }
        
        .generate-btn {
          background: linear-gradient(45deg, #28a745, #20c997);
          color: white;
          border: none;
          padding: 15px 30px;
          font-size: 1.2rem;
          font-weight: bold;
          border-radius: 12px;
          display: block;
          margin: 30px auto;
          min-width: 250px;
          transition: all 0.3s ease;
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
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: bold;
          margin-right: 10px;
        }
        
        .paragraph-number-preview {
          font-family: monospace;
          color: #666;
          font-size: 0.9rem;
          font-weight: bold;
        }
        
        .btn-smart-main { 
          background: #007bff; 
          color: white; 
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
          margin-right: 8px;
          margin-bottom: 4px;
        }
        .btn-smart-up { 
          background: #17a2b8; 
          color: white; 
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
        
        @media (max-width: 768px) {
          .main-container {
            margin: 10px;
            padding: 20px;
          }
          .radio-group {
            flex-direction: column;
            gap: 10px;
          }
        }
      `}</style>

      <div className="naval-gradient-bg">
        <div className="main-container">
          <h1 className="main-title">
            <i className="fas fa-file-alt" style={{ marginRight: '12px' }}></i>
            Naval Letter Format Generator
          </h1>

          {/* Unit Information Section */}
          <div className="form-section">
            <div className="section-legend">
              <i className="fas fa-building" style={{ marginRight: '8px' }}></i>
              Unit Information
            </div>
            
            <div className="input-group">
              <span className="input-group-text">
                <i className="fas fa-building" style={{ marginRight: '8px' }}></i>
                Unit Name:
              </span>
              <input 
                className="form-control" 
                type="text" 
                placeholder="Enter your unit name (e.g., 1st Marine Division)"
                value={formData.line1}
                onChange={(e) => setFormData(prev => ({ ...prev, line1: e.target.value }))}
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
                placeholder="Enter street address or base name"
                value={formData.line2}
                onChange={(e) => setFormData(prev => ({ ...prev, line2: e.target.value }))}
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
                placeholder="Enter city, state, zip code"
                value={formData.line3}
                onChange={(e) => setFormData(prev => ({ ...prev, line3: e.target.value }))}
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
              <span className="input-group-text">
                <i className="fas fa-hashtag" style={{ marginRight: '8px' }}></i>
                Enter The SSIC:
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
                Enter The Originator's Code:
              </span>
              <input 
                className="form-control" 
                type="text" 
                placeholder="e.g., G-1, G-3, S-1, S-4, CO, XO, CG, OPS, MRA, MMSB-20, RA, SJA, ADJ, OPSO"
                value={formData.originatorCode}
                onChange={(e) => setFormData(prev => ({ ...prev, originatorCode: e.target.value }))}
              />
            </div>
            
            <div className="input-group">
              <span className="input-group-text">
                <i className="fas fa-calendar-alt" style={{ marginRight: '8px' }}></i>
                Enter The Date:
              </span>
              <input 
                className="form-control" 
                type="text" 
                placeholder="e.g., 8 Jul 25, 2025-07-08, 07/08/2025, 20250708"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                onBlur={(e) => handleDateChange(e.target.value)}
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
                Enter The From:
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
              <div className={`feedback-message ${validation.from.isValid ? 'text-success' : 'text-info'}`}>
                <i className={`fas ${validation.from.isValid ? 'fa-check' : 'fa-info-circle'}`} style={{ marginRight: '4px' }}></i>
                {validation.from.message}
              </div>
            )}

            <div className="input-group">
              <span className="input-group-text">
                <i className="fas fa-users" style={{ marginRight: '8px' }}></i>
                Enter The To:
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
              <div className={`feedback-message ${validation.to.isValid ? 'text-success' : 'text-info'}`}>
                <i className={`fas ${validation.to.isValid ? 'fa-check' : 'fa-info-circle'}`} style={{ marginRight: '4px' }}></i>
                {validation.to.message}
              </div>
            )}
            
            <div className="input-group">
              <span className="input-group-text">
                <i className="fas fa-book" style={{ marginRight: '8px' }}></i>
                Enter The Subject (ALWAYS IN ALL CAPS):
              </span>
              <input 
                className={`form-control ${validation.subj.isValid ? 'is-valid' : formData.subj && !validation.subj.isValid ? 'is-invalid' : ''}`}
                type="text" 
                placeholder="SUBJECT LINE IN ALL CAPS"
                value={formData.subj}
                onChange={(e) => {
                  const value = autoUppercase(e.target.value);
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
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                <i className="fas fa-route" style={{ marginRight: '8px' }}></i>
                Do you have a VIA?
              </label>
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
                    Enter A Via:
                  </label>
                  {vias.map((via, index) => (
                    <div key={index} className="input-group">
                      <input 
                        className="form-control" 
                        type="text" 
                        placeholder="Enter via information"
                        value={via}
                        onChange={(e) => updateItem(index, e.target.value, setVias)}
                      />
                      {index === vias.length - 1 ? (
                        <button 
                          className="btn btn-primary" 
                          type="button" 
                          onClick={() => addItem(setVias)}
                        >
                          <i className="fas fa-plus" style={{ marginRight: '4px' }}></i>
                          Add Via
                        </button>
                      ) : (
                        <button 
                          className="btn btn-danger" 
                          type="button" 
                          onClick={() => removeItem(index, setVias)}
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
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                <i className="fas fa-bookmark" style={{ marginRight: '8px' }}></i>
                Do you have a REFERENCE?
              </label>
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
                    onChange={() => setShowRef(false)}
                    style={{ marginRight: '8px', transform: 'scale(1.25)' }}
                  />
                  <span style={{ fontSize: '1.1rem' }}>No</span>
                </label>
              </div>

              {showRef && (
                <div className="dynamic-section">
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>
                    <i className="fas fa-bookmark" style={{ marginRight: '8px' }}></i>
                    Enter A Reference:
                  </label>
                  {references.map((ref, index) => (
                    <div key={index} className="input-group">
                      <input 
                        className="form-control" 
                        type="text" 
                        placeholder="REFERENCE IN ALL CAPS"
                        value={ref}
                        onChange={(e) => updateItem(index, e.target.value, setReferences)}
                      />
                      {index === references.length - 1 ? (
                        <button 
                          className="btn btn-primary" 
                          type="button" 
                          onClick={() => addItem(setReferences)}
                        >
                          <i className="fas fa-plus" style={{ marginRight: '4px' }}></i>
                          Add Reference
                        </button>
                      ) : (
                        <button 
                          className="btn btn-danger" 
                          type="button" 
                          onClick={() => removeItem(index, setReferences)}
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
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                <i className="fas fa-paperclip" style={{ marginRight: '8px' }}></i>
                Do you have an ENCLOSURE?
              </label>
              <div className="radio-group">
                <label style={{ display: 'flex', alignItems: 'center' }}>
                  <input 
                    type="radio" 
                    name="ifEncl" 
                    value="yes" 
                    checked={showEncl}
                    onChange={() => setShowEncl(true)}
                    style={{ marginRight: '8px', transform: 'scale(1.25)' }}
                  />
                  <span style={{ fontSize: '1.1rem' }}>Yes</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center' }}>
                  <input 
                    type="radio" 
                    name="ifEncl" 
                    value="no" 
                    checked={!showEncl}
                    onChange={() => setShowEncl(false)}
                    style={{ marginRight: '8px', transform: 'scale(1.25)' }}
                  />
                  <span style={{ fontSize: '1.1rem' }}>No</span>
                </label>
              </div>

              {showEncl && (
                <div className="dynamic-section">
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>
                    <i className="fas fa-paperclip" style={{ marginRight: '8px' }}></i>
                    Enter An Enclosure:
                  </label>
                  {enclosures.map((encl, index) => (
                    <div key={index} className="input-group">
                      <input 
                        className="form-control" 
                        type="text" 
                        placeholder="Enter enclosure information"
                        value={encl}
                        onChange={(e) => updateItem(index, e.target.value, setEnclosures)}
                      />
                      {index === enclosures.length - 1 ? (
                        <button 
                          className="btn btn-primary" 
                          type="button" 
                          onClick={() => addItem(setEnclosures)}
                        >
                          <i className="fas fa-plus" style={{ marginRight: '4px' }}></i>
                          Add Enclosure
                        </button>
                      ) : (
                        <button 
                          className="btn btn-danger" 
                          type="button" 
                          onClick={() => removeItem(index, setEnclosures)}
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

          {/* Body Paragraphs Section */}
          <div className="form-section">
            <div className="section-legend">
              <i className="fas fa-paragraph" style={{ marginRight: '8px' }}></i>
              Body Paragraphs
            </div>
            
            <div>
              {paragraphs.map((paragraph, index) => {
                const levelInfo = getLevelInfo(paragraph.level);
                const hasStructureError = structureErrors.some(error => error.includes(`Level ${paragraph.level}`));
                
                return (
                  <div 
                    key={paragraph.id} 
                    className={`paragraph-container ${hasStructureError ? 'invalid-structure' : ''}`}
                    data-level={paragraph.level}
                  >
                    <div className="paragraph-header">
                      <div>
                        <span className="paragraph-level-badge">Level {paragraph.level}</span>
                        <span className="paragraph-number-preview">{levelInfo.preview.split(',')[0]}</span>
                        <small style={{ color: '#666', marginLeft: '8px' }}>{levelInfo.description}</small>
                      </div>
                      <div>
                        <button 
                          className="btn btn-sm" 
                          style={{ background: '#f8f9fa', border: '1px solid #dee2e6', marginRight: '4px' }}
                          onClick={() => moveParagraphUp(paragraph.id)} 
                          disabled={index === 0}
                          title="Move Up"
                        >
                          ↑
                        </button>
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
                    
                    <textarea 
                      className="form-control" 
                      rows={4}
                      placeholder="Enter your paragraph content here..."
                      value={paragraph.content}
                      onChange={(e) => updateParagraphContent(paragraph.id, e.target.value)}
                      style={{ marginBottom: '12px' }}
                    />
                    
                    {hasStructureError && (
                      <div className="structure-error">
                        <i className="fas fa-exclamation-triangle" style={{ marginRight: '4px' }}></i>
                        <small>
                          Naval format error: If there is a subparagraph at this level, there must be at least two. 
                          Add another paragraph at the same level or promote this to a higher level.
                        </small>
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
                      <button 
                        className="btn btn-smart-same btn-sm" 
                        onClick={() => addParagraph('same', paragraph.id)}
                      >
                        Same
                      </button>
                      {paragraph.level > 1 && (
                        <button 
                          className="btn btn-smart-up btn-sm" 
                          onClick={() => addParagraph('up', paragraph.id)}
                        >
                          One Up
                        </button>
                      )}
                      {paragraph.id !== 1 && (
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
            
            {structureErrors.length > 0 && (
              <div className="validation-summary">
                <h6>
                  <i className="fas fa-exclamation-triangle" style={{ marginRight: '4px' }}></i>
                  Naval Correspondence Format Violations
                </h6>
                <p>
                  <strong>Per SECNAV M-5216.5, Section 7-12:</strong> "If there is a paragraph 1a, there must be a paragraph 1b; if there is a paragraph 1a(1), there must be a paragraph 1a(2), etc."
                </p>
                <ul style={{ marginBottom: '0' }}>
                  {structureErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
                <small style={{ display: 'block', marginTop: '8px', color: '#6c757d' }}>
                  <strong>Solution:</strong> Add another paragraph at the same level, or promote single subparagraphs to a higher level.
                </small>
              </div>
            )}
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
                Enter The Signature:
              </span>
              <input 
                className="form-control" 
                type="text" 
                placeholder="F. M. LASTNAME"
                value={formData.sig}
                onChange={(e) => setFormData(prev => ({ ...prev, sig: e.target.value }))}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                <i className="fas fa-user-tie" style={{ marginRight: '8px' }}></i>
                Delegation of Signature Authority
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
                Do you have Copy To?
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
                    Enter An Addressee:
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
                          Add Copy To
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
              DoD Seal automatically included • Format compliant with SECNAV M-5216.5
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