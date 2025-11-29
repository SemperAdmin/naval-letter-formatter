/**
 * LocalStorage Persistence Utilities
 * Manages saving and loading naval letters to/from browser localStorage
 */

import { SavedLetter } from '@/types';

const STORAGE_KEY = 'navalLetters';
const MAX_SAVED_LETTERS = 10;

/**
 * Loads all saved letters from localStorage
 * Returns empty array if no saved letters found or on error
 */
export function loadSavedLetters(): SavedLetter[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
    return [];
  } catch (error) {
    console.error('Failed to load saved letters from localStorage', error);
    return [];
  }
}

/**
 * Saves a new letter to localStorage
 * Keeps only the most recent MAX_SAVED_LETTERS (10) letters
 * Returns the updated list of all saved letters
 */
export function saveLetterToStorage(newLetter: SavedLetter, existingSavedLetters: SavedLetter[]): SavedLetter[] {
  const updatedLetters = [newLetter, ...existingSavedLetters].slice(0, MAX_SAVED_LETTERS);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLetters));
  } catch (error) {
    console.error('Failed to save letter to localStorage', error);
  }

  return updatedLetters;
}

/**
 * Finds a saved letter by ID
 * Returns undefined if not found
 */
export function findLetterById(letterId: string, savedLetters: SavedLetter[]): SavedLetter | undefined {
  return savedLetters.find(l => l.id === letterId);
}
