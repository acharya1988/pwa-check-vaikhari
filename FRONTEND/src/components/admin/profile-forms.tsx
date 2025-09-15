
'use client';

import React, { useActionState, useEffect, useRef, useState, type ReactNode, useCallback } from 'react';
import { useFormStatus } from 'react-dom';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { getMediaFiles } from '@/services/media.service';
import { useToast } from '@/hooks/use-toast';
import { createBook, createChapter, createBookCategory, updateBookVisibility, updateBook, groupBooksIntoSeries, updateSeriesDescription } from '@/actions/book.actions';
import { getBookCategories } from '@/services/book.service';
import { getSeriesNames } from '@/services/series.service';
import {
    ALL_COMMENTARY_TYPES,
    BOOK_SUBJECTS,
    COMMENTARY_TYPE_GROUPS,
    getTypeLabelById,
    SOURCE_TYPE_GROUPS,
    SANSKRIT_TEXT_TYPE_GROUPS,
} from '@/types';
import type { CommentaryInfo, BookCategory, BookStructure, ContentBlock, BookContent, Circle, Editor, Book, Organization, UserProfile, Genre, SeriesGroup } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { MediaUploader } from '@/components/admin/media-uploader';
import { Separator } from '../ui/separator';
import { CreatableCombobox } from '../ui/creatable-combobox';
import { Loader2, Save, List, ArrowLeft, Trash2, Plus, Eye, ChevronLeft, ChevronRight, Menu, BookOpenCheck, Edit, Library, Globe, Lock, Users, Palette, Layers3, ArrowRight, UploadCloud, PlusCircle, Book as BookIcon, GitBranch, ChevronsRight, Building, User as UserIcon } from 'lucide-react';
import { EditorToolbar } from './editor/toolbar';
import { ArticleTocDisplay } from './article-toc-display';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { getAdministeredOrganizations } from '@/services/organization.service';
import { getUserProfile } from '@/services/user.service';
import { createOrganizationAction, createCircleAction } from '@/actions/profile.actions';
import { GENRES } from '@/types/genre.types';

const RichTextEditor = dynamic(() => import('@/components/admin/rich-text-editor').then(mod => mod.RichTextEditor), {
    ssr: false,
    loading: () => <div className="min-h-[150px] w-full rounded-md border border-input bg-transparent px-3 py-2 animate-pulse" />
});


function SubmitButton({ children }: { children: ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </Button>
  );
}

