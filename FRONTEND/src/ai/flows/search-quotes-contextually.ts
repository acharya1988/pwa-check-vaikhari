
'use server';

import { ai } from '@/app/genkit';
import { z } from 'zod';
import {
  type SearchQuotesContextuallyInput,
  SearchQuotesContextuallyInputSchema,
  type SearchQuotesContextuallyOutput,
  SearchQuotesContextuallyOutputSchema,
} from '@/types/ai.types';

export type { SearchQuotesContextuallyInput, SearchQuotesContextuallyOutput };

const prompt = ai.definePrompt({
      name: 'searchQuotesContextuallyPrompt',
      input: { schema: z.object({ articleText: z.string(), allQuotesAsJson: z.string() }) },
      output: { schema: SearchQuotesContextuallyOutputSchema },
      prompt: `You are an expert research assistant with a deep understanding of semantics and context. Your task is to find the most relevant quotes from a provided library based on the themes and ideas in a user's article.

  The user is not just looking for keyword matches, but for quotes that match the *meaning* and *intent* of their text.

  **Article Text to Analyze:**
  ---
  {{{articleText}}}
  ---

  **Available Quotes Library (JSON format):**
  ---
  {{{allQuotesAsJson}}}
  ---

  Based on the article text, identify up to 5 of the most contextually and semantically relevant quotes from the library. Return them as a JSON object containing a "relevantQuotes" array. The quotes in the array should be the full quote objects from the provided library.`,
});

const searchQuotesContextuallyFlow = ai.defineFlow(
    {
      name: 'searchQuotesContextuallyFlow',
      inputSchema: SearchQuotesContextuallyInputSchema,
      outputSchema: SearchQuotesContextuallyOutputSchema,
    },
    async (input) => {
      const allQuotesAsJson = JSON.stringify(input.quotes);

      const { output } = await prompt({
          articleText: input.articleText,
          allQuotesAsJson,
      });
      
      if (!output) {
          return { relevantQuotes: [] };
      }
      
      return output;
    }
);

export async function searchQuotesContextually(input: SearchQuotesContextuallyInput): Promise<SearchQuotesContextuallyOutput> {
  return searchQuotesContextuallyFlow(input);
}
