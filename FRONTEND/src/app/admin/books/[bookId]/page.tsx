

'use client';

import React, { useState, useEffect, useCallback, useActionState } from 'react';
import { notFound, useRouter, useParams } from 'next/navigation';
import { type Chapter, type Article, type BookContent as BookContentType, type Circle } from '@/types';
import { getBookContent } from '@/services/book.service';
import { updateArticleStatus, deleteChapter, deleteArticle, reorderContent, toggleAnnouncement } from '@/actions/book.actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, ChevronDown, ChevronRight, FileText, Plus, Trash2, GripVertical, Edit, Library, Globe, Lock, Users, Palette } from 'lucide-react';
import { UpdateBookVisibilityDialog, BookFormDialog, CreateChapterDialog } from '@/components/admin/profile-forms';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BOOK_SUBJECTS } from '@/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { getCirclesForUser } from '@/services/profile.service';
import Image from 'next/image';
import { getBookCategories } from '@/services/book.service';
import { getUserProfile } from '@/services/user.service';

function SortableArticleRow({ 
    bookId, 
    chapterId, 
    article, 
    onUpdateStatus, 
    onDeleteArticle 
}: { 
    bookId: string, 
    chapterId: string | number, 
    article: Article, 
    onUpdateStatus: (article: Article, chapterId: string | number, newStatus: 'draft' | 'published') => void,
    onDeleteArticle: (article: Article, chapterId: string | number) => void
}) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ 
        id: article.verse,
        data: {
            type: 'article',
            chapterId: chapterId,
        }
    });

    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };
    
    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen) {
            setDeleteConfirmText('');
        }
        setIsDeleteConfirmOpen(isOpen);
    };
    
    const handleDelete = () => {
        onDeleteArticle(article, chapterId);
        handleOpenChange(false);
    }

    return (
        <TableRow ref={setNodeRef} style={style}>
            <TableCell className="w-8 p-0 pl-2">
                <Button variant="ghost" size="icon" className="cursor-grab" {...attributes} {...listeners}>
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                </Button>
            </TableCell>
            <TableCell className="font-medium w-[100px]">{article.verse}</TableCell>
            <TableCell>
                {article.title}
            </TableCell>
                <TableCell className="text-center">
                <Badge variant="secondary">{article.content?.length || 0}</Badge>
            </TableCell>
            <TableCell className="text-center">
                <Badge variant={article.status === 'published' ? 'default' : 'secondary'} className="capitalize">
                    {article.status}
                </Badge>
            </TableCell>
            <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2 flex-wrap">
                    <Button asChild size="sm" variant="outline">
                        <Link href={`/admin/books/${bookId}/edit/${chapterId}/${article.verse}`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                        </Link>
                    </Button>
                    <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => onUpdateStatus(article, chapterId, article.status === 'published' ? 'draft' : 'published')}>
                       {article.status === 'published' ? 'Unpublish' : 'Publish'}
                    </Button>
                    <AlertDialog open={isDeleteConfirmOpen} onOpenChange={handleOpenChange}>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" title="Delete Article">
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will permanently delete the article titled "{article.title}". This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="space-y-2 py-2">
                                <Label htmlFor={`delete-article-${article.verse}`}>
                                    To confirm, type "<strong className="text-destructive">DELETE</strong>" below.
                                </Label>
                                <Input
                                    id={`delete-article-${article.verse}`}
                                    value={deleteConfirmText}
                                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                                    autoComplete="off"
                                />
                            </div>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                    onClick={handleDelete}
                                    disabled={deleteConfirmText !== 'DELETE'}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >Delete</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </TableCell>
        </TableRow>
    );
}

