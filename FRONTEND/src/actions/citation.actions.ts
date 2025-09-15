

'use server';

import { z } from 'zod';
import { 
    addCitation, 
    bulkAddCitations, 
    addCitationCategory,
    deleteCitationCategory as deleteCategory,
    updateCitationCategory as updateCategory,
    updateCitation as updateCitationDataService,
    deleteCitation as deleteCitationDataService,
} from '@/services/citation.service';
import { revalidatePath } from 'next/cache';
import { extractCitations, type ExtractCitationsOutput } from '@/ai/flows/extract-citations';
import type { Citation } from '@/types';
import { cloneContentForSuperAdmin } from '@/services/super-admin.service';
import { getUserProfile } from '@/services/user.service';

const CategorySchema = z.object({
    name: z.string().min(1, 'Category name is required.'),
});

const CitationSchema = z.object({
    categoryId: z.string().min(1, 'Category is required.'),
    refId: z.string().min(1, 'Reference ID is required.'),
    keywords: z.string().optional(),
    sanskrit: z.string().min(1, 'Sanskrit text is required.'),
    translation: z.string().optional(),
    source: z.string().min(1, 'Source is required.'),
    location: z.string().min(1, 'Location is required.'),
});

const UpdateCitationSchema = z.object({
    categoryId: z.string().min(1),
    originalRefId: z.string().min(1),
    refId: z.string().min(1, 'Reference ID is required.'),
    keywords: z.string().optional(),
    sanskrit: z.string().min(1, 'Sanskrit text is required.'),
    translation: z.string().optional(),
    source: z.string().min(1, 'Source is required.'),
    location: z.string().min(1, 'Location is required.'),
});


const DeleteCategorySchema = z.object({
    id: z.string().min(1, 'Category ID is required.'),
});

const DeleteCitationSchema = z.object({
    categoryId: z.string().min(1),
    refId: z.string().min(1),
});


const UpdateCategorySchema = z.object({
    id: z.string().min(1, 'Category ID is required.'),
    name: z.string().min(1, 'New category name is required.'),
});


export async function createCitationCategory(prevState: any, formData: FormData) {
    const validatedFields = CategorySchema.safeParse({ name: formData.get('name') });
    if (!validatedFields.success) {
        return {
            error: "Validation failed",
            fieldErrors: validatedFields.error.flatten().fieldErrors,
        };
    }
    try {
        await addCitationCategory(validatedFields.data.name);
        revalidatePath('/admin/citations');
        return { success: true, message: 'Category created.' };
    } catch (error: any) {
        return { error: error.message };
    }
}


