import { getPosts } from "@/services/post.service";
import { getUserProfile } from "@/services/user.service";
import { getCirclesForUser } from "@/services/profile.service";
import { Wall } from "@/components/social/wall";
import { Suspense } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookHeart } from 'lucide-react';

function WallSkeleton() {
    return (
        <Card className="text-center">
            <CardHeader>
                <div className="mx-auto bg-muted rounded-full p-4 w-fit">
                    <BookHeart className="h-10 w-10 text-muted-foreground" />
                </div>
                <CardTitle className="mt-4">Loading The Wall...</CardTitle>
                <CardDescription>
                    Please wait while we gather the latest posts and discussions.
                </CardDescription>
            </CardHeader>
        </Card>
    );
}

async function WallPageContent() {
    const userProfile = await getUserProfile();
    const [posts, circles] = await Promise.all([
        getPosts(),
        getCirclesForUser(userProfile.email),
    ]);

    return (
        <div className="container mx-auto max-w-2xl py-8">
            <h1 className="text-3xl font-bold mb-6">The Wall</h1>
            <Wall posts={posts} userProfile={userProfile} circles={circles} />
        </div>
    );
}

export default function WallPage() {
    return (
        <Suspense fallback={<WallSkeleton />}>
            <WallPageContent />
        </Suspense>
    );
}
