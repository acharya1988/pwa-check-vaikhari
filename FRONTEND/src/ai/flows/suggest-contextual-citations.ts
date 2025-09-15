
'use server';
/**
 * @fileOverview An AI flow to suggest relevant citations based on article content.
 *
 * - suggestCitationsForArticle - Analyzes text and suggests citations.
 * - SuggestCitationsForArticleInput - Input schema.
 * - SuggestCitationsForArticleOutput - Output schema.
 */

import { ai } from '@/app/genkit';
import { z } from 'zod';
import { getCitationData } from '@/services/citation.service';
import type { Citation } from '@/types';
import {
    type SuggestCitationsForArticleInput,
    SuggestCitationsForArticleInputSchema,
} from '@/types/ai.types';

export type { SuggestCitationsForArticleInput };


// Define the types for the final output of the exported function
export type SuggestionWithContext = Citation & {
    matchedKeyword: string;
    count: number;
};

export type SuggestCitationsForArticleOutput = {
  suggestions: SuggestionWithContext[];
};


const SuggestedCitationPromptOutputSchema = z.object({
  suggestions: z.array(z.object({
    keyword: z.string().describe("The frequent keyword from the article text that this citation is relevant to."),
    refId: z.string().describe("The refId of the most relevant citation for this keyword.")
  })).describe("An array of up to 5 citation suggestions based on keyword frequency.")
});


const prompt = ai.definePrompt({
    name: 'suggestCitationsForArticlePrompt',
    input: { schema: z.object({ articleText: z.string(), allCitationsAsJson: z.string() }) },
    output: { schema: SuggestedCitationPromptOutputSchema },
    prompt: `You are an expert in Sanskrit literature and textual analysis, acting as a research assistant.

      Your task is to perform a two-step analysis:
      1.  **Keyword Identification**: Read the following \`articleText\`. Identify the most important and frequently occurring Sanskrit keywords or technical terms.
      2.  **Citation Matching**: Based on the most frequent keywords you identified, find the most relevant citations from the provided \`allCitationsAsJson\` library. For each of the top 5 most frequent keywords, select the single best citation match.

      Return your results as a JSON array in the \`suggestions\` field. Each object in the array must contain:
      -   \`keyword\`: The frequent keyword from the article.
      -   \`refId\`: The \`refId\` of the most relevant citation you found for that keyword.

      Analyze this article text:
      ---
      {{{articleText}}}
      ---

      Here is the library of all available citations in JSON format:
      ---
      {{{allCitationsAsJson}}}
      ---
      `
});

const suggestCitationsForArticleFlow = ai.defineFlow({
    name: 'suggestCitationsForArticleFlow',
    inputSchema: SuggestCitationsForArticleInputSchema,
    outputSchema: z.custom<SuggestCitationsForArticleOutput>()
  },
  async (input: SuggestCitationsForArticleInput): Promise<SuggestCitationsForArticleOutput> => {
    const allCitationCategories = await getCitationData();
    const allCitations = allCitationCategories.flatMap(cat => cat.citations);
    
    const allCitationsRefOnly = allCitations.map(({ refId, keywords, source, location }) => ({ refId, keywords, source, location }));
    const allCitationsAsJson = JSON.stringify(allCitationsRefOnly);
    
    const { output } = await prompt({
        articleText: input.articleText,
        allCitationsAsJson,
    });
    
    if (!output || !output.suggestions) {
        return { suggestions: [] };
    }
    
    const suggestions: SuggestionWithContext[] = output.suggestions
        .map(suggestion => {
            const fullCitation = allCitations.find(c => c.refId === suggestion.refId);
            if (!fullCitation) return null;
            
            const keywordRegex = new RegExp(`\\b${suggestion.keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
            const count = (input.articleText.match(keywordRegex) || []).length;
            
            if (count === 0) return null;

            return {
                ...fullCitation,
                matchedKeyword: suggestion.keyword,
                count,
            };
        })
        .filter((s): s is SuggestionWithContext => s !== null);

    return { suggestions };
  }
);


export async function suggestCitationsForArticle(input: SuggestCitationsForArticleInput): Promise<SuggestCitationsForArticleOutput> {
  return suggestCitationsForArticleFlow(input);
}
