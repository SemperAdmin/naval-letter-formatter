"use server";

// AI functionality removed for public deployment
export async function getRefinedLetterText(input: any) {
  // Return the original text unchanged since AI features are removed
  return { 
    refinedText: input.text || input.content || "", 
    error: null 
  };
}