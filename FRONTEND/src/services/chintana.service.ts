
"use server";

import type { ChintanaThread, ChintanaCategory, ChintanaPost, ChintanaPostType, PostAuthor, ChintanaPostReactions } from '@/types';
import slugify from 'slugify';
import { isSuperAdmin } from './user.service';
import { getDb } from '@/lib/mongo';
import { serializeMongo } from '@/lib/serialize';

// --- Category Functions ---
export async function getChintanaCategories(): Promise<ChintanaCategory[]> {
  const db = await getDb();
  const list = await db.collection<ChintanaCategory>('chintana_categories').find({}).toArray();
  return serializeMongo(list) as any as ChintanaCategory[];
}

// --- Thread Functions ---
export async function getChintanaThreads(): Promise<ChintanaThread[]> {
  const db = await getDb();
  const threads = serializeMongo(await db.collection<ChintanaThread>('chintana_threads').find({}).toArray()) as any as ChintanaThread[];
  return threads.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

export async function getThreadsForUser(userId: string): Promise<ChintanaThread[]> {
    const allThreads = await getChintanaThreads();
    return allThreads.filter(thread => 
        (thread.followers || []).includes(userId) || (thread.posts || []).some(p => p.author.id === userId)
    );
}


export async function getChintanaThread(threadId: string): Promise<ChintanaThread | undefined> {
    const db = await getDb();
    const threadDataRaw = await db.collection<ChintanaThread>('chintana_threads').findOne({ id: threadId });
    const threadData = threadDataRaw ? (serializeMongo(threadDataRaw) as any as ChintanaThread) : null;
    if (!threadData) return undefined;

    // Manually reconstruct nested replies
    const postsMap = new Map<string, ChintanaPost>();
    const allPosts: ChintanaPost[] = [];

    const flattenPosts = (posts: ChintanaPost[]) => {
        for (const post of posts) {
            allPosts.push(post);
            postsMap.set(post.id, { ...post, replies: [] }); // Initialize replies array
            if (post.replies && post.replies.length > 0) {
                flattenPosts(post.replies);
            }
        }
    };
    
    if (threadData.posts) {
        flattenPosts(threadData.posts);
    }
    
    // This logic assumes replies are stored flatly with a `replyToPostId`
    // which is not the case. The current structure is already nested.
    // The following is redundant if the data is already nested correctly.
    // For now, we will assume the data is correctly nested and just return it.
    
  return threadData;
}

const findPostRecursive = (posts: ChintanaPost[], postId: string): ChintanaPost | null => {
  for (const post of posts) {
    if (post.id === postId) return post;
    if (post.replies && post.replies.length > 0) {
      const found = findPostRecursive(post.replies, postId);
      if (found) return found;
    }
  }
  return null;
};


export async function updatePostReaction(
  threadId: string,
  postId: string,
  reaction: keyof ChintanaPostReactions
): Promise<ChintanaPost> {
  const db = await getDb();
  const thread = (await db.collection<ChintanaThread>('chintana_threads').findOne({ id: threadId })) as any as ChintanaThread | null;
  if (!thread) throw new Error('Thread not found.');
  const post = findPostRecursive(thread.posts, postId);
  if (!post) throw new Error("Post not found.");
  
  if (!post.reactions) {
     post.reactions = { upvotes: 0, downvotes: 0, insightful: 0, pramanaRequested: 0, fallacyFlagged: 0, love: 0, explanationRequested: 0 };
  }
  
  if (post.reactions[reaction] === undefined) {
      post.reactions[reaction] = 0;
  }
  post.reactions[reaction]++;

  await db.collection('chintana_threads').updateOne({ id: threadId }, { $set: thread as any });
  return post;
}


export async function createChintanaThread(
    author: PostAuthor,
    title: string,
    genreId: string,
    categoryId: string,
    subCategoryId: string | undefined,
    tags: string[],
    initialPost: { content: string, postType: ChintanaPostType }
): Promise<ChintanaThread> {
    const newThreadId = slugify(title, { lower: true, strict: true, remove: /[*+~.()'"!:@]/g }) || `thread-${Date.now()}`;
    const db = await getDb();
    const exists = await db.collection('chintana_threads').findOne({ id: newThreadId });
    if (exists) {
        throw new Error("A thread with a similar title already exists.");
    }
    
    const newThread: ChintanaThread = {
        id: newThreadId,
        title,
        author,
        genreId,
        categoryId,
        subCategoryId,
        tags,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        followers: [author.id],
        posts: [
            {
                id: crypto.randomUUID(),
                author,
                content: initialPost.content,
                postType: initialPost.postType,
                createdAt: Date.now(),
                reactions: { upvotes: 0, downvotes: 0, insightful: 0, pramanaRequested: 0, fallacyFlagged: 0, love: 0, explanationRequested: 0 },
                replies: [],
            }
        ]
    };
    
    await db.collection('chintana_threads').insertOne(newThread as any);
    return newThread;
}

export async function addPostToThread(
    threadId: string,
    author: PostAuthor,
    content: string,
    postType: ChintanaPostType,
    replyToPostId?: string,
    title?: string,
): Promise<ChintanaThread> {
    const db = await getDb();
    const thread = (await db.collection<ChintanaThread>('chintana_threads').findOne({ id: threadId })) as any as ChintanaThread | null;
    if (!thread) throw new Error('Thread not found.');

    const newPost: ChintanaPost = {
        id: crypto.randomUUID(),
        author,
        content,
        postType,
        createdAt: Date.now(),
        reactions: { upvotes: 0, downvotes: 0, insightful: 0, pramanaRequested: 0, fallacyFlagged: 0, love: 0, explanationRequested: 0 },
        replies: [],
    };
    
    if (title && postType === 'fallacy-flag') {
        newPost.title = title;
    }
    
    if (replyToPostId) {
        const parentPost = findPostRecursive(thread.posts, replyToPostId);
        if (!parentPost) {
             throw new Error("Parent post to reply to was not found.");
        }
        if (!parentPost.replies) {
            parentPost.replies = [];
        }
        parentPost.replies.push(newPost);
    } else {
        thread.posts.push(newPost);
    }
    
    thread.updatedAt = Date.now();
    await db.collection('chintana_threads').updateOne({ id: threadId }, { $set: thread as any });
    return thread;
}

export async function deleteChintanaThread(threadId: string, userId: string): Promise<void> {
    const db = await getDb();
    const thread = (await db.collection<ChintanaThread>('chintana_threads').findOne({ id: threadId })) as any as ChintanaThread | null;
    if (!thread) throw new Error('Thread not found.');
    const isAdmin = await isSuperAdmin(userId);
    if (!isAdmin && thread.author.id !== userId) {
        throw new Error("You are not authorized to delete this thread.");
    }
    await db.collection('chintana_threads').deleteOne({ id: threadId });
}
