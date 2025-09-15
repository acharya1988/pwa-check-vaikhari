
'use client';

import { UserEvolutions } from "@/components/admin/profile/user-evolutions";
import type { Post, UserProfile } from "@/types";

export function MyEvolutionsClient({ posts, userProfile }: { posts: Post[], userProfile: UserProfile }) {
    return (
        <div className="container mx-auto max-w-4xl py-8">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">My Evolutions</h1>
                <p className="text-muted-foreground">
                    These are your thoughts that have been marked to evolve into more structured works like articles or book chapters.
                </p>
            </div>
            
            <UserEvolutions posts={posts} userProfile={userProfile} />
        </div>
    );
}
