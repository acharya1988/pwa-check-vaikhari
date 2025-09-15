
'use server';
/**
 * @fileOverview This file defines a Genkit flow to generate variations of a given Sanskrit sentence.
 *
 * It includes the flow definition, input/output schemas, and a wrapper function.
 *
 * - generateSanskritVariations - A function that generates Sanskrit sentence variations.
 * - GenerateSanskritVariationsInput - The input type for the generateSanskritVariations function.
 * - GenerateSanskritVariationsOutput - The return type for the generateSanskritVariations function.
 */

import { ai } from '@/app/genkit';
import { googleAI } from '@genkit-ai/googleai';
import {
    type GenerateSanskritVariationsInput,
    GenerateSanskritVariationsInputSchema,
    type GenerateSanskritVariationsOutput,
    GenerateSanskritVariationsOutputSchema,
} from '@/types/ai.types';

export type { GenerateSanskritVariationsInput, GenerateSanskritVariationsOutput };

const prompt = ai.definePrompt({
    name: 'generateSanskritVariationsPrompt',
    model: googleAI.model('gemini-1.5-flash'),
    input: {schema: GenerateSanskritVariationsInputSchema},
    output: {schema: GenerateSanskritVariationsOutputSchema},
    prompt: `You are a Sanskrit grammar expert. Generate 3 variations of the following Sanskrit sentence:

  {{sanskritText}}

  Return a JSON array containing the variations. Ensure the variations are grammatically correct and preserve the meaning of the original sentence.`,
});

const generateSanskritVariationsFlow = ai.defineFlow(
    {
      name: 'generateSanskritVariationsFlow',
      inputSchema: GenerateSanskritVariationsInputSchema,
      outputSchema: GenerateSanskritVariationsOutputSchema,
    },
    async input => {
      const {output} = await prompt(input);
      if (!output) {
        throw new Error("The AI model failed to generate variations.");
      }
      return output;
    }
);

export async function generateSanskritVariations(
  input: GenerateSanskritVariationsInput
): Promise<GenerateSanskritVariationsOutput> {
  return generateSanskritVariationsFlow(input);
}
