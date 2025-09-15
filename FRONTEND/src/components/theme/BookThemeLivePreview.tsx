
'use client';

import React from 'react';
import type { BookContent, Article, Chapter } from '@/types';
import { useBookTheme } from './BookThemeContext';
import { ThemeApplier } from './ThemeApplier';
import { ScrollArea } from '../ui/scroll-area';
import { Card, CardContent } from '../ui/card';
import { PublicArticleRenderer } from '../public-article-renderer';
import { TransliterationProvider } from '../transliteration-provider';

export function BookThemeLivePreview({ bookContent }: { bookContent: BookContent }) {
    const { theme } = useBookTheme();

    // Create a comprehensive preview article that showcases all typographic elements.
    const previewArticle = React.useMemo(() => {
        const dummyChapter: Chapter = { id: 'preview-ch', name: 'Preview Chapter', articles: [] };
        const dummyArticle: Article = {
            verse: '1',
            title: 'Theme Preview Article',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            author: { id: 'preview', name: 'Vaikhari System', avatarUrl: '' },
            status: 'published',
            tags: [],
            content: [
                { id: 'h1', type: 'shloka', sanskrit: '<h1>Heading 1: Vaikhari Theme</h1>' },
                { id: 'p1', type: 'shloka', sanskrit: '<p>This is a paragraph demonstrating the body text style. It serves as the base for all general text content within the reader.</p>' },
                { id: 'h2', type: 'shloka', sanskrit: '<h2>Heading 2: Primary Texts</h2>' },
                { id: 'sutra1', type: 'sutra', sanskrit: '<p>अथातो ब्रह्मजिज्ञासा। (Sutra)</p>' },
                { id: 'p2', type: 'shloka', sanskrit: '<p>Following a sutra, you might have more descriptive text that continues the narrative or explanation, styled as a standard paragraph.</p>' },
                { id: 'h3', type: 'shloka', sanskrit: '<h3>Heading 3: Commentaries</h3>' },
                { id: 'bhashya1', type: 'bhashya', sanskrit: '<p>This is a Bhashya block, intended for primary commentary on a source text. It can be styled distinctly to separate it from the main verses.</p>', commentary: { type: 'bhashya', author: 'Adi Shankara', workName: 'Brahmasutra Bhashya', shortName: 'Śāṅkara Bhāṣya' } },
                { id: 'teeka1', type: 'teeka', sanskrit: '<p>This is a Tīkā, or sub-commentary, which often elaborates on the Bhashya itself. It can have its own unique styling to indicate a different layer of analysis.</p>', commentary: { type: 'teeka', author: 'Vācaspati Miśra', workName: 'Bhāmatī', shortName: 'Bhāmatī' } },
                { id: 'h4', type: 'shloka', sanskrit: '<h4>Heading 4: Inline Elements</h4>' },
                { id: 'p3', type: 'shloka', sanskrit: '<p>Within any text, you can have <span data-citation="true" data-ref-id="CS_Sutra_27.297">inline citations</span>, which are styled differently. You can also have <blockquote>a blockquote, often used for quoting external sources, attributed to an author.</blockquote> And finally, text with a <span data-versions="[&quot;different version&quot;, &quot;another reading&quot;]" class="version-word">textual variant</span> shows alternative readings from manuscripts.</p>' },
                { id: 'h5', type: 'shloka', sanskrit: '<h5>Heading 5: Notes</h5>' },
                { id: 'p4', type: 'shloka', sanskrit: '<p>The system supports both standard footnotes<sup data-type="footnote" data-content="This is an example of a footnote."></sup> and special notes<sup data-type="specialnote" data-content="This is a special note, perhaps for editorial comments."></sup>, each with their own styling.</p>' },
                { id: 'h6', type: 'shloka', sanskrit: '<h6>Heading 6: Smallest Heading</h6>' },
            ],
        };
        return { chapter: dummyChapter, article: dummyArticle };
    }, []);

    return (
        <div className="relative h-full bg-muted/40">
            {theme && <ThemeApplier theme={theme} scopeToId="theme-preview" />}
            <ScrollArea className="h-full">
                <div id="theme-preview" className="p-8">
                     <Card className="shadow-lg">
                        <CardContent className="p-6 md:p-8">
                            <TransliterationProvider>
                                {previewArticle ? (
                                    <PublicArticleRenderer 
                                        blocks={previewArticle.article.content}
                                        articleInfo={{ book: bookContent, chapter: previewArticle.chapter, article: previewArticle.article }}
                                        bookmarks={[]}
                                        isPreviewMode={true}
                                    />
                                ) : (
                                    <div className="text-center text-muted-foreground p-8">
                                        <p>No content available in this book to preview.</p>
                                    </div>
                                )}
                            </TransliterationProvider>
                        </CardContent>
                    </Card>
                </div>
            </ScrollArea>
        </div>
    );
}
