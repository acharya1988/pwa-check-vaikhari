
'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useActionState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MessageSquare, GitBranch, HelpCircle, Loader2, Star, Eye, Bookmark, Lightbulb, Sparkles, Wind, X, MoreVertical, Trash2, Pencil, Save, Printer, BookPlus } from 'lucide-react';
import type { Post, UserProfile, PostType, AttachedWork, ChintanaCategory, Circle } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { ReactionButtons } from '@/components/social/reaction-buttons';
import { evolvePostAction, addSparkToPost, toggleGlowOnPost, deletePost, updatePost } from '@/actions/post.actions';
import { useToast } from '@/hooks/use-toast';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { BrainCircuit, ScrollText, PenLine, BookOpen } from 'lucide-react';
import { VaikhariLogo } from '../icons';
import { AnswerCard } from '@/components/social/answer-card';
import { CreateAnswerForm } from '@/components/social/create-answer-form';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { SocialContentRenderer } from './social-content-renderer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { EvolvePostDialog } from './evolve-post-dialog';
import { CreateThreadDialog } from './create-chintana-thread-dialog';
import { useRouter } from 'next/navigation';

const postTypeIcons: Record<Post['postType'], React.ElementType> = {
    thought: BrainCircuit,
    reflection: ScrollText,
    sutra: VaikhariLogo,
    question: HelpCircle,
    poetry: PenLine,
};

const postStatusConfig: Record<Post['status'], { label: string, variant: BadgeProps['variant'] }> = {
    raw: { label: 'Raw Thought', variant: 'secondary' },
    'thread-started': { label: 'Thread Started', variant: 'info' },
    drifting: { label: 'Drifting', variant: 'drifting' },
    glowing: { label: 'Glowing', variant: 'glowing' },
    evolving: { label: 'Evolving', variant: 'evolving' },
};

