
import { getPosts } from "@/services/post.service";
import { getUserProfile } from "@/services/user.service";
import { MyEvolutionsClient } from "./my-evolutions-client";
import { Suspense } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { GitBranch } from "lucide-react";
import { LoadingAnimation } from "@/components/loading-animation";

function EvolutionsPageSkeleton() {
    return <LoadingAnimation />;
}

async function MyEvolutionsPageContent() {
    const allPosts = await getPosts();
    const userProfile = await getUserProfile();
    const evolvingPosts = allPosts.filter(post => post.status === 'evolving' && post.author.id === userProfile.email);

    return <MyEvolutionsClient posts={evolvingPosts} userProfile={userProfile} />;
}


export default function MyEvolutionsPage() {
    return (
        <Suspense fallback={<EvolutionsPageSkeleton />}>
            <MyEvolutionsPageContent />
        </Suspense>
    );
}
