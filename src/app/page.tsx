'use client';

import { useState, useEffect, useCallback } from 'react';
import { Document, Packer, Paragraph, TextRun, AlignmentType, TabStopType, Header, ImageRun, VerticalPositionRelativeFrom, HorizontalPositionRelativeFrom, Footer, PageNumber, IParagraphOptions } from 'docx';
import { saveAs } from 'file-saver';
import { fetchImageAsBase64 } from '@/lib/fetch-image';
import { DOC_SETTINGS } from '@/lib/doc-settings';
import { createFormattedParagraph } from '@/lib/paragraph-formatter';
import { UNITS, Unit } from '@/lib/units';
import { SSICS } from '@/lib/ssic';
import { Combobox } from '@/components/ui/SimpleCombobox';

interface ParagraphData {
  id: number;
  level: number;
  content: string;
  acronymError?: string;
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

// Simple View Counter Component
function SimpleViewCounter() {
  const [stats, setStats] = useState({ views: 0, docs: 0, loading: true });

  useEffect(() => {
    // Increment page view and get stats
    const updateStats = async () => {
      try {
        // Get current views
        const viewRes = await fetch('https://api.countapi.xyz/hit/naval-letter-formatter/views');
        const viewData = await viewRes.json();
        
        // Get current documents
        const docRes = await fetch('https://api.countapi.xyz/get/naval-letter-formatter/documents');
        const docData = await docRes.json();
        
        setStats({
          views: viewData.value || 0,
          docs: docData.value || 0,
          loading: false
        });
      } catch (error) {
        setStats({ views: 0, docs: 0, loading: false });
      }
    };
    
    updateStats();
  }, []);

  if (stats.loading) {
    return (
      <div style={{
        background: 'linear-gradient(45deg, #b8860b, #ffd700)',
        color: 'white',
        padding: '8px 16px',
        borderRadius: '20px',
        display: 'inline-block',
        fontSize: '14px',
        fontWeight: 'bold',
        marginTop: '10px',
        opacity: 0.7
      }}>
        <i className="fas fa-spinner fa-spin" style={{ marginRight: '6px' }}></i>
        Loading stats...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '10px', flexWrap: 'wrap' }}>
      <div style={{
        background: 'linear-gradient(45deg, #b8860b, #ffd700)',
        color: 'white',
        padding: '8px 14px',
        borderRadius: '16px',
        fontSize: '13px',
        fontWeight: 'bold',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <i className="fas fa-eye" style={{ marginRight: '6px' }}></i>
        {stats.views.toLocaleString()} views
      </div>
      
      <div style={{
        background: 'linear-gradient(45deg, #28a745, #20c997)',
        color: 'white',
        padding: '8px 14px',
        borderRadius: '16px',
        fontSize: '13px',
        fontWeight: 'bold',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <i className="fas fa-file-word" style={{ marginRight: '6px' }}></i>
        {stats.docs.toLocaleString()} letters
      </div>
      
      <div style={{
        background: 'linear-gradient(45deg, #dc3545, #c82333)',
        color: 'white',
        padding: '8px 14px',
        borderRadius: '16px',
        fontSize: '13px',
        fontWeight: 'bold',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <i className="fas fa-users" style={{ marginRight: '6px' }}></i>
        {Math.floor(stats.views * 0.7).toLocaleString()} Marines
      </div>
    </div>
  );
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
  
  const [paragraphs, setParagraphs] = useState<ParagraphData[]>([{ id: 1, level: 1, content: '', acronymError: '' }]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedLetters, setSavedLetters] = useState<SavedLetter[]>([]);
  const [viewCount, setViewCount] = useState<number>(0);
  const [docCount, setDocCount] = useState<number>(0);

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
    const newLetter: SavedLetter = {
      ...formData,
      id: new Date().toISOString(),
      savedAt: new Date().toLocaleString(),
      vias,
      references,
      enclosures,
      copyTos,
      paragraphs,
    };

    const updatedLetters = [newLetter, ...savedLetters].slice(0, 10);
    setSavedLetters(updatedLetters);
    localStorage.setItem('navalLetters', JSON.stringify(updatedLetters));
  };
  
  const loadLetter = (letterId: string) => {
    const letterToLoad = savedLetters.find(l => l.id === letterId);
    if (letterToLoad) {
      setFormData({
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
      });
      setVias(letterToLoad.vias);
      setReferences(letterToLoad.references);
      setEnclosures(letterToLoad.enclosures);
      setCopyTos(letterToLoad.copyTos);
      setParagraphs(letterToLoad.paragraphs);
      
      setShowVia(letterToLoad.vias.some(v => v.trim() !== ''));
      setShowRef(letterToLoad.references.some(r => r.trim() !== ''));
      setShowEncl(letterToLoad.enclosures.some(e => e.trim() !== ''));
      setShowCopy(letterToLoad.copyTos.some(c => c.trim() !== ''));
      setShowDelegation(!!letterToLoad.delegationText);

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
    
    const navalPattern = /^\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{2}$/i;
    if (navalPattern.test(dateString)) {
      return dateString;
    }

    let date: Date | null = null;

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
      return dateString;
    }

    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear().toString().slice(-2);
    return `${day} ${month} ${year}`;
  };

  const handleDateChange = (value: string) => {
    const formattedDate = parseAndFormatDate(value);
    setFormData(prev => ({ ...prev, date: formattedDate }));
  };

  const autoUppercase = (value: string) => value.toUpperCase();
  const numbersOnly = (value: string) => value.replace(/\D/g, '');

  const addItem = (setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter(prev => [...prev, '']);
  };

  const removeItem = (index: number, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter(prev => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, value: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter(prev => prev.map((item, i) => i === index ? value : item));
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
    
    const newId = (paragraphs.length > 0 ? Math.max(...paragraphs.map(p => p.id)) : 0) + 1;
    const currentIndex = paragraphs.findIndex(p => p.id === afterId);
    const newParagraphs = [...paragraphs];
    newParagraphs.splice(currentIndex + 1, 0, { id: newId, level: newLevel, content: '' });
    setParagraphs(newParagraphs);
  };

  const removeParagraph = (id: number) => {
    if (paragraphs.length <= 1) {
       if (paragraphs[0].id === id) {
           updateParagraphContent(id, '');
           return;
       }
    }
    setParagraphs(prev => prev.filter(p => p.id !== id));
  };
  
  const validateAcronyms = useCallback((allParagraphs: ParagraphData[]) => {
    const fullText = allParagraphs.map(p => p.content).join('\n');
    const definedAcronyms = new Set<string>();
    
    const acronymDefinitionRegex = /\b[A-Za-z\s]+?\s+\(([A-Z]{2,})\)/g;
    
    let match;
    while ((match = acronymDefinitionRegex.exec(fullText)) !== null) {
        definedAcronyms.add(match[1]);
    }

    const globallyDefined = new Set<string>();
    const finalParagraphs = allParagraphs.map(p => {
        let error = '';
        const potentialAcronyms = p.content.match(/\b[A-Z]{2,}\b/g) || [];

        for (const acronym of potentialAcronyms) {
            const isDefined = globallyDefined.has(acronym);
            const definitionPattern = new RegExp(`\\b([A-Za-z][a-z]+(?:\\s[A-Za-z][a-z]+)*)\\s*\\(\\s*${acronym}\\s*\\)`);
            const isDefiningNow = definitionPattern.test(p.content);

            if (!isDefined && !isDefiningNow) {
                 error = `Acronym "${acronym}" used without being defined first. Please define it as "Full Name (${acronym})".`;
                 break;
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
    const newParagraphs = paragraphs.map(p => p.id === id ? { ...p, content } : p)
    setParagraphs(newParagraphs);
    validateAcronyms(newParagraphs);
  };

  const moveParagraphUp = (id: number) => {
    const currentIndex = paragraphs.findIndex(p => p.id === id);
    if (currentIndex > 0) {
      const currentPara = paragraphs[currentIndex];
      const paraAbove = paragraphs[currentIndex - 1];

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
    switch(value) {
      case 'by_direction': delegationText = 'By direction'; break;
      case 'acting_commander': delegationText = 'Acting'; break;
      case 'acting_title': delegationText = 'Acting'; break;
      case 'signing_for': delegationText = 'For'; break;
    }
    setFormData(prev => ({ ...prev, delegationText }));
  };

  const generateCitationForUI = (paragraph: ParagraphData, index: number, allParagraphs: ParagraphData[]) => {
    const { level } = paragraph;
    
    let listStartIndex = 0;
    if (level > 1) {
        for (let i = index - 1; i >= 0; i--) {
            if (allParagraphs[i].level < level) {
                listStartIndex = i + 1;
                break;
            }
        }
    }

    let count = 0;
    for (let i = listStartIndex; i <= index; i++) {
        const p = allParagraphs[i];
        if (p.level === level) {
             if (p.content.trim() || p.id === paragraph.id) {
                count++;
            }
        }
    }
    
    if (count === 0) count = 1;

    let citation = '';
    switch (level) {
        case 1: citation = `${count}.`; break;
        case 2: citation = `${String.fromCharCode(96 + count)}.`; break;
        case 3: citation = `(${count})`; break;
        case 4: citation = `(${String.fromCharCode(96 + count)})`; break;
        case 5: citation = `${count}.`; break; 
        case 6: citation = `${String.fromCharCode(96 + count)}.`; break;
        case 7: citation = `(${count})`; break;
        case 8: citation = `(${String.fromCharCode(96 + count)})`; break;
        default: citation = '';
    }

    return citation;
  };

  const generateDocument = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    
    try {
      let sealBuffer: Buffer | null = null;
      try {
        const sealBase64 = await fetchImageAsBase64('https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/EGA_%28Eagle%2C_Globe%2C_and_Anchor%29_emblem.svg/512px-EGA_%28Eagle%2C_Globe%2C_and_Anchor%29_emblem.svg.png');
        sealBuffer = Buffer.from(sealBase64, 'base64');
      } catch (imgError) {
        console.warn("Could not load Marine Corps seal image:", imgError);
      }

      const allNonEmptyReferences = references.filter(ref => ref.trim() !== '');
      const allNonEmptyEnclosures = enclosures.filter(encl => encl.trim() !== '');
      const allNonEmptyVias = vias.filter(via => via.trim() !== '');
      const allNonEmptyCopyTos = copyTos.filter(copy => copy.trim() !== '');

      const content: Paragraph[] = [];
      const headerParagraphs: Paragraph[] = [];

      const headerFormattedLines = splitSubject(formData.subj, 60);

      if (headerFormattedLines.length === 1) {
        headerParagraphs.push(new Paragraph({
            children: [
                new TextRun({ text: "Subj:\t", font: "Times New Roman", size: 24 }),
                new TextRun({ text: headerFormattedLines[0], font: "Times New Roman", size: 24 }),
            ],
            tabStops: [{ type: TabStopType.LEFT, position: 720 }],
        }));
      } else if (headerFormattedLines.length === 0) {
        headerParagraphs.push(new Paragraph({
            children: [ new TextRun({ text: "Subj:\t", font: "Times New Roman", size: 24 }) ],
            tabStops: [{ type: TabStopType.LEFT, position: 720 }],
        }));
      } else {
        const firstLineOptions: IParagraphOptions = {
            children: [
                new TextRun({ text: "Subj:\t", font: "Times New Roman", size: 24 }),
                new TextRun({ text: headerFormattedLines[0], font: "Times New Roman", size: 24 }),
            ],
            tabStops: [{ type: TabStopType.LEFT, position: 720 }],
        };
        headerParagraphs.push(new Paragraph(firstLineOptions));

        for (let i = 1; i < headerFormattedLines.length; i++) {
            headerParagraphs.push(new Paragraph({
                children: [ new TextRun({ text: "\t" + headerFormattedLines[i], font: "Times New Roman", size: 24 }) ],
                tabStops: [{ type: TabStopType.LEFT, position: 720 }],
            }));
        }
      }

      headerParagraphs.push(new Paragraph({ text: "" }));

      const doc = new Document({
        creator: "by Semper Admin",
        title: formData.subj || "Naval Letter",
        description: "Generated Naval Letter Format",
        sections: [{
          properties: {
            page: {
              margin: DOC_SETTINGS.pageMargins,
              size: DOC_SETTINGS.pageSize,
            },
            titlePage: true,
          },
          headers: {
            first: new Header({
              children: sealBuffer ? [
                new Paragraph({
                  children: [
                    new ImageRun({
                      data: sealBuffer,
                      transformation: {
                        width: 96,
                        height: 96,
                      },
                      floating: {
                        horizontalPosition: {
                            relative: HorizontalPositionRelativeFrom.PAGE,
                            offset: 457200,
                        },
                        verticalPosition: {
                            relative: VerticalPositionRelativeFrom.PAGE,
                            offset: 457200,
                        },
                      },
                    }),
                  ],
                }),
              ] : [],
            }),
            default: new Header({
              children: headerParagraphs,
            }),
          },
          footers: {
            first: new Footer({
              children: [],
            }),
            default: new Footer({
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      children: [PageNumber.CURRENT],
                      font: "Times New Roman",
                      size: 24,
                    })
                  ]
                })
              ]
            })
          },
          children: content
        }]
      });

      const filename = (formData.subj || "NavalLetter") + ".docx";
      const blob = await Packer.toBlob(doc);
      saveAs(blob, filename);
      
    } catch (error) {
      console.error("Error generating document:", error);
      alert("Error generating document: " + (error as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  const filename = (formData.subj || "NavalLetter") + ".docx";
    const blob = await Packer.toBlob(doc);
    saveAs(blob, filename);

    // *** ADD THIS LINE HERE ***
    fetch('https://api.countapi.xyz/hit/naval-letter-formatter/documents').catch(() => {});

    } catch (error) {
      console.error("Error generating document:", error);
      alert("Error generating document: " + (error as Error).message);
    } finally {
      setIsGenerating(false);
    }

  const unitComboboxData = UNITS.map(unit => ({
    value: `${unit.uic}-${unit.ruc}-${unit.mcc}`,
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
    value: `${ssic.code}-${index}`,
    label: `${ssic.code} - ${ssic.nomenclature}`,
    originalCode: ssic.code,
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
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      
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
          display: flex;
          margin-bottom: 1rem;
        }
        
        .input-group-text {
          background: linear-gradient(45deg, #b8860b, #ffd700);
          color: white;
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
          border: 1px solid #dee2e6;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.9);
        }

        .paragraph-level-preview {
          font-family: monospace;
          color: #666;
          font-size: 1.1rem;
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
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <img src="https://yt3.googleusercontent.com/KxVUCCrrOygiNK4sof8n_pGMIjEu3w0M3eY7pFWPmD20xjBzHFjbXgtSBzor8UBuwg6pWsBI=s160-c-k-c0x00ffffff-no-rj" alt="Semper Admin Logo" style={{ width: '100px', height: '100px', margin: '0 auto', borderRadius: '50%' }} />
            <h1 className="main-title" style={{ marginBottom: '0', marginTop: '10px' }}>
              Naval Letter Format Generator
            </h1>
            <p style={{ marginTop: '0', fontSize: '1.2rem', color: '#6c757d' }}>by Semper Admin</p>
            
            {/* Simple View Counter */}
            <SimpleViewCounter />
          </div>

          {/* Unit Information Section */}
          <div className="form-section">
            <div className="section-legend">
              <i className="fas fa-building" style={{ marginRight: '8px' }}></i>
              Unit Information
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Find Unit (by Name, RUC, MCC, or UIC):
              </label>
              <div className="flex items-center gap-2">
                <Combobox
                  items={unitComboboxData}
                  onSelect={handleUnitSelect}
                  placeholder="Search for a unit..."
                  searchMessage="No unit found."
                  inputPlaceholder="Search units..."
                />
                <button
                  className="btn btn-danger"
                  type="button"
                  onClick={clearUnitInfo}
                  title="Clear Unit Information"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
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

            <div style={{ marginBottom: '1rem' }}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Find SSIC by Nomenclature:
              </label>
              <div className="flex items-center gap-2">
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
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
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
              <div className={`feedback-message ${validation.from.isValid ? 'text-success' : 'text-info'}`}>
                <i className={`fas ${validation.from.isValid ? 'fa-check' : 'fa-info-circle'}`} style={{ marginRight: '4px' }}></i>
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
              <div className={`feedback-message ${validation.to.isValid ? 'text-success' : 'text-info'}`}>
                <i className={`fas ${validation.to.isValid ? 'fa-check' : 'fa-info-circle'}`} style={{ marginRight: '4px' }}></i>
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
                Via?
              </label>
              <div className="radio-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="radio" 
                    name="via" 
                    checked={!showVia} 
                    onChange={() => setShowVia(false)} 
                  />
                  No
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="radio" 
                    name="via" 
                    checked={showVia} 
                    onChange={() => setShowVia(true)} 
                  />
                  Yes
                </label>
              </div>
              {showVia && (
                <div className="dynamic-section">
                  {vias.map((via, index) => (
                    <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                      <input
                        className="form-control"
                        type="text"
                        placeholder="Via entry..."
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
                          Add
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
                <i className="fas fa-file-alt" style={{ marginRight: '8px' }}></i>
                References?
              </label>
              <div className="radio-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="radio" 
                    name="ref" 
                    checked={!showRef} 
                    onChange={() => setShowRef(false)} 
                  />
                  No
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="radio" 
                    name="ref" 
                    checked={showRef} 
                    onChange={() => setShowRef(true)} 
                  />
                  Yes
                </label>
              </div>
              {showRef && (
                <div className="dynamic-section">
                  {references.map((ref, index) => (
                    <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                      <input
                        className="form-control"
                        type="text"
                        placeholder="Reference entry..."
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
                          Add
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
                Enclosures?
              </label>
              <div className="radio-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="radio" 
                    name="encl" 
                    checked={!showEncl} 
                    onChange={() => setShowEncl(false)} 
                  />
                  No
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="radio" 
                    name="encl" 
                    checked={showEncl} 
                    onChange={() => setShowEncl(true)} 
                  />
                  Yes
                </label>
              </div>
              {showEncl && (
                <div className="dynamic-section">
                  {enclosures.map((encl, index) => (
                    <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                      <input
                        className="form-control"
                        type="text"
                        placeholder="Enclosure entry..."
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
                          Add
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

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                <i className="fas fa-copy" style={{ marginRight: '8px' }}></i>
                Copy To?
              </label>
              <div className="radio-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="radio" 
                    name="copy" 
                    checked={!showCopy} 
                    onChange={() => setShowCopy(false)} 
                  />
                  No
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="radio" 
                    name="copy" 
                    checked={showCopy} 
                    onChange={() => setShowCopy(true)} 
                  />
                  Yes
                </label>
              </div>
              {showCopy && (
                <div className="dynamic-section">
                  {copyTos.map((copy, index) => (
                    <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                      <input
                        className="form-control"
                        type="text"
                        placeholder="Copy to entry..."
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

          {/* Letter Body Section */}
          <div className="form-section">
            <div className="section-legend">
              <i className="fas fa-edit" style={{ marginRight: '8px' }}></i>
              Letter Body
            </div>
            
            {paragraphs.map((paragraph, index) => (
              <div key={paragraph.id} className={`paragraph-container ${paragraph.acronymError ? 'invalid-structure' : ''}`}>
                <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <span className="paragraph-level-preview">
                    {generateCitationForUI(paragraph, index, paragraphs)}
                  </span>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Enter paragraph text..."
                    value={paragraph.content}
                    onChange={(e) => updateParagraphContent(paragraph.id, e.target.value)}
                    style={{ flex: 1 }}
                  />
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
                      className="btn btn-smart-up btn-sm" 
                      onClick={() => addParagraph('up', paragraph.id)}
                    >
                      One Up
                    </button>
                  )}
                  
                  <button 
                    className="btn btn-danger btn-sm" 
                    onClick={() => removeParagraph(paragraph.id)}
                    style={{ marginLeft: '10px' }}
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                  
                  <button 
                    className="btn btn-secondary btn-sm" 
                    onClick={() => moveParagraphUp(paragraph.id)}
                    disabled={index === 0}
                  >
                    <i className="fas fa-arrow-up"></i>
                  </button>
                  
                  <button 
                    className="btn btn-secondary btn-sm" 
                    onClick={() => moveParagraphDown(paragraph.id)}
                    disabled={index === paragraphs.length - 1}
                  >
                    <i className="fas fa-arrow-down"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Signature Section */}
          <div className="form-section">
            <div className="section-legend">
              <i className="fas fa-signature" style={{ marginRight: '8px' }}></i>
              Signature Block
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                <i className="fas fa-user-tie" style={{ marginRight: '8px' }}></i>
                Delegation of Authority?
              </label>
              <div className="radio-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="radio" 
                    name="delegation" 
                    checked={!showDelegation} 
                    onChange={() => setShowDelegation(false)} 
                  />
                  No
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="radio" 
                    name="delegation" 
                    checked={showDelegation} 
                    onChange={() => setShowDelegation(true)} 
                  />
                  Yes
                </label>
              </div>
              {showDelegation && (
                <div className="dynamic-section">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Type of Delegation:</label>
                  <select 
                    className="form-control" 
                    onChange={(e) => updateDelegationType(e.target.value)}
                    style={{ marginBottom: '1rem' }}
                  >
                    <option value="">Select delegation type...</option>
                    <option value="by_direction">By direction</option>
                    <option value="acting_commander">Acting (as commander)</option>
                    <option value="acting_title">Acting (in title)</option>
                    <option value="signing_for">For (signing for)</option>
                  </select>
                </div>
              )}
            </div>
            
            <div className="input-group">
              <span className="input-group-text">
                <i className="fas fa-pen" style={{ marginRight: '8px' }}></i>
                Signature:
              </span>
              <input 
                className="form-control" 
                type="text" 
                placeholder="e.g., J. DOE"
                value={formData.sig}
                onChange={(e) => setFormData(prev => ({ ...prev, sig: autoUppercase(e.target.value) }))}
              />
            </div>
          </div>

          {/* Actions Section */}
          <div className="form-section">
            <div className="section-legend">
              <i className="fas fa-cogs" style={{ marginRight: '8px' }}></i>
              Actions
            </div>
            
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button 
                className="btn btn-primary" 
                onClick={saveLetter}
                title="Save Current Letter"
              >
                <i className="fas fa-save" style={{ marginRight: '8px' }}></i>
                Save Letter
              </button>
              
              <button 
                className="btn btn-secondary" 
                onClick={() => {
                  setFormData({
                    line1: '', line2: '', line3: '', ssic: '', originatorCode: '', 
                    date: '', from: '', to: '', subj: '', sig: '', delegationText: ''
                  });
                  setVias(['']);
                  setReferences(['']);
                  setEnclosures(['']);
                  setCopyTos(['']);
                  setParagraphs([{ id: 1, level: 1, content: '', acronymError: '' }]);
                  setShowVia(false);
                  setShowRef(false);
                  setShowEncl(false);
                  setShowCopy(false);
                  setShowDelegation(false);
                }}
                title="Clear All Fields"
              >
                <i className="fas fa-eraser" style={{ marginRight: '8px' }}></i>
                Clear All
              </button>
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

          {/* Generate Button */}
          <div style={{ textAlign: 'center' }}>
            <button 
              className="generate-btn" 
              onClick={generateDocument} 
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
                  Generating...
                </>
              ) : (
                <>
                  <i className="fas fa-download" style={{ marginRight: '8px' }}></i>
                  Generate Naval Letter
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 
