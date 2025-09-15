
'use server';
/**
 * @fileOverview A generic translation AI agent.
 *
 * - translateText - A function that handles the translation process.
 * - TranslateTextInput - The input type for the translateText function.
 * - TranslateTextOutput - The return type for the translateText function.
 */

import { ai } from '@/app/genkit';
import { googleAI } from '@genkit-ai/googleai';
import {z} from 'zod';
import {
    type TranslateTextInput,
    TranslateTextInputSchema,
    type TranslateTextOutput,
    TranslateTextOutputSchema,
} from '@/types/ai.types';

export type { TranslateTextInput, TranslateTextOutput };

const LanguageName = {
    en: 'English',
    hi: 'Hindi',
    sa: 'Sanskrit',
    kn: 'Kannada',
    ta: 'Tamil',
    te: 'Telugu',
    bn: 'Bengali',
    gu: 'Gujarati',
    ml: 'Malayalam',
    ne: 'Nepali',
    bo: 'Tibetan',
};

const PromptInputSchema = z.object({
  text: z.string(),
  sourceLangName: z.string(),
  targetLangName: z.string(),
});

const prompt = ai.definePrompt({
    name: 'translateTextPrompt',
    model: googleAI.model('gemini-1.5-flash'),
    input: {schema: PromptInputSchema},
    output: {schema: TranslateTextOutputSchema},
    prompt: `You are an expert multilingual translator. Your task is to translate the following HTML content from {{sourceLangName}} into **{{targetLangName}}**.

  **CRITICAL INSTRUCTIONS:**
  1.  You MUST translate the meaning of the content, not just the script (transliteration).
  2.  You MUST preserve all original HTML structural tags (like \`<p>\`, \`<b>\`, \`<i>\`, \`<h4>\`, etc.) and any special placeholders (like \`__NOTE_0__\`).
  3.  Do NOT translate the content of any \`data-content\` attributes within HTML tags.
  4.  The final output must be a single string of valid HTML.

  **EXAMPLE:**
  *   Source Language: Sanskrit
  *   Input Text: \`<p><b>अथातो वेदोत्पत्तिमध्यायं व्याख्यास्यामः</b> इति।</p>\`
  *   Target Language: English
  *   Correct Output: \`<p><b>Now, therefore, we shall explain the chapter on the origin of the Veda.</b></p>\`

  ---
  Now, please translate the following text from {{sourceLangName}} into **{{targetLangName}}**:
  {{{text}}}`,
});

const translateTextFlow = ai.defineFlow(
    {
      name: 'translateTextFlow',
      inputSchema: TranslateTextInputSchema,
      outputSchema: TranslateTextOutputSchema,
    },
    async input => {
      // Step 0: Handle placeholders for non-translatable parts like footnotes.
      const notePlaceholders = new Map<string, string>();
      let noteIndex = 0;
      
      const textWithPlaceholders = input.text.replace(/<sup[^>]*>.*?<\/sup>/g, (match) => {
          const placeholder = `__NOTE_${noteIndex}__`;
          notePlaceholders.set(placeholder, match);
          noteIndex++;
          return placeholder;
      });

      // Step 1: Check if the target is English. If so, do a direct translation.
      if (input.targetLang === 'en') {
        const { output } = await prompt({
          text: textWithPlaceholders,
          sourceLangName: 'Sanskrit',
          targetLangName: 'English',
        });
        if (!output?.translation) return { translation: '' };
        
        let restored = output.translation;
        notePlaceholders.forEach((original, placeholder) => {
            restored = restored.replace(new RegExp(placeholder, 'g'), original);
        });
        return { translation: restored };
      }

      // Step 2: If target is not English, first translate Sanskrit to English.
      const englishTranslationResponse = await prompt({
        text: textWithPlaceholders,
        sourceLangName: 'Sanskrit',
        targetLangName: 'English'
      });
      
      const englishText = englishTranslationResponse.output?.translation;
      if (!englishText) {
          throw new Error('Failed to get intermediate English translation.');
      }
      
      // Step 3: Translate from English to the final target language.
      const finalTranslationResponse = await prompt({
        text: englishText,
        sourceLangName: 'English',
        targetLangName: LanguageName[input.targetLang]
      });

      if (!finalTranslationResponse.output?.translation) {
        return { translation: '' };
      }
      
      // Step 4: Restore placeholders in the final translation
      let restoredTranslation = finalTranslationResponse.output.translation;
      notePlaceholders.forEach((original, placeholder) => {
          const placeholderRegex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
          restoredTranslation = restoredTranslation.replace(placeholderRegex, original);
      });
      
      return { translation: restoredTranslation };
    }
);

export async function translateText(
  input: TranslateTextInput
): Promise<TranslateTextOutput> {
  return translateTextFlow(input);
}