function ArticleTable({ 
    bookId, 
    chapterId, 
    articles,
    onUpdateStatus, 
    onDeleteArticle 
}: { 
    bookId: string, 
    chapterId: string|number, 
    articles: Article[], 
    onUpdateStatus: (article: Article, chapterId: string | number, newStatus: 'draft' | 'published') => void,
    onDeleteArticle: (article: Article, chapterId: string | number) => void
}) {
    if (articles.length === 0) {
        return (
            <div className="text-center text-muted-foreground p-4">
                No articles in this chapter yet.
            </div>
        );
    }
    
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead className="w-[100px]">Verse</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead className="text-center">Blocks</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                 <SortableContext items={articles.map(a => a.verse)} strategy={verticalListSortingStrategy}>
                    {articles.map((article) => (
                        <SortableArticleRow 
                            key={String(article.verse)} 
                            bookId={bookId} 
                            chapterId={chapterId} 
                            article={article} 
                            onUpdateStatus={onUpdateStatus}
                            onDeleteArticle={onDeleteArticle}
                        />
                    ))}
                 </SortableContext>
            </TableBody>
        </Table>
    );
}

function ChapterNode({ 
    chapter, 
    bookId, 
    level, 
    dragHandleProps, 
    chapterNumber, 
    bookStructure,
    bookName,
    onUpdateStatus, 
    onDeleteArticle,
    onDeleteChapter
}: { 
    chapter: Chapter, 
    bookId: string, 
    level: number, 
    dragHandleProps: any, 
    chapterNumber: string, 
    bookStructure?: BookContentType['structure'],
    bookName: string,
    onUpdateStatus: (article: Article, chapterId: string | number, newStatus: 'draft' | 'published') => void,
    onDeleteArticle: (article: Article, chapterId: string | number) => void,
    onDeleteChapter: (chapterId: string | number) => void
}) {
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');

    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen) {
            setDeleteConfirmText('');
        }
        setIsDeleteConfirmOpen(isOpen);
    };

    const handleDelete = () => {
        onDeleteChapter(chapter.id);
        handleOpenChange(false);
    };

    return (
        <Accordion type="single" collapsible className="rounded-lg border bg-card/50">
            <AccordionItem value={`chapter-${chapter.id}`} className="border-b-0">
                <div className="flex items-center p-3 flex-wrap gap-2">
                     <Button variant="ghost" size="icon" className="cursor-grab" {...dragHandleProps}>
                        <GripVertical className="h-5 w-5 text-muted-foreground" />
                    </Button>
                    <AccordionTrigger className="flex-1 p-0 hover:no-underline flex justify-start">
                        <div className="flex items-center gap-2 flex-1">
                            <ChevronDown className="h-5 w-5 transition-transform duration-200 group-data-[state=closed]:-rotate-90" />
                            <span className="text-lg font-devanagari font-bold">
                                <span className="mr-2 text-muted-foreground font-mono">{chapterNumber}</span>
                                {chapter.name}
                            </span>
                            {chapter.topic && <Badge variant="outline" className="font-normal">{chapter.topic}</Badge>}
                            <Badge variant="secondary">{chapter.articles.length} articles</Badge>
                            {chapter.children && chapter.children.length > 0 && <Badge variant="outline">{chapter.children.length} sub-chapters</Badge>}
                        </div>
                    </AccordionTrigger>
                    <div className="flex items-center gap-2 flex-wrap">
                        <Button asChild variant="ghost" size="sm">
                            <Link href={`/admin/books/${bookId}/${chapter.id}/new`}>
                                <Plus className="mr-1 h-4 w-4" /> Article
                            </Link>
                        </Button>
                        <CreateChapterDialog bookId={bookId} parentId={chapter.id} bookName={bookName}>
                            <Button variant="ghost" size="sm">
                                <Plus className="mr-1 h-4 w-4" /> Sub-chapter
                            </Button>
                        </CreateChapterDialog>
                        <AlertDialog open={isDeleteConfirmOpen} onOpenChange={handleOpenChange}>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" title="Delete Chapter">
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will permanently delete the chapter "{chapter.name}" and ALL its sub-chapters and articles. This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="space-y-2 py-2">
                                    <Label htmlFor={`delete-chapter-${chapter.id}`}>
                                        To confirm, type "<strong className="text-destructive">DELETE</strong>" below.
                                    </Label>
                                    <Input
                                        id={`delete-chapter-${chapter.id}`}
                                        value={deleteConfirmText}
                                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                                        autoComplete="off"
                                    />
                                </div>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleDelete}
                                        disabled={deleteConfirmText !== 'DELETE'}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >Delete Chapter</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
                <AccordionContent>
                    <div className="p-4 bg-background">
                        {chapter.articles.length > 0 && <ArticleTable bookId={bookId} chapterId={chapter.id} articles={chapter.articles} onUpdateStatus={onUpdateStatus} onDeleteArticle={onDeleteArticle} />}
                        
                        {chapter.children && chapter.children.length > 0 && (
                             <div className="mt-4 pt-4 border-t">
                                <h4 className="font-semibold mb-2 text-muted-foreground text-sm">Sub-Chapters</h4>
                                <ChapterTree 
                                    chapters={chapter.children} 
                                    bookId={bookId} 
                                    level={level + 1} 
                                    prefix={`${chapterNumber}.`} 
                                    bookStructure={bookStructure}
                                    bookName={bookName}
                                    onUpdateStatus={onUpdateStatus}
                                    onDeleteArticle={onDeleteArticle}
                                    onDeleteChapter={onDeleteChapter}
                                />
                             </div>
                        )}
                        
                        {chapter.articles.length === 0 && (!chapter.children || chapter.children.length === 0) && (
                            <p className="text-center text-muted-foreground py-4">This chapter is empty.</p>
                        )}
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
}

