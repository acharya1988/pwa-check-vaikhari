
'use client';

import React, { useState, useMemo, useEffect, useRef, useActionState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, MessageCircle, Rss, Send, Paperclip, MoreVertical } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format, formatDistanceToNow, isSameDay } from 'date-fns';
import type { Conversation, ChintanaThread, UserProfile, Message } from '@/types';
import { VaikhariLogo } from '@/components/icons';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SocialContentRenderer } from '@/components/social/social-content-renderer';
import { getMessagesForConversation, createNewConversation, sendMessageAction } from '@/actions/message.actions';
import { Textarea } from '@/components/ui/textarea';
import { useFormStatus } from 'react-dom';
import { useToast } from '@/hooks/use-toast';
import { ChintanaThreadMessengerView } from '@/components/admin/messages/chintana-thread-messenger-view';
import { getDiscoverableUsers } from '@/services/user.service';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';

function ConversationListItem({ item, isActive, onSelect }: { item: Conversation | ChintanaThread, isActive: boolean, onSelect: () => void }) {
    const isConvo = 'lastMessage' in item;
    const name = isConvo ? item.name : item.title;
    const avatar = isConvo ? item.avatarUrl : item.author.avatarUrl;
    const avatarFallback = (isConvo ? item.name : item.author.name)?.charAt(0) || '?';
    
    let lastMessage = '';
    if (isConvo) {
        lastMessage = item.lastMessage.text;
    } else if (item.posts && item.posts.length > 0) {
        lastMessage = item.posts[item.posts.length - 1].content;
    }

    const timestamp = isConvo ? item.lastMessage.timestamp : item.updatedAt;
    const unread = (item as Conversation).unreadCount || 0;

    return (
        <button 
            className={cn(
                "w-full text-left p-3 rounded-lg transition-colors flex items-start gap-3",
                isActive ? "bg-primary/10" : "hover:bg-muted"
            )}
            onClick={onSelect}
        >
            <Avatar className="h-12 w-12 border">
                 <AvatarImage src={avatar} alt={name || 'Item'} data-ai-hint="person avatar" />
                 <AvatarFallback>{avatarFallback}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                    <p className="font-semibold truncate">{name}</p>
                    <p className="text-xs text-muted-foreground whitespace-nowrap">{formatDistanceToNow(new Date(timestamp), { addSuffix: true })}</p>
                </div>
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground truncate" dangerouslySetInnerHTML={{ __html: lastMessage }} />
                    {unread > 0 && (
                        <div className="ml-2 bg-primary text-primary-foreground rounded-full px-2 text-xs font-medium">{unread}</div>
                    )}
                </div>
            </div>
        </button>
    );
}


function ChatPlaceholder() {
    return (
        <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-muted/50">
            <VaikhariLogo className="h-20 w-20 text-primary/20" />
            <h2 className="mt-6 text-2xl font-semibold">Select a conversation</h2>
            <p className="mt-2 max-w-xs text-muted-foreground">
                Choose a conversation or a Chintana thread from the sidebar to start messaging.
            </p>
        </div>
    )
}

function MessageBubble({ message, from, isMe }: { message: string, from: string, isMe: boolean }) {
    return (
        <div className={cn("flex items-end gap-2", isMe ? "justify-end" : "justify-start")}>
            {!isMe && (
                <Avatar className="h-8 w-8">
                    <AvatarFallback>{from.charAt(0)}</AvatarFallback>
                </Avatar>
            )}
            <div className={cn(
                "max-w-[70%] px-4 py-2 rounded-2xl shadow-sm",
                isMe ? "bg-primary text-primary-foreground rounded-br-none" : "bg-card border rounded-bl-none"
            )}>
                 <div className="whitespace-pre-wrap">{message}</div>
            </div>
        </div>
    )
}

function DateSeparator({ date }: { date: number }) {
  return (
    <div className="text-center my-4">
      <span className="bg-background text-muted-foreground text-xs px-3 py-1 rounded-full border">
        {format(new Date(date), 'MMMM d, yyyy')}
      </span>
    </div>
  );
}

