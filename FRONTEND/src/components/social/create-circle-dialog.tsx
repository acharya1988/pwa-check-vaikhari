
'use client';

import React, { useState, useEffect, useRef, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { createCircleAction } from '@/actions/profile.actions';
import { Loader2 } from 'lucide-react';

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </Button>
  );
}

export function CreateCircleDialog({ children, onCircleCreated, forceType }: {
    children: React.ReactNode;
    onCircleCreated?: () => void;
    forceType?: 'organization' | 'personal';
}) {
    const [open, setOpen] = useState(false);
    const [state, formAction] = useActionState(createCircleAction, null);
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        if (state?.success) {
            toast({ title: state.message });
            formRef.current?.reset();
            setOpen(false);
            onCircleCreated?.();
        }
        if (state?.error) {
            toast({ variant: 'destructive', title: 'Error', description: state.error });
        }
    }, [state, toast, onCircleCreated]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create a New Circle</DialogTitle>
                    <DialogDescription>Build a community around a topic or interest.</DialogDescription>
                </DialogHeader>
                <form ref={formRef} action={formAction} className="space-y-4">
                     <div>
                        <Label htmlFor="name">Circle Name</Label>
                        <Input id="name" name="name" required />
                        {state?.fieldErrors?.name && <p className="text-sm text-destructive mt-1">{state.fieldErrors.name[0]}</p>}
                    </div>
                     <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" name="description" required />
                        {state?.fieldErrors?.description && <p className="text-sm text-destructive mt-1">{state.fieldErrors.description[0]}</p>}
                    </div>
                     <div>
                        <Label>Circle Type</Label>
                        <input type="hidden" name="type" value={forceType || 'personal'} />
                         <RadioGroup defaultValue={forceType || 'personal'} name="type" className="flex gap-4">
                            <Label htmlFor="type-personal" className="flex items-center gap-2 border rounded-md p-3 flex-1 cursor-pointer has-[:checked]:border-primary">
                                <RadioGroupItem value="personal" id="type-personal" disabled={!!forceType} />
                                <div><p className="font-semibold">Personal</p><p className="text-xs text-muted-foreground">A group for friends or colleagues.</p></div>
                            </Label>
                             <Label htmlFor="type-org" className="flex items-center gap-2 border rounded-md p-3 flex-1 cursor-pointer has-[:checked]:border-primary">
                                <RadioGroupItem value="organization" id="type-org" disabled={!!forceType} />
                                <div><p className="font-semibold">Organization</p><p className="text-xs text-muted-foreground">Represents an institution or company.</p></div>
                            </Label>
                        </RadioGroup>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
                        <Button type="submit">Create Circle</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
