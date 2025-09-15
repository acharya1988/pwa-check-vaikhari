
'use client';

import { useActionState, useEffect, useRef, useState, type ReactNode } from 'react';
import { useFormStatus } from 'react-dom';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { createGlossaryCategory, createGlossaryTerm } from '@/actions/glossary.actions';
import { Loader2, Plus } from 'lucide-react';
import type { GlossaryCategory } from '@/types';

function SubmitButton({ children }: { children: ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </Button>
  );
}

export function CreateCategoryDialog({ children, onCategoryCreated }: { children: React.ReactNode; onCategoryCreated?: () => void; }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(createGlossaryCategory, null);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
        toast({ title: "Success!", description: "Category created." });
        setOpen(false);
        formRef.current?.reset();
        onCategoryCreated?.();
    }
    if (state?.error) {
        toast({ variant: 'destructive', title: "Error", description: state.error });
    }
  }, [state, toast, onCategoryCreated]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Glossary Category</DialogTitle>
          <DialogDescription>Add a new category to group your glossary terms.</DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="space-y-4">
          <div>
            <Label htmlFor="name">Category Name</Label>
            <Input id="name" name="name" placeholder="e.g., Vedanta Terms" required />
            {state?.fieldErrors?.name && <p className="text-sm text-destructive mt-1">{state.fieldErrors.name[0]}</p>}
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


export function CreateTermDialog({ categories, children, selectedCategoryId, onTermCreated }: { 
    categories: GlossaryCategory[], 
    children: ReactNode, 
    selectedCategoryId?: string,
    onTermCreated?: () => void,
 }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(createGlossaryTerm, null);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  
  useEffect(() => {
    if(state?.success) {
        toast({ title: 'Success', description: state.message });
        formRef.current?.reset();
        setOpen(false);
        onTermCreated?.();
    }
    if(state?.error) {
        toast({ variant: 'destructive', title: 'Error', description: state.error });
    }
  },[state?.success, state?.error, state?.message, toast, onTermCreated])
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Glossary Term</DialogTitle>
          <DialogDescription>Add a new term to a glossary category.</DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="space-y-4">
          
           <div>
                <Label htmlFor="categoryId">Category</Label>
                <div className="flex items-center gap-2">
                    <Select name="categoryId" defaultValue={selectedCategoryId || 'uncategorized'}>
                        <SelectTrigger id="categoryId">
                            <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                            {categories.map(category => (
                                <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                     <CreateCategoryDialog onCategoryCreated={onTermCreated}>
                        <Button type="button" variant="outline" size="icon" className="flex-shrink-0" title="Add new category">
                            <Plus className="h-4 w-4" />
                        </Button>
                    </CreateCategoryDialog>
                </div>
                {state?.fieldErrors?.categoryId && <p className="text-sm text-destructive mt-1">{state.fieldErrors.categoryId[0]}</p>}
            </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="term">Term (in Sanskrit)</Label>
              <Input id="term" name="term" placeholder="e.g., आत्मन्" required />
              {state?.fieldErrors?.term && <p className="text-sm text-destructive mt-1">{state.fieldErrors.term[0]}</p>}
            </div>
             <div>
              <Label htmlFor="transliteration">IAST Transliteration</Label>
              <Input id="transliteration" name="transliteration" placeholder="e.g., ātman" />
            </div>
          </div>

          <div>
            <Label htmlFor="definition">Definition</Label>
            <Textarea id="definition" name="definition" placeholder="Enter the definition of the term." required />
             {state?.fieldErrors?.definition && <p className="text-sm text-destructive mt-1">{state.fieldErrors.definition[0]}</p>}
          </div>

          <DialogFooter>
            <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
            <SubmitButton>Create Term</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
