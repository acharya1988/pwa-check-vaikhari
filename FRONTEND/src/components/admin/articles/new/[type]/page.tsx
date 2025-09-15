

'use client';

import React, { useActionState, useState, useEffect, useCallback, useRef } from 'react';
import { notFound, useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useFormStatus } from 'react-dom';
import type { Editor, Range } from '@tiptap/react';
import { createStandaloneArticle, createStandaloneArticleCategory } from '@/actions/standalone-article.actions';
import { getStandaloneArticleCategories } from '@/services/standalone-article.service';
import { getQuoteData } from '@/services/quote.service';
import type { StandaloneArticleCategory, Quote, QuoteCategory, GlossaryCategory, UserProfile, Organization } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, Save, ArrowLeft, Plus, ChevronLeft, ChevronRight, Menu, User, Building } from 'lucide-react';
import { EditorToolbar } from '@/components/admin/editor/toolbar';
import { RichTextEditor } from '@/components/admin/rich-text-editor';
import { WhitepaperForm } from '@/components/admin/whitepaper-form';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { IntellicitePanel } from '@/components/admin/intellicite-panel';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { CreateQuoteDialog } from '@/components/admin/quote-forms';
import { GenreSelector } from '@/app/admin/genre/genre-provider-system';
import { TagInput } from '@/components/ui/tag-input';
import { getAdministeredOrganizations } from '@/services/organization.service';
import { getUserProfile } from '@/services/user.service';
import { Card, CardContent } from '@/components/ui/card';

function SubmitButton({ children }: { children: React.ReactNode}) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" size="sm" disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {children}
        </Button>
    );
}

function CreateCategoryDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(createStandaloneArticleCategory, null);
  const { toast } = useToast();

  useEffect(() => {
    if (state?.success) {
      toast({ title: "Success!", description: "Category created." });
      setOpen(false);
      onCreated();
    }
    if (state?.error) {
      toast({ variant: 'destructive', title: "Error", description: state.error });
    }
  }, [state, toast, onCreated]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="icon" className="flex-shrink-0" title="Add new category">
          <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Category</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div>
            <Label htmlFor="name">Category Name</Label>
            <Input id="name" name="name" required />
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
            <Button type="submit">Create</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function NewArticleForm({ type, categories, onCategoryCreated, formAction, state, onComplete }: {
    type: 'article' | 'abstract' | 'whitepaper';
    categories: StandaloneArticleCategory[];
    onCategoryCreated: () => void;
    formAction: any;
    state: any;
    onComplete: () => void;
}) {
    const isMobile = useIsMobile();
    const [title, setTitle] = useState('');
    const [tagline, setTagline] = useState('');
    const [description, setDescription] = useState('');
    const [content, setContent] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [taggedUserIds, setTaggedUserIds] = useState<string[]>([]);
    const [taggedOrganizationIds, setTaggedOrganizationIds] = useState<string[]>([]);
    const [taggedBookIds, setTaggedBookIds] = useState<string[]>([]);
    const [taggedCircleIds, setTaggedCircleIds] = useState<string[]>([]);

    const [editorInstance, setEditorInstance] = useState<Editor | null>(null);
    const [activeGlossary, setActiveGlossary] = useState<GlossaryCategory | null>(null);
    const [isPanelOpen, setIsPanelOpen] = useState(true);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    
    const [quoteCategories, setQuoteCategories] = React.useState<QuoteCategory[]>([]);
    const [quoteDialogState, setQuoteDialogState] = React.useState<{ open: boolean; text: string; range: Range | null }>({ open: false, text: '', range: null });

    const [genreSelection, setGenreSelection] = useState<{ genreId?: string }>({});

    const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);

    useEffect(() => {
        getQuoteData().then(setQuoteCategories);
    }, []);
    
    const handleNewQuoteFound = React.useCallback((text: string, range: Range) => {
        setQuoteDialogState({ open: true, text, range });
    }, []);

    const handleQuoteCreated = React.useCallback((newQuote?: Quote) => {
        const range = quoteDialogState.range;
        if (!newQuote || !range || !editorInstance) {
             setQuoteDialogState({ open: false, text: '', range: null });
            return;
        }
        
        editorInstance.chain().focus()
            .deleteRange(range)
            .insertContent({
                type: 'blockquote',
                attrs: { author: newQuote.author },
                content: [{ type: 'paragraph', content: [{ type: 'text', text: `“${newQuote.quote}”` }] }]
            })
            .run();
            
        setQuoteDialogState({ open: false, text: '', range: null });
    }, [editorInstance, quoteDialogState.range]);

    if (type === 'whitepaper') {
        return <WhitepaperForm categories={categories} formAction={formAction} state={state} />;
    }

    const panelContent = (
      <IntellicitePanel
        tags={tags}
        onTagsChange={setTags}
        editor={editorInstance}
        blocks={[{ id: '1', type: 'prose', sanskrit: content }]}
        activeGlossary={activeGlossary}
        onActiveGlossaryChange={setActiveGlossary}
        articleInfo={null}
        highlightTarget={null}
        onHighlight={() => {}}
        headerActions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onComplete}>Cancel</Button>
            <SubmitButton>Create {typeLabel}</SubmitButton>
          </div>
        }
      />
    );


    return (
         <div className="h-full flex flex-col bg-muted/40">
            <CreateQuoteDialog
                open={quoteDialogState.open}
                onOpenChange={(isOpen) => setQuoteDialogState(prev => ({ ...prev, open: isOpen }))}
                initialQuote={quoteDialogState.text}
                onQuoteCreated={handleQuoteCreated}
                categories={quoteCategories}
            />
            <form action={formAction} className="flex-1 flex flex-col min-h-0">
                <input type="hidden" name="type" value={type} />
                <input type="hidden" name="content" value={content} />
                 <input type="hidden" name="tags" value={tags.join(',')} />
                 <input type="hidden" name="taggedUserIds" value={taggedUserIds.join(',')} />
                 <input type="hidden" name="taggedOrganizationIds" value={taggedOrganizationIds.join(',')} />
                 <input type="hidden" name="taggedBookIds" value={taggedBookIds.join(',')} />
                 <input type="hidden" name="taggedCircleIds" value={taggedCircleIds.join(',')} />

                <header className="flex items-center justify-between gap-4 p-4 border-b bg-background sticky top-0 z-20">
                    <div className="flex-1 min-w-0">
                        <Button variant="link" className="p-0 h-auto text-muted-foreground" onClick={onComplete}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Publisher Selection
                        </Button>
                        <h1 className="text-xl font-bold truncate">New {typeLabel}</h1>
                    </div>
                     <div className="flex items-center gap-2">
                         {isMobile && (
                            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                                <SheetTrigger asChild>
                                    <Button variant="outline" size="icon"><Menu className="h-4 w-4" /></Button>
                                </SheetTrigger>
                                <SheetContent className="w-[340px] p-0 flex flex-col">
                                    {panelContent}
                                </SheetContent>
                            </Sheet>
                         )}
                     </div>
                </header>

                <div className="flex-1 flex flex-row overflow-hidden">
                    <main className="flex-1 flex flex-col overflow-hidden">
                        {editorInstance && (
                            <div className="editor-toolbar-container flex-shrink-0 border-b z-10 bg-background/95 backdrop-blur-sm">
                                <EditorToolbar editor={editorInstance} />
                            </div>
                        )}
                        <div className="flex-1 overflow-y-auto p-8 sm:p-12">
                            <div className="max-w-4xl mx-auto bg-card p-8 rounded-lg shadow-sm space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Title</Label>
                                    <Input id="title" name="title" value={title} onChange={(e) => setTitle(e.target.value)} className="text-3xl font-bold font-headline h-auto p-2" required />
                                    {state?.fieldErrors?.title && <p className="text-sm text-destructive mt-1">{state.fieldErrors.title[0]}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="tagline">Tagline (one-line excerpt)</Label>
                                    <Input id="tagline" name="tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea id="description" name="description" value={description} onChange={(e) => setDescription(e.target.value)} />
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  {!genreSelection.genreId && (
                                    <div className="space-y-2">
                                        <Label htmlFor="categoryId">Legacy Category</Label>
                                        <div className="flex items-center gap-2">
                                            <Select name="categoryId" required defaultValue="uncategorized">
                                                <SelectTrigger id="categoryId"><SelectValue placeholder="Select a category" /></SelectTrigger>
                                                <SelectContent>
                                                    {categories.map(category => (<SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>))}
                                                </SelectContent>
                                            </Select>
                                            <CreateCategoryDialog onCreated={onCategoryCreated} />
                                        </div>
                                        {state?.fieldErrors?.categoryId && <p className="text-sm text-destructive mt-1">{state.fieldErrors.categoryId[0]}</p>}
                                    </div>
                                  )}
                                   <div className={cn("space-y-2", genreSelection.genreId ? 'md:col-span-2' : '')}>
                                      <Label>Categorization</Label>
                                      <div className="p-4 border rounded-md bg-muted/50"><GenreSelector onSelectionChange={setGenreSelection}/></div>
                                  </div>
                                </div>

                                <RichTextEditor
                                    id="content-editor"
                                    content={content}
                                    onChange={setContent}
                                    setEditorInstance={(id, editor) => setEditorInstance(editor)}
                                    removeEditorInstance={() => setEditorInstance(null)}
                                    activeGlossary={activeGlossary}
                                    onNewQuoteFound={handleNewQuoteFound}
                                />
                                
                                <div className="space-y-4 pt-6 border-t">
                                     <div>
                                        <Label>Tags</Label>
                                        <TagInput value={tags} onChange={setTags} placeholder="Add relevant tags..." />
                                     </div>
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label>Tag Users</Label>
                                            <TagInput value={taggedUserIds} onChange={setTaggedUserIds} placeholder="Tag a user by email..." />
                                        </div>
                                         <div>
                                            <Label>Tag Organizations</Label>
                                            <TagInput value={taggedOrganizationIds} onChange={setTaggedOrganizationIds} placeholder="Tag an organization ID..."/>
                                        </div>
                                         <div>
                                            <Label>Tag Books</Label>
                                            <TagInput value={taggedBookIds} onChange={setTaggedBookIds} placeholder="Tag a book ID..." />
                                        </div>
                                         <div>
                                            <Label>Tag Circles</Label>
                                            <TagInput value={taggedCircleIds} onChange={setTaggedCircleIds} placeholder="Tag a circle ID..." />
                                        </div>
                                     </div>
                                </div>
                            </div>
                        </div>
                    </main>
                    {!isMobile && (
                        <div id="intellicite-panel-container" className="relative flex-shrink-0 border-l">
                            <aside className={cn("bg-card transition-all duration-300 ease-in-out h-full overflow-hidden", isPanelOpen ? "w-[340px]" : "w-0")}>
                                <div className="w-[340px] h-full">{panelContent}</div>
                            </aside>
                            <Button type="button" variant="outline" size="icon" onClick={() => setIsPanelOpen(!isPanelOpen)} className="absolute top-1/2 -left-4 -translate-y-1/2 rounded-full h-8 w-8 z-10 bg-background hover:bg-muted" title="Toggle Assistant Panel">
                                {isPanelOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                            </Button>
                        </div>
                    )}
                </div>
            </form>
        </div>
    )
}

export default function NewStandaloneArticlePage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    
    const type = params.type as 'article' | 'abstract' | 'whitepaper';
    
    const [categories, setCategories] = useState<StandaloneArticleCategory[]>([]);
    const [state, formAction] = useActionState(createStandaloneArticle, null);
    
    const [currentView, setCurrentView] = useState('publisher-select'); // 'publisher-select', 'org-select', 'form'
    const [user, setUser] = useState<UserProfile | null>(null);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [selectedPublisher, setSelectedPublisher] = useState<{type: 'user' | 'org', id?: string, name?: string} | null>(null);

    const fetchInitialData = useCallback(() => {
        getStandaloneArticleCategories().then(setCategories);
        getUserProfile().then(setUser);
        getAdministeredOrganizations().then(setOrganizations);
    }, []);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    useEffect(() => {
        if (state?.success && state.redirectPath) {
            toast({ title: "Success!", description: state.message });
            router.push(state.redirectPath);
        }
        if (state?.error) {
            toast({ variant: 'destructive', title: "Creation Failed", description: state.error });
        }
    }, [state, toast, router]);

    const handlePublisherSelect = (publisher: 'user' | 'org') => {
        if (publisher === 'user') {
            setSelectedPublisher({ type: 'user', id: user?.email, name: user?.name });
            setCurrentView('form');
        } else {
            setCurrentView('org-select');
        }
    };
    
    const handleOrgSelect = (org: Organization) => {
        setSelectedPublisher({ type: 'org', id: org.id, name: org.name });
        setCurrentView('form');
    }

    if (!['article', 'abstract', 'whitepaper'].includes(type)) {
        return notFound();
    }
    
    if (currentView === 'form') {
        return <NewArticleForm 
            type={type} 
            categories={categories} 
            onCategoryCreated={fetchInitialData} 
            formAction={formAction} 
            state={state} 
            onComplete={() => setCurrentView('publisher-select')}
        />
    }

    return (
        <div className="container mx-auto max-w-2xl py-12">
             <div className="text-center mb-8">
                <h1 className="text-3xl font-bold">Create New {type.charAt(0).toUpperCase() + type.slice(1)}</h1>
                <p className="text-muted-foreground">First, who is publishing this work?</p>
            </div>
            <Card>
                <CardContent className="p-6">
                {currentView === 'publisher-select' && (
                     <div className="space-y-4">
                        <Button variant="outline" className="w-full h-20 text-left justify-start items-center gap-4" onClick={() => handlePublisherSelect('user')}>
                            <User className="h-8 w-8 text-primary" />
                            <div><p className="font-semibold">Publish as Myself</p><p className="text-sm text-muted-foreground">{user?.name}</p></div>
                        </Button>
                        <Button variant="outline" className="w-full h-20 text-left justify-start items-center gap-4" onClick={() => handlePublisherSelect('org')} disabled={organizations.length === 0}>
                            <Building className="h-8 w-8 text-primary" />
                            <div><p className="font-semibold">Publish as an Organization</p><p className="text-sm text-muted-foreground">{organizations.length > 0 ? `${organizations.length} available` : 'No organizations found'}</p></div>
                        </Button>
                    </div>
                )}
                {currentView === 'org-select' && (
                     <div className="space-y-4">
                         <div className="flex justify-between items-center">
                            <h4 className="font-semibold">Select a Publisher</h4>
                            <Button variant="ghost" size="sm" onClick={() => setCurrentView('publisher-select')}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back
                            </Button>
                        </div>
                        {organizations.map(org => (
                            <Button key={org.id} variant="outline" className="w-full h-16 justify-start gap-3" onClick={() => handleOrgSelect(org)}>
                                <Building className="h-6 w-6 text-muted-foreground" />
                                {org.name}
                            </Button>
                        ))}
                    </div>
                )}
                </CardContent>
            </Card>
        </div>
    )
}
