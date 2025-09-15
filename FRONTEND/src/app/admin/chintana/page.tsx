
import { getChintanaThreads, getChintanaCategories } from "@/services/chintana.service";
import { ChintanaForumClient } from "./chintana-forum-client";
import { getUserProfile } from "@/services/user.service";
import { getBooks } from "@/services/book.service";

export default async function ChintanaPage() {
    const [threads, categories, userProfile, books] = await Promise.all([
        getChintanaThreads(),
        getChintanaCategories(),
        getUserProfile(),
        getBooks(),
    ]);

    return (
        <div className="h-full">
            <ChintanaForumClient
                threads={threads}
                categories={categories}
                currentUser={userProfile}
                books={books}
            />
        </div>
    );
}
