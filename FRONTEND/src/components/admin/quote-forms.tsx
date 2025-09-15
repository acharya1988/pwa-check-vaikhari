
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
import { useToast } from '@/hooks/use-toast';
import { createQuoteCategory, createQuote } from '@/actions/quote.actions';
import { Loader2, Plus } from 'lucide-react';
import type { Quote, QuoteCategory } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function SubmitButton({ children }: { children: ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </Button>
  );
}

function useFormDialog(state: any, onOpenChange: (open: boolean) => void) {
    const { toast } = useToast();
    
    useEffect(() => {
        if (state?.success) {
            toast({ title: "Success!", description: state.message });
            onOpenChange(false);
        }
         if (state?.error && !state.fieldErrors) {
            toast({ variant: 'destructive', title: "Error!", description: state.error });
        }
    }, [state, toast, onOpenChange]);
}

export function CreateQuoteCategoryDialog({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(createQuoteCategory, null);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
        toast({ title: state.message });
        formRef.current?.reset();
        setOpen(false);
    }
    if (state?.error) {
        toast({ variant: 'destructive', title: 'Error', description: state.error });
    }
  }, [state, toast]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Quote Category</DialogTitle>
          <DialogDescription>Add a new category to group your quotes.</DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="space-y-4">
          <div>
            <Label htmlFor="name">Category Name</Label>
            <Input id="name" name="name" required />
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

export function CreateQuoteDialog({
  open,
  onOpenChange,
  children,
  categories,
  selectedCategoryId,
  initialQuote,
  onQuoteCreated
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
  categories: QuoteCategory[];
  selectedCategoryId?: string;
  initialQuote?: string;
  onQuoteCreated?: (newQuote?: Quote) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const currentOpen = isControlled ? open! : internalOpen;
  const setCurrentOpen = isControlled ? onOpenChange! : setInternalOpen;
  
  const [state, formAction] = useActionState(createQuote, null);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      toast({ title: "Success!", description: "Quote created successfully." });
      setCurrentOpen(false);
      formRef.current?.reset();
      onQuoteCreated?.(state.newQuote);
    }
    if (state?.error && !state.fieldErrors) {
      toast({ variant: 'destructive', title: "Error!", description: state.error });
    }
  }, [state, toast, setCurrentOpen, onQuoteCreated]);


  return (
    <Dialog open={currentOpen} onOpenChange={setCurrentOpen}>
      {!isControlled && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create New Quote</DialogTitle>
          <DialogDescription>Add a new quote to your library.</DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="space-y-4">
          <div>
            <Label htmlFor="categoryId">Category</Label>
            <Select name="categoryId" required defaultValue={selectedCategoryId || 'uncategorized'}>
              <SelectTrigger id="categoryId">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {state?.fieldErrors?.categoryId && <p className="text-sm text-destructive mt-1">{state.fieldErrors.categoryId[0]}</p>}
          </div>
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required />
            {state?.fieldErrors?.title && <p className="text-sm text-destructive mt-1">{state.fieldErrors.title[0]}</p>}
          </div>
          <div>
            <Label htmlFor="quote">Quote</Label>
            <Textarea id="quote" name="quote" required rows={4} defaultValue={initialQuote || ''} />
            {state?.fieldErrors?.quote && <p className="text-sm text-destructive mt-1">{state.fieldErrors.quote[0]}</p>}
          </div>
          <div>
            <Label htmlFor="author">Author / Source</Label>
            <Input id="author" name="author" required />
            {state?.fieldErrors?.author && <p className="text-sm text-destructive mt-1">{state.fieldErrors.author[0]}</p>}
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
            <SubmitButton>Create Quote</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
