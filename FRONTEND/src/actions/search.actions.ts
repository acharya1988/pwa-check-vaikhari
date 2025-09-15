

'use server';

import { translateToSanskrit } from '@/ai/flows/translate-to-sanskrit';
import { generateSanskritVariations } from '@/ai/flows/generate-sanskrit-variations';
import { searchCorpus } from '@/services/search.service';
import { z } from 'zod';

const SearchResultSchema = z.object({
  translation: z.string().optional(),
  variations: z.array(z.string()).optional(),
  matches: z.array(z.any()).optional(),
  error: z.string().optional(),
});

type SearchResult = z.infer<typeof SearchResultSchema>;

export async function performSearch(prevState: any, formData: FormData): Promise<SearchResult> {
  const query = formData.get('query');

  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return { error: 'Please enter a search query.' };
  }

  try {
    const translationResult = await translateToSanskrit({ text: query });
    const sanskritText = translationResult.translation;

    if (!sanskritText) {
      return { error: 'Could not translate the text to Sanskrit.' };
    }

    const variationsResult = await generateSanskritVariations({ sanskritText });
    const variations = variationsResult.variations;
    
    if (!variations || variations.length === 0) {
      return { 
        translation: sanskritText,
        error: 'Could not generate sentence variations.' 
      };
    }

    const searchMatches = await searchCorpus([sanskritText, ...variations]);

    return {
      translation: sanskritText,
      variations: variations,
      matches: searchMatches,
    };
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
    return { error: `An unexpected error occurred during the search: ${errorMessage}` };
  }
}