export async function createCitation(prevState: any, formData: FormData): Promise<{
    error?: string;
    fieldErrors?: any;
    success?: boolean;
    newCitation?: Citation;
}> {
     const validatedFields = CitationSchema.safeParse({
        categoryId: formData.get('categoryId'),
        refId: formData.get('refId'),
        keywords: formData.get('keywords'),
        sanskrit: formData.get('sanskrit'),
        translation: formData.get('translation'),
        source: formData.get('source'),
        location: formData.get('location'),
    });
    
    if (!validatedFields.success) {
        return {
            error: "Validation failed",
            fieldErrors: validatedFields.error.flatten().fieldErrors,
        };
    }

    try {
        const userProfile = await getUserProfile();
        const data = validatedFields.data;
        
        const citationPayload = {
            refId: data.refId,
            keywords: data.keywords ? data.keywords.split(',').map(k => k.trim()).filter(Boolean) : [],
            sanskrit: data.sanskrit,
            translation: data.translation || '',
            source: data.source,
            location: data.location,
        };
        const newCitation = await addCitation(data.categoryId, citationPayload);

        await cloneContentForSuperAdmin(
            newCitation.refId,
            'citation',
            userProfile.email,
            `/admin/citations/${data.categoryId}`,
            newCitation
        );

        revalidatePath('/admin/citations');
        revalidatePath(`/admin/citations/${data.categoryId}`);
        revalidatePath('/admin/books'); // For keywords
        return { success: true, newCitation: newCitation };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function updateCitation(prevState: any, formData: FormData): Promise<{
    error?: string;
    fieldErrors?: any;
    success?: boolean;
}> {
    const validatedFields = UpdateCitationSchema.safeParse(Object.fromEntries(formData.entries()));
    
    if (!validatedFields.success) {
        return {
            error: "Validation failed",
            fieldErrors: validatedFields.error.flatten().fieldErrors,
        };
    }

    try {
        const userProfile = await getUserProfile();
        const { categoryId, originalRefId, ...data } = validatedFields.data;

        const citationPayload = {
            ...data,
            keywords: data.keywords ? data.keywords.split(',').map(k => k.trim()).filter(Boolean) : [],
            translation: data.translation || '',
        };
        await updateCitationDataService(categoryId, originalRefId, citationPayload);

        await cloneContentForSuperAdmin(
            data.refId,
            'citation',
            userProfile.email,
            `/admin/citations/${categoryId}`,
            citationPayload
        );

        revalidatePath(`/admin/citations/${categoryId}`);
        revalidatePath('/admin/books'); // For keywords
        return { success: true, message: 'Citation updated successfully.' };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function deleteCitation(prevState: any, formData: FormData) {
    const validatedFields = DeleteCitationSchema.safeParse(Object.fromEntries(formData.entries()));
    
    if (!validatedFields.success) {
        return { error: 'Invalid data.' };
    }
    
    try {
        const { categoryId, refId } = validatedFields.data;
        await deleteCitationDataService(categoryId, refId);
        revalidatePath(`/admin/citations/${categoryId}`);
        revalidatePath('/admin/books'); // For keywords
        return { success: true, message: 'Citation deleted successfully.' };
    } catch (error: any) {
        return { error: error.message };
    }
}


const CitationParserSchema = z.object({
    text: z.string().min(10, 'Please provide some text to parse.'),
});

// This is the output for the action, not the flow.
// It includes client-side IDs for the review step.
export interface CitationParserResult {
    citations: (ExtractCitationsOutput['citations'][number] & { clientId: string })[];
    error?: string;
}

export async function runCitationParser(prevState: any, formData: FormData): Promise<CitationParserResult | { error: string, fieldErrors?: any }> {
    const validatedFields = CitationParserSchema.safeParse({
        text: formData.get('text'),
    });

    if (!validatedFields.success) {
        return {
            error: "Validation failed",
            fieldErrors: validatedFields.error.flatten().fieldErrors,
        };
    }

    try {
        const aiResult = await extractCitations({ text: validatedFields.data.text });
        
        if (aiResult.citations.length === 0) {
            return { error: 'The AI could not extract any citations. Please check the text format.' };
        }

        const citationsWithClientIds = aiResult.citations.map(c => ({
            ...c,
            clientId: crypto.randomUUID(),
        }));

        return { citations: citationsWithClientIds };

    } catch (e: any) {
        console.error("Citation Parser AI Flow Error:", e);
        return { error: `An error occurred during AI parsing: ${e.message}` };
    }
}


const ImportCitationsSchema = z.object({
  categoryId: z.string().min(1, 'A category must be selected.'),
  citations: z.string().min(1, 'Parsed citations data is missing.'),
});

export async function importParsedCitations(prevState: any, formData: FormData) {
    const validatedFields = ImportCitationsSchema.safeParse({
        categoryId: formData.get('categoryId'),
        citations: formData.get('citations'),
    });
    
    if (!validatedFields.success) {
        return {
            error: "Validation failed before import.",
            fieldErrors: validatedFields.error.flatten().fieldErrors,
        };
    }
    
    const { categoryId, citations: citationsJson } = validatedFields.data;
    let citationsToImport: Citation[] = [];

    try {
        // The JSON from the client will have `clientId`. bulkAddCitations doesn't need it.
        citationsToImport = JSON.parse(citationsJson);
    } catch (e) {
        return { error: "Could not parse the citations data for import." };
    }
    
    if (citationsToImport.length === 0) {
        return { error: "There are no citations to import." };
    }

    try {
        const userProfile = await getUserProfile();
        const result = await bulkAddCitations(categoryId, citationsToImport);
        
        // Also clone the newly added ones to super admin
        const addedCitations = citationsToImport.slice(0, result.added);
        for(const citation of addedCitations) {
             await cloneContentForSuperAdmin(
                citation.refId,
                'citation',
                userProfile.email,
                `/admin/citations/${categoryId}`,
                citation
            );
        }

        let message = `Successfully imported ${result.added} new citations.`;
        if (result.skipped > 0) {
            message += ` Skipped ${result.skipped} existing citations.`;
        }
        revalidatePath('/admin/citations');
        revalidatePath(`/admin/citations/${categoryId}`);
        return { success: true, message };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function deleteCitationCategory(prevState: any, formData: FormData) {
    const validatedFields = DeleteCategorySchema.safeParse({ id: formData.get('id') });
    if (!validatedFields.success) {
        return { error: 'Invalid data.' };
    }
    if (validatedFields.data.id === 'uncategorized') {
        return { error: 'The "Uncategorized" collection cannot be deleted.' };
    }
    try {
        await deleteCategory(validatedFields.data.id);
        revalidatePath('/admin/citations');
        return { success: true, message: 'Collection deleted.' };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function updateCitationCategory(prevState: any, formData: FormData) {
    const validatedFields = UpdateCategorySchema.safeParse({
        id: formData.get('id'),
        name: formData.get('name'),
    });
    if (!validatedFields.success) {
        return {
            error: "Validation failed",
            fieldErrors: validatedFields.error.flatten().fieldErrors,
        };
    }
    if (validatedFields.data.id === 'uncategorized') {
        return { error: 'The "Uncategorized" collection cannot be renamed.' };
    }
    try {
        await updateCategory(validatedFields.data.id, validatedFields.data.name);
        revalidatePath('/admin/citations');
        revalidatePath(`/admin/citations/${validatedFields.data.id}`); // revalidate the detail page too
        return { success: true, message: 'Collection updated.' };
    } catch (error: any) {
        return { error: error.message };
    }
}