function ChatWindow({ item, currentUser, onReplyPosted }: { 
    item: Conversation | ChintanaThread | null, 
    currentUser: UserProfile,
    onReplyPosted: () => void,
}) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesAreaRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);

    const isChintana = item && 'posts' in item;

    useEffect(() => {
      async function fetchMessages() {
        if (item && 'lastMessage' in item) {
          setIsLoading(true);
          const msgs = await getMessagesForConversation(item.id);
          setMessages(msgs);
          setIsLoading(false);
        }
      }
      fetchMessages();
    }, [item]);
    
    useEffect(() => {
        if(messagesAreaRef.current) {
            messagesAreaRef.current.scrollTop = messagesAreaRef.current.scrollHeight;
        }
    }, [messages, item]);

    const handleSend = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!item || isChintana) return;
        const formData = new FormData(e.currentTarget);
        const content = formData.get('content') as string;

        if (!content.trim()) return;

        formRef.current?.reset();

        const optimisticMessage: Message = {
            id: 'temp-' + Date.now(),
            conversationId: item.id,
            authorId: currentUser.email,
            content,
            timestamp: Date.now(),
            read: false,
            type: 'text'
        };
        setMessages(prev => [...prev, optimisticMessage]);

        const result = await sendMessageAction(item.id, content);
        if (result.error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to send message.' });
            setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id)); // remove optimistic message
        } else {
             onReplyPosted(); // Refresh conversation list to update last message
        }
    }
    
    if (!item) {
        return <ChatPlaceholder />;
    }
    
    let lastDate: number | null = null;
    
    if (isChintana) {
        return <ChintanaThreadMessengerView thread={item as ChintanaThread} currentUser={currentUser} onReplyPosted={onReplyPosted} />;
    }
    
    return (
         <div className="h-full flex flex-col">
            <header className="p-3 border-b bg-card flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={item.avatarUrl} />
                        <AvatarFallback>{item.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                     <div>
                        <div className="font-semibold">{item.name}</div>
                        <div className="text-xs text-muted-foreground">
                            {item.type === 'dm' ? 'Direct Message' : 'Group Conversation'}
                        </div>
                    </div>
                </div>
                 <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon"><Paperclip className="h-5 w-5"/></Button>
                    <Button variant="ghost" size="icon"><MoreVertical className="h-5 w-5"/></Button>
                </div>
            </header>
            
            <ScrollArea className="flex-1 p-6 bg-muted/30" ref={messagesAreaRef}>
                <div className="max-w-3xl mx-auto space-y-4">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-full">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        messages.map(msg => {
                            const showDateSeparator = !lastDate || !isSameDay(new Date(lastDate), new Date(msg.timestamp));
                            lastDate = msg.timestamp;
                            return (
                                <React.Fragment key={msg.id}>
                                    {showDateSeparator && <DateSeparator date={msg.timestamp} />}
                                    <MessageBubble message={msg.content} from={item.participants.find(p => p.id === msg.authorId)?.name || '?'} isMe={msg.authorId === currentUser.email} />
                                </React.Fragment>
                            );
                        })
                    )}
                </div>
            </ScrollArea>
             <footer className="p-3 border-t bg-card">
                 <form ref={formRef} onSubmit={handleSend} className="max-w-3xl mx-auto flex items-center gap-2">
                    <Textarea placeholder="Type a message..." className="min-h-0 py-2" rows={1} name="content" />
                    <Button size="icon" className="rounded-full flex-shrink-0" type="submit">
                        <Send className="h-5 w-5" />
                    </Button>
                </form>
            </footer>
        </div>
    )
}

