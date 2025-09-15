

import { getUserProfile, getUserProfileById, getDiscoverableUsers } from "@/services/user.service";
import { getBookmarksForUser } from "@/services/user.service";
import { getPosts } from "@/services/post.service";
import { getBooksWithStats } from "@/services/book.service";
import { getCirclesForUser } from "@/services/profile.service";
import { getStandaloneArticles } from "@/services/standalone-article.service";
import { getLayersForUser } from "@/services/layer.service";
import { ProfileClientPage } from "@/components/admin/profile/profile-client-page";
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import type { Post, UserProfile as UserProfileType, Bookmark, BookWithStats, Circle, StandaloneArticle, LayerAnnotation } from '@/types';
import { LoadingAnimation } from "@/components/loading-animation";

async function ProfilePageSkeleton() {
    return <LoadingAnimation />;
}

async function ProfilePageContent({ userId }: { userId: string }) {
    const loggedInUser = await getUserProfile();
    const isOwner = loggedInUser.email === userId;

    const userProfile = await getUserProfileById(userId);
    
    if (!userProfile) {
        notFound();
    }
    
    const [bookmarks, allBooks, userCircles, posts, discoverableUsers, allStandaloneArticles, userLayers] = await Promise.all([
        getBookmarksForUser(userProfile.email),
        getBooksWithStats(),
        getCirclesForUser(userProfile.email),
        getPosts(),
        getDiscoverableUsers(),
        getStandaloneArticles(),
        getLayersForUser(userProfile.email)
    ]);

    return (
        <ProfileClientPage
            userProfile={userProfile}
            isOwner={isOwner}
            bookmarks={bookmarks}
            allBooks={allBooks}
            userCircles={userCircles}
            posts={posts}
            discoverableUsers={discoverableUsers}
            allStandaloneArticles={allStandaloneArticles}
            userLayers={userLayers}
        />
    )
}

export default async function UserProfilePage({ params }: { params: Promise<{ userId: string }> }) {
    const { userId } = await params;
    const decodedUserId = decodeURIComponent(userId);

    return (
        <Suspense fallback={<ProfilePageSkeleton />}>
            <ProfilePageContent userId={decodedUserId} />
        </Suspense>
    );
}
