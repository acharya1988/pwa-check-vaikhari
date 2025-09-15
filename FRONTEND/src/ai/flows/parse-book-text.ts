
'use server';
/**
 * @fileOverview This file defines a Genkit flow to parse unstructured book text into structured segments.
 *
 * - parseBookText - A function that handles the parsing process.
 */

import { ai } from '@/app/genkit';
import { googleAI } from '@genkit-ai/googleai';
import {z} from 'zod';
import {
  ParseBookTextInput,
  ParseBookTextInputSchema,
  AiBookOutput,
  AiBookOutputSchema,
} from '@/types/import.types';

const prompt = ai.definePrompt({
      name: 'parseBookTextPrompt',
      model: googleAI.model('gemini-1.5-flash'),
      input: {schema: ParseBookTextInputSchema},
      output: {schema: AiBookOutputSchema},
      prompt: `You are an expert in structuring long Sanskrit documents. Your task is to analyze the following text and split it into a structured JSON format.

  **CRITICAL INSTRUCTIONS:**

  1.  **Identify Book Title**: Find the main title of the book and place it in the \`bookName\` field.
  2.  **Identify Chapters**: Split the entire document into chapters. A new chapter often starts with a heading like "अध्याय १", "Chapter 1", or a similar section marker.
  3.  **Process Each Chapter**: For each chapter, create a \`segments\` array. A new segment begins with every verse marker (e.g., \`।। 1 ।।\`, \`।। 2 ।।\`).
  4.  **Extract Segments**: For each segment, you MUST provide:
      *   \`verseNumber\`: The number from the verse marker (e.g., "1" from \`।। 1 ।।\`). For any text before the first marker, use "prose-1".
      *   \`verseText\`: The main text of the shloka or prose. **CRITICAL: Keep inline footnote markers like \`(1)\` or \`¹\` within this text.** Do NOT include the footnote definitions here.
      *   \`footnoteText\`: If there is a block of footnote definitions (often starting with \`F.N.\` or just a numbered list) that follows the verse text and belongs to it, extract that ENTIRE block of text into this field. If there are no footnotes for a verse, omit this field.

  **EXAMPLE:**

  **Input Text:**
  \`\`\`
  Chapter 1
  This is some introductory prose.
  ।। 1 ।।
  Verse one text here(1).
  F.N.
  (1) This is the first footnote.
  ।। 2 ।।
  Verse two text with no footnotes.
  \`\`\`

  **Expected JSON Output for this Chapter:**
  \`\`\`json
  {
    "name": "Chapter 1",
    "segments": [
      {
        "verseNumber": "prose-1",
        "verseText": "This is some introductory prose."
      },
      {
        "verseNumber": "1",
        "verseText": "Verse one text here(1).",
        "footnoteText": "F.N.\\n(1) This is the first footnote."
      },
      {
        "verseNumber": "2",
        "verseText": "Verse two text with no footnotes."
      }
    ]
  }
  \`\`\`
  ---

  Now, analyze the following text:
  {{{text}}}`,
});

const parseBookTextFlow = ai.defineFlow(
  {
    name: 'parseBookTextFlow',
    inputSchema: ParseBookTextInputSchema,
    outputSchema: AiBookOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);

    if (!output) {
      throw new Error("The AI model failed to return a valid structured response. Please check the input text format or try again.");
    }
     // Ensure every chapter has a segments array.
    output.chapters.forEach(chapter => {
      if (!chapter.segments) {
        chapter.segments = [];
      }
    });
    return output;
  }
);


export async function parseBookText(input: ParseBookTextInput): Promise<AiBookOutput> {
  return parseBookTextFlow(input);
}
