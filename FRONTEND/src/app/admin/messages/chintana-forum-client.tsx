'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, MessageCircle, Rss } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { formatDistanceToNow } from 'date-fns';
import type { Conversation, ChintanaThread, UserProfile } from '@/types';
import { SocialContentRenderer } from '@/components/social/social-content-renderer';
import { VaikhariLogo } from '@/components/icons';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

function ConversationListItem({ conversation, isActive, onSelect }: { conversation: Conversation, isActive: boolean, onSelect: () => void }) {
    return (
        <button 
            className={cn(
                "w-full text-left p-3 rounded-lg transition-colors flex items-start gap-3",
                isActive ? "bg-primary/10" : "hover:bg-muted"
            )}
            onClick={onSelect}
        >
            <Avatar className="h-10 w-10 border">
                 <AvatarImage src={conversation.avatarUrl} alt={conversation.name || 'Conversation'} data-ai-hint="person avatar" />
                 <AvatarFallback>
                    {conversation.name ? conversation.name.charAt(0) : <MessageCircle className="h-5 w-5" />}
                 </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{conversation.name || conversation.participants.find(p => p.id !== 'vakyateam')?.name}</p>
                <p className="text-sm text-muted-foreground truncate">{conversation.lastMessage.text}</p>
            </div>
            <div className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDistanceToNow(new Date(conversation.lastMessage.timestamp), { addSuffix: true })}
            </div>
        </button>
    );
}


function ThreadListItem({ thread, isActive, onSelect }: { thread: ChintanaThread, isActive: boolean, onSelect: () => void }) {
    return (
        <button 
            className={cn(
                "w-full text-left p-3 rounded-lg transition-colors flex items-start gap-3",
                isActive ? "bg-primary/10" : "hover:bg-muted"
            )}
            onClick={onSelect}
        >
            <Avatar className="h-10 w-10 border">
                 <AvatarImage src={thread.author.avatarUrl} alt={thread.author.name} data-ai-hint="person avatar" />
                 <AvatarFallback>{thread.author.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{thread.title}</p>
                <p className="text-sm text-muted-foreground truncate">{thread.posts[0].content.replace(/<[^>]+>/g, '')}</p>
            </div>
             <div className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDistanceToNow(new Date(thread.updatedAt), { addSuffix: true })}
            </div>
        </button>
    )
}

function ChatPlaceholder() {
    return (
        <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-muted/50">
            <VaikhariLogo className="h-20 w-20 text-primary/20" />
            <h2 className="mt-6 text-2xl font-semibold">Select a conversation</h2>
            <p className="mt-2 max-w-xs text-muted-foreground">
                Choose a conversation or a Chintana thread from the sidebar to view messages and continue the discussion.
            </p>
        </div>
    )
}

function ChatWindow({ item }: { item: Conversation | ChintanaThread | null }) {
    if (!item) {
        return <ChatPlaceholder />;
    }
    // This is a placeholder for the actual chat implementation
    return (
         <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <h2 className="text-xl font-semibold">{item.name || (item as ChintanaThread).title}</h2>
            <p className="text-muted-foreground mt-2">Full chat view coming soon.</p>
        </div>
    )
}

export function MessagesClient({ initialConversations, initialThreads, currentUser }: {
    initialConversations: Conversation[];
    initialThreads: ChintanaThread[];
    currentUser: UserProfile;
}) {
    const [selectedItem, setSelectedItem] = useState<Conversation | ChintanaThread | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    
    const filteredConversations = useMemo(() => 
        initialConversations.filter(c => c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || c.lastMessage.text.toLowerCase().includes(searchQuery.toLowerCase())),
        [initialConversations, searchQuery]
    );
    
    const filteredThreads = useMemo(() => 
        initialThreads.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase())),
        [initialThreads, searchQuery]
    );

    return (
        <div className="h-full flex border rounded-lg bg-card overflow-hidden">
            <aside className="w-80 border-r flex flex-col">
                <div className="p-4 border-b">
                    <h2 className="text-xl font-bold">Inbox</h2>
                    <div className="relative mt-2">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search..." 
                            className="pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
                 <ScrollArea className="flex-1">
                    <div className="p-2 space-y-1">
                         <h3 className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">Conversations</h3>
                         {filteredConversations.map(convo => (
                            <ConversationListItem 
                                key={convo.id} 
                                conversation={convo} 
                                isActive={selectedItem?.id === convo.id}
                                onSelect={() => setSelectedItem(convo)}
                            />
                        ))}
                         <h3 className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase mt-4">Chintana Threads</h3>
                         {filteredThreads.map(thread => (
                             <ThreadListItem 
                                key={thread.id}
                                thread={thread}
                                isActive={selectedItem?.id === thread.id}
                                onSelect={() => setSelectedItem(thread)}
                            />
                         ))}
                    </div>
                 </ScrollArea>
            </aside>
            <main className="flex-1">
                <ChatWindow item={selectedItem} />
            </main>
        </div>
    )
}