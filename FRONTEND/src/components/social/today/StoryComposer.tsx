

'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useFormStatus } from 'react-dom';
import { useActionState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { createTodayStoryAction } from '@/actions/today.actions';
import type { UserProfile, TodayStoryStyle, Quote, QuoteCategory, AttachedWork } from '@/types';
import { Loader2, Send, Edit, BookOpen } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { SocialContentRenderer } from '../social-content-renderer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import './story-composer.css';
import { useEditor, EditorContent, type Editor, type Range } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { CitationNode, CustomBlockquote, QuoteSuggestions } from '@/components/admin/editor/tiptap-extensions';
import { TextSelectionMenu } from '@/components/text-selection-menu';
import { UserCitationDialog } from '@/components/user-citation-dialog';
import { CreateQuoteDialog } from '@/components/admin/quote-forms';
import { getQuoteData } from '@/services/quote.service';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RgbaStringColorPicker } from 'react-colorful';
import { Separator } from '@/components/ui/separator';
import { AnnounceWorkDialog } from '../announce-work-dialog';
import { Card } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';

// ---------- Utilities ----------
const pad2 = (n: number) => String(n).padStart(2, '0');
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const nowRounded = () => {
  const d = new Date();
  d.setSeconds(0, 0);
  return d;
};

const toInputDateTime = (d: Date) => {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};

const fromInputDateTime = (s: string) => {
  if (!s) return new Date(NaN);
  const v = s.split('.')[0];
  return new Date(v);
};

const addHours = (d: Date, hours: number) => {
  const n = new Date(d.getTime());
  n.setHours(n.getHours() + hours);
  return n;
};

const maxExpiry = (base = new Date()) => addHours(base, 24 * 15);

const firstHexIn = (css: string) => {
  try {
    const m = String(css).match(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})/);
    return m ? `#${m[1]}` : '#ffffff';
  } catch (e) {
    return '#ffffff';
  }
};

const hexToRgb = (hex: string) => {
  const h = String(hex || '#000000').replace('#', '');
  const r = parseInt(h.slice(0, 2) || '00', 16);
  const g = parseInt(h.slice(2, 4) || '00', 16);
  const b = parseInt(h.slice(4, 6) || '00', 16);
  return { r, g, b };
};

const luminance = ({ r, g, b }: {r: number, g: number, b: number}) => {
  const srgb = [r, g, b].map((v) => v / 255).map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
};

const contrastTextFor = (bgCss: string) => {
  if (!bgCss || bgCss.includes('gradient')) return '#ffffff'; // Default to white for gradients
  const hex = firstHexIn(bgCss);
  const lum = luminance(hexToRgb(hex));
  return lum > 0.5 ? '#0b0b0b' : '#ffffff';
};

// ---------- Presets ----------
const GRADIENTS = [
  { key: 'mural-royal', label: 'Mural • Royal', css: 'linear-gradient(135deg, #0ea5e9 0%, #9333ea 50%, #f43f5e 100%)' },
  { key: 'sunrise', label: 'Sunrise', css: 'linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%)' },
  { key: 'forest', label: 'Forest', css: 'linear-gradient(135deg, #16a34a 0%, #065f46 100%)' },
  { key: 'ocean', label: 'Ocean', css: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)' },
  { key: 'amrita', label: 'Amṛta', css: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 50%, #8b5cf6 100%)' },
];

const SOLIDS = [
  { key: 'minimal-white', label: 'Minimal', css: '#ffffff' },
  { key: 'slate', label: 'Slate', css: '#0f172a' },
  { key: 'cream', label: 'Cream', css: '#faf8f3' },
  { key: 'sand', label: 'Sand', css: '#f5e8d0' },
  { key: 'ink', label: 'Ink', css: '#111111' },
];

const FONT_SIZE_OPTIONS = [16, 18, 20, 22, 24, 26, 28, 32, 36, 40];

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
             {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Publish Story
        </Button>
    )
}

