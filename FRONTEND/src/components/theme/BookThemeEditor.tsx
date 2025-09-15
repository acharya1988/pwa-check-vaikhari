
'use client';

import React, { useState, useEffect, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useBookTheme } from './BookThemeContext';
import { BookThemeControls } from './BookThemeControls';
import { BookThemeLivePreview } from './BookThemeLivePreview';
import type { BookTheme, BookContent } from '@/types';
import { Button } from '../ui/button';
import { ArrowLeft, Save, Undo, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { saveBookTheme } from '@/actions/book.actions';
import { useToast } from '@/hooks/use-toast';

interface BookThemeEditorProps {
  initialTheme: BookTheme;
  defaultTheme: BookTheme;
  bookContent: BookContent;
}

function SaveButton() {
    const { pending } = useFormStatus();
    return (
        <Button size="sm" type="submit" disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Theme
        </Button>
    )
}

export function BookThemeEditor({ initialTheme, defaultTheme, bookContent }: BookThemeEditorProps) {
  const { theme, setTheme } = useBookTheme();
  const [state, formAction] = useActionState(saveBookTheme, null);
  const { toast } = useToast();
  
  const handleStyleChange = (element: keyof BookTheme['styles'], property: string, value: string) => {
    if (!theme) return;
    const newTheme = JSON.parse(JSON.stringify(theme)); // Deep copy
    if (!newTheme.styles[element]) {
        newTheme.styles[element] = {};
    }
    newTheme.styles[element][property as keyof typeof newTheme.styles[keyof BookTheme['styles']]] = value;
    setTheme(newTheme);
  };

  const handleThemeApply = (newPreset: BookTheme) => {
    setTheme({
      ...theme,
      themeName: newPreset.themeName,
      styles: newPreset.styles,
    } as BookTheme);
  };
  
  const resetToDefault = () => {
    setTheme({ ...defaultTheme, bookId: theme?.bookId || 'unknown' });
  };
  
  useEffect(() => {
    if (state?.success) {
      toast({ title: "Success!", description: state.message });
    }
    if (state?.error) {
      toast({ variant: 'destructive', title: "Error", description: state.error });
    }
  }, [state, toast]);
  
  if (!theme) return null;

  return (
    <div className="h-screen flex flex-col bg-muted/40">
       <form action={formAction}>
           <input type="hidden" name="bookId" value={theme.bookId} />
           <input type="hidden" name="themeData" value={JSON.stringify(theme)} />

           <header className="flex items-center justify-between gap-4 p-4 border-b bg-background sticky top-0 z-20 flex-shrink-0">
             <div className="flex items-center gap-2">
               <Button variant="link" className="p-0 h-auto text-muted-foreground" asChild>
                 <Link href={`/admin/books/${bookContent.bookId}`}>
                   <ArrowLeft className="mr-2 h-4 w-4" /> Back to Book
                 </Link>
               </Button>
             </div>
             <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" type="button" onClick={resetToDefault}>
                    <Undo className="mr-2 h-4 w-4" /> Reset to Default
                </Button>
                <SaveButton />
             </div>
           </header>
       </form>

       <div className="flex-1 grid grid-cols-1 lg:grid-cols-[400px_1fr] overflow-hidden">
        <div className="flex flex-col min-h-0">
            <BookThemeControls
                styles={theme.styles}
                defaultStyles={defaultTheme.styles}
                onStyleChange={handleStyleChange}
                onThemeApply={handleThemeApply}
            />
        </div>
        <div className="relative h-full overflow-hidden">
             <BookThemeLivePreview bookContent={bookContent} />
        </div>
       </div>
    </div>
  );
}
