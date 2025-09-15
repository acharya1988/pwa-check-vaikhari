
import { getPosts } from "@/services/post.service";
import { getUserProfile } from "@/services/user.service";
import { UserEvolutions } from "@/components/admin/profile/user-evolutions";

export default async function MyEvolutionsPage() {
    const allPosts = await getPosts();
    const userProfile = await getUserProfile();
    const evolvingPosts = allPosts.filter(post => post.status === 'evolving' && post.author.id === userProfile.email);

    return (
        <div className="container mx-auto max-w-4xl py-8">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">My Evolutions</h1>
                <p className="text-muted-foreground">
                    These are your thoughts that have been marked to evolve into more structured works like articles or book chapters.
                </p>
            </div>
            
            <UserEvolutions posts={evolvingPosts} userProfile={userProfile} />
        </div>
    );
}
