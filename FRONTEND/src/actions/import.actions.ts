

'use server';

import { z } from 'zod';
import { type ParseBookTextOutput, ParseBookTextOutputSchema } from '@/types/import.types';
import { addBook, addChapter, addArticle } from '@/services/book.service';
import { bulkAddCitations } from '@/services/citation.service';
import type { ContentBlock, Citation } from '@/types';
import slugify from 'slugify';


const ImportSchema = z.object({
  categoryId: z.string().min(1, 'A category must be selected.'),
  parsedData: z.string().min(1, 'Parsed data is missing.'),
  action: z.enum(['createBook', 'createCitations']),
});


async function createBookFromParsed(categoryId: string, parsedData: ParseBookTextOutput) {
    try {
        const newBook = await addBook({
            name: parsedData.bookName,
            categoryId: categoryId,
            subtitle: parsedData.subtitle || '',
        });

        const processChaptersRecursively = async (chaptersToProcess: any[], parentChapterId?: string) => {
            for (const chapterData of chaptersToProcess) {
                const newChapter = await addChapter(newBook.id, chapterData.name, chapterData.topic, parentChapterId);
                
                if (chapterData.segments) {
                    for (const segment of chapterData.segments) {
                        if (!segment.content || segment.content.trim() === '') continue;

                        let finalContent = segment.content;
                        // Replace footnote markers in the final content with proper sup tags
                        if (segment.footnotes) {
                            finalContent = finalContent.replace(/[\[(]¹?(\d+)[)\]]?/g, (match: string, p1: string) => {
                                const noteText = segment.footnotes[p1];
                                if (noteText) {
                                    return `<sup data-type="footnote" data-content="${noteText.replace(/"/g, '&quot;')}">${p1}</sup>`;
                                }
                                return match; // Keep marker if no definition found
                            });
                        }
                        
                        const verseNum = slugify(String(segment.verseNumber) || `prose-${Math.random()}`, { lower: true, strict: true });
                        
                        const contentBlock: ContentBlock = {
                            id: crypto.randomUUID(),
                            type: segment.type,
                            sanskrit: `<p>${finalContent.replace(/\n/g, '<br>')}</p>`,
                            originalLang: 'sa',
                            translations: {},
                        };

                        await addArticle(newBook.id, newChapter.id, {
                            verse: verseNum,
                            title: segment.verseNumber && !String(segment.verseNumber).startsWith('prose-') ? `Verse ${segment.verseNumber}` : `Section`,
                            content: [contentBlock],
                        });
                    }
                }
                
                if (chapterData.children && chapterData.children.length > 0) {
                    await processChaptersRecursively(chapterData.children, newChapter.id);
                }
            }
        };
        
        await processChaptersRecursively(parsedData.chapters);
        
        return { success: true, message: `Book "${parsedData.bookName}" created successfully!` };

    } catch (e: any) {
        console.error("Error creating book from parsed data:", e);
        return { error: e.message };
    }
}


export async function importParsedData(prevState: any, formData: FormData) {
    const validatedFields = ImportSchema.safeParse({
        categoryId: formData.get('categoryId'),
        parsedData: formData.get('parsedData'),
        action: formData.get('action'),
    });

    if (!validatedFields.success) {
        return {
            error: "Validation failed before import.",
            fieldErrors: validatedFields.error.flatten().fieldErrors,
        };
    }

    const { categoryId, action } = validatedFields.data;
    let parsedData: ParseBookTextOutput;
    try {
        parsedData = JSON.parse(validatedFields.data.parsedData);
    } catch (e) {
        return { error: 'Could not parse the data for import.' };
    }
    
    if (action === 'createBook') {
        return await createBookFromParsed(categoryId, parsedData);
    } else if (action === 'createCitations') {
        return await createCitationsFromParsed(categoryId, parsedData);
    } else {
        return { error: 'Invalid import action specified.' };
    }
}


async function createCitationsFromParsed(categoryId: string, parsedData: ParseBookTextOutput) {
    const citationsToCreate: Omit<Citation, 'keywords'>[] = [];
    
    const bookSlug = slugify(parsedData.bookName, { lower: true, strict: true });

    function processChapters(chapters: any[], chapterPrefix = '') {
        chapters.forEach(chapter => {
            const chapterName = `${chapterPrefix}${chapter.name}`;
            if (chapter.segments) {
                for (const segment of chapter.segments) {
                    if ((segment.type === 'shloka' || segment.type === 'sutra') && segment.verseNumber && !String(segment.verseNumber).startsWith('prose-')) {
                        citationsToCreate.push({
                            refId: `${bookSlug}-${segment.verseNumber}`,
                            sanskrit: segment.content.replace(/<br>/g, '\n'),
                            translation: '', // No translation from this source
                            source: parsedData.bookName,
                            location: chapterName,
                        });
                    }
                }
            }
            if (chapter.children) {
                processChapters(chapter.children, `${chapterName} > `);
            }
        });
    }

    processChapters(parsedData.chapters);

    if (citationsToCreate.length === 0) {
        return { error: 'No numbered shlokas or sutras were found to create citations.' };
    }

    try {
        const result = await bulkAddCitations(categoryId, citationsToCreate.map(c => ({...c, keywords: []})));
        return { success: true, message: `Successfully created ${result.added} citations from "${parsedData.bookName}". Skipped ${result.skipped} duplicates.` };
    } catch (e: any) {
        console.error("Error creating citations from parsed data:", e);
        return { error: e.message };
    }
}