function SortableChapterNode({ 
    chapter, 
    bookId, 
    level, 
    chapterNumber, 
    bookStructure,
    bookName,
    onUpdateStatus, 
    onDeleteArticle,
    onDeleteChapter
}: { 
    chapter: Chapter, 
    bookId: string, 
    level: number, 
    chapterNumber: string, 
    bookStructure?: BookContentType['structure'],
    bookName: string,
    onUpdateStatus: (article: Article, chapterId: string | number, newStatus: 'draft' | 'published') => void,
    onDeleteArticle: (article: Article, chapterId: string | number) => void,
    onDeleteChapter: (chapterId: string | number) => void
}) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: chapter.id, data: { type: 'chapter' } });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };
    
    return (
        <div ref={setNodeRef} style={style}>
            <ChapterNode 
                chapter={chapter} 
                bookId={bookId} 
                level={level} 
                dragHandleProps={{...attributes, ...listeners}} 
                chapterNumber={chapterNumber} 
                bookStructure={bookStructure}
                bookName={bookName}
                onUpdateStatus={onUpdateStatus}
                onDeleteArticle={onDeleteArticle}
                onDeleteChapter={onDeleteChapter}
            />
        </div>
    );
}

function ChapterTree({ 
    chapters, 
    bookId, 
    level = 0, 
    prefix = '', 
    bookStructure,
    bookName,
    onUpdateStatus, 
    onDeleteArticle,
    onDeleteChapter
}: { 
    chapters: Chapter[], 
    bookId: string, 
    level?: number, 
    prefix?: string, 
    bookStructure?: BookContentType['structure'],
    bookName: string,
    onUpdateStatus: (article: Article, chapterId: string | number, newStatus: 'draft' | 'published') => void,
    onDeleteArticle: (article: Article, chapterId: string | number) => void,
    onDeleteChapter: (chapterId: string | number) => void
}) {
    return (
         <SortableContext items={chapters.map(c => c.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-4">
                {chapters.map((chapter, index) => {
                    const chapterNumber = `${prefix}${index + 1}`;
                    return (
                        <SortableChapterNode 
                            key={chapter.id} 
                            chapter={chapter} 
                            bookId={bookId} 
                            level={level} 
                            chapterNumber={chapterNumber} 
                            bookStructure={bookStructure}
                            bookName={bookName}
                            onUpdateStatus={onUpdateStatus}
                            onDeleteArticle={onDeleteArticle}
                            onDeleteChapter={onDeleteChapter}
                        />
                    )
                })}
            </div>
        </SortableContext>
    );
}

const visibilityConfig: Record<BookContentType['visibility'], { icon: React.ElementType, label: string, variant: BadgeProps['variant'] }> = {
    private: { icon: Lock, label: 'Private', variant: 'secondary' },
    circle: { icon: Users, label: 'Circle', variant: 'info' },
    public: { icon: Globe, label: 'Public', variant: 'success' },
}

function VisibilityBadge({ visibility }: { visibility: BookContentType['visibility'] }) {
    const config = visibilityConfig[visibility] || visibilityConfig.private;
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Badge variant={config.variant} className="capitalize">
                        <config.icon className="mr-1 h-3 w-3" />
                        {config.label}
                    </Badge>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Visibility: {config.label}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}

function AnnounceWithholdButtons({ bookId, isAnnounced, onUpdate }: { bookId: string, isAnnounced: boolean, onUpdate: () => void }) {
    const [state, formAction] = useActionState(toggleAnnouncement, null);
    const { toast } = useToast();

    useEffect(() => {
        if (state?.success) {
            toast({ description: state.message });
            onUpdate();
        }
        if(state?.error) {
            toast({ variant: 'destructive', title: 'Error', description: state.error });
        }
    }, [state, toast, onUpdate]);

    if (isAnnounced) {
        return (
            <form action={formAction}>
                 <input type="hidden" name="bookId" value={bookId} />
                 <input type="hidden" name="isAnnounced" value="false" />
                 <Button type="submit" variant="outline" size="sm">Withhold</Button>
            </form>
        );
    }
    
    return (
        <form action={formAction}>
            <input type="hidden" name="bookId" value={bookId} />
            <input type="hidden" name="isAnnounced" value="true" />
            <Button type="submit" variant="default" size="sm">Announce</Button>
        </form>
    );
}


function BookProfileCard({ bookContent, circles, bookCategories, onUpdate }: { 
    bookContent: BookContentType, 
    circles: Circle[], 
    bookCategories: any[],
    onUpdate: () => void
}) {
    const subjectLabel = BOOK_SUBJECTS.find(s => s.id === bookContent.subject)?.label || bookContent.subject;
    
    return (
        <Card className="overflow-hidden">
            <div className="relative">
                <div className="h-48 w-full bg-muted">
                    <Image src={bookContent.coverUrl || 'https://placehold.co/800x300.png'} alt={`${bookContent.bookName} cover`} className="h-full w-full object-cover" width={800} height={300} data-ai-hint="book cover background" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
                 <div className="absolute bottom-4 left-6 flex items-end gap-6 w-full pr-12">
                    <div className="relative h-40 w-28 flex-shrink-0 -mb-8 rounded-md border-4 border-background bg-muted shadow-lg">
                         <Image src={bookContent.profileUrl || 'https://placehold.co/400x600.png'} alt={`${bookContent.bookName} profile`} className="h-full w-full object-cover rounded-sm" width={200} height={300} data-ai-hint="book cover" />
                    </div>
                     <div className="pb-4 flex-1 flex flex-col sm:flex-row justify-between sm:items-end gap-2">
                        <div>
                            <h1 className="text-3xl font-bold font-devanagari">{bookContent.bookName}</h1>
                            {bookContent.subtitle && <p className="text-xl text-muted-foreground">{bookContent.subtitle}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                            <BookFormDialog
                                trigger={<Button variant="outline"><Edit className="mr-2 h-4 w-4" /> Edit Book</Button>}
                                categories={bookCategories}
                                bookToEdit={bookContent}
                            />
                            <Button asChild>
                                <Link href={`/admin/books/${bookContent.bookId}/theme`}>
                                    <Palette className="mr-2 h-4 w-4" /> Edit Theme
                                </Link>
                            </Button>
                        </div>
                     </div>
                 </div>
            </div>
            <CardContent className="pt-12">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-4">
                        <h3 className="font-semibold text-lg">About this Book</h3>
                        {bookContent.description ? (
                            <div 
                                className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground" 
                                dangerouslySetInnerHTML={{ __html: bookContent.description }} 
                            />
                        ) : (
                            <p className="text-muted-foreground text-sm">No description provided.</p>
                        )}
                    </div>
                    <div className="space-y-3 text-sm">
                        <h3 className="font-semibold text-lg">Details</h3>
                        <div className="space-y-2">
                            {bookContent.publisher && <div className="flex justify-between"><span className="text-muted-foreground">Publisher</span><span className="font-medium text-right">{bookContent.publisher}</span></div>}
                            {bookContent.isbn && <div className="flex justify-between"><span className="text-muted-foreground">ISBN</span><span className="font-medium text-right">{bookContent.isbn}</span></div>}
                            {bookContent.designer && <div className="flex justify-between"><span className="text-muted-foreground">Designer</span><span className="font-medium text-right">{bookContent.designer}</span></div>}
                            {bookContent.subject && <div className="flex justify-between"><span className="text-muted-foreground">Subject</span><span className="font-medium text-right">{subjectLabel}</span></div>}
                             <div className="flex justify-between items-center pt-2">
                                 <UpdateBookVisibilityDialog book={bookContent} circles={circles}>
                                    <button type="button" className="flex items-center gap-2 rounded-md p-1 -ml-1 hover:bg-muted">
                                        <span className="text-muted-foreground">Visibility</span>
                                        <VisibilityBadge visibility={bookContent.visibility} />
                                    </button>
                                </UpdateBookVisibilityDialog>
                                <div className="flex items-center gap-2">
                                     {bookContent.isAnnounced && <Badge variant="secondary">Announced</Badge>}
                                     <AnnounceWithholdButtons bookId={bookContent.bookId} isAnnounced={bookContent.isAnnounced} onUpdate={onUpdate} />
                                 </div>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export default function BookDetailPage() {
    const params = useParams();
    const bookId = params.bookId as string;
    
    const [bookContent, setBookContent] = useState<BookContentType | null>(null);
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [circles, setCircles] = useState<Circle[]>([]);
    const [bookCategories, setBookCategories] = useState<any[]>([]);
    const { toast } = useToast();

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
          coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const fetchData = useCallback(() => {
        if (bookId) {
            getBookContent(bookId).then(data => {
                if (!data) {
                    notFound();
                } else {
                    setBookContent(data);
                    setChapters(data.chapters);
                }
            });
        }
    }, [bookId]);

    useEffect(() => {
        fetchData();
        getUserProfile().then(user => {
            if (user) {
                getCirclesForUser(user.email).then(setCircles);
            }
        });
        getBookCategories().then(setBookCategories);
    }, [bookId, fetchData]);

    const findAndUpdateArticleStatus = (allChapters: Chapter[], chapterId: string | number, verse: string | number, newStatus: 'draft' | 'published'): Chapter[] => {
        return allChapters.map(chapter => {
            if (String(chapter.id) === String(chapterId)) {
                return {
                    ...chapter,
                    articles: chapter.articles.map(article =>
                        String(article.verse) === String(verse) ? { ...article, status: newStatus } : article
                    )
                };
            }
            if (chapter.children) {
                return { ...chapter, children: findAndUpdateArticleStatus(chapter.children, chapterId, verse, newStatus) };
            }
            return chapter;
        });
    };
    
    const findAndRemoveArticle = (allChapters: Chapter[], chapterId: string | number, verse: string | number): Chapter[] => {
         return allChapters.map(chapter => {
            if (String(chapter.id) === String(chapterId)) {
                return { ...chapter, articles: chapter.articles.filter(a => String(a.verse) !== String(verse)) };
            }
            if (chapter.children) {
                return { ...chapter, children: findAndRemoveArticle(chapter.children, chapterId, verse) };
            }
            return chapter;
        });
    }

    const removeChapterById = (allChapters: Chapter[], chapterId: string | number): Chapter[] => {
        let newChapters = allChapters.filter(c => String(c.id) !== String(chapterId));
        if (newChapters.length < allChapters.length) {
            return newChapters;
        }
        return allChapters.map(c => {
            if (c.children && c.children.length > 0) {
                return { ...c, children: removeChapterById(c.children, chapterId) };
            }
            return c;
        });
    };

    const handleArticleStatusUpdate = async (articleToUpdate: Article, chapterId: string | number, newStatus: 'draft' | 'published') => {
        const originalChapters = chapters;
        setChapters(prev => findAndUpdateArticleStatus(prev, chapterId, articleToUpdate.verse, newStatus));

        const formData = new FormData();
        formData.append('bookId', bookId);
        formData.append('chapterId', String(chapterId));
        formData.append('verse', String(articleToUpdate.verse));
        formData.append('newStatus', newStatus);

        const result = await updateArticleStatus(formData);
        if (result?.error) {
            setChapters(originalChapters);
            toast({ variant: 'destructive', title: "Update failed", description: result.error });
        }
    };
    
    const handleArticleDelete = async (articleToDelete: Article, chapterId: string | number) => {
        const originalChapters = chapters;
        setChapters(prev => findAndRemoveArticle(prev, chapterId, articleToDelete.verse));
        
        const formData = new FormData();
        formData.append('bookId', bookId);
        formData.append('chapterId', String(chapterId));
        formData.append('verse', String(articleToDelete.verse));

        const result = await deleteArticle(formData);
        if (result?.error) {
            setChapters(originalChapters);
            toast({ variant: 'destructive', title: "Delete failed", description: result.error });
        } else {
            toast({ title: "Success", description: "Article deleted successfully."});
        }
    };

    const handleChapterDelete = async (chapterIdToDelete: string | number) => {
        const originalChapters = chapters;
        setChapters(prev => removeChapterById(prev, chapterIdToDelete));

        const formData = new FormData();
        formData.append('bookId', bookId);
        formData.append('chapterId', String(chapterIdToDelete));
        
        const result = await deleteChapter(formData);
        if (result?.error) {
            setChapters(originalChapters);
            toast({ variant: 'destructive', title: "Delete failed", description: result.error });
        } else {
            toast({ title: "Success", description: "Chapter deleted successfully."});
        }
    };
    
    const findAndReorderChapters = (currentChapters: Chapter[], activeId: string | number, overId: string | number): Chapter[] => {
        const oldIndex = currentChapters.findIndex(c => c.id === activeId);
        const newIndex = currentChapters.findIndex(c => c.id === overId);

        if (oldIndex !== -1 && newIndex !== -1) {
            return arrayMove(currentChapters, oldIndex, newIndex);
        }

        for (const chapter of currentChapters) {
            if (chapter.children) {
                const reorderedChildren = findAndReorderChapters(chapter.children, activeId, overId);
                if (reorderedChildren !== chapter.children) {
                    return currentChapters.map(c => c.id === chapter.id ? { ...c, children: reorderedChildren } : c);
                }
            }
        }
        return currentChapters;
    };
    
    const findAndReorderArticles = (currentChapters: Chapter[], chapterId: string | number, activeId: string | number, overId: string | number): Chapter[] => {
        return currentChapters.map(chapter => {
            if (String(chapter.id) === String(chapterId)) {
                const oldIndex = chapter.articles.findIndex(a => a.verse === activeId);
                const newIndex = chapter.articles.findIndex(a => a.verse === overId);
                if (oldIndex !== -1 && newIndex !== -1) {
                    return { ...chapter, articles: arrayMove(chapter.articles, oldIndex, newIndex) };
                }
            }
            if (chapter.children) {
                return { ...chapter, children: findAndReorderArticles(chapter.children, chapterId, activeId, overId) };
            }
            return chapter;
        });
    };
    
    const handleDragEnd = useCallback(async (event: DragEndEvent) => {
        const { active, over } = event;
    
        if (!over || active.id === over.id) return;
    
        const activeType = active.data.current?.type;
        const overType = over.data.current?.type;

        if (activeType !== overType) {
            toast({ variant: 'destructive', title: "Invalid Move", description: "Cannot reorder items of different types." });
            return;
        }

        const originalChapters = chapters;
        let optimisticallyUpdatedChapters: Chapter[] = [];
        
        if (activeType === 'chapter') {
            optimisticallyUpdatedChapters = findAndReorderChapters([...originalChapters], active.id, over.id);
        } else if (activeType === 'article') {
            const chapterId = active.data.current?.chapterId;
            if (!chapterId) return;
            optimisticallyUpdatedChapters = findAndReorderArticles([...originalChapters], chapterId, active.id, over.id);
        } else {
             return;
        }
        
        setChapters(optimisticallyUpdatedChapters);
        
        const formData = new FormData();
        formData.append('bookId', bookId);
        formData.append('chapters', JSON.stringify(optimisticallyUpdatedChapters));
        
        const result = await reorderContent(formData);

        if (result?.error) {
            setChapters(originalChapters); // Rollback on error
            toast({ variant: 'destructive', title: "Save Error", description: `Could not save new order: ${result.error}` });
        } else {
            setBookContent(prev => prev ? {...prev, chapters: optimisticallyUpdatedChapters} : null);
        }
    }, [bookId, chapters, toast]);


    if (!bookContent) {
        return (
            <div className="space-y-8">
                {/* Skeleton Loader */}
                <div className="flex items-center justify-between">
                    <div>
                        <div className="h-6 w-24 bg-muted rounded-md animate-pulse mb-2"></div>
                        <div className="h-10 w-64 bg-muted rounded-md animate-pulse"></div>
                    </div>
                    <div className="h-10 w-48 bg-muted rounded-md animate-pulse"></div>
                </div>
                <div className="h-96 bg-muted rounded-lg animate-pulse"></div>
            </div>
        );
    }

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <div className="space-y-8 min-h-[calc(100vh-10rem)]">
                 <Button variant="link" className="p-0 h-auto text-muted-foreground -mt-1 mb-2" asChild>
                    <Link href="/admin/books"> &larr; All Books</Link>
                </Button>
                
                <BookProfileCard bookContent={bookContent} circles={circles} bookCategories={bookCategories} onUpdate={fetchData} />

                <Card>
                    <CardHeader>
                        <CardTitle>Content Structure</CardTitle>
                        <CardDescription>
                            Manage the hierarchical content for {bookContent.bookName}. Drag and drop items to reorder them.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {chapters.length > 0 ? (
                            <ChapterTree 
                                chapters={chapters} 
                                bookId={bookId} 
                                bookStructure={bookContent.structure}
                                bookName={bookContent.bookName}
                                onUpdateStatus={handleArticleStatusUpdate}
                                onDeleteArticle={handleArticleDelete}
                                onDeleteChapter={handleChapterDelete}
                            />
                        ) : (
                            <div className="flex items-center justify-center text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg min-h-[400px]">
                                <div className="flex flex-col items-center gap-4">
                                    <Library className="h-16 w-16 text-muted-foreground/50" />
                                    <h2 className="text-xl font-semibold text-foreground">This Book is Empty</h2>
                                    <p className="max-w-xs">Create your first chapter to begin populating this book.</p>
                                    <CreateChapterDialog bookId={bookId} bookName={bookContent.bookName}>
                                        <Button size="lg" className="mt-4">
                                            <Plus className="mr-2 h-5 w-5" />
                                            Create First Chapter
                                        </Button>
                                    </CreateChapterDialog>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

            </div>
            {chapters.length > 0 && (
                <CreateChapterDialog bookId={bookId} bookName={bookContent.bookName}>
                    <Button
                        size="icon"
                        className="fixed z-10 bottom-8 right-8 h-14 w-14 rounded-full shadow-lg"
                        aria-label="Create new chapter"
                    >
                        <Plus className="h-8 w-8" />
                    </Button>
                </CreateChapterDialog>
            )}
        </DndContext>
    );
}