export function StoryComposer({
  open,
  onOpenChange,
  currentUser,
  onStoryCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: UserProfile;
  onStoryCreated: () => void;
}) {
    const [state, formAction] = useActionState(createTodayStoryAction as any, null as any);
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);

    const [storyType, setStoryType] = useState('thought');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [source, setSource] = useState('');
    const [bgCss, setBgCss] = useState<string | null>(GRADIENTS[0].css);
    const [fontSize, setFontSize] = useState(26);
    
    const [isAnnounceDialogOpen, setIsAnnounceDialogOpen] = useState(false);
    const [attachedWork, setAttachedWork] = useState<AttachedWork | null>(null);
    
    const [quoteCategories, setQuoteCategories] = useState<QuoteCategory[]>([]);
    const [quoteDialogState, setQuoteDialogState] = useState<{ open: boolean; text: string; range: Range | null }>({ open: false, text: '', range: null });
    const [citationDialogState, setCitationDialogState] = useState({ open: false, text: '' });
    
    const editor = useEditor({
        extensions: [
            StarterKit.configure({ blockquote: false, heading: false, horizontalRule: false }),
            Placeholder.configure({ placeholder: 'Write your śloka, sūtra, or thought…' }),
            CitationNode, CustomBlockquote, QuoteSuggestions
        ],
        onUpdate: ({ editor }) => setContent(editor.getHTML()),
    });
    
    useEffect(() => {
        if (open) getQuoteData().then(setQuoteCategories);
    }, [open]);

    const minDt = nowRounded();
    const defaultExpiry = toInputDateTime(addHours(new Date(), 24));
    const [expiry, setExpiry] = useState(defaultExpiry);
    const maxDt = maxExpiry();

    const isGradient = bgCss?.includes('gradient');
    const previewBg = isGradient ? { backgroundImage: bgCss } : { backgroundColor: bgCss || 'transparent' };
    const textColor = useMemo(() => contrastTextFor(bgCss || '#ffffff'), [bgCss]);

    useEffect(() => {
        if (!expiry) setExpiry(defaultExpiry);
    }, [defaultExpiry, expiry]);
    
    const handleStoryTypeChange = (type: string) => {
        setStoryType(type);
        if (type === 'announce') {
            setIsAnnounceDialogOpen(true);
        }
    }

    const handleWorkSelected = (work: AttachedWork) => {
        setAttachedWork(work);
        if(editor) {
            let announceContent = `<h1>${work.title}</h1>`;
            if (work.parentTitle) {
                announceContent += `<p>From: ${work.parentTitle}</p>`;
            }
            if(work.description) {
                 announceContent += `<p>${work.description}</p>`;
            }
            editor.commands.setContent(announceContent);
        }
        setIsAnnounceDialogOpen(false);
    };

    const handleQuickExpiry = (hours: number) => {
        const clamped = clamp(hours, 1, 24 * 15);
        const newExpiryDate = addHours(new Date(), clamped);
        setExpiry(toInputDateTime(newExpiryDate));
    };
    
    useEffect(() => {
        if(state?.success) {
            toast({ title: "Story Published!" });
            onOpenChange(false);
            formRef.current?.reset();
            setContent('');
            setTitle('');
            setSource('');
            onStoryCreated();
        }
        if(state?.error) {
            toast({ variant: 'destructive', title: "Error", description: state.error });
        }
    }, [state, toast, onOpenChange, onStoryCreated]);

    const handleQuoteCreated = (newQuote?: Quote) => {
        const range = quoteDialogState.range;
        if (!newQuote || !range || !editor) return;
        editor.chain().focus().deleteRange(range).insertContent({
            type: 'blockquote',
            attrs: { author: newQuote.author },
            content: [{ type: 'paragraph', content: [{ type: 'text', text: newQuote.quote }] }]
        }).run();
        setQuoteDialogState({ open: false, text: '', range: null });
    };

    const handleTextSelection = (text: string) => {
        if (text) {
            setQuoteDialogState(prev => ({ ...prev, text }));
            setCitationDialogState(prev => ({...prev, text }));
        }
    };
    
    //  const handleSubmit = (formData: FormData) => {
    //     const when = fromInputDateTime(expiry);
    //     const max = maxDt;
    //     const finalExpiry = when > max ? max : when;
        
    //     const style: TodayStoryStyle = {
    //         background: bgCss || '#ffffff',
    //         textColor: textColor,
    //         fontSize,
    //     };
        
    //     const payload = {
    //         type: storyType,
    //         content,
    //         style,
    //         source,
    //         visibility: {
    //             expiryAt: finalExpiry.toISOString(),
    //         },
    //         title,
    //         tags: [],
    //         attachedWork,
    //     };
        
    //     formData.append('payload', JSON.stringify(payload));
    //     formAction(formData);
    // }


    const handleSubmit = (formData: FormData) => {


    // Convert expiry input
    const when = fromInputDateTime(expiry);
    const max = maxDt;
    const finalExpiry = when > max ? max : when;

  

    // Build style object
    const style: TodayStoryStyle = {
        background: bgCss || "#ffffff",
        textColor: textColor,
        fontSize,
    };


    // Basic validation
    if (!storyType) {
        console.error("❌ Validation failed: storyType is required");
        return;
    }
    if (!content || content.trim() === "") {
        console.error("❌ Validation failed: content cannot be empty");
        return;
    }
    if (!title || title.trim() === "") {
        console.error("❌ Validation failed: title is required");
        return;
    }
    if (!finalExpiry || isNaN(finalExpiry.getTime())) {
        console.error("❌ Validation failed: expiry date is invalid");
        return;
    }

    // Payload construction
    const payload = {
        type: storyType,
        content,
        style,
        source,
        visibility: {
            expiryAt: finalExpiry.toISOString(),
        },
        title,
        tags: [],
        attachedWork,
    };


    // Append to FormData
    formData.append("payload", JSON.stringify(payload));

    formAction(formData);
};


  return (
    <>
      <UserCitationDialog open={citationDialogState.open} onOpenChange={(isOpen) => setCitationDialogState({ open: isOpen, text: '' })} sanskritText={citationDialogState.text} source={{ name: 'Today Story', location: '' }} />
      <CreateQuoteDialog open={quoteDialogState.open} onOpenChange={(isOpen) => setQuoteDialogState(prev => ({ ...prev, open: isOpen }))} initialQuote={quoteDialogState.text} onQuoteCreated={handleQuoteCreated} categories={quoteCategories} />
      <AnnounceWorkDialog open={isAnnounceDialogOpen} onOpenChange={setIsAnnounceDialogOpen} onWorkSelected={handleWorkSelected} />

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl p-0 h-full md:h-[calc(100vh-4rem)] flex flex-col">
            <DialogHeader className="sr-only">
                <DialogTitle>Create Today's Story</DialogTitle>
                <DialogDescription>Share a thought, a shloka, or an announcement that will be visible to your circles for a limited time.</DialogDescription>
            </DialogHeader>
            <form ref={formRef} action={handleSubmit} className="flex-1 flex flex-col min-h-0">
                <input type="hidden" name="authorId" value={currentUser.email} />
                <input type="hidden" name="authorName" value={currentUser.name} />
                <input type="hidden" name="authorAvatarUrl" value={currentUser.avatarUrl} />
                <div className="flex-1 grid grid-cols-1 md:grid-cols-[1fr_340px] overflow-hidden">
                    <ScrollArea className="w-full h-full">
                        <div className="p-4 space-y-4">
                             <section className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Select value={storyType} onValueChange={handleStoryTypeChange}>
                                        <SelectTrigger 
                                        
                                        className="w-auto h-9 rounded-full text-xs gap-2"
                                        >
                                            <SelectValue/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="thought">Thought</SelectItem>
                                            <SelectItem value="sloka">Shloka</SelectItem>
                                            <SelectItem value="sutra">Sutra</SelectItem>
                                            <SelectItem value="announce">Announcement</SelectItem>
                                            <SelectItem value="event">Event</SelectItem>
                                        </SelectContent>
                                    </Select>
                                   

                                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (optional)" aria-label="Story title" className="rounded-full h-9 flex-1" />
                                </div>
                                <TextSelectionMenu onSelectText={handleTextSelection} onSaveCitation={() => setCitationDialogState(prev => ({...prev, open: true}))} onCreateQuote={() => {
                                    const selection = window.getSelection();
                                    if (selection) {
                                        const range = selection.getRangeAt(0);
                                        setQuoteDialogState(prev => ({ ...prev, open: true, range }));
                                    }
                                }}>
                                    <EditorContent editor={editor} className="min-h-[120px] w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
                                </TextSelectionMenu>
                                <Input value={source} onChange={(e) => setSource(e.target.value)} placeholder="Source (e.g., Gītā 2.47)" aria-label="Story source" className="rounded-full h-9" />
                            </section>
                            
                             <section className="space-y-3">
                                <h3 className="font-medium text-sm text-muted-foreground">Styling</h3>
                                <div className="flex items-center gap-2 flex-wrap">
                                     <div className="flex items-center gap-2">
                                        <Label htmlFor="font-size-select" className="text-sm text-muted-foreground">Font</Label>
                                         <Select value={String(fontSize)} onValueChange={(val) => setFontSize(Number(val))}>
                                            <SelectTrigger id="font-size-select" className="w-[100px] h-9 rounded-full">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {FONT_SIZE_OPTIONS.map(size => (
                                                    <SelectItem key={size} value={String(size)}>{size} px</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Label className="text-sm text-muted-foreground">Background</Label>
                                         <Tabs defaultValue="gradients" className="flex items-center gap-1.5">
                                            <TabsList>
                                                <TabsTrigger value="solids">Solids</TabsTrigger>
                                                <TabsTrigger value="gradients">Gradients</TabsTrigger>
                                            </TabsList>
                                            <TabsContent value="solids" className="flex items-center gap-1.5 ml-2">
                                                {SOLIDS.map(swatch => (
                                                    <button key={swatch.key} type="button" onClick={() => setBgCss(swatch.css)} className={cn("h-7 w-7 rounded-md border-2", bgCss === swatch.css ? 'border-primary' : 'border-border/50')} style={{background: swatch.css}} aria-label={`Select background ${swatch.label}`}/>
                                                ))}
                                            </TabsContent>
                                            <TabsContent value="gradients" className="flex items-center gap-1.5 ml-2">
                                                 {GRADIENTS.map((g) => (
                                                    <button key={g.key} title={g.label} type="button" className={cn("h-7 w-7 rounded-md border-2", bgCss === g.css ? 'border-primary' : 'border-border/50')} style={{ background: g.css }} onClick={() => setBgCss(g.css)} aria-label={`Select gradient ${g.label}`} />
                                                ))}
                                            </TabsContent>
                                        </Tabs>
                                          <Popover>
                                            <PopoverTrigger asChild>
                                                <Button type="button" variant="outline" size="icon" className="h-7 w-7 rounded-md relative group shrink-0">
                                                    <div className="h-full w-full rounded-sm border" style={{ background: isGradient ? '#000' : bgCss || 'transparent' }}></div>
                                                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                                                        <Edit className="h-3 w-3 text-white" />
                                                    </div>
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0 border-none">
                                                <RgbaStringColorPicker color={isGradient ? 'rgba(0,0,0,1)' : (bgCss || 'rgba(0,0,0,1)')} onChange={setBgCss} />
                                            </PopoverContent>
                                        </Popover>
                                     </div>
                                </div>
                            </section>

                            <section className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-medium text-sm text-muted-foreground">Visibility</h3>
                                    <div className="text-xs text-muted-foreground">Max 15 days</div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    {[{ label: '24h', hours: 24 }, { label: '3d', hours: 72 }, { label: '7d', hours: 168 }, { label: '10d', hours: 240 }, { label: '15d', hours: 360 }].map((opt) => (
                                        <Button key={opt.label} type="button" variant="outline" size="sm" onClick={() => handleQuickExpiry(opt.hours)} className="h-8 px-2">{opt.label}</Button>
                                    ))}
                                    <Input type="datetime-local" className="h-9 rounded-full w-auto" min={toInputDateTime(minDt)} max={toInputDateTime(maxDt)} value={expiry} onChange={(e) => setExpiry(e.target.value)} aria-label="Expiry datetime" />
                                </div>
                            </section>
                            <div className="pt-4 flex justify-end gap-2">
                                <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                                <SubmitButton />
                            </div>
                        </div>
                    </ScrollArea>

                     <div className="bg-muted p-4 flex items-center justify-center flex-1 min-w-0">
                         <div
                            className={cn("relative w-full max-w-[270px] aspect-[9/16] rounded-2xl shadow-2xl overflow-hidden border")}
                            style={previewBg}
                        >
                            <div className="absolute inset-0 p-6 flex">
                                <div className="m-auto w-full text-center" style={{ color: textColor }}>
                                    {title && <div className="text-xs opacity-75 mb-2">{title}</div>}
                                    <div className="font-serif whitespace-pre-wrap" style={{ fontSize: `${fontSize}px`, lineHeight: 1.4 }}>
                                        <SocialContentRenderer htmlString={content || 'Write your śloka/sūtra/announcement…'} />
                                    </div>
                                </div>
                            </div>
                            <div className="pointer-events-none absolute inset-0" style={{
                            background:
                                'radial-gradient(120% 60% at 50% 0%, rgba(255,255,255,0.25), transparent 40%), radial-gradient(80% 60% at 50% 100%, rgba(0,0,0,0.12), transparent 60%)',
                            }} />
                        </div>
                    </div>
                </div>
            </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
