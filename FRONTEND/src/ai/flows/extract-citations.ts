
'use server';
/**
 * @fileOverview This file defines a Genkit flow to extract structured citations from unstructured text.
 */

import { ai } from '@/app/genkit';
import { googleAI } from '@genkit-ai/googleai';
import {z} from 'zod';
import slugify from 'slugify';
import {
  type ExtractCitationsInput,
  ExtractCitationsInputSchema,
  type ExtractCitationsOutput,
  ExtractCitationsOutputSchema,
} from '@/types/ai.types';

export type { ExtractCitationsInput, ExtractCitationsOutput };

const prompt = ai.definePrompt({
    name: 'extractCitationsPrompt',
    model: googleAI.model('gemini-1.5-flash'),
    input: {schema: ExtractCitationsInputSchema},
    output: {schema: ExtractCitationsOutputSchema},
    prompt: `You are an expert librarian specializing in Indology and digital humanities. Your task is to parse unstructured text and extract ALL well-formed citations you can find. You must be meticulous and find every single verse.

  **CRITICAL INSTRUCTIONS:**
  1.  **Identify Every Citation**: Scan the entire text. Every distinct verse, shloka, or sutra MUST be treated as a separate entry in the output array. Look for verse-ending markers like \`।। 1 ।।\`, \`।। 2 ।।\` to identify distinct shlokas. Do not stop after the first one.
  2.  **Extract Fields**: For each citation you identify, meticulously extract the following fields:
      *   \`sanskrit\`: The core Sanskrit text. This is mandatory. **Exclude any footnote markers like \`(1)\` or \`F.N.\` blocks from this field.**
      *   \`translation\`: The translation if available.
      *   \`keywords\`: Extract any provided keywords, or generate 2-3 relevant keywords from the content.
      *   \`source\`: The name of the book or text it comes from (e.g., "Bhagavad Gita", "Charaka Samhita"). You should infer this from the text context if possible.
      *   \`location\`: The specific location within the source (e.g., "1.2", "Sutrasthana 1.27"). You should extract this from the verse-ending markers (e.g., \`।। 1 ।।\` means location is "1").

  3.  **Generate \`refId\`**: This is the most critical step. You MUST generate the \`refId\` based on the following rules:
      *   **Rule A (Primary)**: If \`source\` and \`location\` are available, create the \`refId\` by combining an abbreviation of the source and the location.
          *   Generate a standard abbreviation for the source (e.g., 'CS' for 'Charaka Samhita', 'SRB' for 'सुभाषितरत्नभाण्डागारम्').
          *   Combine them with an underscore.
          *   Example: \`source: "सुभाषितरत्नभाण्डागारम्", location: "1"\` -> \`refId: "SRB_1"\`
      *   **Rule B (Fallback)**: If \`source\` and \`location\` cannot be determined, generate a plausible \`refId\` by slugifying the first few words of the shloka (e.g., 'sarva-dharman-parityajya').

  **EXAMPLE OF MULTIPLE CITATIONS WITH FOOTNOTES:**

  **Input Text:**
  "सुभाषितरत्नभाण्डागारम्। <परब्रह्म।> 	अथ स्वस्थाय देवाय नित्याय हतपाप्मने(1)।         त्यक्तक्रमविभागाय(2) चैतन्यज्योतिषे नमः।। 1 ।। F.N. (1. नाशितकिल्बिषाय.) (2. विधिः.) 	दिक्कालाद्यनवच्छिन्नानन्तचिन्मात्रమूर्तये(3)। 	स्वानुभूत्येकमानाय(4) नमः शान्ताय तेजसे।। 2 ।। F.N. (3. अविषयीकृता.) (4. प्रमाणम्.)"

  **Expected JSON Output:**
  {
    "citations": [
      {
        "refId": "SRB_1",
        "sanskrit": "अथ स्वस्थाय देवाय नित्याय हतपाप्मने। त्यक्तक्रमविभागाय चैतन्यज्योतिषे नमः।",
        "translation": "",
        "keywords": ["deva", "nitya", "chaitanya"],
        "source": "सुभाषितरत्नभाण्डागारम्",
        "location": "1"
      },
      {
        "refId": "SRB_2",
        "sanskrit": "दिक्कालाद्यनवच्छिन्नानन्तचिन्मात्रमूर्तये। स्वानुभूत्येकमानाय नमः शान्ताय तेजसे।",
        "translation": "",
        "keywords": ["dikkala", "chaitanya", "tejas"],
        "source": "सुभाषितरत्नभाण्डागारम्",
        "location": "2"
      }
    ]
  }

  ---
  Now, analyze the following text and return a JSON object with all the citations you found.
  {{{text}}}`,
});

const extractCitationsFlow = ai.defineFlow(
    {
      name: 'extractCitationsFlow',
      inputSchema: ExtractCitationsInputSchema,
      outputSchema: ExtractCitationsOutputSchema,
    },
    async (input) => {
      const {output} = await prompt(input);
      
      if (!output || !output.citations) {
          return { citations: [] };
      }

      // Post-process to ensure refIds are unique
      const uniqueRefIds = new Set<string>();
      output.citations.forEach(citation => {
          // Trust the AI's generated refId first.
          // Use a slugified fallback only if the AI fails to generate one.
          let finalRefId = citation.refId || '';
          if (!finalRefId && citation.sanskrit) {
              const sourceSlug = citation.source ? slugify(citation.source, { lower: true, strict: true }) : 'citation';
              const contentSlug = slugify(citation.sanskrit.split(' ').slice(0, 3).join(' '), { lower: true, strict: true });
              finalRefId = `${sourceSlug}-${contentSlug}`;
          }
          
          let originalFinalRefId = finalRefId;
          let counter = 1;
          while(uniqueRefIds.has(finalRefId)) {
              finalRefId = `${originalFinalRefId}-${counter++}`;
          }
          
          uniqueRefIds.add(finalRefId);
          citation.refId = finalRefId;
      });

      return output;
    }
);

export async function extractCitations(input: ExtractCitationsInput): Promise<ExtractCitationsOutput> {
  return extractCitationsFlow(input);
}
