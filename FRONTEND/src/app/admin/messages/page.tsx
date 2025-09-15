
import { getChintanaThreads } from "@/services/chintana.service";
import { getConversationsForUser } from '@/services/message.service';
import { MessagesClient } from "./messages-client";
import { getUserProfile } from "@/services/user.service";
import { getCirclesForUser } from "@/services/profile.service";
import { Suspense } from 'react';
import { LoadingAnimation } from "@/components/loading-animation";

async function MessagesPageContent() {
    const userProfile = await getUserProfile();
    const [conversations, threads, circles] = await Promise.all([
        getConversationsForUser(userProfile.email),
        getChintanaThreads(),
        getCirclesForUser(userProfile.email)
    ]);

    // Add circle conversations to the list if they don't already exist
    circles.forEach(circle => {
        if (!conversations.some(c => c.id === circle.id)) {
            conversations.push({
                id: circle.id,
                type: 'group',
                name: circle.name,
                participants: circle.members.map(m => ({ id: m.userId, name: m.name, avatarUrl: m.avatarUrl })),
                participantIds: circle.members.map(m => m.userId),
                lastMessage: { text: "No messages yet", timestamp: circle.createdAt },
            });
        }
    });

     return (
        <div className="h-full">
            <MessagesClient
                initialConversations={conversations}
                initialThreads={threads}
                currentUser={userProfile}
            />
        </div>
    );
}

export default function MessagesPage() {
    return (
        <Suspense fallback={<LoadingAnimation />}>
            <MessagesPageContent />
        </Suspense>
    )
}
