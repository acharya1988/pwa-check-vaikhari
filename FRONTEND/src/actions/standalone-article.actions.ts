

'use server';

import { z } from 'zod';
import { 
    addStandaloneArticle as addStandaloneArticleToDb,
    addStandaloneArticleCategory,
    updateStandaloneArticleInDb,
    deleteStandaloneArticleFromDb,
    writeStandaloneArticles,
} from '@/services/standalone-article.service';
import { getStandaloneArticles } from '@/services/standalone-article.service';
import { revalidatePath } from 'next/cache';
import { getUserProfile, addNotification } from '@/services/user.service';
import { cloneContentForSuperAdmin } from '@/services/super-admin.service';
import { updatePost } from '@/services/post.service';

const CategorySchema = z.object({
    name: z.string().min(1, 'Category name is required.'),
});

const ArticleSchema = z.object({
    title: z.string().min(1, 'Title is required.'),
    type: z.enum(['article', 'abstract', 'whitepaper']),
    categoryId: z.string().min(1, 'Category is required.'),
    genreId: z.string().optional(),
    subCategoryId: z.string().optional(),
    content: z.string().min(3, 'Content cannot be empty.'),
    sourcePostId: z.string().optional(),
    tagline: z.string().optional(),
    description: z.string().optional(),
    tags: z.string().optional(),
    taggedUserIds: z.string().optional(),
    taggedOrganizationIds: z.string().optional(),
    taggedBookIds: z.string().optional(),
    taggedCircleIds: z.string().optional(),
});

const UpdateArticleSchema = z.object({
    id: z.string(),
    title: z.string().min(1, 'Title is required.'),
    content: z.string().min(3, 'Content cannot be empty.'),
});


const DeleteArticleSchema = z.object({
    id: z.string(),
});


