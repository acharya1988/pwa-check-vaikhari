

// src/types/ai.types.ts
import { z } from 'zod';

// Schemas for: check-grammar.ts
export const CheckGrammarInputSchema = z.object({
  sanskritText: z.string().describe('The Sanskrit text to be grammatically analyzed.'),
});

const GrammarErrorSchema = z.object({
  violatedText: z.string().describe('The exact word or phrase from the input text that is grammatically incorrect.'),
  startIndex: z.number().describe('The starting character index of the violatedText in the original input string.'),
  endIndex: z.number().describe('The ending character index (exclusive) of the violatedText in the original input string.'),
  suggestion: z.string().describe('The suggested correction for the violated text.'),
  sutraReference: z.string().describe('The relevant Pāṇini sūtra reference, e.g., "Pāṇini 3.1.68 (कर्तरि शप्)".'),
  explanation: z.string().describe('A brief explanation of the grammatical error and the reasoning for the correction based on the sūtra. CRITICAL: Ensure all special characters in this string, especially quotation marks, are properly escaped for JSON compatibility, for example: "This is an \\"example\\"."'),
});

export const CheckGrammarOutputSchema = z.object({
  correctedText: z.string().describe("The full text with all corrections applied."),
  errors: z.array(GrammarErrorSchema).describe('An array of all grammatical errors found in the text.'),
});

// Schemas for: extract-citations.ts
export const ExtractCitationsInputSchema = z.object({
  text: z.string().describe('The unstructured text containing citation data.'),
});

const ExtractedCitationSchema = z.object({
    refId: z.string().optional().describe("The reference ID of the citation. If not present in the source text, generate a plausible one based on the source and content (e.g., 'source-keyword-1')."),
    sanskrit: z.string().describe('The original Sanskrit text of the citation.'),
    translation: z.string().optional().describe('The English or other language translation of the citation.'),
    keywords: z.array(z.string()).describe('A list of relevant keywords for the citation.'),
    source: z.string().optional().describe('The name of the source text (e.g., "Charaka Samhita").'),
    location: z.string().optional().describe('The location within the source text (e.g., "Sutrasthana 1.27").'),
});

export const ExtractCitationsOutputSchema = z.object({
  citations: z.array(ExtractedCitationSchema).describe('An array of structured citations extracted from the text.'),
});

// Schemas for: extract-glossary-terms.ts
export const ExtractGlossaryTermsInputSchema = z.object({
  text: z.string().describe('The text containing glossary terms, either as prose or XML.'),
});

const GlossaryTermSchema = z.object({
    term: z.string().describe('The glossary term in Devanagari script.'),
    transliteration: z.string().optional().describe('The IAST transliteration of the term.'),
    definition: z.string().describe('The definition of the term.'),
});

export const ExtractGlossaryTermsOutputSchema = z.object({
  terms: z.array(GlossaryTermSchema).describe('An array of structured glossary terms extracted from the text.'),
});

// Schemas for: generate-glossary-from-prose.ts (shares schemas with extract-glossary-terms)
export const GenerateGlossaryFromProseInputSchema = ExtractGlossaryTermsInputSchema;
export const GenerateGlossaryFromProseOutputSchema = ExtractGlossaryTermsOutputSchema;

// Schemas for: generate-sanskrit-variations.ts
export const GenerateSanskritVariationsInputSchema = z.object({
  sanskritText: z.string().describe('The Sanskrit text to generate variations for.'),
});
export const GenerateSanskritVariationsOutputSchema = z.object({
  variations: z.array(z.string()).describe('An array of Sanskrit sentence variations.'),
});

// Schemas for: search-quotes-contextually.ts
const QuoteSchemaForSearch = z.object({
    id: z.string(),
    title: z.string(),
    quote: z.string(),
    author: z.string(),
});
export const SearchQuotesContextuallyInputSchema = z.object({
  articleText: z.string().describe('The article text to analyze for context.'),
  quotes: z.array(QuoteSchemaForSearch).describe('The list of all available quotes to search through.'),
});
export const SearchQuotesContextuallyOutputSchema = z.object({
  relevantQuotes: z.array(QuoteSchemaForSearch).describe('An array of the most contextually relevant quotes from the provided list, sorted by relevance.'),
});

// Schemas for: suggest-contextual-citations.ts
export const SuggestCitationsForArticleInputSchema = z.object({
  articleText: z
    .string()
    .min(50, 'Article text must be at least 50 characters.')
    .describe('The text content of the article to analyze.'),
});

