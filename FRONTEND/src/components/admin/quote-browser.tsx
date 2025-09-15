
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { LayoutGrid, List } from 'lucide-react';
import type { QuoteCategory, Quote } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function QuoteTable({ quotes }: { quotes: Quote[] }) {
    if (quotes.length === 0) {
        return (
            <div className="text-center text-muted-foreground p-4">
                No quotes in this category yet.
            </div>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Quote</TableHead>
                    <TableHead>Author/Source</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {quotes.map((quote) => (
                    <TableRow key={quote.id}>
                        <TableCell className="font-semibold">{quote.title}</TableCell>
                        <TableCell className="text-muted-foreground italic">"{quote.quote.substring(0, 100)}{quote.quote.length > 100 ? '...' : ''}"</TableCell>
                        <TableCell>{quote.author}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

function QuoteCard({ quote }: { quote: Quote }) {
    return (
        <Card className="flex flex-col h-full hover:shadow-lg transition-shadow">
            <CardHeader>
                <CardTitle className="text-lg">{quote.title}</CardTitle>
                <CardDescription>by {quote.author}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
                 <blockquote className="border-l-2 pl-6 italic">
                    {quote.quote}
                </blockquote>
            </CardContent>
        </Card>
    );
}

function QuotesDisplay({ quotes, view }: { quotes: Quote[], view: 'grid' | 'list' }) {
    if (quotes.length === 0) {
        return (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">No quotes to display in this category.</p>
            </div>
        );
    }

    if (view === 'grid') {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {quotes.map(quote => <QuoteCard key={quote.id} quote={quote} />)}
            </div>
        );
    }

    return <QuoteTable quotes={quotes} />;
}


export function QuoteBrowser({ groupedQuotes, totalQuotes }: { groupedQuotes: QuoteCategory[], totalQuotes: number }) {
    const [view, setView] = useState<'grid' | 'list'>('grid');
    const allQuotes = groupedQuotes.flatMap(g => g.quotes);

    return (
        <Card>
            <CardHeader className="flex-row items-center justify-between flex-wrap gap-4">
                <div>
                    <CardTitle>Quote Categories</CardTitle>
                    <CardDescription>
                        {totalQuotes > 0
                          ? `Found ${totalQuotes} quotes across ${groupedQuotes.length} categories.`
                          : 'No quotes found. Create a category and then a quote to get started.'
                        }
                    </CardDescription>
                </div>
                 <ToggleGroup type="single" value={view} onValueChange={(v) => { if (v) setView(v as 'list' | 'grid') }} aria-label="View mode">
                    <ToggleGroupItem value="grid" aria-label="Grid view">
                        <LayoutGrid className="h-4 w-4" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="list" aria-label="List view">
                        <List className="h-4 w-4" />
                    </ToggleGroupItem>
                </ToggleGroup>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="all" className="w-full">
                    <TabsList>
                        <TabsTrigger value="all">All</TabsTrigger>
                        {groupedQuotes.map(category => (
                            <TabsTrigger key={category.id} value={category.id}>{category.name}</TabsTrigger>
                        ))}
                    </TabsList>
                    <TabsContent value="all" className="pt-6">
                        <QuotesDisplay quotes={allQuotes} view={view} />
                    </TabsContent>
                    {groupedQuotes.map(category => (
                        <TabsContent key={category.id} value={category.id} className="pt-6">
                             <QuotesDisplay quotes={category.quotes} view={view} />
                        </TabsContent>
                    ))}
                </Tabs>
            </CardContent>
        </Card>
    );
}
