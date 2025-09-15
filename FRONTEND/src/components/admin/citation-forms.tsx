

'use client';

import { useActionState, useEffect, useRef, useState, type ReactNode, useCallback } from 'react';
import { useFormStatus } from 'react-dom';
import slugify from 'slugify';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
    createCitation, 
    runCitationParser, 
    importParsedCitations, 
    createCitationCategory,
    updateCitationCategory,
    deleteCitationCategory,
    updateCitation,
} from '@/actions/citation.actions';
import { Loader2, Sparkles, Trash2, Library, Plus, MoreVertical, Edit } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Citation, CitationCategory } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </Button>
  );
}

export function CreateCitationCategoryDialog({ children, open, onOpenChange, onCategoryCreated }: { 
    children: React.ReactNode; 
    open?: boolean; 
    onOpenChange?: (open: boolean) => void;
    onCategoryCreated?: () => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined && onOpenChange !== undefined;
  const currentOpen = isControlled ? open! : internalOpen;
  const setCurrentOpen = isControlled ? onOpenChange! : setInternalOpen;
  
  const [state, formAction] = useActionState(createCitationCategory, null);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
        toast({ title: "Success!", description: state.message });
        setCurrentOpen(false);
        formRef.current?.reset();
        onCategoryCreated?.();
    }
    if (state?.error && !state.fieldErrors) {
        toast({ variant: 'destructive', title: "Error", description: state.error });
    }
  }, [state, toast, setCurrentOpen, onCategoryCreated]);

  return (
    <Dialog open={currentOpen} onOpenChange={setCurrentOpen}>
      {!isControlled && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Citation Collection</DialogTitle>
          <DialogDescription>Add a new collection to group your citations.</DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="space-y-4">
          <div>
            <Label htmlFor="name">Collection Name</Label>
            <Input id="name" name="name" placeholder="e.g., Ayurveda Samhitas" required />
            {state?.fieldErrors?.name && <p className="text-sm text-destructive mt-1">{state.fieldErrors.name[0]}</p>}
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
            <SubmitButton>Create Collection</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EditCitationCategoryDialog({ category, children, open, onOpenChange, onActionComplete }: { 
    category: CitationCategory; 
    children: ReactNode; 
    open?: boolean; 
    onOpenChange?: (open: boolean) => void;
    onActionComplete?: () => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined && onOpenChange !== undefined;
  const currentOpen = isControlled ? open! : internalOpen;
  const setCurrentOpen = isControlled ? onOpenChange! : setInternalOpen;
  
  const [state, formAction] = useActionState(updateCitationCategory, null);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
        toast({ title: "Success!", description: state.message });
        setCurrentOpen(false);
        onActionComplete?.();
    }
    if (state?.error && !state.fieldErrors) {
        toast({ variant: 'destructive', title: "Error", description: state.error });
    }
  }, [state, toast, setCurrentOpen, onActionComplete]);

  return (
    <Dialog open={currentOpen} onOpenChange={setCurrentOpen}>
      {!isControlled && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Collection</DialogTitle>
          <DialogDescription>Rename the "{category.name}" collection.</DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="space-y-4">
          <input type="hidden" name="id" value={category.id} />
          <div>
            <Label htmlFor="name">New Collection Name</Label>
            <Input id="name" name="name" defaultValue={category.name} required />
            {state?.fieldErrors?.name && <p className="text-sm text-destructive mt-1">{state.fieldErrors.name[0]}</p>}
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
            <SubmitButton>Save Changes</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// New component for actions dropdown
export function CollectionActions({ category, onActionComplete }: { category: CitationCategory; onActionComplete: () => void }) {
    const { toast } = useToast();
    const [deleteState, deleteFormAction] = useActionState(deleteCitationCategory, null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    
    useEffect(() => {
        if (deleteState?.success) {
            toast({ title: 'Success', description: deleteState.message || 'Collection deleted.' });
            setIsDeleteOpen(false);
            onActionComplete();
        }
        if (deleteState?.error && !deleteState.fieldErrors) {
            toast({ variant: 'destructive', title: 'Error', description: deleteState.error });
        }
    }, [deleteState, toast, onActionComplete]);
    
    if (category.id === 'uncategorized' || category.id === 'user-saved-notes') {
        return null;
    }
    
    return (
        <>
            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">More actions for {category.name}</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setIsEditOpen(true)}>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Rename</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Delete</span>
                            </DropdownMenuItem>
                        </AlertDialogTrigger>
                    </DropdownMenuContent>
                </DropdownMenu>
                
                <form action={deleteFormAction}>
                    <input type="hidden" name="id" value={category.id} />
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently delete the collection "{category.name}". All citations within this collection will be moved to "Uncategorized". This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <Button type="submit" variant="destructive">Delete Collection</Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </form>
            </AlertDialog>
            
            <EditCitationCategoryDialog category={category} open={isEditOpen} onOpenChange={setIsEditOpen} onActionComplete={onActionComplete} >
                <></>
            </EditCitationCategoryDialog>
        </>
    );
}

export function CreateCitationDialog({
  open,
  onOpenChange,
  children, // The trigger, if not controlled
  categories,
  selectedCategoryId,
  initialSanskrit,
  onCitationCreated
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
  categories: CitationCategory[];
  selectedCategoryId?: string;
  initialSanskrit?: string;
  onCitationCreated?: (newCitation?: Citation) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const currentOpen = isControlled ? open! : internalOpen;
  const setCurrentOpen = isControlled ? onOpenChange! : setInternalOpen;

  const [state, formAction] = useActionState(createCitation, null);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  
  const [sanskritValue, setSanskritValue] = useState('');

  useEffect(() => {
    if (currentOpen) {
      setSanskritValue(initialSanskrit || '');
    }
  }, [currentOpen, initialSanskrit]);
  
  useEffect(() => {
    if (state?.success) {
      toast({ title: "Success!", description: "Citation created successfully." });
      if (onCitationCreated) {
        onCitationCreated(state.newCitation);
      }
      setCurrentOpen(false);
      formRef.current?.reset();
      setSanskritValue('');
    }
    if (state?.error && !state.fieldErrors) {
      toast({ variant: 'destructive', title: "Error!", description: state.error });
    }
  }, [state, toast, setCurrentOpen, onCitationCreated]);

  return (
    <Dialog open={currentOpen} onOpenChange={setCurrentOpen}>
      {!isControlled && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Citation</DialogTitle>
          <DialogDescription>Add a new citation to a collection for use in the editor.</DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="space-y-4">
          
          <div>
            <Label htmlFor="categoryId">Collection</Label>
             <div className="flex items-center gap-2">
                <Select name="categoryId" defaultValue={selectedCategoryId || 'uncategorized'}>
                    <SelectTrigger id="categoryId">
                        <SelectValue placeholder="Select a collection" />
                    </SelectTrigger>
                    <SelectContent>
                        {categories.map(category => (
                            <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <CreateCitationCategoryDialog>
                    <Button type="button" variant="outline" size="icon" className="flex-shrink-0" title="Add new collection">
                        <Plus className="h-4 w-4" />
                    </Button>
                </CreateCitationCategoryDialog>
             </div>
            {state?.fieldErrors?.categoryId && <p className="text-sm text-destructive mt-1">{state.fieldErrors.categoryId[0]}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="refId">Reference ID</Label>
              <Input id="refId" name="refId" placeholder="e.g., CS_Sutra_1.27" required />
              {state?.fieldErrors?.refId && <p className="text-sm text-destructive mt-1">{state.fieldErrors.refId[0]}</p>}
            </div>
            <div>
              <Label htmlFor="keywords">Keywords (comma-separated)</Label>
              <Input id="keywords" name="keywords" placeholder="e.g., agni, digestive fire" />
              {state?.fieldErrors?.keywords && <p className="text-sm text-destructive mt-1">{state.fieldErrors.keywords[0]}</p>}
            </div>
          </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="source">Source</Label>
              <Input id="source" name="source" placeholder="e.g., Charaka Samhita" required />
              {state?.fieldErrors?.source && <p className="text-sm text-destructive mt-1">{state.fieldErrors.source[0]}</p>}
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input id="location" name="location" placeholder="e.g., Sutrasthana 1.27" required />
              {state?.fieldErrors?.location && <p className="text-sm text-destructive mt-1">{state.fieldErrors.location[0]}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="sanskrit">Sanskrit</Label>
            <Textarea 
              id="sanskrit" 
              name="sanskrit" 
              placeholder="Enter the original Sanskrit text." 
              required
              value={sanskritValue}
              onChange={(e) => setSanskritValue(e.target.value)}
            />
             {state?.fieldErrors?.sanskrit && <p className="text-sm text-destructive mt-1">{state.fieldErrors.sanskrit[0]}</p>}
          </div>
           <div>
            <Label htmlFor="translation">Translation</Label>
            <Textarea id="translation" name="translation" placeholder="Enter the English/other translation." />
             {state?.fieldErrors?.translation && <p className="text-sm text-destructive mt-1">{state.fieldErrors.translation[0]}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setCurrentOpen(false)}>Cancel</Button>
            <SubmitButton>Create Citation</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EditCitationDialog({
  open,
  onOpenChange,
  citation,
  categoryId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  citation: Citation;
  categoryId: string;
}) {
  const [state, formAction] = useActionState(updateCitation, null);
  const { toast } = useToast();

  useEffect(() => {
    if (state?.success) {
      toast({ title: "Success!", description: "Citation updated successfully." });
      onOpenChange(false);
    }
    if (state?.error && !state.fieldErrors) {
      toast({ variant: 'destructive', title: "Error!", description: state.error });
    }
  }, [state, toast, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Citation</DialogTitle>
          <DialogDescription>Modify the details for Ref ID: {citation.refId}</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="categoryId" value={categoryId} />
          <input type="hidden" name="originalRefId" value={citation.refId} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="refId">Reference ID</Label>
              <Input id="refId" name="refId" defaultValue={citation.refId} required />
              {state?.fieldErrors?.refId && <p className="text-sm text-destructive mt-1">{state.fieldErrors.refId[0]}</p>}
            </div>
            <div>
              <Label htmlFor="keywords">Keywords (comma-separated)</Label>
              <Input id="keywords" name="keywords" defaultValue={citation.keywords.join(', ')} />
              {state?.fieldErrors?.keywords && <p className="text-sm text-destructive mt-1">{state.fieldErrors.keywords[0]}</p>}
            </div>
          </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="source">Source</Label>
              <Input id="source" name="source" defaultValue={citation.source} required />
              {state?.fieldErrors?.source && <p className="text-sm text-destructive mt-1">{state.fieldErrors.source[0]}</p>}
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input id="location" name="location" defaultValue={citation.location} required />
              {state?.fieldErrors?.location && <p className="text-sm text-destructive mt-1">{state.fieldErrors.location[0]}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="sanskrit">Sanskrit</Label>
            <Textarea 
              id="sanskrit" 
              name="sanskrit" 
              defaultValue={citation.sanskrit}
              required
            />
             {state?.fieldErrors?.sanskrit && <p className="text-sm text-destructive mt-1">{state.fieldErrors.sanskrit[0]}</p>}
          </div>
           <div>
            <Label htmlFor="translation">Translation</Label>
            <Textarea id="translation" name="translation" defaultValue={citation.translation} />
             {state?.fieldErrors?.translation && <p className="text-sm text-destructive mt-1">{state.fieldErrors.translation[0]}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <SubmitButton>Save Changes</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


function ParserSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Parsing...</> : <><Sparkles className="mr-2 h-4 w-4" />Parse with AI</>}
    </Button>
  );
}

function ImporterSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Importing...</> : <><Library className="mr-2 h-4 w-4" /> Import Citations</>}
    </Button>
  );
}

function ParsedCitationEditor({ citation, onUpdate, onDelete }: { citation: any; onUpdate: (id: string, updates: Partial<Citation>) => void; onDelete: (id: string) => void; }) {
    
    const handleFieldUpdate = (field: keyof Omit<Citation, 'keywords'>, value: string) => {
        let updates: Partial<Citation> = { [field]: value };

        let source = citation.source;
        let location = citation.location;

        if (field === 'source') {
            source = value;
        } else if (field === 'location') {
            location = value;
        }
        
        if (source && location && (field === 'source' || field === 'location')) {
            const sourceAbbr = source
                .split(' ')
                .map((s: string) => s.charAt(0))
                .join('')
                .toUpperCase();
            
            const locationSlug = slugify(location, { lower: true, strict: true, replacement: '-' });
            updates.refId = `${sourceAbbr}_${locationSlug}`;
        }
        
        onUpdate(citation.clientId, updates);
    };

    const handleKeywordsUpdate = (value: string) => {
        onUpdate(citation.clientId, { keywords: value.split(',').map(k => k.trim()) });
    };

    return (
        <Card className="bg-card">
            <CardContent className="p-3">
                <div className="flex items-start gap-4">
                    <div className="flex-1 space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor={`source-${citation.clientId}`} className="text-xs">Source</Label>
                                <Input id={`source-${citation.clientId}`} value={citation.source || ''} onChange={(e) => handleFieldUpdate('source', e.target.value)} className="h-8 text-sm" />
                            </div>
                            <div>
                                <Label htmlFor={`location-${citation.clientId}`} className="text-xs">Location</Label>
                                <Input id={`location-${citation.clientId}`} value={citation.location || ''} onChange={(e) => handleFieldUpdate('location', e.target.value)} className="h-8 text-sm" />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor={`sanskrit-${citation.clientId}`} className="text-xs">Sanskrit</Label>
                            <Textarea id={`sanskrit-${citation.clientId}`} value={citation.sanskrit || ''} onChange={(e) => handleFieldUpdate('sanskrit', e.target.value)} className="text-sm font-devanagari" rows={2} />
                        </div>
                        <div>
                            <Label htmlFor={`translation-${citation.clientId}`} className="text-xs">Translation</Label>
                            <Textarea id={`translation-${citation.clientId}`} value={citation.translation || ''} onChange={(e) => handleFieldUpdate('translation', e.target.value)} className="text-sm" rows={2} />
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <Label htmlFor={`refId-${citation.clientId}`} className="text-xs">Ref ID (auto-generated)</Label>
                                <Input id={`refId-${citation.clientId}`} value={citation.refId || ''} onChange={(e) => handleFieldUpdate('refId', e.target.value)} className="h-8 text-sm bg-muted/50" />
                            </div>
                            <div>
                                <Label htmlFor={`keywords-${citation.clientId}`} className="text-xs">Keywords (comma-separated)</Label>
                                <Input id={`keywords-${citation.clientId}`} value={citation.keywords?.join(', ') || ''} onChange={(e) => handleKeywordsUpdate(e.target.value)} className="h-8 text-sm" />
                            </div>
                        </div>
                    </div>
                     <Button size="icon" variant="ghost" onClick={() => onDelete(citation.clientId)} title="Remove Citation" className="shrink-0 mt-4">
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

export function BulkCitationImporterDialog({ children, categories, open, onOpenChange }: { children: ReactNode; categories: CitationCategory[]; open?: boolean; onOpenChange?: (open: boolean) => void; }) {
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = open !== undefined && onOpenChange !== undefined;
    const currentOpen = isControlled ? open! : internalOpen;
    const setCurrentOpen = isControlled ? onOpenChange! : setInternalOpen;
    
    const [parsedData, setParsedData] = useState<any[] | null>(null);
    const { toast } = useToast();

    const [parserState, runParserAction] = useActionState(runCitationParser, null);
    const [importerState, importCitationsAction] = useActionState(importParsedCitations, null);
    
    useEffect(() => {
        if (parserState?.citations) {
            setParsedData(parserState.citations);
        }
        if (parserState?.error && !parserState.fieldErrors) {
            toast({ variant: 'destructive', title: 'Parsing Error', description: parserState.error });
        }
    }, [parserState, toast]);

    useEffect(() => {
        if (importerState?.success) {
            toast({ title: 'Import Complete!', description: importerState.message });
            setCurrentOpen(false); // Close dialog on success
        }
        if (importerState?.error && !importerState.fieldErrors) {
            toast({ variant: 'destructive', title: 'Import Error', description: importerState.error });
        }
    }, [importerState, toast, setCurrentOpen]);

    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen) {
            setParsedData(null);
        }
        setCurrentOpen(isOpen);
    };

    const handleUpdateCitation = useCallback((clientId: string, updates: Partial<Citation>) => {
        setParsedData(currentData => {
            if (!currentData) return null;
            return currentData.map(c => c.clientId === clientId ? { ...c, ...updates } : c);
        });
    }, []);

    const handleDeleteCitation = useCallback((clientId: string) => {
        setParsedData(currentData => (currentData || []).filter(c => c.clientId !== clientId));
    }, []);
    
    const dataToSubmit = parsedData || [];

    return (
        <Dialog open={currentOpen} onOpenChange={handleOpenChange}>
            {!isControlled && <DialogTrigger asChild>{children}</DialogTrigger>}
            <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Bulk Import Citations</DialogTitle>
                    <DialogDescription>
                        {parsedData ? 'Review the parsed citations, make any edits, then import them into a collection.' : 'Paste unstructured text containing citations. The AI will parse it into a structured format.'}
                    </DialogDescription>
                </DialogHeader>

                {!parsedData ? (
                    <form action={runParserAction} className="space-y-4">
                        <Textarea name="text" rows={15} placeholder="Paste your citation data here..." required />
                        {parserState?.fieldErrors?.text && <p className="text-sm text-destructive">{parserState.fieldErrors.text[0]}</p>}
                        <ParserSubmitButton />
                    </form>
                ) : (
                    <form action={importCitationsAction} className="flex-1 flex flex-col min-h-0">
                        <input type="hidden" name="citations" value={JSON.stringify(dataToSubmit)} />
                        
                        <div className="flex justify-between items-center mb-4 flex-shrink-0">
                             <h3 className="text-lg font-medium">Review Citations ({parsedData?.length || 0})</h3>
                            <div className="flex items-center gap-2">
                                <Label htmlFor="category-select">Import To</Label>
                                <Select name="categoryId" required defaultValue="uncategorized">
                                    <SelectTrigger id="category-select" className="w-[200px]">
                                        <SelectValue placeholder="Select a collection" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map(category => (
                                            <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex-1 min-h-0 overflow-y-auto">
                          <div className="space-y-2 pr-4">
                              {parsedData.map(citation => (
                                  <ParsedCitationEditor 
                                      key={citation.clientId}
                                      citation={citation}
                                      onUpdate={handleUpdateCitation}
                                      onDelete={handleDeleteCitation}
                                  />
                              ))}
                          </div>
                        </div>
                        
                        <DialogFooter className="pt-4 border-t flex-shrink-0 mt-4">
                             <Button type="button" variant="outline" onClick={() => setParsedData(null)}>Back</Button>
                            <ImporterSubmitButton />
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}


  