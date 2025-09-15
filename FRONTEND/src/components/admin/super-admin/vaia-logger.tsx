
'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Bot, User, MessageSquare, Clock } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { VaiaSession } from '@/types';
import { marked } from 'marked';

function UserInteraction({ interaction, userRole, userId }: { interaction: any, userRole: string, userId: string }) {
    return (
        <div className="flex gap-4">
            <div className="flex flex-col items-center">
                <User className="h-6 w-6" />
                <span className="text-xs text-muted-foreground">{userRole}</span>
            </div>
            <div className="flex-1 p-3 rounded-md bg-muted">
                {interaction.content.startsWith('Please analyze') ? (
                    <details>
                        <summary className="cursor-pointer text-sm italic text-muted-foreground">Context provided for analysis...</summary>
                        <pre className="mt-2 text-xs whitespace-pre-wrap font-sans bg-background/50 p-2 rounded">{interaction.content.split('---')[1]}</pre>
                    </details>
                ) : (
                    <p>{interaction.content}</p>
                )}
            </div>
        </div>
    );
}

function AssistantInteraction({ interaction }: { interaction: any }) {
    return (
        <div className="flex gap-4">
            <div className="flex flex-col items-center">
                <Bot className="h-6 w-6 text-primary" />
                 <span className="text-xs text-muted-foreground">VAIA</span>
            </div>
            <div 
                className="flex-1 p-3 rounded-lg bg-primary/10 prose prose-sm dark:prose-invert max-w-none prose-p:my-1" 
                dangerouslySetInnerHTML={{ __html: marked(interaction.content) as string }} 
            />
        </div>
    );
}

export function VaiaLoggerClient({ logs }: { logs: VaiaSession[] }) {
    const [searchTerm, setSearchTerm] = useState('');

    const groupedByUser = useMemo(() => {
        const groups: Record<string, VaiaSession[]> = {};
        logs.forEach(log => {
            if (!groups[log.userId]) {
                groups[log.userId] = [];
            }
            groups[log.userId].push(log);
        });
        return Object.entries(groups).sort((a,b) => b[1][0].timestamp - a[1][0].timestamp); // Sort users by most recent interaction
    }, [logs]);

    const filteredUsers = useMemo(() => {
        if (!searchTerm) return groupedByUser;
        const lowerCaseSearch = searchTerm.toLowerCase();
        return groupedByUser.filter(([userId, sessions]) => 
            userId.toLowerCase().includes(lowerCaseSearch) ||
            sessions.some(s => s.interactions.some(i => i.content.toLowerCase().includes(lowerCaseSearch)))
        );
    }, [groupedByUser, searchTerm]);

    return (
         <Card>
            <CardHeader>
                <CardTitle>VAIA Interaction Logs</CardTitle>
                <CardDescription>Review conversations between users and the AI assistant.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search by User ID or conversation content..." 
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <ScrollArea className="h-[65vh] border rounded-md">
                     <Accordion type="multiple" className="p-2">
                        {filteredUsers.map(([userId, sessions]) => (
                            <AccordionItem value={userId} key={userId}>
                                <AccordionTrigger>
                                    <div className="flex items-center gap-2">
                                        <User className="h-5 w-5" />
                                        <div className="text-left">
                                            <p className="font-semibold">{userId}</p>
                                            <p className="text-xs text-muted-foreground font-normal">{sessions.length} sessions</p>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <Accordion type="multiple" className="w-full space-y-2">
                                        {sessions.map(session => (
                                            <AccordionItem value={session.sessionId} key={session.sessionId}>
                                                <AccordionTrigger className="text-sm p-2 bg-muted/50 rounded hover:no-underline">
                                                    <div className="flex items-center gap-2">
                                                        <MessageSquare className="h-4 w-4" />
                                                        <p>Session from {format(new Date(session.timestamp), "PPP p")}</p>
                                                    </div>
                                                </AccordionTrigger>
                                                <AccordionContent className="p-4 bg-background border rounded-b-md space-y-4">
                                                    {session.interactions.map((interaction, index) => (
                                                        interaction.role === 'user' ? (
                                                             <UserInteraction key={index} interaction={interaction} userRole={session.userRole} userId={session.userId} />
                                                        ) : (
                                                            <AssistantInteraction key={index} interaction={interaction} />
                                                        )
                                                    ))}
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
