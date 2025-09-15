import {z} from 'zod';
import { ContentBlockSchema } from '.';

export const ParseBookTextInputSchema = z.object({
  text: z.string().describe('The unstructured text of the book to be parsed.'),
});
export type ParseBookTextInput = z.infer<typeof ParseBookTextInputSchema>;

// This schema represents the AI's improved structured output.
export const AiVerseSegmentSchema = z.object({
  verseNumber: z.string().describe("The verse number, e.g., '1', '2', or 'prose-1' for content before the first numbered verse."),
  verseText: z.string().describe("The main text of the verse or prose segment. Inline footnote markers like (1) or ¹ should be preserved here."),
  footnoteText: z.string().optional().describe("The full, raw text of the corresponding footnote block (e.g., 'F.N. ...' or a list of numbered notes) associated with this verse. If no footnotes, this field should be omitted."),
});

export const AiChapterOutputSchema = z.object({
  name: z.string().describe("The chapter title."),
  segments: z.array(AiVerseSegmentSchema).describe("An array of verse and footnote segments found in this chapter."),
});

export const AiBookOutputSchema = z.object({
  bookName: z.string().describe('The detected title of the book.'),
  subtitle: z.string().optional().describe('The subtitle of the book, if any.'),
  chapters: z.array(AiChapterOutputSchema).describe('An array of top-level chapters.')
});
export type AiBookOutput = z.infer<typeof AiBookOutputSchema>;


// This is the final, structured output that the ACTION will produce after code-based processing.
export const FinalSegmentSchema = z.object({
    id: z.string(),
    type: z.enum(['shloka', 'sutra', 'prose', 'commentary', 'bhashya', 'tika', 'gadya', 'padya', 'vyakhya', 'tippani', 'heading-1', 'heading-2', 'heading-3']),
    content: z.string(),
    verseNumber: z.string().optional(),
    isAi: z.boolean().optional(),
    footnotes: z.record(z.string()).optional(),
});

export const FinalChapterSchema: z.ZodType<any> = z.lazy(() => z.object({
    id: z.string(),
    name: z.string(),
    topic: z.string().optional(),
    segments: z.array(FinalSegmentSchema).default([]),
    children: z.array(z.lazy(() => FinalChapterSchema)).optional().default([]),
}));

export const ParseBookTextOutputSchema = z.object({
  bookName: z.string().describe('The detected title of the book.'),
  subtitle: z.string().optional().describe('The detected subtitle of the book, if any.'),
  chapters: z.array(FinalChapterSchema).describe('An array of top-level chapters, fully parsed by the code.')
});
export type ParseBookTextOutput = z.infer<typeof ParseBookTextOutputSchema>;