function AttachedWorkCard({ work, showRemoveButton = false, onRemove }: { 
    work: AttachedWork;
    showRemoveButton?: boolean;
    onRemove?: () => void;
}) {
      if (!work?.href) return null; 
    return (
        <div className="px-3 pb-2">
            <Card className="bg-muted relative group">
                {showRemoveButton && (
                     <button type="button" onClick={onRemove} className="absolute top-1 right-1 z-10 h-6 w-6 rounded-full bg-background/50 hover:bg-background flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="h-4 w-4" />
                    </button>
                )}
                 <Link href={work?.href} className="block group">
                    <div className="p-3 flex items-center gap-3">
                        {work.profileUrl && (
                            <div className="w-12 h-16 relative flex-shrink-0">
                                <Image src={work.profileUrl} alt={work.title} layout="fill" objectFit="cover" className="rounded-sm shadow-md" data-ai-hint="book cover" />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground font-medium">
                           {work.type === 'book' ? 'Book Announcement' : work.type === 'book-article' ? 'Book Article' : 'Standalone Article'}
                            </p>
                            <p className="font-semibold leading-tight group-hover:underline">{work.title}</p>
                            {work.parentTitle && <p className="text-sm text-muted-foreground truncate">{work.parentTitle}</p>}
                            {work.type === 'book' && work.description && (
                                <div 
                                    className="text-xs text-muted-foreground line-clamp-2 prose-sm prose-p:my-0"
                                    dangerouslySetInnerHTML={{ __html: work.description }} 
                                />
                            )}
                        </div>
                    </div>
                </Link>
            </Card>
        </div>
    )
}

function EvolveButton({ post }: { post: Post }) {
    const { toast } = useToast();
    const [isEvolveDialogOpen, setIsEvolveDialogOpen] = useState(false);
    const [state, formAction] = useActionState(evolvePostAction, null);
    
    useEffect(() => {
        if(state?.success) {
            toast({ title: 'Success', description: state.message });
        }
        if(state?.error) {
            toast({ variant: 'destructive', title: 'Error', description: state.error });
        }
    }, [state, toast]);
    
    if (post.evolvedTo) {
        let href = '#';
        if (post.evolvedTo.type === 'standalone-article') {
            href = `/admin/articles/edit/${post.evolvedTo.id}`;
        }
        return (
             <Button asChild variant="ghost" size="sm">
                <Link href={href}>View Evolution</Link>
            </Button>
        )
    }

    if (post.status === 'evolving') {
        return (
            <>
                <EvolvePostDialog post={post} open={isEvolveDialogOpen} onOpenChange={setIsEvolveDialogOpen} />
                 <Button variant="outline" size="sm" onClick={() => setIsEvolveDialogOpen(true)}>
                    <GitBranch className="mr-2 h-4 w-4" />
                    Evolve
                </Button>
            </>
        )
    }
    
    return (
         <form action={formAction}>
            <input type="hidden" name="postId" value={post.id} />
            <Button variant="ghost" size="sm" type="submit">
                <GitBranch className="mr-2 h-4 w-4" />
                Mark for Evolution
            </Button>
         </form>
    );
}

function EditPostDialog({ open, onOpenChange, post }: { open: boolean, onOpenChange: (open: boolean) => void, post: Post }) {
    const [state, formAction] = useActionState(updatePost, null);
    const { toast } = useToast();
    const [content, setContent] = useState(post.content);
    const [postType, setPostType] = useState<PostType>(post.postType);

    const editor = useEditor({
        extensions: [StarterKit, Placeholder.configure({ placeholder: 'Edit your post...' })],
        content: post.content,
        onUpdate: ({ editor }) => setContent(editor.getHTML()),
    });
    
    useEffect(() => {
        if (state?.success) {
            toast({ title: "Post Updated" });
            onOpenChange(false);
        }
        if (state?.error) {
            toast({ variant: 'destructive', title: "Error", description: state.error });
        }
    }, [state, toast, onOpenChange]);
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Post</DialogTitle>
                </DialogHeader>
                <form action={formAction} className="space-y-4">
                    <input type="hidden" name="postId" value={post.id} />
                    <input type="hidden" name="content" value={content} />
                    
                    <div className="space-y-2">
                        <Label>Post Type</Label>
                        <Select name="postType" value={postType} onValueChange={(v) => setPostType(v as PostType)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(postTypeIcons).map(([type, Icon]) => (
                                    <SelectItem key={type} value={type}>
                                        <div className="flex items-center gap-2">
                                            <Icon className="h-4 w-4" /> 
                                            {type.charAt(0).toUpperCase() + type.slice(1)}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <EditorContent editor={editor} className="min-h-[150px] border p-2 rounded-md" />
                    
                    {post.attachedWork?.href && (
                        <div>
                             <Label className="text-xs text-muted-foreground">Attached Work (cannot be changed)</Label>
                            <AttachedWorkCard work={post.attachedWork} />
                        </div>
                    )}

                    <DialogFooter>
                         <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit">Save Changes</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

function PostActions({ post, isAuthor }: { post: Post, isAuthor: boolean }) {
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [state, formAction] = useActionState(deletePost, null);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        if (state?.success) {
            toast({ description: state.message });
            setIsDeleteOpen(false);
        }
        if (state?.error) {
            toast({ variant: 'destructive', title: 'Error', description: state.error });
        }
    }, [state, toast, router]);

    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen) setDeleteConfirmText('');
        setIsDeleteOpen(isOpen);
    };

    if (!isAuthor) return null;

    return (
        <>
            <EditPostDialog open={isEditOpen} onOpenChange={setIsEditOpen} post={post} />
            <AlertDialog open={isDeleteOpen} onOpenChange={handleOpenChange}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onSelect={() => setIsEditOpen(true)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit Post
                        </DropdownMenuItem>
                        <AlertDialogTrigger asChild>
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={e => e.preventDefault()}>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete Post
                            </DropdownMenuItem>
                        </AlertDialogTrigger>
                    </DropdownMenuContent>
                </DropdownMenu>
                <AlertDialogContent>
                    <form action={formAction}>
                        <input type="hidden" name="postId" value={post.id} />
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently delete this post and all its replies. This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="space-y-2 py-2">
                            <Label htmlFor={`delete-post-${post.id}`}>
                                To confirm, type "<strong className="text-destructive">DELETE</strong>" below.
                            </Label>
                            <Input
                                id={`delete-post-${post.id}`}
                                value={deleteConfirmText}
                                onChange={(e) => setDeleteConfirmText(e.target.value)}
                                autoComplete="off"
                            />
                        </div>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <Button type="submit" variant="destructive" disabled={deleteConfirmText !== 'DELETE'}>Delete</Button>
                        </AlertDialogFooter>
                    </form>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

export function PostCard({ post, userProfile, chintanaCategories }: { 
    post: Post; 
    userProfile: UserProfile;
    chintanaCategories?: ChintanaCategory[];
}) {
    const isAuthor = userProfile.email === post.author.id;
    const isQuestion = post.postType === 'question';
    const [isCreateThreadOpen, setIsCreateThreadOpen] = useState(false);

    return (
        <>
        <CreateThreadDialog 
            open={isCreateThreadOpen} 
            onOpenChange={setIsCreateThreadOpen}
            categories={chintanaCategories || []}
            post={post}
        />
        <Card className="bg-card/80 backdrop-blur-sm border-border/50">
            <CardHeader className="flex flex-row items-start gap-4 space-y-0 p-4">
                <Avatar className="h-10 w-10 border">
                    <AvatarImage src={post.author.avatarUrl} alt={post.author.name} data-ai-hint="person avatar" />
                    <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-semibold">{post.author.name}</p>
                            <p className="text-xs text-primary">{post.author.role}</p>
                            <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant={postStatusConfig[post.status].variant} className="capitalize">{postStatusConfig[post.status].label}</Badge>
                            <PostActions post={post} isAuthor={isAuthor} />
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0 space-y-4">
                {post.attachedWork && <AttachedWorkCard work={post.attachedWork} />}
                <SocialContentRenderer htmlString={post.content} />
            </CardContent>
            <CardFooter className="flex justify-between items-center p-2 border-t">
                <ReactionButtons post={post} />
                <div className="flex items-center gap-1">
                    {isAuthor && !post.attachedWork && <EvolveButton post={post} />}
                    <Button variant="ghost" size="sm" onClick={() => setIsCreateThreadOpen(true)}>
                        <BookPlus className="mr-2 h-4 w-4" /> Discuss
                    </Button>
                    <Button variant="ghost" size="sm">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        {isQuestion ? 'Answer' : 'Reply'}
                    </Button>
                </div>
            </CardFooter>
        </Card>
        </>
    );
}