function NewMessageDialog({ open, onOpenChange, currentUser, onConversationCreated }: { 
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentUser: UserProfile;
    onConversationCreated: (conversation: Conversation) => void;
}) {
    const [search, setSearch] = useState('');
    const [users, setUsers] = useState<UserProfile[]>([]);
    const debouncedSearch = useDebounce(search, 300);

    useEffect(() => {
        if(debouncedSearch) {
            getDiscoverableUsers().then(allUsers => {
                setUsers(allUsers.filter(u => 
                    u.email !== currentUser.email &&
                    u.name.toLowerCase().includes(debouncedSearch.toLowerCase())
                ));
            });
        } else {
            setUsers([]);
        }
    }, [debouncedSearch, currentUser.email]);

    const handleSelectUser = async (user: UserProfile) => {
        const newConversation = await createNewConversation(
            [currentUser, user],
            { type: 'dm', name: user.name, avatarUrl: user.avatarUrl }
        );
        onConversationCreated(newConversation);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>New Message</DialogTitle>
                </DialogHeader>
                <Input 
                    placeholder="Search for a user..." 
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <ScrollArea className="h-64">
                    <div className="space-y-1">
                        {users.map(user => (
                            <Button key={user.email} variant="ghost" className="w-full justify-start gap-3" onClick={() => handleSelectUser(user)}>
                                <Avatar className="h-8 w-8"><AvatarImage src={user.avatarUrl}/><AvatarFallback>{user.name.charAt(0)}</AvatarFallback></Avatar>
                                {user.name}
                            </Button>
                        ))}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}

export function MessagesClient({ initialConversations, initialThreads, currentUser, onDataNeeded }: {
    initialConversations: Conversation[];
    initialThreads: ChintanaThread[];
    currentUser: UserProfile;
    onDataNeeded: () => void;
}) {
    const [conversations, setConversations] = useState(initialConversations);
    const [threads, setThreads] = useState(initialThreads);
    const [selectedItem, setSelectedItem] = useState<Conversation | ChintanaThread | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'circles' | 'chintana' | 'messages'>('all');
    const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);
    
    useEffect(() => {
        setConversations(initialConversations);
        setThreads(initialThreads);
    }, [initialConversations, initialThreads]);
    
    const allItems = useMemo(() => [...conversations, ...threads].sort((a,b) => {
        const timeA = 'lastMessage' in a ? a.lastMessage.timestamp : a.updatedAt;
        const timeB = 'lastMessage' in b ? b.lastMessage.timestamp : b.updatedAt;
        return timeB - timeA;
    }), [conversations, threads]);
    
    const filteredItems = useMemo(() => {
        let items: (Conversation | ChintanaThread)[] = [];
        switch(activeTab) {
            case 'circles': items = allItems.filter(i => ('type' in i && i.type === 'group')); break;
            case 'chintana': items = allItems.filter(i => 'posts' in i); break;
            case 'messages': items = allItems.filter(i => ('type' in i && i.type === 'dm')); break;
            case 'all': 
            default: items = allItems;
        }

        if(!searchQuery) return items;
        const lowerQuery = searchQuery.toLowerCase();

        return items.filter(item => {
            const name = 'lastMessage' in item ? item.name : item.title;
            return name?.toLowerCase().includes(lowerQuery);
        });
    }, [allItems, searchQuery, activeTab]);

    const handleNewConversation = (newConvo: Conversation) => {
        setConversations(prev => [newConvo, ...prev]);
        setSelectedItem(newConvo);
    };

    return (
        <div className="h-full flex border rounded-lg bg-card overflow-hidden">
            <NewMessageDialog 
                open={isNewMessageOpen} 
                onOpenChange={setIsNewMessageOpen} 
                currentUser={currentUser} 
                onConversationCreated={handleNewConversation}
            />
            <aside className="w-96 border-r flex flex-col">
                <div className="p-4 border-b">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold">Inbox</h2>
                         <Button variant="outline" size="sm" onClick={() => setIsNewMessageOpen(true)}>New Message</Button>
                    </div>
                     <div className="mt-3">
                         <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                            <TabsList className="grid w-full grid-cols-4 h-auto">
                                <TabsTrigger value="all">All</TabsTrigger>
                                <TabsTrigger value="circles">Circles</TabsTrigger>
                                <TabsTrigger value="chintana">Chintana</TabsTrigger>
                                <TabsTrigger value="messages">Messages</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                    <div className="relative mt-3">
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
                         {filteredItems.map(item => (
                            <ConversationListItem 
                                key={item.id} 
                                item={item} 
                                isActive={selectedItem?.id === item.id}
                                onSelect={() => setSelectedItem(item)}
                            />
                        ))}
                    </div>
                 </ScrollArea>
            </aside>
            <main className="flex-1">
                <ChatWindow item={selectedItem} currentUser={currentUser} onReplyPosted={onDataNeeded} />
            </main>
        </div>
    )
}
