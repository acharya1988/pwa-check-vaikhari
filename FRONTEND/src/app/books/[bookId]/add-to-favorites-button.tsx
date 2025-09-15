'use client';

import React, { useActionState, useEffect, useState } from 'react';
import { toggleFavoriteBook } from '@/actions/profile.actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

export function AddToFavoritesButton({ bookId, isFavorited }: { bookId: string; isFavorited: boolean }) {
    const [state, formAction] = useActionState(toggleFavoriteBook, null);
    const { toast } = useToast();
    const [optimisticFavorited, setOptimisticFavorited] = useState(isFavorited);

    useEffect(() => {
        setOptimisticFavorited(isFavorited);
    }, [isFavorited]);

    useEffect(() => {
        if (state?.success) {
            toast({ description: state.message });
        }
        if (state?.error) {
            toast({ variant: 'destructive', title: 'Error', description: state.error });
            setOptimisticFavorited(isFavorited); // Revert on error
        }
    }, [state, toast, isFavorited]);

    const handleFormAction = (formData: FormData) => {
        setOptimisticFavorited(prev => !prev);
        formAction(formData);
    };
    
    return (
        <form action={handleFormAction}>
            <input type="hidden" name="bookId" value={bookId} />
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button type="submit" variant="secondary">
                            <Bookmark className={cn("mr-2 h-4 w-4", optimisticFavorited && "fill-primary text-primary")} />
                            {optimisticFavorited ? 'Saved' : 'Save for Later'}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{optimisticFavorited ? 'Remove from Favorites' : 'Add to Favorites'}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </form>
    );
}