// Schemas for: train-on-tag.ts
export const TrainOnTagInputSchema = z.object({
  tag: z.string().describe('The tag being trained on.'),
  contentItems: z.array(z.any()).describe('An array of content items associated with the tag.'),
});
export const TrainOnTagOutputSchema = z.object({
  summary: z.string().describe('A summary of the training session.'),
  itemsProcessed: z.number().describe('The number of items processed.'),
});

// Schemas for: translate-text.ts
const LanguageCode = z.enum(['en', 'hi', 'sa', 'kn', 'ta', 'te', 'bn', 'gu', 'ml', 'ne', 'bo']);
export const TranslateTextInputSchema = z.object({
  text: z.string().describe('The text to translate.'),
  targetLang: LanguageCode.describe("The IETF language tag of the target language."),
});
export const TranslateTextOutputSchema = z.object({
  translation: z.string().describe('The translated text.'),
});

// Schemas for: translate-to-sanskrit.ts
export const TranslateToSanskritInputSchema = z.object({
  text: z.string().describe('The text to translate to Sanskrit.'),
});
export const TranslateToSanskritOutputSchema = z.object({
  translation: z.string().describe('The translated text in Sanskrit.'),
});

// Schemas for: vaia-copilot.ts
const MessageSchema = z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
});
export const VaiaCopilotInputSchema = z.object({
  history: z.array(MessageSchema).describe("The entire conversation history."),
  userName: z.string().describe("The name of the user for personalization, which could be their profile name or a preferred title like 'Acharya'."),
  userId: z.string(),
  userRole: z.string().optional(),
  sessionId: z.string(),
});

// Schemas for: text-to-speech.ts
// export const TextToSpeechInputSchema = z.object({
//   text: z.string().describe('The text to convert to speech.'),
// });
// export const TextToSpeechOutputSchema = z.object({
//   audioDataUri: z.string().describe("The generated audio as a data URI in WAV format."),
// });

// Schemas for email-otp.ts
export const EmailOtpInputSchema = z.object({
    email: z.string().email(),
});

export const VerifyOtpInputSchema = z.object({
    email: z.string().email(),
    otp: z.string().length(6),
});

// Type Exports
export type CheckGrammarInput = z.infer<typeof CheckGrammarInputSchema>;
export type CheckGrammarOutput = z.infer<typeof CheckGrammarOutputSchema>;
export type ExtractCitationsInput = z.infer<typeof ExtractCitationsInputSchema>;
export type ExtractCitationsOutput = z.infer<typeof ExtractCitationsOutputSchema>;
export type ExtractGlossaryTermsInput = z.infer<typeof ExtractGlossaryTermsInputSchema>;
export type ExtractGlossaryTermsOutput = z.infer<typeof ExtractGlossaryTermsOutputSchema>;
export type GenerateGlossaryFromProseInput = z.infer<typeof GenerateGlossaryFromProseInputSchema>;
export type GenerateGlossaryFromProseOutput = z.infer<typeof GenerateGlossaryFromProseOutputSchema>;
export type GenerateSanskritVariationsInput = z.infer<typeof GenerateSanskritVariationsInputSchema>;
export type GenerateSanskritVariationsOutput = z.infer<typeof GenerateSanskritVariationsOutputSchema>;
export type SearchQuotesContextuallyInput = z.infer<typeof SearchQuotesContextuallyInputSchema>;
export type SearchQuotesContextuallyOutput = z.infer<typeof SearchQuotesContextuallyOutputSchema>;
export type SuggestCitationsForArticleInput = z.infer<typeof SuggestCitationsForArticleInputSchema>;
export type TrainOnTagInput = z.infer<typeof TrainOnTagInputSchema>;
export type TrainOnTagOutput = z.infer<typeof TrainOnTagOutputSchema>;
export type TranslateTextInput = z.infer<typeof TranslateTextInputSchema>;
export type TranslateTextOutput = z.infer<typeof TranslateTextOutputSchema>;
export type TranslateToSanskritInput = z.infer<typeof TranslateToSanskritInputSchema>;
export type TranslateToSanskritOutput = z.infer<typeof TranslateToSanskritOutputSchema>;
export type VaiaCopilotInput = z.infer<typeof VaiaCopilotInputSchema>;
// export type TextToSpeechInput = z.infer<typeof TextToSpeechInputSchema>;
// export type TextToSpeechOutput = z.infer<typeof TextToSpeechOutputSchema>;
export type EmailOtpInput = z.infer<typeof EmailOtpInputSchema>;
export type VerifyOtpInput = z.infer<typeof VerifyOtpInputSchema>;
