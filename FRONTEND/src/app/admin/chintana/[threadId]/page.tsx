
import { getChintanaThread } from "@/services/chintana.service";
import { getUserProfile } from "@/services/user.service";
import { notFound } from "next/navigation";
import { ChintanaThreadClient } from "./chintana-thread-client";

export default async function ChintanaThreadPage({ params }: { params: { threadId: string } }) {
    const threadId = params.threadId;
    const [thread, userProfile] = await Promise.all([
        getChintanaThread(threadId),
        getUserProfile()
    ]);

    if (!thread) {
        notFound();
    }

    return (
        <div className="bg-muted/50 min-h-full">
             <ChintanaThreadClient thread={thread} currentUser={userProfile} />
        </div>
    );
}
