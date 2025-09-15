
'use client';

import React, { useEffect, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { completeOnboarding } from '@/actions/onboarding.actions';
import { useToast } from '@/hooks/use-toast';
import { useAuthGuard } from '@/hooks/useAuthGuard';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button size="lg" type="submit" className="w-full" disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Complete Profile & Enter'}
        </Button>
    );
}


export function ProfileForm() {
    const { user } = useAuthGuard();
    const [state, formAction] = useActionState(completeOnboarding, null);
    const { toast } = useToast();

    useEffect(() => {
        if (state?.error) {
            toast({
                variant: 'destructive',
                title: 'Submission Error',
                description: state.error,
            });
            console.log("Field Errors:", state.fieldErrors);
        }
    }, [state, toast]);

    return (
        <Card>
            <CardHeader className="text-center">
                <CardTitle className="text-3xl">Build Your VAIKHARI Profile</CardTitle>
                <CardDescription>
                    This information will be used to create your public profile.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form action={formAction} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name*</Label>
                        <Input id="name" name="name" required defaultValue={user?.name || ''} />
                        {state?.fieldErrors?.name && <p className="text-destructive text-xs mt-1">{state.fieldErrors.name[0]}</p>}
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="username">Username* (@handle)</Label>
                        <Input id="username" name="username" required defaultValue={user?.username || user?.email?.split('@')[0] || ''} />
                         {state?.fieldErrors?.username && <p className="text-destructive text-xs mt-1">{state.fieldErrors.username[0]}</p>}
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="tagline">Tagline / Current Role</Label>
                        <Input id="tagline" name="tagline" placeholder="e.g., Researcher, Scholar, Doctor" defaultValue={user?.tagline || ''} />
                    </div>
                    <div className="pt-4">
                        <SubmitButton />
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
