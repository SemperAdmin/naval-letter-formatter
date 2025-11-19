/**
 * Paragraph Section Component
 * Manages the body paragraphs with multi-level indentation, voice input, and validation
 */

import React from 'react';
import { ParagraphData } from '@/types';

interface ParagraphSectionProps {
  paragraphs: ParagraphData[];
  activeVoiceInput: number | null;
  validateParagraphNumbering: (paragraphs: ParagraphData[]) => string[];
  getUiCitation: (paragraph: ParagraphData, index: number, allParagraphs: ParagraphData[]) => string;
  moveParagraphUp: (id: number) => void;
  moveParagraphDown: (id: number) => void;
  updateParagraphContent: (id: number, content: string) => void;
  toggleVoiceInput: (id: number) => void;
  addParagraph: (type: 'main' | 'sub' | 'same' | 'up', afterId: number) => void;
  removeParagraph: (id: number) => void;
}

export function ParagraphSection({
  paragraphs,
  activeVoiceInput,
  validateParagraphNumbering,
  getUiCitation,
  moveParagraphUp,
  moveParagraphDown,
  updateParagraphContent,
  toggleVoiceInput,
  addParagraph,
  removeParagraph
}: ParagraphSectionProps) {
  const numberingErrors = validateParagraphNumbering(paragraphs);

  return (
    <div className="form-section">
      <div className="section-legend">
        <i className="fas fa-paragraph mr-2"></i>
        Body Paragraphs
      </div>

      <div>
        {numberingErrors.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <div className="font-bold text-yellow-800 mb-2">
              <i className="fas fa-exclamation-triangle mr-2"></i>
              Paragraph Numbering Issues:
            </div>
            {numberingErrors.map((error, index) => (
              <div key={index} className="text-yellow-800 text-sm">
                • {error}
              </div>
            ))}
            <div className="mt-2 text-xs text-gray-600">
              <strong>Rule:</strong> If there's a paragraph 1a, there must be a paragraph 1b; if there's a paragraph 1a(1), there must be a paragraph 1a(2), etc.
            </div>
          </div>
        )}

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
                      className="btn btn-sm bg-gray-50 border border-gray-300 mr-1"
                      onClick={() => moveParagraphUp(paragraph.id)}
                      title="Move Up"
                    >
                      ↑
                    </button>
                  )}
                  <button
                    className="btn btn-sm bg-gray-50 border border-gray-300"
                    onClick={() => moveParagraphDown(paragraph.id)}
                    disabled={index === paragraphs.length - 1}
                    title="Move Down"
                  >
                    ↓
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-2 mb-3">
                <textarea
                  className="form-control flex-1"
                  rows={4}
                  placeholder="Enter your paragraph content here..."
                  value={paragraph.content}
                  onChange={(e) => updateParagraphContent(paragraph.id, e.target.value)}
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
                    <>🔴 Recording...</>
                  ) : (
                    <>🎤 Voice Input</>
                  )}
                </button>
              </div>

              {paragraph.acronymError && (
                <div className="acronym-error">
                  <i className="fas fa-exclamation-triangle mr-1"></i>
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
                    className="btn btn-danger btn-sm ml-2"
                    onClick={() => removeParagraph(paragraph.id)}
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
  );
}
