
import { getUserProfile, getBookmarksForUser } from "@/services/user.service";
import { getStandaloneArticles } from "@/services/standalone-article.service";
import type { Bookmark } from "@/types";
import { MyNotesClient } from "@/components/admin/my-notes-client";

export default async function MyNotesPage() {
    const user = await getUserProfile();
    const [bookmarks, standaloneArticles] = await Promise.all([
        getBookmarksForUser(user.email),
        getStandaloneArticles()
    ]);
    
    // Filter for bookmarks that are actually notes
    const notes = bookmarks.filter(b => b.note);

    return (
        <div className="container mx-auto max-w-4xl py-8">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">My Notes</h1>
                <p className="text-muted-foreground">
                    All your private notes from various articles, collected in one place.
                </p>
            </div>
            <MyNotesClient notes={notes} standaloneArticles={standaloneArticles} />
        </div>
    );
}