export function CreateBookCategoryDialog({ children, onCategoryCreated, genres }: { children: ReactNode; onCategoryCreated?: () => void; genres: Genre[]; }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(createBookCategory, null);
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (state?.success) {
        toast({ title: "Success!", description: "Category created." });
        setOpen(false);
        formRef.current?.reset();
        onCategoryCreated?.();
    }
    if (state?.error && !state.fieldErrors) {
        toast({ variant: 'destructive', title: "Error", description: state.error });
    }
  }, [state, toast, onCategoryCreated]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Book Category</DialogTitle>
          <DialogDescription>Add a new category to group your books.</DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="space-y-4">
          <div>
            <Label htmlFor="name">Category Name</Label>
            <Input id="name" name="name" placeholder="e.g., Itihasa" />
            {state?.fieldErrors?.name && <p className="text-sm text-destructive mt-1">{state.fieldErrors.name[0]}</p>}
          </div>
          <div>
            <Label htmlFor="genreId">Genre</Label>
             <Select name="genreId" required>
                <SelectTrigger id="genreId">
                    <SelectValue placeholder="Select a genre" />
                </SelectTrigger>
                <SelectContent>
                {genres.map(genre => (
                    <SelectItem key={genre.id} value={genre.id}>{genre.name}</SelectItem>
                ))}
                </SelectContent>
            </Select>
            {state?.fieldErrors?.genreId && <p className="text-sm text-destructive mt-1">{state.fieldErrors.genreId[0]}</p>}
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
            <SubmitButton>Create Category</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CheckboxGroup({ title, group, defaultValues = [] }: { title: string, group: { id: string, label: string }[], defaultValues?: string[] }) {
    const name = title === "Source Types" ? "sourceTypes" : "commentaryTypes";
    return (
        <div>
            <h4 className="font-medium mb-2">{title}</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-4 border rounded-md max-h-48 overflow-y-auto">
                {group.map(item => (
                    <div key={item.id} className="flex items-center space-x-2">
                        <Checkbox
                            id={`${name}-${item.id}`}
                            name={name}
                            value={item.id}
                            defaultChecked={(defaultValues || []).includes(item.id)}
                        />
                        <Label htmlFor={`${name}-${item.id}`} className="text-sm font-normal cursor-pointer">{item.label}</Label>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ImageSelector({ label, value, onValueChange, target }: { label: string, value: string, onValueChange: (url: string) => void, target: 'cover' | 'profile' }) {
    const [isMediaSheetOpen, setIsMediaSheetOpen] = useState(false);
    const [mediaFiles, setMediaFiles] = useState<string[]>([]);

    const fetchMedia = () => getMediaFiles().then(setMediaFiles);

    useEffect(() => {
        if (isMediaSheetOpen) {
           fetchMedia();
        }
    }, [isMediaSheetOpen]);

    const handleSelectImage = (url: string) => {
        onValueChange(url);
        setIsMediaSheetOpen(false);
    }

    const isCover = target === 'cover';

    return (
        <Sheet open={isMediaSheetOpen} onOpenChange={setIsMediaSheetOpen}>
            <div className="space-y-2">
                <Label>{label}</Label>
                <div className={cn("relative rounded-md border bg-muted group", isCover ? "aspect-[16/9]" : "aspect-[4/6] w-48")}>
                    <Image src={value || 'https://placehold.co/800x400.png'} alt={`${label} preview`} fill className="object-cover rounded-md" data-ai-hint="book cover background" />
                    <SheetTrigger asChild>
                        <Button variant="secondary" size="sm" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Edit className="mr-2 h-4 w-4" /> Change
                        </Button>
                    </SheetTrigger>
                </div>
            </div>
             <SheetContent className="w-[600px] sm:max-w-[600px] flex flex-col">
                <SheetHeader>
                    <SheetTitle>Select {label}</SheetTitle>
                </SheetHeader>
                <div className="p-4 border-y">
                    <MediaUploader showCard={false} onUploadSuccess={fetchMedia} />
                </div>
                <ScrollArea className="flex-1 mt-4">
                     {mediaFiles.length > 0 ? (
                        <div className="grid grid-cols-3 gap-4 pr-6">
                            {mediaFiles.map(fileUrl => (
                                <button key={fileUrl} className="relative aspect-square overflow-hidden rounded-md border transition-all hover:ring-2 hover:ring-primary focus:outline-none focus:ring-2 focus:ring-ring" onClick={() => handleSelectImage(fileUrl)}>
                                    <Image
                                        src={fileUrl}
                                        alt=""
                                        fill
                                        sizes="(max-width: 768px) 50vw, 25vw"
                                        className="object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                                        <Check className="h-8 w-8 text-white" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground">No images in library.</p>
                    )}
                </ScrollArea>
            </SheetContent>
        </Sheet>
    )
}

const bookFormSteps = [
    { step: 1, label: 'Primary Details', id: 'details' },
    { step: 2, label: 'Visuals & Structure', id: 'visuals' },
    { step: 3, label: 'Publication Info', id: 'publication' },
];

const NavItem = ({ step, currentStep, onStepClick }: {
    step: typeof bookFormSteps[number],
    currentStep: number,
    onStepClick: (step: number) => void,
}) => {
    const isActive = step.step === currentStep;
    return (
        <Button
            type="button"
            variant={isActive ? 'secondary' : 'ghost'}
            className="w-full justify-start gap-3"
            onClick={() => onStepClick(step.step)}
        >
            <span className={cn("h-6 w-6 rounded-full flex items-center justify-center text-xs", isActive ? "bg-primary text-primary-foreground" : "bg-muted")}>{step.step}</span>
            <span className={cn(isActive && "font-bold")}>{step.label}</span>
        </Button>
    )
}

function BookCreator({ categories: initialCategories, bookToEdit, onComplete, authorName: initialAuthorName, organizationId, organizationName, publisherName, structureType }: {
    categories: BookCategory[],
    bookToEdit?: BookContent,
    onComplete: () => void,
    authorName?: string,
    organizationId?: string,
    organizationName?: string,
    publisherName?: string,
    structureType: 'regular' | 'serial',
}) {
  const isEditMode = !!bookToEdit;
  const [categories, setCategories] = useState(initialCategories);

  const [state, formAction] = useActionState(isEditMode ? updateBook : createBook, null);
  const formRef = useRef<HTMLFormElement>(null);

  const [coverUrl, setCoverUrl] = useState(bookToEdit?.coverUrl || 'https://placehold.co/800x400.png');
  const [profileUrl, setProfileUrl] = useState(bookToEdit?.profileUrl || 'https://placehold.co/400x600.png');
  const [description, setDescription] = useState(bookToEdit?.description || '');
  const [descriptionEditor, setDescriptionEditor] = useState<Editor | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [allSeriesNames, setAllSeriesNames] = useState<string[]>([]);
  const [volumeSeriesName, setVolumeSeriesName] = useState(bookToEdit?.volumeInfo?.seriesName || '');
  const [authorName, setAuthorName] = useState(initialAuthorName || bookToEdit?.authorName || '');
  const [publisher, setPublisher] = useState(publisherName || bookToEdit?.publisher || '');

  const { toast } = useToast();

  useEffect(() => {
    if (state !== null) {
        if (state.success) {
            toast({ title: 'Success!', description: state.message || 'Your changes have been saved.' });
            onComplete();
        } else if (state.error) {
            toast({ variant: 'destructive', title: 'Error', description: state.error });
        }
    }
  }, [state, toast, onComplete]);

  useEffect(() => {
    getSeriesNames().then(setAllSeriesNames);
  }, []);

  const handleCategoryCreated = useCallback(async () => {
    const freshCategories = await getBookCategories();
    setCategories(freshCategories);
  }, []);

  const allSourceTypes = Object.values(SOURCE_TYPE_GROUPS).flat();
  const allCommentaryTypes = Object.values(COMMENTARY_TYPE_GROUPS).flat();

  const handleFormSubmit = (formData: FormData) => {
    formData.set('coverUrl', coverUrl);
    formData.set('profileUrl', profileUrl);
    formData.set('description', description);
    formData.set('volumeSeriesName', volumeSeriesName);
    formData.set('organizationId', organizationId || '');
    formData.set('organizationName', organizationName || '');
    formData.set('authorName', authorName);
    formData.set('publisher', publisher);
    formData.set('structureType', structureType);
    if (isEditMode) {
      formData.set('bookId', bookToEdit.bookId);
    }
    formAction(formData);
  };

  return (
        <form ref={formRef} action={handleFormSubmit} className="flex-1 grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8 min-h-0">

          <aside className="hidden md:block">
            <div className="sticky top-4 space-y-2">
                {bookFormSteps.map(step => (
                    <NavItem
                        key={step.id}
                        step={step}
                        currentStep={currentStep}
                        onStepClick={setCurrentStep}
                    />
                ))}
            </div>
          </aside>

          <div className="flex-1 flex flex-col min-h-0">
            <ScrollArea className="flex-1 -mr-6 pr-6">
                <div className="space-y-6">
                    <div style={{ display: currentStep === 1 ? 'block' : 'none' }}>
                        <Card>
                            <CardHeader><CardTitle>Primary Details</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Book Name</Label>
                                        <Input id="name" name="name" placeholder="e.g., The Upanishads" defaultValue={bookToEdit?.bookName ?? ''} />
                                        {state?.fieldErrors?.name && <p className="text-sm text-destructive mt-1">{state.fieldErrors.name[0]}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="subtitle">Subtitle</Label>
                                        <Input id="subtitle" name="subtitle" placeholder="e.g., A New Translation" defaultValue={bookToEdit?.subtitle ?? ''} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description-editor">Book Description</Label>
                                    <div className="rounded-md border min-h-[150px]">
                                        {descriptionEditor && <EditorToolbar editor={descriptionEditor} />}
                                        <RichTextEditor
                                            id="description-editor"
                                            content={description}
                                            onChange={setDescription}
                                            setEditorInstance={(id, editor) => setDescriptionEditor(editor)}
                                            removeEditorInstance={() => {}}
                                            placeholder="A brief summary of the book..."
                                        />
                                    </div>
                                </div>
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="genreId">Genre</Label>
                                        <Select name="genreId" defaultValue={bookToEdit?.genreId}>
                                            <SelectTrigger id="genreId"><SelectValue placeholder="Select a genre" /></SelectTrigger>
                                            <SelectContent>
                                                {GENRES.map(genre => (<SelectItem key={genre.id} value={genre.id}>{genre.name}</SelectItem>))}
                                            </SelectContent>
                                        </Select>
                                        {state?.fieldErrors?.genreId && <p className="text-sm text-destructive mt-1">{state.fieldErrors.genreId[0]}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="categoryId">Category</Label>
                                        <div className="flex items-center gap-2">
                                        <Select name="categoryId" defaultValue={bookToEdit?.categoryId ?? ''}>
                                            <SelectTrigger id="categoryId">
                                                <SelectValue placeholder="Select a category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {categories.map(category => (
                                                    <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <CreateBookCategoryDialog onCategoryCreated={handleCategoryCreated} genres={GENRES}>
                                            <Button type="button" variant="outline" size="icon" className="flex-shrink-0" title="Add new category">
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </CreateBookCategoryDialog>
                                        </div>
                                        {state?.fieldErrors?.categoryId && <p className="text-sm text-destructive mt-1">{state.fieldErrors.categoryId[0]}</p>}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="subject">Subject / Book Type</Label>
                                    <Select name="subject" defaultValue={bookToEdit?.subject ?? ''}>
                                        <SelectTrigger id="subject">
                                        <SelectValue placeholder="Select a subject type..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                        {BOOK_SUBJECTS.map(subject => (
                                            <SelectItem key={subject.id} value={subject.id}>
                                            {subject.label}
                                            </SelectItem>
                                        ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                     <div style={{ display: currentStep === 2 ? 'block' : 'none' }}>
                        <>
                            <Card>
                                <CardHeader><CardTitle>Visuals</CardTitle></CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center justify-center">
                                    <ImageSelector label="Cover Image (16:9)" value={coverUrl} onValueChange={setCoverUrl} target="cover" />
                                    <ImageSelector label="Profile Image (4:6)" value={profileUrl} onValueChange={setProfileUrl} target="profile" />
                                </CardContent>
                            </Card>
                            <Card className="mt-6">
                                <CardHeader><CardTitle>Content Structure</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-sm text-muted-foreground">Select all text types you expect to use. This will customize the editor to only show these options.</p>
                                    <CheckboxGroup title="Source Types" group={allSourceTypes} defaultValues={bookToEdit?.structure?.sourceTypes || []} />
                                    <CheckboxGroup title="Commentary Types" group={allCommentaryTypes} defaultValues={bookToEdit?.structure?.commentaryTypes || []} />
                                </CardContent>
                            </Card>
                        </>
                    </div>
                     <div style={{ display: currentStep === 3 ? 'block' : 'none' }}>
                         <Card>
                            <CardHeader><CardTitle>Publication Details</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="authorName">Author Name</Label>
                                        <Input id="authorName" value={authorName} onChange={(e) => setAuthorName(e.target.value)} disabled={!!initialAuthorName || !!organizationName} />
                                    </div>
                                    <div>
                                        <Label htmlFor="publishedAt">Publication Date</Label>
                                        <Input id="publishedAt" name="publishedAt" type="date" defaultValue={bookToEdit?.publishedAt ? new Date(bookToEdit.publishedAt).toISOString().split('T')[0] : ''} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="publisher">Publisher Name</Label>
                                    <Input id="publisher" value={publisher} onChange={(e) => setPublisher(e.target.value)} disabled={!!publisherName}/>
                                </div>
                                <div>
                                    <Label htmlFor="isbn">ISBN Number</Label>
                                    <Input id="isbn" name="isbn" placeholder="e.g., 978-3-16-148410-0" defaultValue={bookToEdit?.isbn ?? ''} />
                                </div>
                                <div>
                                    <Label htmlFor="designer">Cover Designer</Label>
                                    <Input id="designer" name="designer" placeholder="e.g., Jane Doe" defaultValue={bookToEdit?.designer ?? ''} />
                                </div>
                                </div>
                                {structureType === 'regular' && (
                                    <>
                                        <Separator className="my-6" />
                                        <h4 className="font-semibold text-md">Volume Information (Optional)</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="volumeSeriesNameInput">Series Name</Label>
                                                <CreatableCombobox
                                                    name="volumeSeriesName"
                                                    options={allSeriesNames.map(name => ({ value: name, label: name }))}
                                                    defaultValue={volumeSeriesName}
                                                    placeholder="Select or create a series..."
                                                    searchPlaceholder="Search series..."
                                                    emptyPlaceholder="No series found."
                                                    createPlaceholder={(val) => `Create new series "${val}"`}
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="volumeNumber">Volume Number</Label>
                                                <Input id="volumeNumber" name="volumeNumber" type="number" placeholder="e.g., 3" defaultValue={bookToEdit?.volumeInfo?.volumeNumber ?? ''} />
                                            </div>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </ScrollArea>

          <DialogFooter className="pt-4 mt-auto border-t flex-shrink-0 px-6">
             <DialogClose asChild><Button variant="ghost" type="button">Cancel</Button></DialogClose>
             <div className="flex-1 flex justify-end gap-2">
                 {currentStep > 1 && (
                    <Button type="button" variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                 )}
                  {currentStep < bookFormSteps.length ? (
                    <Button type="button" onClick={() => setCurrentStep(currentStep + 1)}>
                        Next <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                ) : (
                    <SubmitButton>
                        {isEditMode ? <><Save className="mr-2 h-4 w-4" /> Save Changes</> : <> <Plus className="mr-2 h-4 w-4" /> Create Book</>}
                    </SubmitButton>
                )}
             </div>
          </DialogFooter>
          </div>
        </form>
    );
}

export function GroupBooksDialog({ seriesToEdit, allBooks, children }: {
    seriesToEdit: SeriesGroup;
    allBooks: Book[];
    children: React.ReactNode;
}) {
    const [open, setOpen] = useState(false);
    const [state, formAction] = useActionState(groupBooksIntoSeries, null);
    const { toast } = useToast();
    const router = useRouter();

    const [booksInSeries, setBooksInSeries] = useState<Book[]>(seriesToEdit.volumes);
    const [availableBooks, setAvailableBooks] = useState<Book[]>(() =>
        allBooks.filter(b => !seriesToEdit.volumes.some(v => v.id === b.id))
    );

    useEffect(() => {
        if (state?.success) {
            toast({ description: state.message });
            setOpen(false);
            router.refresh();
        }
        if (state?.error) {
            toast({ variant: 'destructive', title: "Error", description: state.error });
        }
    }, [state, toast, router]);

    const addToSeries = (book: Book) => {
        setAvailableBooks(prev => prev.filter(b => b.id !== book.id));
        setBooksInSeries(prev => [...prev, book]);
    };

    const removeFromSeries = (book: Book) => {
        setBooksInSeries(prev => prev.filter(b => b.id !== book.id));
        setAvailableBooks(prev => [book, ...prev].sort((a,b) => a.name.localeCompare(b.name)));
    };

    return (
         <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Manage Series: {seriesToEdit.seriesName}</DialogTitle>
                    <DialogDescription>Add or remove books from this series.</DialogDescription>
                </DialogHeader>
                <form action={formAction}>
                    <input type="hidden" name="seriesName" value={seriesToEdit.seriesName} />
                    <input type="hidden" name="bookIds" value={JSON.stringify(booksInSeries.map(b => b.id))} />
                    <div className="grid grid-cols-2 gap-6 flex-1">
                        <div className="border rounded-lg flex flex-col">
                            <h3 className="text-sm font-semibold p-3 border-b bg-muted/50">Books in Series ({booksInSeries.length})</h3>
                            <ScrollArea className="flex-1">
                                <div className="p-2 space-y-1">
                                    {booksInSeries.map(book => (
                                        <div key={book.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                                            <span className="text-sm">{book.name}</span>
                                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeFromSeries(book)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                         <div className="border rounded-lg flex flex-col">
                            <h3 className="text-sm font-semibold p-3 border-b bg-muted/50">Available Books ({availableBooks.length})</h3>
                            <ScrollArea className="flex-1">
                                 <div className="p-2 space-y-1">
                                    {availableBooks.map(book => (
                                        <div key={book.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                                            <span className="text-sm">{book.name}</span>
                                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => addToSeries(book)}>
                                                <Plus className="h-4 w-4 text-primary" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    </div>
                     <DialogFooter className="mt-4">
                        <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                        <Button type="submit">Save Series</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export function BookFormDialog({ trigger, bookToEdit, categories }: {
    trigger: ReactNode;
    bookToEdit?: BookContent;
    categories: BookCategory[];
}) {
  const [open, setOpen] = useState(false);
  const [publisherType, setPublisherType] = useState<'myself' | 'organization' | null>(null);
  const [structureType, setStructureType] = useState<'regular' | 'serial' | null>(null);

  const [administeredOrgs, setAdministeredOrgs] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);

  const router = useRouter();

  useEffect(() => {
    if (open) {
      getUserProfile().then(setUser);
      getAdministeredOrganizations().then(setAdministeredOrgs);
    } else {
        // Reset state when closing
        setTimeout(() => {
            setPublisherType(null);
            setStructureType(null);
            setSelectedOrg(null);
        }, 300);
    }
  }, [open]);

  const handleStructureSelect = (type: 'regular' | 'serial') => {
    setStructureType(type);
  }

  const handlePublisherSelect = (type: 'myself' | 'organization') => {
    setPublisherType(type);
  }

  const resetFlow = () => {
    if(publisherType || selectedOrg) {
        setPublisherType(null);
        setSelectedOrg(null);
    } else if (structureType) {
        setStructureType(null);
    }
  }

  const onComplete = () => {
    setOpen(false);
    router.refresh();
  }

  const STEPS = {
    STRUCTURE: 'structure',
    PUBLISHER: 'publisher',
    ORGANIZATION: 'organization',
    FORM: 'form'
  };

  let currentStep = STEPS.STRUCTURE;
  if (structureType) currentStep = STEPS.PUBLISHER;
  if (publisherType === 'organization') {
      currentStep = STEPS.ORGANIZATION;
  }
  if (publisherType === 'myself' || selectedOrg) {
      currentStep = STEPS.FORM;
  }

  const showCreator = currentStep === STEPS.FORM || !!bookToEdit;

  const renderContent = () => {
    switch (currentStep) {
        case STEPS.STRUCTURE:
            return (
                 <div className="space-y-4">
                    <Button variant="outline" className="w-full h-20 text-left justify-start items-center gap-4" onClick={() => handleStructureSelect('regular')}>
                        <BookIcon className="h-8 w-8 text-primary" />
                        <div><p className="font-semibold">Book / Series of Books</p><p className="text-sm text-muted-foreground">A standard work, possibly with volumes.</p></div>
                    </Button>
                    <Button variant="outline" className="w-full h-20 text-left justify-start items-center gap-4" onClick={() => handleStructureSelect('serial')}>
                        <Layers3 className="h-8 w-8 text-primary" />
                        <div><p className="font-semibold">Serial Publication</p><p className="text-sm text-muted-foreground">An ongoing work published in parts.</p></div>
                    </Button>
                     <Button variant="outline" className="w-full h-20 text-left justify-start items-center gap-4" onClick={() => { router.push('/admin/import'); setOpen(false); }}>
                        <UploadCloud className="h-8 w-8 text-primary" />
                        <div><p className="font-semibold">Import from Text</p><p className="text-sm text-muted-foreground">Use AI to parse a manuscript file.</p></div>
                    </Button>
                </div>
            );
        case STEPS.PUBLISHER:
             return (
                <div className="space-y-4">
                     <Button variant="outline" className="w-full h-20 text-left justify-start items-center gap-4" onClick={() => handlePublisherSelect('myself')}>
                        <UserIcon className="h-8 w-8 text-primary" />
                        <div><p className="font-semibold">Publish as Myself</p><p className="text-sm text-muted-foreground">{user?.name}</p></div>
                    </Button>
                     <Button variant="outline" className="w-full h-20 text-left justify-start items-center gap-4" onClick={() => handlePublisherSelect('organization')} disabled={administeredOrgs.length === 0}>
                        <Building className="h-8 w-8 text-primary" />
                        <div><p className="font-semibold">Publish as an Organization</p><p className="text-sm text-muted-foreground">{administeredOrgs.length > 0 ? `${administeredOrgs.length} available` : 'No organizations found'}</p></div>
                    </Button>
                </div>
            );
        case STEPS.ORGANIZATION:
             return (
                <div className="space-y-4">
                    <h4 className="font-semibold">Select a Publisher</h4>
                    {administeredOrgs.map(org => (
                        <Button key={org.id} variant="outline" className="w-full h-16 justify-start gap-3" onClick={() => setSelectedOrg(org)}>
                            <Building className="h-6 w-6 text-muted-foreground" />
                            {org.name}
                        </Button>
                    ))}
                    <div className="text-center pt-2">
                        <Button variant="link" size="sm" asChild>
                            <Link href="/admin/settings?tab=organizations">Manage Organizations</Link>
                        </Button>
                    </div>
                </div>
            )
        default:
            return null;
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className={cn("sm:max-w-4xl max-h-[90vh] flex flex-col", !showCreator && "sm:max-w-lg")}>
        <DialogHeader>
            <div className="flex items-center gap-2">
                 {(publisherType || structureType) && !bookToEdit && <Button variant="ghost" size="icon" className="h-6 w-6" onClick={resetFlow}><ArrowLeft className="h-4 w-4" /></Button>}
                <DialogTitle>{showCreator ? (bookToEdit ? 'Edit Work' : 'Create New Work') : 'Select Publication Type'}</DialogTitle>
            </div>
        </DialogHeader>
        {showCreator ? (
            <BookCreator
                categories={categories}
                bookToEdit={bookToEdit}
                onComplete={onComplete}
                authorName={publisherType === 'myself' ? user?.name : selectedOrg?.name}
                organizationId={publisherType === 'organization' ? selectedOrg?.id : undefined}
                organizationName={publisherType === 'organization' ? selectedOrg?.name : undefined}
                publisherName={publisherType === 'organization' ? selectedOrg?.name : undefined}
                structureType={structureType || 'regular'}
            />
        ) : (
            renderContent()
        )}
      </DialogContent>
    </Dialog>
  );
}

export function CreateChapterDialog({ bookId, parentId, bookName, children }: {
    bookId: string;
    parentId?: string | number;
    bookName: string;
    children: React.ReactNode;
}) {
    const [open, setOpen] = useState(false);
    const [state, formAction] = useActionState(createChapter, null);
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);
    const router = useRouter();

    useEffect(() => {
        if (state?.success) {
            toast({ title: "Success", description: "Chapter created successfully." });
            setOpen(false);
            formRef.current?.reset();
        }
        if (state?.error) {
            toast({ variant: 'destructive', title: "Error", description: state.error });
        }
    }, [state, toast, router]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New {parentId ? 'Sub-Chapter' : 'Chapter'}</DialogTitle>
                    <DialogDescription>Add a new chapter to "{bookName}".</DialogDescription>
                </DialogHeader>
                <form action={formAction} ref={formRef} className="space-y-4">
                    <input type="hidden" name="bookId" value={bookId} />
                    {parentId && <input type="hidden" name="parentId" value={String(parentId)} />}
                    <div>
                        <Label htmlFor="name">Chapter Name</Label>
                        <Input id="name" name="name" required />
                        {state?.fieldErrors?.name && <p className="text-sm text-destructive mt-1">{state.fieldErrors.name[0]}</p>}
                    </div>
                     <div>
                        <Label htmlFor="topic">Topic (Optional)</Label>
                        <Input id="topic" name="topic" />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
                        <SubmitButton>Create Chapter</SubmitButton>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export function CommentaryDialog({ open, onOpenChange, onSave, initialData }: {
    open: boolean,
    onOpenChange: (open: boolean) => void,
    onSave: (data: CommentaryInfo) => void,
    initialData: CommentaryInfo
}) {
    const [data, setData] = useState<CommentaryInfo>(initialData);

    useEffect(() => {
        if(open) setData(initialData);
    }, [open, initialData]);

    return (
         <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Commentary Details</DialogTitle>
                    <DialogDescription>Provide information about this commentary block.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="commentary-type">Type</Label>
                         <Select value={data.type} onValueChange={(value) => setData({...data, type: value })}>
                            <SelectTrigger id="commentary-type"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {Object.values(COMMENTARY_TYPE_GROUPS).flat().map(t => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="commentary-author">Author</Label>
                        <Input id="commentary-author" value={data.author} onChange={(e) => setData({...data, author: e.target.value })}/>
                    </div>
                    <div>
                        <Label htmlFor="commentary-work">Work Name</Label>
                        <Input id="commentary-work" value={data.workName} onChange={(e) => setData({...data, workName: e.target.value })}/>
                    </div>
                    <div>
                        <Label htmlFor="commentary-short">Short Name (for display)</Label>
                        <Input id="commentary-short" value={data.shortName} onChange={(e) => setData({...data, shortName: e.target.value })}/>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                    <Button onClick={() => onSave(data)}>Save</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function SourceInfoDialog({ open, onOpenChange, blockType }: { open: boolean, onOpenChange: (open: boolean) => void, blockType: string }) {
    return (
         <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Source Information</DialogTitle>
                    <DialogDescription>Details about this content block.</DialogDescription>
                </DialogHeader>
                <p>Type: <strong>{getTypeLabelById(blockType)}</strong></p>
                <DialogFooter>
                    <DialogClose asChild><Button>Close</Button></DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export function AddBlockDialog({ onAddBlock, structure, children }: { onAddBlock: (type: string) => void, structure?: BookStructure, children: ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Content Block</DialogTitle>
          <DialogDescription>Select the type of content you want to add.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          <Card>
            <CardHeader><CardTitle>Source Text</CardTitle></CardHeader>
            <CardContent className="space-y-2">
                {(structure?.sourceTypes || []).map(typeId => (
                     <DialogClose key={typeId} asChild>
                        <Button variant="outline" className="w-full justify-start" onClick={() => onAddBlock(typeId)}>
                            {getTypeLabelById(typeId)}
                        </Button>
                    </DialogClose>
                ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Commentaries</CardTitle></CardHeader>
            <CardContent className="space-y-2">
                {(structure?.commentaryTypes || []).map(typeId => (
                    <DialogClose key={typeId} asChild>
                        <Button variant="outline" className="w-full justify-start" onClick={() => onAddBlock(typeId)}>
                             {getTypeLabelById(typeId)}
                        </Button>
                     </DialogClose>
                ))}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}


export function UpdateBookVisibilityDialog({ book, circles, children }: { book: Book, circles: Circle[], children: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const [state, formAction] = useActionState(updateBookVisibility, null);
    const { toast } = useToast();
    const router = useRouter();
    const [selectedVisibility, setSelectedVisibility] = useState<Book['visibility']>(book.visibility);
    const [selectedCircles, setSelectedCircles] = useState<string[]>(book.circleIds || []);

    useEffect(() => {
        if (state?.success) {
            toast({ title: state.message });
            setOpen(false);
            router.refresh();
        }
        if (state?.error) {
            toast({ variant: 'destructive', title: 'Error', description: state.error });
        }
    }, [state, toast, router]);

    const handleCircleToggle = (circleId: string) => {
        setSelectedCircles(prev =>
            prev.includes(circleId) ? prev.filter(id => id !== circleId) : [...prev, circleId]
        );
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Update Book Visibility</DialogTitle>
                    <DialogDescription>Control who can view this book.</DialogDescription>
                </DialogHeader>
                <form action={formAction}>
                    <input type="hidden" name="bookId" value={book.id} />
                    <div className="space-y-4 py-4">
                        <RadioGroup name="visibility" value={selectedVisibility} onValueChange={(v) => setSelectedVisibility(v as any)} className="space-y-2">
                             <Label className="flex items-center gap-2 p-3 border rounded-md cursor-pointer has-[:checked]:border-primary">
                                <RadioGroupItem value="private" id="private"/>
                                <div><Lock className="h-4 w-4 mr-2 inline" /> Private</div>
                             </Label>
                             <Label className="flex items-center gap-2 p-3 border rounded-md cursor-pointer has-[:checked]:border-primary">
                                <RadioGroupItem value="public" id="public"/>
                                <div><Globe className="h-4 w-4 mr-2 inline" /> Public</div>
                             </Label>
                             <Label className="p-3 border rounded-md cursor-pointer has-[:checked]:border-primary">
                                <div className="flex items-center gap-2">
                                    <RadioGroupItem value="circle" id="circle"/>
                                    <div><Users className="h-4 w-4 mr-2 inline" /> Specific Circles</div>
                                </div>
                                {selectedVisibility === 'circle' && (
                                    <div className="mt-4 pl-8 space-y-2">
                                        <p className="text-sm text-muted-foreground">Select which circles can view this book.</p>
                                        <ScrollArea className="h-32">
                                            {circles.map(circle => (
                                                <div key={circle.id} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`circle-${circle.id}`}
                                                        name="circleIds"
                                                        value={circle.id}
                                                        checked={selectedCircles.includes(circle.id)}
                                                        onCheckedChange={() => handleCircleToggle(circle.id)}
                                                    />
                                                    <Label htmlFor={`circle-${circle.id}`}>{circle.name}</Label>
                                                </div>
                                            ))}
                                        </ScrollArea>
                                    </div>
                                )}
                             </Label>
                        </RadioGroup>
                    </div>
                     <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
                        <Button type="submit">Update Visibility</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
