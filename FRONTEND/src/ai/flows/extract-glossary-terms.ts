
'use server';
/**
 * @fileOverview This file defines a Genkit flow to extract glossary terms from text.
 * It can handle both structured XML dictionaries and unstructured prose.
 *
 * - extractGlossaryTerms - A function that handles the glossary extraction process.
 * - ExtractGlossaryTermsInput - The input type for the extractGlossaryTerms function.
 * - ExtractGlossaryTermsOutput - The return type for the extractGlossaryTerms function.
 */

import { ai } from '@/app/genkit';
import {z} from 'zod';
// @ts-ignore
import * as Sanscript from '@sanskrit-coders/sanscript';
import { generateGlossaryFromProse } from '@/ai/flows/generate-glossary-from-prose';
import {
  type ExtractGlossaryTermsInput,
  ExtractGlossaryTermsInputSchema,
  type ExtractGlossaryTermsOutput,
  ExtractGlossaryTermsOutputSchema,
} from '@/types/ai.types';

export type { ExtractGlossaryTermsInput, ExtractGlossaryTermsOutput };

const AiXmlGlossaryTermSchema = z.object({
    phoneticTerm: z.string().describe('The glossary term in its original phonetic script (e.g., ITRANS from <key1>).'),
    definition: z.string().describe('The definition of the term, with XML tags removed.'),
});

const AiXmlOutputSchema = z.object({
  terms: z.array(AiXmlGlossaryTermSchema).describe('An array of structured glossary terms extracted from the XML text.'),
});

const xmlParsingPrompt = ai.definePrompt({
    name: 'parseXmlGlossaryPrompt',
    input: { schema: z.object({ text: z.string() }) },
    output: { schema: AiXmlOutputSchema },
    prompt: `You are an expert lexicographer specializing in parsing XML-based Sanskrit dictionaries (Wilson format). Your task is to analyze the provided text, which is in a custom XML format, and extract ALL glossary entries into a structured JSON format.

  **CRITICAL INSTRUCTIONS:**

  1.  **Identify Entries**: Each glossary entry is contained within an \`<H1>\` tag. You must process every single \`<H1>\` tag in the input.
  2.  **Extract Phonetic Term**: The primary term for the entry is located inside the \`<key1>\` tag. This term is in a Roman phonetic script (like ITRANS). You MUST extract this value for the \`phoneticTerm\` field.
  3.  **Extract Definition**: The full definition is contained within the \`<body>\` tag. You must extract all the text content from the \`<body>\` tag.
      *   Clean the definition text by removing any nested XML tags like \`<s>\`, \`<div>\`, \`<L>\`, or \`<b>\`.

  **Input Text:**
  {{{text}}}
`
});

const extractGlossaryTermsFlow = ai.defineFlow(
    {
      name: 'extractGlossaryTermsFlow',
      inputSchema: ExtractGlossaryTermsInputSchema,
      outputSchema: ExtractGlossaryTermsOutputSchema,
    },
    async (input) => {
      // First, attempt to parse as XML.
      try {
        const { output: aiOutput } = await xmlParsingPrompt({ text: input.text });

        if (aiOutput && aiOutput.terms.length > 0) {
            const finalTerms = aiOutput.terms.map(item => ({
                term: Sanscript.t(item.phoneticTerm, 'itrans', 'devanagari'),
                transliteration: Sanscript.t(item.phoneticTerm, 'itrans', 'iast'),
                definition: item.definition,
            }));
            return { terms: finalTerms };
        }
      } catch (e) {
          console.log("XML parsing failed, falling back to prose analysis. Error:", e);
      }

      // If XML parsing fails or returns no terms, fall back to prose generation.
      console.log("Fallback: attempting to generate glossary from unstructured prose.");
      return generateGlossaryFromProse({ text: input.text });
    }
);

export async function extractGlossaryTerms(input: ExtractGlossaryTermsInput): Promise<ExtractGlossaryTermsOutput> {
  return extractGlossaryTermsFlow(input);
}
