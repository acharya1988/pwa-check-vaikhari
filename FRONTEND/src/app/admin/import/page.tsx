
'use client';

import React, { useActionState, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useFormStatus } from 'react-dom';
import { runBookParser, importParsedData } from '@/actions/import.actions';
import { getBookCategories, type BookCategory } from '@/services/book.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, BookUp, ArrowLeft, Library, FileText, ChevronsUpDown, Trash2, Combine, CheckCircle2, SplitSquareVertical } from 'lucide-react';
import Link from 'next/link';
import { ALL_SOURCE_TYPES, ALL_COMMENTARY_TYPES, getTypeLabelById, SOURCE_TYPE_GROUPS, COMMENTARY_TYPE_GROUPS } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { runBookParser as runBookParserAction } from '@/actions/ai.actions';

function ParserSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Parsing with AI...
        </>
      ) : (
        <>
          <Sparkles className="mr-2 h-4 w-4" />
          Parse Text
        </>
      )}
    </Button>
  );
}

function FinalizeButton({ variant, action, children }: { variant: "default" | "secondary", action: 'createBook' | 'createCitations', children: React.ReactNode }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" name="action" value={action} variant={variant} disabled={pending}>
             {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : children}
        </Button>
    )
}

function EvolveToBookEditor({ parsedData, onDataChange }: { parsedData: any; onDataChange: (data: any | null) => void }) {
    const [categories, setCategories] = useState<BookCategory[]>([]);
    const [editableData, setEditableData] = useState(parsedData);
    const [selectedSegments, setSelectedSegments] = useState<Set<string>>(new Set());
    const [creatorState, importBookAction] = useActionState(importParsedData, null);
    const { toast } = useToast();
    const editorContentRef = useRef<HTMLDivElement>(null);
    const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

    useEffect(() => {
        getBookCategories().then(setCategories);
    }, []);

    useEffect(() => {
        if (creatorState?.success) {
            toast({ title: 'Success', description: creatorState.message });
            onDataChange(null);
        }
        if (creatorState?.error) {
            toast({ variant: 'destructive', title: 'Error', description: creatorState.error });
        }
    }, [creatorState, toast, onDataChange]);

    const handleSegmentChange = useCallback((chapterId: string, segmentId: string, field: 'content' | 'type', value: string) => {
        setEditableData((currentData: any) => {
            const newChapters = currentData.chapters.map((c: any) => {
                if (c.id === chapterId) {
                    return {
                        ...c,
                        segments: c.segments.map((s: any) =>
                            s.id === segmentId ? { ...s, [field]: value } : s
                        ),
                    };
                }
                return c;
            });
            return { ...currentData, chapters: newChapters };
        });
    }, []);
    
    const handleSegmentSelection = useCallback((segmentId: string) => {
        setSelectedSegments(prev => {
            const newSelection = new Set(prev);
            if (newSelection.has(segmentId)) {
                newSelection.delete(id);
            } else {
                newSelection.add(segmentId);
            }
            return newSelection;
        });
    }, []);

    const handleSelectAllChapter = useCallback((chapterId: string) => {
        const chapter = editableData.chapters.find((c: any) => c.id === chapterId);
        if (!chapter) return;
        const segments = chapter.segments || [];

        setSelectedSegments(prev => {
            const newSelection = new Set(prev);
            const chapterSegmentIds = (segments || []).map((s:any) => s.id);
            const allSelected = chapterSegmentIds.every((id: string) => newSelection.has(id));
            
            if (allSelected) {
                chapterSegmentIds.forEach((id: string) => newSelection.delete(id));
            } else {
                chapterSegmentIds.forEach((id: string) => newSelection.add(id));
            }
            return newSelection;
        });
    }, [editableData.chapters]);

    const handleDeleteSegment = useCallback((chapterId: string, segmentId: string) => {
        setEditableData((currentData: any) => {
            const newChapters = currentData.chapters.map((c: any) => {
                 if (c.id === chapterId) {
                    return { ...c, segments: (c.segments || []).filter((s:any) => s.id !== segmentId) };
                }
                return c;
            });
            return { ...currentData, chapters: newChapters };
        });
    }, []);
    
    const handleDeleteSelected = () => {
        setEditableData((currentData: any) => {
            if (!currentData || !currentData.chapters || selectedSegments.size === 0) return currentData;
            
            const newChapters = currentData.chapters.map((c: any) => ({
                ...c,
                segments: (c.segments || []).filter((s: any) => !selectedSegments.has(s.id))
            }));

            return { ...currentData, chapters: newChapters };
        });
        setSelectedSegments(new Set());
    };

    const handleMergeSelected = () => {
        if (selectedSegments.size < 2) {
            toast({ variant: 'destructive', title: 'Select at least two segments to merge.' });
            return;
        }

        setEditableData((currentData: any) => {
            let firstSegment: any = null;
            let chapterIdOfMerge: string | null = null;
            const segmentsToMerge: any[] = [];

            // Find all selected segments and their parent chapters
            currentData.chapters.forEach((c: any) => {
                (c.segments || []).forEach((s: any) => {
                    if (selectedSegments.has(s.id)) {
                        segmentsToMerge.push({ ...s, chapterId: c.id });
                    }
                });
            });
            
            // Ensure all segments are from the same chapter
            if (new Set(segmentsToMerge.map(s => s.chapterId)).size > 1) {
                toast({ variant: 'destructive', title: 'Cannot merge across chapters.' });
                return currentData;
            }

            // Sort segments by their original DOM order to merge correctly
            segmentsToMerge.sort((a, b) => {
                const aIndex = currentData.chapters.flatMap((c:any) => c.segments).findIndex((s:any) => s.id === a.id);
                const bIndex = currentData.chapters.flatMap((c:any) => c.segments).findIndex((s:any) => s.id === b.id);
                return aIndex - bIndex;
            });

            firstSegment = segmentsToMerge[0];
            chapterIdOfMerge = firstSegment.chapterId;
            const mergedContent = segmentsToMerge.map(s => s.content).join('\n');
            
            const newChapters = currentData.chapters.map((c: any) => {
                if (c.id !== chapterIdOfMerge) return c;
                
                const newSegments = (c.segments || []).filter((s:any) => !selectedSegments.has(s.id));
                const firstSegmentOriginalIndex = (c.segments || []).findIndex((s:any) => s.id === firstSegment.id);
                
                newSegments.splice(firstSegmentOriginalIndex >= 0 ? firstSegmentOriginalIndex : 0, 0, {
                    ...firstSegment,
                    content: mergedContent,
                });

                return { ...c, segments: newSegments };
            });

            return { ...currentData, chapters: newChapters };
        });
        setSelectedSegments(new Set());
    };
    
    const handleSplitSelected = () => {
        if (selectedSegments.size !== 1) {
            toast({ variant: 'destructive', title: 'Select exactly one segment to split.' });
            return;
        }

        const segmentIdToSplit = Array.from(selectedSegments)[0];

        setEditableData((currentData: any) => {
            let chapterIdOfSplit: string | null = null;
            let segmentToSplit: any = null;
            let originalIndex = -1;
            
            currentData.chapters.forEach((c: any) => {
                const foundIndex = (c.segments || []).findIndex((s: any) => s.id === segmentIdToSplit);
                if (foundIndex !== -1) {
                    segmentToSplit = c.segments[foundIndex];
                    chapterIdOfSplit = c.id;
                    originalIndex = foundIndex;
                }
            });

            if (!segmentToSplit || chapterIdOfSplit === null || originalIndex === -1) return currentData;

            const lines = segmentToSplit.content.split('\n').filter((l: string) => l.trim() !== '');
            if (lines.length <= 1) {
                toast({ title: 'Info', description: 'This segment cannot be split further.' });
                return currentData;
            }
            
            const newSegments = lines.map((line: string) => ({
                ...segmentToSplit,
                id: crypto.randomUUID(),
                content: line,
            }));
            
            const newChapters = currentData.chapters.map((c: any) => {
                if (c.id !== chapterIdOfSplit) return c;
                
                const segments = [...c.segments];
                segments.splice(originalIndex, 1, ...newSegments);
                
                return { ...c, segments };
            });

            return { ...currentData, chapters: newChapters };
        });
        setSelectedSegments(new Set());
    };
    
    const scrollToChapter = (chapterId: string) => {
        editorContentRef.current?.querySelector(`#chapter-${chapterId}`)?.scrollIntoView({ behavior: 'smooth' });
    }

    const renderChapter = (chapter: any) => (
        <Card key={chapter.id} id={`chapter-${chapter.id}`} className="mb-6 scroll-mt-24">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>{chapter.name}</CardTitle>
                    <CardDescription>{(chapter.segments || []).length} segments found.</CardDescription>
                </div>
                 <div className="flex items-center gap-2">
                    <Label htmlFor={`select-all-${chapter.id}`} className="text-sm">Select All</Label>
                    <Checkbox id={`select-all-${chapter.id}`} onCheckedChange={() => handleSelectAllChapter(chapter.id)} />
                </div>
            </CardHeader>
            <CardContent>
                {(chapter.segments || []).map((segment: any) => (
                    <div key={segment.id} className="flex gap-4 items-start border-t py-4">
                        <Checkbox className="mt-2" checked={selectedSegments.has(segment.id)} onCheckedChange={() => handleSegmentSelection(segment.id)} />
                        <div className="flex-1 space-y-2">
                            <Textarea
                                value={segment.content || ''}
                                onChange={(e) => handleSegmentChange(chapter.id, segment.id, 'content', e.target.value)}
                                rows={Math.max(3, (segment.content || '').split('\n').length)}
                                className="font-mono text-sm"
                            />
                            {segment.verseNumber && <p className="text-xs text-muted-foreground">Verse: {segment.verseNumber}</p>}
                            {segment.footnotes && Object.keys(segment.footnotes).length > 0 && (
                                <div className="mt-2 p-2 border bg-muted/50 rounded-md">
                                    <h5 className="text-xs font-bold mb-1">Footnotes</h5>
                                    <ul className="text-xs text-muted-foreground space-y-1">
                                        {Object.entries(segment.footnotes).map(([num, text]) => (
                                            <li key={num}><strong>({num})</strong> {text as string}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col gap-2 w-48">
                            <Select value={segment.type} onValueChange={(value) => handleSegmentChange(chapter.id, segment.id, 'type', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(SOURCE_TYPE_GROUPS).map(([groupName, groupItems]) => (
                                        <SelectGroup key={groupName}>
                                            <SelectLabel>{groupName}</SelectLabel>
                                            {groupItems.map(item => (
                                                <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>
                                            ))}
                                        </SelectGroup>
                                    ))}
                                    {Object.entries(COMMENTARY_TYPE_GROUPS).map(([groupName, groupItems]) => (
                                        <SelectGroup key={groupName}>
                                            <SelectLabel>{groupName}</SelectLabel>
                                            {groupItems.map(item => (
                                                <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>
                                            ))}
                                        </SelectGroup>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteSegment(chapter.id, segment.id)}>
                                <Trash2 className="h-4 w-4 mr-2 text-destructive" /> Delete
                            </Button>
                        </div>
                    </div>
                ))}
                 {(chapter.children || []).map(child => <React.Fragment key={child.id}>{renderChapter(child)}</React.Fragment>)}
            </CardContent>
        </Card>
    );

    return (
        <form action={importBookAction} className="flex h-screen flex-col bg-muted/50">
             <AlertDialog open={isClearConfirmOpen} onOpenChange={setIsClearConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will discard all parsed terms and your edits. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDataChange(null)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                            Yes, Discard All
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <input type="hidden" name="parsedData" value={JSON.stringify(editableData)} />

            <header className="flex h-16 flex-shrink-0 items-center justify-between border-b bg-background px-4">
                <h1 className="text-lg font-semibold">Review & Refine Manuscript</h1>
                <Button variant="ghost" onClick={() => setIsClearConfirmOpen(true)}>Start Over</Button>
            </header>

            <div className="flex flex-1 overflow-hidden">
                <aside className="hidden w-72 flex-shrink-0 border-r bg-background md:flex md:flex-col">
                    <div className="p-4">
                        <h3 className="text-base font-semibold">Content Structure</h3>
                        <p className="text-sm text-muted-foreground truncate">{parsedData.bookName}</p>
                    </div>
                    <ScrollArea className="flex-1">
                        <div className="p-4 space-y-1">
                            {editableData.chapters.map((chapter: any) => (
                                <Button key={chapter.id} variant="ghost" size="sm" className="w-full justify-start" onClick={() => scrollToChapter(chapter.id)}>
                                    {chapter.name}
                                </Button>
                            ))}
                        </div>
                    </ScrollArea>
                </aside>

                <main ref={editorContentRef} className="flex-1 overflow-y-auto">
                    <div className="p-4 sm:p-6 md:p-8">
                        <div className="sticky top-0 z-10 mb-4 rounded-md border bg-background/80 p-2 backdrop-blur-sm flex items-center gap-2">
                             <Button variant="outline" onClick={handleMergeSelected} disabled={selectedSegments.size < 2}>
                                <Combine className="mr-2 h-4 w-4" /> Merge Selected
                            </Button>
                            <Button variant="outline" onClick={handleSplitSelected} disabled={selectedSegments.size !== 1}>
                                <SplitSquareVertical className="mr-2 h-4 w-4" /> Split Selected
                            </Button>
                            <Button variant="outline" className="text-destructive hover:text-destructive" onClick={handleDeleteSelected} disabled={selectedSegments.size === 0}>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete Selected
                            </Button>
                        </div>
                        {editableData.chapters.map(renderChapter)}
                    </div>
                </main>

                <aside className="hidden w-80 flex-shrink-0 border-l bg-background lg:flex lg:flex-col">
                    <div className="flex h-full flex-col p-4 space-y-4">
                         <Card className="flex-1 flex flex-col">
                            <CardHeader>
                                <CardTitle>Finalize & Import</CardTitle>
                                <CardDescription>Select a category and import this manuscript.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 flex-1">
                                 <div className="space-y-2">
                                    <Label htmlFor="category-select">Import Category *</Label>
                                    <Select name="categoryId" required>
                                        <SelectTrigger id="category-select">
                                            <SelectValue placeholder="Select a category..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                             <CardFooter className="flex-col items-stretch gap-2">
                                <FinalizeButton variant="default" action="createBook">
                                    <BookUp className="mr-2 h-4 w-4" /> Finalize Book
                                </FinalizeButton>
                                <FinalizeButton variant="secondary" action="createCitations">
                                    <FileText className="mr-2 h-4 w-4" /> Create Citations
                                </FinalizeButton>
                            </CardFooter>
                        </Card>
                    </div>
                </aside>
            </div>
        </form>
    );
}

export default function AIImportPage() {
    const [rawText, setRawText] = useState('');
    const [parsedData, setParsedData] = useState<any>(null);
    const { toast } = useToast();

    const [parserState, runParserAction] = useActionState(runBookParserAction, null);
    
    useEffect(() => {
        if (parserState?.success) {
            toast({
                title: '✅ Parsing Complete!',
                description: `Found ${parserState.data.chapters.length} chapters. Please review them below.`,
            });
            setParsedData(parserState.data);
            if(fileInputRef.current) fileInputRef.current.value = '';
        }
        if (parserState?.error && !parserState?.fieldErrors) {
             toast({ variant: 'destructive', title: 'Parsing Error', description: parserState.error });
        }
    }, [parserState, toast]);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const content = await file.text();
        setRawText(content);
        setParsedData(null);
    };

    if (parsedData) {
        return <EvolveToBookEditor parsedData={parsedData} onDataChange={setParsedData} />;
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <h1 className="text-3xl font-bold">Import Book from Text</h1>
                 <Button asChild variant="outline">
                    <Link href="/admin/books">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Books
                    </Link>
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>1. Provide Source Content</CardTitle>
                    <CardDescription>Upload a .txt file or paste the content. The AI will parse it into chapters.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={runParserAction} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="file-upload">Upload File</Label>
                            <Input id="file-upload" type="file" accept=".txt,text/plain" onChange={handleFileChange} ref={fileInputRef}/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="raw-text">Or Paste Text</Label>
                            <Textarea
                                id="raw-text"
                                name="text"
                                placeholder="Paste the full text of the book or discussion here..."
                                value={rawText}
                                onChange={(e) => setRawText(e.target.value)}
                                rows={15}
                                className="font-mono"
                            />
                            {parserState?.fieldErrors?.text && (
                                <p className="text-sm font-medium text-destructive">{parserState.fieldErrors.text[0]}</p>
                            )}
                        </div>
                        <ParserSubmitButton />
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
