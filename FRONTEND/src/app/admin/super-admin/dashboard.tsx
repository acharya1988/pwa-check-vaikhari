
'use client';

import React, { useMemo, useState, useActionState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { formatDistanceToNow } from 'date-fns';
import type { SuperAdminContent, ContentType, Post } from '@/types';
import { Eye, Trash2, Search, Book, FileText, Quote } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { deleteClonedContentAction, toggleAiSyncAction } from '@/actions/super-admin.actions';
import { Input } from '@/components/ui/input';

const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
    'book': 'Book',
    'book-article': 'Book Article',
    'standalone-article': 'Standalone Article',
    'citation': 'Citation',
    'glossary-term': 'Glossary Term',
    'quote': 'Quote',
    'post': 'Post'
};

function AiSyncSwitch({ item }: { item: SuperAdminContent }) {
    const [optimisticChecked, setOptimisticChecked] = useState(item.allowAiSync);

    const handleCheckedChange = (checked: boolean) => {
        setOptimisticChecked(checked);
        const formData = new FormData();
        formData.append('contentId', item.id);
        // We don't need to await this, the UI update is optimistic.
        toggleAiSyncAction(formData);
    };

    return (
        <Switch
            id={`sync-${item.id}`}
            checked={optimisticChecked}
            onCheckedChange={handleCheckedChange}
            aria-label="Toggle AI Sync"
        />
    );
}

function DeleteContentButton({ item }: { item: SuperAdminContent }) {
    const { toast } = useToast();
    const [state, formAction] = useActionState(deleteClonedContentAction, null);

    useEffect(() => {
        if (state?.success) {
            toast({ title: state.message });
        }
        if (state?.error) {
            toast({ variant: 'destructive', title: 'Error', description: state.error });
        }
    }, [state, toast]);
    
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" title="Delete Cloned Content">
                    <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <form action={formAction}>
                    <input type="hidden" name="contentId" value={item.id} />
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the cloned content from the super admin repository. This does not affect the original user's content. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction asChild>
                            <Button type="submit" variant="destructive">Delete</Button>
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </form>
            </AlertDialogContent>
        </AlertDialog>
    );
}

function getContentPreview(item: SuperAdminContent): string {
    const c = item.content;
    if (!c) return item.originalContentId;

    switch (item.contentType) {
        case 'book': return c.name || c.bookName;
        case 'book-article':
        case 'standalone-article': return c.title;
        case 'citation': return `Ref: ${c.refId}`;
        case 'glossary-term': return c.term;
        case 'quote': return `"${(c.quote || '').substring(0, 30)}..."`;
        default: return item.originalContentId;
    }
};

function ContentTable({ content }: { content: SuperAdminContent[] }) {
     if (content.length === 0) {
        return <p className="text-center text-sm text-muted-foreground py-4">No content in this category.</p>
    }
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Content</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Original User</TableHead>
                    <TableHead>Cloned</TableHead>
                    <TableHead>AI Sync</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {content.map(item => (
                    <TableRow key={item.id}>
                        <TableCell className="font-medium truncate max-w-xs">{getContentPreview(item)}</TableCell>
                        <TableCell>
                            <Badge variant="secondary">{CONTENT_TYPE_LABELS[item.contentType]}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{item.originalUserId}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                           {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                        </TableCell>
                        <TableCell>
                            <AiSyncSwitch item={item} />
                        </TableCell>
                        <TableCell className="text-right">
                           <Button asChild variant="ghost" size="icon">
                               <Link href={item.sourcePath} target="_blank">
                                    <Eye className="h-4 w-4" />
                               </Link>
                           </Button>
                           <DeleteContentButton item={item} />
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

function SectionCard({ title, description, icon: Icon, count, children }: { title: string, description: string, icon: React.ElementType, count: number, children: React.ReactNode }) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 text-primary rounded-lg">
                        <Icon className="h-8 w-8" />
                    </div>
                    <div>
                        <CardTitle>{title}</CardTitle>
                        <CardDescription>{description} ({count} items)</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {children}
            </CardContent>
        </Card>
    )
}

export function SuperAdminDashboard({ allContent }: { allContent: SuperAdminContent[] }) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredContent = useMemo(() => {
        if (!searchTerm) return allContent;
        const lowerCaseSearch = searchTerm.toLowerCase();
        return allContent.filter(item => 
            getContentPreview(item).toLowerCase().includes(lowerCaseSearch) ||
            item.originalUserId.toLowerCase().includes(lowerCaseSearch)
        );
    }, [allContent, searchTerm]);
    
    const publishedWorks = useMemo(() => filteredContent.filter(c => c.contentType === 'book'), [filteredContent]);
    const scholarlyArticles = useMemo(() => filteredContent.filter(c => c.contentType === 'book-article' || c.contentType === 'standalone-article'), [filteredContent]);
    const knowledgeComponents = useMemo(() => filteredContent.filter(c => ['citation', 'glossary-term', 'quote'].includes(c.contentType)), [filteredContent]);


    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Super Admin Repository</h1>
                 <p className="text-muted-foreground">
                    A central repository of all user-generated content for moderation and AI training. Found {filteredContent.length} items.
                </p>
            </div>
             <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm py-2">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Filter by content or user ID..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <Accordion type="multiple" defaultValue={['published-works', 'scholarly-articles', 'knowledge-components']} className="w-full space-y-6">
                <AccordionItem value="published-works">
                    <AccordionTrigger className="text-xl font-semibold p-4 bg-card rounded-lg border hover:no-underline">
                        <div className="flex items-center gap-4">
                             <Book className="h-6 w-6 text-primary" />
                             Published Works
                             <Badge variant="outline">{publishedWorks.length}</Badge>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4">
                        <ContentTable content={publishedWorks} />
                    </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="scholarly-articles">
                     <AccordionTrigger className="text-xl font-semibold p-4 bg-card rounded-lg border hover:no-underline">
                        <div className="flex items-center gap-4">
                             <FileText className="h-6 w-6 text-primary" />
                             Scholarly Articles
                             <Badge variant="outline">{scholarlyArticles.length}</Badge>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4">
                         <ContentTable content={scholarlyArticles} />
                    </AccordionContent>
                </AccordionItem>

                 <AccordionItem value="knowledge-components">
                     <AccordionTrigger className="text-xl font-semibold p-4 bg-card rounded-lg border hover:no-underline">
                        <div className="flex items-center gap-4">
                             <Quote className="h-6 w-6 text-primary" />
                             Knowledge Components
                             <Badge variant="outline">{knowledgeComponents.length}</Badge>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4">
                        <ContentTable content={knowledgeComponents} />
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    );
}
