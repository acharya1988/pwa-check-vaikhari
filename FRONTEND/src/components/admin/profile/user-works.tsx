
'use client';

import { useState } from 'react';
import type { StandaloneArticle, LayerAnnotation, BookWithStats, Bookmark } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileText, Layers } from 'lucide-react';
import { WhitePaperSwitch } from '@/components/ui/white-paper-switch';
import { Transliterate } from '@/components/transliteration-provider';
import { stripHtml } from '@/services/service-utils';
import { UserBookshelf } from '@/components/admin/profile/user-bookshelf';

function WorkCard({ work }: { work: StandaloneArticle }) {
    const snippet = work.content.replace(/<[^>]+>/g, '').substring(0, 150) + '...';
    return (
        <Card className="flex flex-col h-full">
            <CardHeader>
                <CardTitle>{work.title}</CardTitle>
                <CardDescription>
                    {work.type.charAt(0).toUpperCase() + work.type.slice(1)}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">{snippet}</p>
            </CardContent>
            <CardFooter>
                 <Button asChild variant="secondary">
                    <Link href={`/admin/articles/edit/${work.id}`}>View Work</Link>
                </Button>
            </CardFooter>
        </Card>
    );
}

function LayerCard({ layer }: { layer: LayerAnnotation }) {
    const snippet = layer.content.replace(/<[^>]+>/g, '').substring(0, 150) + '...';
    return (
        <Card className="flex flex-col h-full">
            <CardHeader>
                <CardTitle>Layer on: {layer.articleTitle}</CardTitle>
                <CardDescription>
                   In "{layer.bookName}"
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <blockquote className="border-l-2 pl-3 italic text-sm text-muted-foreground mb-2">
                    <Transliterate>{stripHtml(layer.blockSanskrit || '')}</Transliterate>...
                </blockquote>
                <p className="text-sm text-muted-foreground">{snippet}</p>
            </CardContent>
            <CardFooter>
                 <Button asChild variant="secondary">
                    <Link href={`/articles/${layer.bookId}/${layer.chapterId}/${layer.verse}`}>View Context</Link>
                </Button>
            </CardFooter>
        </Card>
    );
}

function WorksGrid({ works, layers, books, type }: { 
    works: StandaloneArticle[], 
    layers: LayerAnnotation[],
    books: BookWithStats[],
    type: string 
}) {
    if (type === 'layers') {
        if (layers.length === 0) {
            return (
                 <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <Layers className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">This user has not created any public layers.</p>
                </div>
            )
        }
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {layers.map(layer => <LayerCard key={layer.id} layer={layer} />)}
            </div>
        );
    }
    
    if (type === 'books') {
        return <UserBookshelf books={books} bookmarks={[]} isOwner={false} />;
    }

    if (works.length === 0) {
        return (
             <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">This user has not published any works of this type yet.</p>
            </div>
        )
    }
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {works.map(work => <WorkCard key={work.id} work={work} />)}
        </div>
    );
}


export function UserWorks({ books, works, isOwner = false, layers, bookmarks }: {
    books: BookWithStats[],
    works: StandaloneArticle[],
    isOwner?: boolean,
    layers: LayerAnnotation[],
    bookmarks: Bookmark[],
}) {
    const [selectedType, setSelectedType] = useState<'books' | 'articles' | 'whitepapers' | 'abstracts' | 'layers'>('books');
    
    const articles = works.filter(w => w.type === 'article');
    const whitepapers = works.filter(w => w.type === 'whitepaper');
    const abstracts = works.filter(w => w.type === 'abstract');

    let worksToShow: StandaloneArticle[] = [];
    switch (selectedType) {
        case 'articles':
            worksToShow = articles;
            break;
        case 'whitepapers':
            worksToShow = whitepapers;
            break;
        case 'abstracts':
            worksToShow = abstracts;
            break;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-center">
                <WhitePaperSwitch defaultSelected="books" onChange={setSelectedType} />
            </div>
            <div className="mt-4">
                <WorksGrid works={worksToShow} layers={layers} books={books} type={selectedType} />
            </div>
        </div>
    );
}

    