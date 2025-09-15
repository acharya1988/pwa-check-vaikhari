
'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import type { TaggedContent } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, BrainCircuit, Book, FileText, ChevronLeft, Sparkles } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

const CONTENT_TYPE_ICONS: Record<string, React.ElementType> = {
    'book': Book,
    'book-article': FileText,
    'standalone-article': FileText,
};

export function TagTrainerClient({ content }: { content: TaggedContent[] }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTag, setSelectedTag] = useState<TaggedContent | null>(null);

    const filteredContent = useMemo(() => {
        if (!searchTerm) return content;
        return content.filter(group => group.tag.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [content, searchTerm]);

    if (selectedTag) {
        return (
            <motion.div
                key="detail-view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
            >
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-4">
                             <Button variant="outline" size="icon" onClick={() => setSelectedTag(null)}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <BrainCircuit className="h-6 w-6 text-primary" />
                                    Training for: #{selectedTag.tag}
                                </CardTitle>
                                <CardDescription>{selectedTag.count} items found for this tag.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-end mb-4">
                             <Button>
                                <Sparkles className="mr-2 h-4 w-4" /> Train on All {selectedTag.count} Items
                            </Button>
                        </div>
                        <ScrollArea className="h-[60vh] border rounded-md p-2">
                            <div className="space-y-2">
                                {selectedTag.items.map(item => {
                                    const Icon = CONTENT_TYPE_ICONS[item.contentType] || FileText;
                                    return (
                                        <div key={item.id} className="flex items-center gap-3 p-2 rounded hover:bg-muted">
                                            <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <Link href={item.sourcePath} target="_blank" className="hover:underline">
                                                    <p className="truncate font-medium">{item.content.title || item.content.name || item.originalContentId}</p>
                                                </Link>
                                                <p className="text-xs text-muted-foreground">User: {item.originalUserId}</p>
                                            </div>
                                            <Button variant="secondary" size="sm">Train</Button>
                                        </div>
                                    )
                                })}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </motion.div>
        );
    }
    
    return (
        <motion.div
            key="list-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
        >
            <Card>
                <CardHeader>
                    <CardTitle>Tag Trainer</CardTitle>
                    <CardDescription>Select a tag to view associated content and initiate AI training.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search tags..." 
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <ScrollArea className="h-[60vh]">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pr-4">
                             <AnimatePresence>
                                {filteredContent.map(group => (
                                     <motion.div
                                        key={group.tag}
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                    >
                                        <Card className="flex flex-col h-full hover:border-primary transition-colors">
                                             <CardHeader className="flex-grow">
                                                <CardTitle className="text-xl">#{group.tag}</CardTitle>
                                                <CardDescription>{group.count} content items</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                 <Button className="w-full" onClick={() => setSelectedTag(group)}>
                                                    View & Train
                                                </Button>
                                            </CardContent>
                                        </Card>
                                     </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </motion.div>
    );
}
