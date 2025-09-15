import { getPosts } from "@/services/post.service";
import { getUserProfile } from "@/services/user.service";
import { getCirclesForUser } from "@/services/profile.service";
import { getChintanaCategories, getChintanaThreads } from "@/services/chintana.service";
import { ActivityPageClient } from "./activity-client";
import { redirect } from 'next/navigation';
import { getServerUser } from "@/lib/auth/server";
import { getUserProfileByEmailServer } from "@/services/user.server";
import { serializeMongo } from "@/lib/serialize";

// This page is now the root of the "Connect & Share" section.
// It will serve as the main activity feed.
export default async function ActivityPage() {
    const serverUser = await getServerUser();
    if (!serverUser) {
        redirect('/login');
    }

    const userProfile = await getUserProfileByEmailServer(serverUser.email!);
    
    if (!userProfile) {
      // This might happen if the Firestore doc isn't created yet, though unlikely
      redirect('/login');
    }
    
    if (!(userProfile as any).profileCompleted && !(userProfile as any).onboardingCompleted) {
        redirect('/onboarding/profile');
    }

    const [allPosts, userCircles, chintanaThreads, chintanaCategories] = await Promise.all([
        getPosts(),
        getCirclesForUser(userProfile.email!),
        getChintanaThreads(),
        getChintanaCategories(),
    ]);

    const allowedCircleIds = new Set(userCircles.map(c => c.id));
    const posts = allPosts.filter(p => !p.postMethod || p.postMethod === 'feed' || (p.postMethod === 'circle' && p.circleId && allowedCircleIds.has(p.circleId)));

    // Ensure only plain JSON data is passed to Client Components (serialize everything)
    const userProfilePlain = serializeMongo(userProfile);
    const postsPlain = serializeMongo(posts);
    const userCirclesPlain = serializeMongo(userCircles);
    const chintanaThreadsPlain = serializeMongo(chintanaThreads);
    const chintanaCategoriesPlain = serializeMongo(chintanaCategories);

    return (
        <ActivityPageClient
            posts={postsPlain}
            userProfile={userProfilePlain as any}
            userCircles={userCirclesPlain}
            chintanaThreads={chintanaThreadsPlain}
            chintanaCategories={chintanaCategoriesPlain}
        />
    );
}
