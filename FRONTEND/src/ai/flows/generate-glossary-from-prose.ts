
'use server';
/**
 * @fileOverview This file defines a Genkit flow to identify key Sanskrit terms from unstructured prose and generate glossary entries for them.
 *
 * - generateGlossaryFromProse - A function that handles the glossary generation process.
 * - GenerateGlossaryFromProseInput - The input type for the generateGlossaryFromProse function.
 * - GenerateGlossaryFromProseOutput - The return type for the generateGlossaryFromProse function.
 */

import { ai } from '@/app/genkit';
import {z} from 'zod';
import {
  type GenerateGlossaryFromProseInput,
  GenerateGlossaryFromProseInputSchema,
  type GenerateGlossaryFromProseOutput,
  GenerateGlossaryFromProseOutputSchema,
} from '@/types/ai.types';

export type { GenerateGlossaryFromProseInput, GenerateGlossaryFromProseOutput };

const prompt = ai.definePrompt({
    name: 'generateGlossaryFromProsePrompt',
    input: {schema: GenerateGlossaryFromProseInputSchema},
    output: {schema: GenerateGlossaryFromProseOutputSchema},
    prompt: `You are an expert Sanskrit scholar and lexicographer. Your task is to read the following unstructured text, identify all the significant Sanskrit technical terms, philosophical concepts, or important nouns, and generate a structured glossary from them.

  **CRITICAL INSTRUCTIONS:**

  1.  **Identify Key Terms**: Read through the entire text and identify the key terms. These are typically nouns or concepts that are central to the meaning of the text (e.g., 'Dharma', 'Ātman', 'Brahman', 'Karma', 'Mokṣa'). Do not just extract every single Sanskrit word.
  2.  **Generate Comprehensive Entries**: For each key term you identify, you MUST provide the following in the JSON output:
      *   \`term\`: The term in its original Devanagari script (e.g., 'धर्म').
      *   \`transliteration\`: A standard IAST transliteration of the term (e.g., 'dharma'). You must generate this yourself.
      *   \`definition\`: A clear and concise definition of the term based on its context in the provided text and your general knowledge of Sanskrit philosophy.
  3.  **Return as JSON**: The final output must be a single JSON object with a single key "terms", which is an array of the glossary entries you have generated.

  **EXAMPLE:**

  **Input Text:**
  "The concept of dharma is central to Hindu ethics. It is not merely law, but a cosmic order. Following one's dharma leads to good karma, which affects the cycle of samsara. The ultimate goal is mokṣa, or liberation from this cycle, by understanding the true nature of the self, or ātman."

  **Expected JSON Output:**
  \`\`\`json
  {
    "terms": [
      {
        "term": "धर्म",
        "transliteration": "dharma",
        "definition": "A central concept in Hindu ethics, representing cosmic law, order, duty, and righteous conduct. Following it leads to good karma."
      },
      {
        "term": "कर्म",
        "transliteration": "karma",
        "definition": "The principle of cause and effect where intent and actions of an individual influence their future. Good dharma leads to good karma."
      },
      {
        "term": "संसार",
        "transliteration": "saṃsāra",
        "definition": "The cycle of death and rebirth to which life in the material world is bound."
      },
      {
        "term": "मोक्ष",
        "transliteration": "mokṣa",
        "definition": "Liberation or release from the cycle of samsara, considered the ultimate goal."
      },
      {
        "term": "आत्मन्",
        "transliteration": "ātman",
        "definition": "The true self or soul, the understanding of which is key to achieving mokṣa."
      }
    ]
  }
  \`\`\`
  ---

  Now, analyze the following text and generate a complete glossary in the correct JSON format.
  {{{text}}}`,
});

const generateGlossaryFromProseFlow = ai.defineFlow(
    {
      name: 'generateGlossaryFromProseFlow',
      inputSchema: GenerateGlossaryFromProseInputSchema,
      outputSchema: GenerateGlossaryFromProseOutputSchema,
    },
    async (input) => {
      const {output} = await prompt(input);
      return output!;
    }
);

export async function generateGlossaryFromProse(input: GenerateGlossaryFromProseInput): Promise<GenerateGlossaryFromProseOutput> {
  return generateGlossaryFromProseFlow(input);
}
