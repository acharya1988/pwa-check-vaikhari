

import { z } from 'zod';

export interface CorpusEntry {
    book: string;
    chapter: number | string;
    verse: number | string;
    text_sanskrit: string;
    text_english: string;
}

export const CommentaryInfoSchema = z.object({
  type: z.string(),
  author: z.string(),
  workName: z.string(),
  shortName: z.string(),
});
export type CommentaryInfo = z.infer<typeof CommentaryInfoSchema>;

export const SparkSchema = z.object({
  id: z.string(),
  author: z.any(), // Simplified for now
  content: z.string(),
  createdAt: z.number(),
});
export type Spark = z.infer<typeof SparkSchema>;

export const LayerAnnotationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  bookId: z.string(),
  chapterId: z.string(),
  verse: z.string(),
  blockId: z.string(),
  content: z.string(),
  timestamp: z.number(),
  bookName: z.string(),
  chapterName: z.string(),
  articleTitle: z.string(),
  blockSanskrit: z.string().optional(),
});
export type LayerAnnotation = z.infer<typeof LayerAnnotationSchema>;

export const PointLinkSchema = z.object({
  id: z.string(),
  authorId: z.string(),
  timestamp: z.number(),
  target: z.object({
    bookId: z.string(),
    chapterId: z.union([z.string(), z.number()]),
    verse: z.union([z.string(), z.number()]),
    blockId: z.string().optional(),
    articleTitle: z.string(),
  }),
  comment: z.string().optional(),
});
export type PointLink = z.infer<typeof PointLinkSchema>;

export const GlowSchema = z.object({
  userId: z.string(),
  timestamp: z.number(),
});
export type Glow = z.infer<typeof GlowSchema>;

export const ContentBlockSchema = z.object({
  id: z.string(),
  type: z.string().min(1, "Block type is required."),
  sanskrit: z.string(),
  originalLang: z.string().optional(),
  translations: z.record(z.string()).optional(),
  commentary: CommentaryInfoSchema.optional(),
  sparks: z.array(SparkSchema).optional(),
  layers: z.array(LayerAnnotationSchema).optional(),
  points: z.array(PointLinkSchema).optional(),
  glows: z.array(GlowSchema).optional(),
});
export type ContentBlock = z.infer<typeof ContentBlockSchema>;

export interface LinkableArticle {
    id: string;
    url: string;
    label: string;
}

export interface VersionedText {
  id: string;
  originalText: string;
  versions: string[];
}
