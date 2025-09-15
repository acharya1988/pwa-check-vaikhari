
'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { uploadImage } from '@/actions/media.actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} className="w-full">
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                </>
            ) : (
                <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Image
                </>
            )}
        </Button>
    );
}

export function MediaUploader({ 
    showCard = true,
    onUploadSuccess,
    capture
}: { 
    showCard?: boolean;
    onUploadSuccess?: () => void;
    capture?: 'user' | 'environment';
}) {
    const [state, formAction] = useActionState(uploadImage, null);
    const formRef = useRef<HTMLFormElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();
    const [lastHandledState, setLastHandledState] = useState<any>(null);

    useEffect(() => {
        // Only show toast if the state is new and hasn't been handled yet.
        if (state && state !== lastHandledState) {
            if (state.success) {
                toast({
                    title: 'Success!',
                    description: state.message,
                });
                formRef.current?.reset();
                if (onUploadSuccess) {
                    onUploadSuccess();
                }
            }
            if (state.error) {
                toast({
                    variant: 'destructive',
                    title: 'Upload Failed',
                    description: state.error,
                });
            }
            // Mark this state as handled to prevent re-triggering.
            setLastHandledState(state);
        }
    }, [state, toast, onUploadSuccess, lastHandledState]);
    
    const UploaderForm = (
        <form ref={formRef} action={formAction} className="space-y-4">
            <div>
                <Label htmlFor="image-upload" className="sr-only">Choose file</Label>
                <Input id="image-upload" name="image" type="file" ref={inputRef} required accept="image/*" capture={capture} />
            </div>
            <SubmitButton />
        </form>
    );

    if (!showCard) {
        return UploaderForm;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Upload New Image</CardTitle>
                <CardDescription>
                    Select an image file from your computer to add it to the library.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {UploaderForm}
            </CardContent>
        </Card>
    );
}
