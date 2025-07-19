'use server';
/**
 * @fileOverview This file defines a Genkit flow for refining the tone of a naval letter.
 *
 * - refineLetterTone - A function that refines the tone of a naval letter based on the recipient and subject matter.
 * - RefineLetterToneInput - The input type for the refineLetterTone function.
 * - RefineLetterToneOutput - The return type for the refineLetterTone function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RefineLetterToneInputSchema = z.object({
  text: z.string().describe('The naval letter text to refine.'),
  recipientRank: z.string().optional().describe('The rank of the recipient.'),
  subjectMatter: z.string().optional().describe('The subject matter of the letter.'),
});
export type RefineLetterToneInput = z.infer<typeof RefineLetterToneInputSchema>;

const RefineLetterToneOutputSchema = z.object({
  refinedText: z.string().describe('The refined naval letter text.'),
});
export type RefineLetterToneOutput = z.infer<typeof RefineLetterToneOutputSchema>;

export async function refineLetterTone(input: RefineLetterToneInput): Promise<RefineLetterToneOutput> {
  return refineLetterToneFlow(input);
}

const refineLetterTonePrompt = ai.definePrompt({
  name: 'refineLetterTonePrompt',
  input: {schema: RefineLetterToneInputSchema},
  output: {schema: RefineLetterToneOutputSchema},
  prompt: `You are tasked with refining the tone of a naval letter to be appropriate for the recipient and subject matter. 

  Here is the letter text: {{{text}}}

  {% if recipientRank %}The recipient's rank is: {{{recipientRank}}}.{% endif %}
  {% if subjectMatter %}The subject matter is: {{{subjectMatter}}}.{% endif %}

  Please refine the letter text to ensure it is professional, respectful, and appropriate for the given context. Return only the refined letter text.
  `,
});

const refineLetterToneFlow = ai.defineFlow(
  {
    name: 'refineLetterToneFlow',
    inputSchema: RefineLetterToneInputSchema,
    outputSchema: RefineLetterToneOutputSchema,
  },
  async input => {
    const {output} = await refineLetterTonePrompt(input);
    return output!;
  }
);
