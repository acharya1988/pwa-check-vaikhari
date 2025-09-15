
'use server';

import { z } from 'zod';
import { addGlossaryCategory, addGlossaryTerm, bulkAddTermsToCategory } from '@/services/glossary.service';
import { revalidatePath } from 'next/cache';
import { extractGlossaryTerms, type ExtractGlossaryTermsOutput } from '@/ai/flows/extract-glossary-terms';
import type { GlossaryTerm } from '@/types';
import { cloneContentForSuperAdmin } from '@/services/super-admin.service';
import { getUserProfile } from '@/services/user.service';
import { getGlossaryData } from '@/services/glossary.service';

const CategorySchema = z.object({
    name: z.string().min(1, 'Category name is required.'),
});

const TermSchema = z.object({
    categoryId: z.string().optional(),
    term: z.string().min(1, 'Term is required.'),
    transliteration: z.string().optional(),
    definition: z.string().min(1, 'Definition is required.'),
});

async function handleFormSubmission(validatedFields: any, action: Function, revalidate?: string) {
    if (!validatedFields.success) {
        return {
            error: "Validation failed",
            fieldErrors: validatedFields.error.flatten().fieldErrors,
        };
    }
    try {
        await action(validatedFields.data);
        if (revalidate) {
            revalidatePath(revalidate);
        }
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function createGlossaryCategory(prevState: any, formData: FormData) {
    const validatedFields = CategorySchema.safeParse({ name: formData.get('name') });
    return handleFormSubmission(validatedFields, async (data) => addGlossaryCategory(data.name), '/admin/glossary');
}

export async function createGlossaryTerm(prevState: any, formData: FormData) {
     const validatedFields = TermSchema.safeParse({
        categoryId: formData.get('categoryId'),
        term: formData.get('term'),
        transliteration: formData.get('transliteration'),
        definition: formData.get('definition'),
    });

    if (!validatedFields.success) {
        return {
            error: "Validation failed",
            fieldErrors: validatedFields.error.flatten().fieldErrors,
        };
    }

    const data = validatedFields.data;
    const categoryId = data.categoryId || 'uncategorized';

    try {
        const userProfile = await getUserProfile();
        const newTerm = await addGlossaryTerm(categoryId, data);

        await cloneContentForSuperAdmin(
            newTerm.id,
            'glossary-term',
            userProfile.email,
            `/admin/glossary`,
            newTerm
        );

        revalidatePath('/admin/glossary');
        return { success: true, message: "Glossary term created." };
    } catch (error: any) {
        return { error: error.message };
    }
}

export interface GlossaryParserResult {
    terms: (ExtractGlossaryTermsOutput['terms'][number] & { id: string })[];
    errors?: string[];
    error?: string;
    success?: boolean;
    data?: any;
}

export async function runGlossaryParser(prevState: any, formData: FormData): Promise<GlossaryParserResult | { error: string, fieldErrors?: any }> {
    
    let textToParse = '';
    const sourceType = formData.get('sourceType');
    
    if (sourceType === 'paste') {
        textToParse = formData.get('paste_data') as string || '';
    } else if (sourceType === 'ai') {
        textToParse = formData.get('ai_data') as string || '';
    } else if (sourceType === 'upload') {
        const file = formData.get('file') as File;
        if (file && file.size > 0) {
            textToParse = await file.text();
        } else {
             return { error: 'Please select a file to upload.' };
        }
    }

    if (!textToParse || !textToParse.trim()) {
        return { error: 'No text was provided to parse.' };
    }

    try {
        const aiResult = await extractGlossaryTerms({ text: textToParse });
        
        if (aiResult.terms.length === 0) {
            return { error: 'The AI could not extract any glossary terms. Please check the text format.' };
        }
        
        const termsWithClientIds = aiResult.terms.map(t => ({
            ...t,
            id: crypto.randomUUID(),
        }));

        return { success: true, data: { terms: termsWithClientIds } };

    } catch (e: any) {
        console.error("Glossary Parser AI Flow Error:", e);
        return { error: `An error occurred during AI parsing: ${e.message}` };
    }
}


const ImportGlossarySchema = z.object({
  categoryId: z.string().min(1, 'A category must be selected.'),
  terms: z.string().min(1, 'Parsed terms data is missing.'),
});

export async function importGlossaryData(prevState: any, formData: FormData) {
    const validatedFields = ImportGlossarySchema.safeParse({
        categoryId: formData.get('categoryId'),
        terms: formData.get('terms'),
    });
    
    if (!validatedFields.success) {
        return {
            error: "Validation failed before import.",
            fieldErrors: validatedFields.error.flatten().fieldErrors,
        };
    }
    
    const { categoryId, terms: termsJson } = validatedFields.data;
    let termsToImport: Omit<GlossaryTerm, 'id'>[] = [];

    try {
        termsToImport = JSON.parse(termsJson);
    } catch (e) {
        return { error: "Could not parse the terms data for import." };
    }
    
    if (termsToImport.length === 0) {
        return { error: "There are no terms to import." };
    }

    try {
        const userProfile = await getUserProfile();
        const result = await bulkAddTermsToCategory(categoryId, termsToImport);

        // This is less efficient, but required by the file-based DB structure.
        // A real DB would return the added items.
        const allTerms = await getGlossaryData().then(cats => cats.find(c => c.id === categoryId)?.terms || []);
        const addedTerms = termsToImport.slice(0, result.added);
        for(const termData of addedTerms) {
            const newTerm = allTerms.find(t => t.term === termData.term);
            if (newTerm) {
                 await cloneContentForSuperAdmin(
                    newTerm.id,
                    'glossary-term',
                    userProfile.email,
                    `/admin/glossary`,
                    newTerm
                );
            }
        }
        
        let message = `Successfully imported ${result.added} new terms.`;
        if (result.skipped > 0) {
            message += ` Skipped ${result.skipped} existing terms.`;
        }
        revalidatePath('/admin/glossary');
        return { success: true, message };
    } catch (error: any) {
        return { error: error.message };
    }
}
