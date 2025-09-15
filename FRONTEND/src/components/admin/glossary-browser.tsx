
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { LayoutGrid, List } from 'lucide-react';
import type { GlossaryCategory, GlossaryTerm } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function TermTable({ terms }: { terms: GlossaryTerm[] }) {
    if (terms.length === 0) {
        return (
            <div className="text-center text-muted-foreground p-4">
                No terms in this category yet.
            </div>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Term</TableHead>
                    <TableHead>Transliteration</TableHead>
                    <TableHead>Definition</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {terms.map((term) => (
                    <TableRow key={term.id}>
                        <TableCell className="font-devanagari font-semibold">{term.term}</TableCell>
                        <TableCell className="text-muted-foreground italic">{term.transliteration}</TableCell>
                        <TableCell>{term.definition.substring(0, 100)}{term.definition.length > 100 ? '...' : ''}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

function TermCard({ term }: { term: GlossaryTerm }) {
    return (
        <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
            <CardHeader>
                <CardTitle className="text-lg leading-tight font-devanagari font-bold">{term.term}</CardTitle>
                {term.transliteration && <CardDescription className="italic">{term.transliteration}</CardDescription>}
            </CardHeader>
            <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground">{term.definition}</p>
            </CardContent>
        </Card>
    );
}

function GlossaryDisplay({ terms, view }: { terms: GlossaryTerm[], view: 'grid' | 'list' }) {
    if (terms.length === 0) {
        return (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">No terms to display in this category.</p>
            </div>
        );
    }

    if (view === 'grid') {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {terms.map(term => <TermCard key={term.id} term={term} />)}
            </div>
        );
    }

    return <TermTable terms={terms} />;
}

export function GlossaryBrowser({ groupedTerms, totalTerms }: { groupedTerms: GlossaryCategory[], totalTerms: number }) {
    const [view, setView] = useState<'grid' | 'list'>('grid');
    const allTerms = groupedTerms.flatMap(g => g.terms);

    return (
        <Card>
            <CardHeader className="flex-row items-center justify-between flex-wrap gap-4">
                <div>
                    <CardTitle>Glossary Categories</CardTitle>
                    <CardDescription>
                        {totalTerms > 0
                          ? `Found ${totalTerms} terms across ${groupedTerms.length} categories.`
                          : 'No terms found. Create a category and then a term to get started.'
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
                {groupedTerms.length > 0 ? (
                     <Tabs defaultValue="all" className="w-full">
                        <TabsList>
                            <TabsTrigger value="all">All ({allTerms.length})</TabsTrigger>
                            {groupedTerms.map(category => (
                                <TabsTrigger key={category.id} value={category.id}>{category.name} ({category.terms.length})</TabsTrigger>
                            ))}
                        </TabsList>
                        <TabsContent value="all" className="pt-6">
                            <GlossaryDisplay terms={allTerms} view={view} />
                        </TabsContent>
                        {groupedTerms.map(category => (
                            <TabsContent key={category.id} value={category.id} className="pt-6">
                                <GlossaryDisplay terms={category.terms} view={view} />
                            </TabsContent>
                        ))}
                    </Tabs>
                ) : (
                    <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                        <p className="mb-2">No glossary categories found.</p>
                        <p className="text-sm">Create a category and a term to get started.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