export async function createStandaloneArticleCategory(prevState: any, formData: FormData) {
    const validatedFields = CategorySchema.safeParse({ name: formData.get('name') });
    if (!validatedFields.success) {
        return { error: "Validation failed", fieldErrors: validatedFields.error.flatten().fieldErrors };
    }
    try {
        await addStandaloneArticleCategory(validatedFields.data.name);
        revalidatePath('/admin/articles');
        return { success: true, message: 'Category created.' };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function createStandaloneArticle(prevState: any, formData: FormData) {
    const type = formData.get('type') as 'whitepaper' | 'article' | 'abstract';
    let content = '';

    if (type === 'whitepaper') {
        const sections = [
            { title: 'Title', content: formData.get('title') },
            { title: 'Subtitle', content: formData.get('subtitle') },
            { title: 'Author(s)', content: formData.get('author') },
            { title: 'Date', content: formData.get('date') },
            { title: 'Abstract / Executive Summary', content: formData.get('abstract') },
            { title: 'Introduction', content: formData.get('introduction') },
            { title: 'Problem Statement', content: formData.get('problem') },
            { title: 'Objective / Scope', content: formData.get('objective') },
            { title: 'Methodology or Approach', content: formData.get('methodology') },
            { title: 'Proposed Solution or Insight', content: formData.get('solution') },
            { title: 'Benefits & Impact', content: formData.get('benefits') },
            { title: 'Comparison / Competitive Analysis', content: formData.get('comparison') },
            { title: 'Conclusion', content: formData.get('conclusion') },
            { title: 'References / Citations', content: formData.get('references') },
            { title: 'Appendix / Glossary', content: formData.get('appendix') },
        ];
        
        content = sections
            .filter(section => section.content)
            .map(section => `<h2>${section.title}</h2><p>${(section.content as string).replace(/\n/g, '<br>')}</p>`)
            .join('');
    } else {
        content = formData.get('content') as string;
    }

    const validatedFields = ArticleSchema.safeParse({
        title: formData.get('title'),
        type: formData.get('type'),
        categoryId: formData.get('categoryId'),
        genreId: formData.get('genreId') || undefined,
        subCategoryId: formData.get('subCategoryId') || undefined,
        content: content,
        sourcePostId: formData.get('sourcePostId') || undefined,
        tagline: formData.get('tagline') || undefined,
        description: formData.get('description') || undefined,
        tags: formData.get('tags') || undefined,
        taggedUserIds: formData.get('taggedUserIds') || undefined,
        taggedOrganizationIds: formData.get('taggedOrganizationIds') || undefined,
        taggedBookIds: formData.get('taggedBookIds') || undefined,
        taggedCircleIds: formData.get('taggedCircleIds') || undefined,
    });

    if (!validatedFields.success) {
        return { error: "Validation failed.", fieldErrors: validatedFields.error.flatten().fieldErrors };
    }
    try {
        const userProfile = await getUserProfile();
        const { sourcePostId, tags, taggedUserIds, taggedOrganizationIds, taggedBookIds, taggedCircleIds, ...articleData } = validatedFields.data;
        const newArticleData = { 
            ...articleData, 
            ownerId: userProfile.email,
            tags: tags ? tags.split(',') : [],
            taggedUserIds: taggedUserIds ? taggedUserIds.split(',') : [],
            taggedOrganizationIds: taggedOrganizationIds ? taggedOrganizationIds.split(',') : [],
            taggedBookIds: taggedBookIds ? taggedBookIds.split(',') : [],
            taggedCircleIds: taggedCircleIds ? taggedCircleIds.split(',') : [],
        };
        const newArticle = await addStandaloneArticleToDb(newArticleData);
        
        if (sourcePostId) {
            await updatePost(sourcePostId, { 
                status: 'evolving', 
                evolvedTo: { type: 'standalone-article', id: newArticle.id, title: newArticle.title } 
            });
        }

        await cloneContentForSuperAdmin(
            newArticle.id,
            'standalone-article',
            userProfile.email,
            `/admin/articles/edit/${newArticle.id}`,
            newArticle
        );
        
        // Notify followers of the author
        const followers = userProfile.followers || [];
        for (const followerId of followers) {
            await addNotification(followerId, {
                type: 'newArticleInBook', // Reusing this type for now
                actor: userProfile,
                title: 'New Article Published',
                message: `${userProfile.name} published a new article: "${newArticle.title}".`,
                link: `/admin/articles/edit/${newArticle.id}`,
            });
        }


        revalidatePath('/admin/articles');
        revalidatePath('/admin/profile');
        revalidatePath(`/admin/my-evolutions`);
        return { success: true, message: `${type} created.`, redirectPath: `/admin/articles/edit/${newArticle.id}` };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function updateStandaloneArticle(prevState: any, formData: FormData) {
     const validatedFields = UpdateArticleSchema.safeParse({
        id: formData.get('id'),
        title: formData.get('title'),
        content: formData.get('content'),
    });

    if (!validatedFields.success) {
        return { error: "Validation failed.", fieldErrors: validatedFields.error.flatten().fieldErrors };
    }
     try {
        const userProfile = await getUserProfile();
        const updatedArticle = await updateStandaloneArticleInDb(validatedFields.data.id, validatedFields.data);
        
        await cloneContentForSuperAdmin(
            updatedArticle.id,
            'standalone-article',
            userProfile.email,
            `/admin/articles/edit/${updatedArticle.id}`,
            updatedArticle
        );
        
        revalidatePath('/admin/articles');
        revalidatePath('/admin/profile');
        return { success: true, message: 'Article updated.' };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function deleteStandaloneArticle(prevState: any, formData: FormData) {
    const validatedFields = DeleteArticleSchema.safeParse({ id: formData.get('id') });
     if (!validatedFields.success) {
        return { error: "Invalid data for deletion." };
    }
    try {
        await deleteStandaloneArticleFromDb(validatedFields.data.id);
        revalidatePath('/admin/articles');
        revalidatePath('/admin/profile');
        return { success: true, message: 'Article deleted.' };
    } catch (error: any) {
        return { error: error.message };
    }
}

const StandaloneArticleFeedbackSchema = z.object({
    articleId: z.string(),
    action: z.enum(['like', 'dislike', 'insightful', 'uplifting']),
});

export async function handleStandaloneArticleFeedback(prevState: any, formData: FormData) {
    const validatedFields = StandaloneArticleFeedbackSchema.safeParse(Object.fromEntries(formData));
    if (!validatedFields.success) {
        return { error: 'Invalid feedback data.' };
    }
    const { articleId, action } = validatedFields.data;

    try {
        const articles = await getStandaloneArticles();
        const articleIndex = articles.findIndex(a => a.id === articleId);
        if (articleIndex === -1) {
            throw new Error('Article not found.');
        }

        const article = articles[articleIndex];
        if (!article.feedback) {
            article.feedback = { likes: 0, dislikes: 0, insightful: 0, uplifting: 0, views: 0, scores: [] };
        }
        
        switch(action) {
            case 'like': article.feedback.likes = (article.feedback.likes || 0) + 1; break;
            case 'dislike': article.feedback.dislikes = (article.feedback.dislikes || 0) + 1; break;
            case 'insightful': article.feedback.insightful = (article.feedback.insightful || 0) + 1; break;
            case 'uplifting': article.feedback.uplifting = (article.feedback.uplifting || 0) + 1; break;
        }

        articles[articleIndex] = article;
        await writeStandaloneArticles(articles);
        revalidatePath('/admin/profile');
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

    
