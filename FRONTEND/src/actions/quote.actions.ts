

'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getUserProfile } from '@/services/user.service';
import { Quote, QuoteCategory } from '@/types';
import slugify from 'slugify';
import { searchQuotesContextually } from '@/ai/flows/search-quotes-contextually';
import { searchQuotes, addQuote, addQuoteCategory } from '@/services/quote.service';
import { stripHtml } from '@/services/service-utils';

const QuoteCategorySchema = z.object({
    name: z.string().min(3, { message: 'Category name must be at least 3 characters.' }).max(50, { message: 'Category name must be less than 50 characters.' }),
});

export async function createQuoteCategory(prevState: any, formData: FormData) {
  const user = await getUserProfile();
  if (!user) {
    return { error: 'Unauthorized' };
  }

  const validatedFields = QuoteCategorySchema.safeParse({
    name: formData.get('name'),
  });

  if (!validatedFields.success) {
    return {
      error: 'Invalid input',
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { name } = validatedFields.data;
  const id = slugify(name, { lower: true, strict: true });

  try {
    await addQuoteCategory(name);
    revalidatePath('/admin/quotes');
    return { success: true, message: 'Category created successfully.' };
  } catch (e: any) {
    return { error: 'Failed to create category.' };
  }
}

const QuoteSchema = z.object({
  title: z.string().min(1, { message: 'Title is required.' }),
  quote: z.string().min(10, { message: 'Quote must be at least 10 characters.' }),
  categoryId: z.string().min(1, { message: 'Please select a category.' }),
  author: z.string().min(1, { message: 'Author/Source is required.' }),
});

export async function createQuote(prevState: any, formData: FormData) {
    const user = await getUserProfile();
    if (!user) {
      return { error: 'Unauthorized' };
    }

    const validatedFields = QuoteSchema.safeParse({
        title: formData.get('title'),
        quote: formData.get('quote'),
        categoryId: formData.get('categoryId'),
        author: formData.get('author'),
    });

    if (!validatedFields.success) {
      return {
        error: 'Invalid input',
        fieldErrors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { title, quote, categoryId, author } = validatedFields.data;
    try {
        const newQuote = await addQuote(categoryId, { title, quote, author });
        revalidatePath('/admin/quotes');
        return { success: true, message: 'Quote created successfully.', newQuote };
    } catch (e: any) {
        console.error(e);
        return { error: 'Failed to create quote.' };
    }
}


export async function suggestQuotesForArticle(articleText: string): Promise<Quote[]> {
    if (articleText.length < 50) return [];

    try {
        const allQuotes = await searchQuotes('');
        
        if (allQuotes.length === 0) return [];

        const result = await searchQuotesContextually({ articleText, quotes: allQuotes });
        return result.relevantQuotes || [];

    } catch (e) {
        console.error('AI Quote Suggestion Error:', e);
        return [];
    }
}


export async function createQuoteFromPost(postContent: string, postAuthorName: string) {
  try {
    const plainText = stripHtml(postContent);
    const title = plainText.split(' ').slice(0, 5).join(' ') + '...';

    await addQuote('collected-from-post', {
      title,
      quote: plainText,
      author: postAuthorName,
    });
    
    revalidatePath('/admin/quotes');
    return { success: true, message: 'Post saved as a quote!' };
  } catch (e: any) {
    return { error: e.message };
  }
}
