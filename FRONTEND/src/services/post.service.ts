

"use server";

import type { Post, PostType, AttachedWork, Spark, Answer, UserProfile, PostMethod } from '@/types';
import { announceWork } from './book.service';
import { isSuperAdmin } from './user.service';
import { getDb } from '@/lib/mongo';
import { serializeMongo } from '@/lib/serialize';

const POSTS_COLLECTION = 'posts';
const CIRCLE_POSTS_COLLECTION = 'circle_posts';

function migratePost(post: any): Post {
    if(!post.postType) post.postType = 'thought';
    if(!post.status) post.status = 'raw';
    if(post.type && post.type === 'qa') {
        post.postType = 'question';
    }
    delete post.type;
    return post;
}

export async function getPosts(): Promise<Post[]> {
  const dbm = await getDb();
  const [posts, circlePosts] = await Promise.all([
    dbm.collection<Post>(POSTS_COLLECTION).find({}).toArray(),
    dbm.collection<Post>(CIRCLE_POSTS_COLLECTION).find({}).toArray(),
  ]);
  const plain = serializeMongo([...(posts as any[]), ...(circlePosts as any[])] as any);
  return (plain as any[])
    .map(migratePost)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export async function getCirclePosts(
  circleId: string,
  opts?: { limit?: number; before?: number }
): Promise<{ items: Post[]; hasMore: boolean }> {
  const dbm = await getDb();
  const limit = Math.min(Math.max(opts?.limit ?? 10, 1), 100);
  const filter: any = { circleId };
  if (opts?.before) {
    filter.createdAt = { $lt: opts.before };
  }
  const list = await dbm
    .collection<Post>(CIRCLE_POSTS_COLLECTION)
    .find(filter)
    .sort({ createdAt: -1 })
    .limit(limit + 1)
    .toArray();
  const plain = (serializeMongo(list as any) as any[]).map(migratePost);
  const hasMore = plain.length > limit;
  const items = hasMore ? plain.slice(0, limit) : plain;
  return { items, hasMore };
}

export async function getPost(id: string): Promise<Post | undefined> {
  const dbm = await getDb();
  const fromPosts = await dbm.collection<Post>(POSTS_COLLECTION).findOne({ id });
  if (fromPosts) return migratePost(serializeMongo(fromPosts) as any);
  const fromCircle = await dbm.collection<Post>(CIRCLE_POSTS_COLLECTION).findOne({ id });
  if (fromCircle) return migratePost(serializeMongo(fromCircle) as any);
  return undefined;
}

async function writePost(postId: string, post: Post): Promise<void> {
  const dbm = await getDb();
  const targetColName = post.postMethod === 'circle' ? CIRCLE_POSTS_COLLECTION : POSTS_COLLECTION;
  await dbm.collection(targetColName).updateOne({ id: postId }, { $set: post }, { upsert: true });
}

interface AddPostPayload {
    content: string;
    postType: PostType;
    userProfile: UserProfile;
    postMethod?: PostMethod;
    circleId?: string;
    attachedWork?: AttachedWork;
    tags?: string[];
    mentions?: string[];
    metaTags?: string[];
}

export async function addPost(payload: AddPostPayload): Promise<Post> {
    const dbm = await getDb();
    const { content, postType, userProfile, postMethod = 'feed', circleId, attachedWork, tags, mentions, metaTags } = payload;
    const targetColName = postMethod === 'circle' ? CIRCLE_POSTS_COLLECTION : POSTS_COLLECTION;
    const newId = globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : (Math.random().toString(36).slice(2) + Date.now());

    // const newPost: Post = {
    //     id: newPostRef.id,
    //     postType,
    //     postMethod,
    //     circleId: postMethod === 'circle' ? circleId : {},
    //     status: 'raw',
    //     author: { 
    //         id: userProfile.email, 
    //         name: userProfile.name, 
    //         avatarUrl: userProfile.avatarUrl,
    //         role: "Mimamsaka Scholar",
    //     },
    //     content,
    //     tags,
    //     mentions,
    //     metaTags,
    //     attachedWork,
    //     createdAt: Date.now(),
    //     views: 0,
    //     reactions: { likes: 0, dislikes: 0, insightful: 0, uplifting: 0, cites: 0 },
    //     sparks: [],
    //     glows: [],
    // };
    const newPost: Post = {
  id: newId,
  postType,
  postMethod,
  ...(postMethod === 'circle' && circleId ? { circleId } : {}),
  status: 'raw',
  author: { 
    id: userProfile.email, 
    name: userProfile.name, 
    avatarUrl: userProfile.avatarUrl,
    role: "Mimamsaka Scholar",
  },
  content,
  tags,
  mentions,
  metaTags,
  ...(attachedWork ? { attachedWork } : {}),
  createdAt: Date.now(),
  views: 0,
  reactions: { likes: 0, dislikes: 0, insightful: 0, uplifting: 0, cites: 0 },
  sparks: [],
  glows: [],
};

    await dbm.collection(targetColName).insertOne(newPost as any);
    
   if (attachedWork && attachedWork.href) {
      const workId = attachedWork.href.split('/').pop();
      if (workId) {
        await announceWork(attachedWork.type, workId);
      }
   }


    // Mongo driver mutates the object to add _id; strip it and any non-plain values
    return serializeMongo(newPost) as any as Post;
}

export async function updatePost(postId: string, data: Partial<Post>): Promise<Post> {
    const dbm = await getDb();
    let existing = await dbm.collection<Post>(POSTS_COLLECTION).findOne({ id: postId });
    let targetCollection = POSTS_COLLECTION;
    if (!existing) {
        existing = await dbm.collection<Post>(CIRCLE_POSTS_COLLECTION).findOne({ id: postId });
        targetCollection = CIRCLE_POSTS_COLLECTION;
    }
    if (!existing) throw new Error('Post not found');
    const updatedData = { ...(existing as any), ...data } as any;
    await dbm.collection(targetCollection).updateOne({ id: postId }, { $set: updatedData });
    return updatedData as Post;
}

export async function updatePostReactions(postId: string, reaction: keyof Post['reactions']): Promise<Post> {
    const post = await getPost(postId);
    if(!post) throw new Error('Post not found');
    
    if(!post.reactions) post.reactions = { likes: 0, dislikes: 0, insightful: 0, uplifting: 0, cites: 0 };
    post.reactions[reaction] = (post.reactions[reaction] || 0) + 1;
    await writePost(postId, post);
    return post;
}

export async function evolvePost(postId: string): Promise<Post> {
    const post = await getPost(postId);
    if(!post) throw new Error('Post not found');
    
    post.status = 'evolving';
    await writePost(postId, post);
    return post;
}

export async function addSparkToPost(postId: string, sparkContent: string, userProfile: UserProfile): Promise<Post> {
    const post = await getPost(postId);
    if(!post) throw new Error('Post not found');
    
    const newSpark: Spark = {
        id: crypto.randomUUID(),
        author: { id: userProfile.email, name: userProfile.name, avatarUrl: userProfile.avatarUrl },
        content: sparkContent,
        createdAt: Date.now(),
    };
    const sparks = [...(post.sparks || []), newSpark];
    post.sparks = sparks;
    await writePost(postId, post);
    return post;
}

export async function toggleGlowOnPost(postId: string, userId: string): Promise<Post> {
    const post = await getPost(postId);
    if (!post) throw new Error('Post not found');
    
    if (!post.glows) post.glows = [];
    const existingGlowIndex = post.glows.findIndex(g => g.userId === userId);
    
    if (existingGlowIndex > -1) {
        post.glows.splice(existingGlowIndex, 1);
    } else {
        post.glows.push({ userId, timestamp: Date.now() });
    }
    
    if(post.glows.length > 0 && post.status !== 'evolving') {
        post.status = 'glowing';
    } else if (post.glows.length === 0 && post.status === 'glowing') {
        post.status = post.answers && post.answers.length > 0 ? 'thread-started' : 'raw';
    }

    await writePost(postId, post);
    return post;
}


export async function addAnswer(postId: string, content: string, userProfile: UserProfile): Promise<Answer> {
    const post = await getPost(postId);
    if (!post) throw new Error('Post not found');
    
    const newAnswer: Answer = {
        id: crypto.randomUUID(),
        author: { id: userProfile.email, name: userProfile.name, avatarUrl: userProfile.avatarUrl },
        content,
        createdAt: Date.now(),
        upvotes: 0,
        downvotes: 0
    };
    
    const answers = [...(post.answers || []), newAnswer];
    post.answers = answers;
    if(post.status === 'raw') {
        post.status = 'thread-started';
    }
    
    await writePost(postId, post);
    return newAnswer;
}

export async function updateAnswerReaction(postId: string, answerId: string, reaction: 'upvote' | 'downvote'): Promise<Answer> {
    const post = await getPost(postId);
    if (!post || !post.answers) throw new Error('Post or answers not found');
    
    const answer = post.answers.find(a => a.id === answerId);
    if (!answer) throw new Error('Answer not found');

    answer[reaction === 'upvote' ? 'upvotes' : 'downvotes']++;
    await writePost(postId, post);
    return answer;
}

export async function setAcceptedAnswer(postId: string, answerId: string): Promise<Post> {
    const post = await getPost(postId);
    if(!post) throw new Error("Post not found");
    post.acceptedAnswerId = answerId;
    await writePost(postId, post);
    return post;
}

export async function deletePostFromService(postId: string, userId: string): Promise<void> {
    const post = await getPost(postId);
    if (!post) throw new Error('Post not found.');

    const isAdmin = await isSuperAdmin(userId);
    if (!isAdmin && post.author.id !== userId) {
        throw new Error('You are not authorized to delete this post.');
    }

    const dbm = await getDb();
    const targetColName = post.postMethod === 'circle' ? CIRCLE_POSTS_COLLECTION : POSTS_COLLECTION;
    await dbm.collection(targetColName).deleteOne({ id: postId });
}

export async function deleteAnswerFromService(postId: string, answerId: string, userId: string): Promise<void> {
    const post = await getPost(postId);
    if (!post || !post.answers) return;

    const answerToDelete = post.answers.find(a => a.id === answerId);
    if (!answerToDelete) return;
    
    const isAdmin = await isSuperAdmin(userId);
    if (!isAdmin && answerToDelete.author.id !== userId) {
        throw new Error('You are not authorized to delete this reply.');
    }

    const newAnswers = post.answers.filter(a => a.id !== answerId);
    post.answers = newAnswers;

    if (post.acceptedAnswerId === answerId) {
        post.acceptedAnswerId = undefined;
    }

    await writePost(postId, post);
}


