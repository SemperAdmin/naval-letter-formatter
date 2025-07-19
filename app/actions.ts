"use server";

import { refineLetterTone } from '@/ai/flows/refine-letter-tone';
import type { RefineLetterToneInput } from '@/ai/flows/refine-letter-tone';

export async function getRefinedLetterText(input: RefineLetterToneInput) {
  try {
    const result = await refineLetterTone(input);
    return { refinedText: result.refinedText, error: null };
  } catch (error) {
    console.error("AI Refinement Error:", error);
    return { refinedText: null, error: 'Failed to refine text. Please try again.' };
  }
}
