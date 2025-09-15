
'use client';

import React, { useMemo, useState, useActionState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Plus,
  X,
  FileText,
  GitBranch,
  MoreVertical,
  Edit,
  Trash2,
  LayoutGrid,
  List,
} from 'lucide-react';
import type {
  StandaloneArticle,
  StandaloneArticleCategory,
} from '@/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { deleteStandaloneArticle, createStandaloneArticleCategory } from '@/actions/standalone-article.actions';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

function CreateStandaloneCategoryDialog() {
  const [state, formAction] = useActionState(createStandaloneArticleCategory, null);
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (state?.success) {
      toast({ title: 'Success', description: 'Category created.' });
      setOpen(false);
    }
    if (state?.error) {
      toast({ variant: 'destructive', title: 'Error', description: state.error });
    }
  }, [state, toast]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
            <Plus className="mr-2 h-4 w-4" /> New Category
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Category</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div>
            <Label htmlFor="category-name">Category Name</Label>
            <Input id="category-name" name="name" required />
            {state?.fieldErrors?.name && <p className="text-sm text-destructive mt-1">{state.fieldErrors.name[0]}</p>}
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
            <Button type="submit">Create</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ArticleActions({ article }: { article: StandaloneArticle }) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);

    const handleDelete = async () => {
        const formData = new FormData();
        formData.append('id', article.id);
        const result = await deleteStandaloneArticle({}, formData);
        if (result.success) {
            toast({ title: 'Success', description: 'Article deleted.' });
            setOpen(false);
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
    };
    
    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                         <Link href={`/admin/articles/edit/${article.id}`}>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Edit</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                     <AlertDialogTrigger asChild>
                        <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Delete</span>
                        </DropdownMenuItem>
                    </AlertDialogTrigger>
                </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>This will permanently delete "{article.title}". This cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

function ArticlesTable({ articles, categories }: { articles: StandaloneArticle[]; categories: StandaloneArticleCategory[] }) {
    const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || id;
    
    if (articles.length === 0) {
        return <p className="text-center text-muted-foreground p-4">No articles of this type yet.</p>;
    }
    
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {articles.map(article => (
                    <TableRow key={article.id}>
                        <TableCell className="font-medium">
                            <Link href={`/admin/articles/edit/${article.id}`} className="hover:underline">
                                {article.title}
                            </Link>
                        </TableCell>
                        <TableCell>
                            <Badge variant="outline">{getCategoryName(article.categoryId)}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                           <ArticleActions article={article} />
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

function ArticleCard({ article, categories }: { article: StandaloneArticle; categories: StandaloneArticleCategory[] }) {
    const snippet = article.content.replace(/<[^>]+>/g, '').substring(0, 100) + (article.content.length > 100 ? '...' : '');
    const categoryName = categories.find(c => c.id === article.categoryId)?.name || article.categoryId;

    return (
        <Card className="flex flex-col">
            <CardHeader>
                <CardTitle className="text-lg leading-tight">{article.title}</CardTitle>
                <CardDescription>
                    {categoryName}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground line-clamp-3">{snippet}</p>
            </CardContent>
            <CardFooter className="flex justify-end">
                <ArticleActions article={article} />
                <Button variant="secondary" asChild>
                    <Link href={`/admin/articles/edit/${article.id}`}>View & Edit</Link>
                </Button>
            </CardFooter>
        </Card>
    );
}


function ArticlesDisplay({ articles, categories, view }: { articles: StandaloneArticle[], categories: StandaloneArticleCategory[], view: 'grid' | 'list'}) {
    if (articles.length === 0) {
        return (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No articles found in this category.</p>
            </div>
        );
    }

    if (view === 'list') {
        return <ArticlesTable articles={articles} categories={categories} />;
    }
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map(article => (
                <ArticleCard key={article.id} article={article} categories={categories} />
            ))}
        </div>
    );
}


const ARTICLE_TYPES = [
    { id: 'article', label: 'Article', icon: FileText },
    { id: 'whitepaper', label: 'White Paper', icon: FileText },
    { id: 'abstract', label: 'Abstract', icon: FileText },
    { id: 'drift', label: 'My Drifts', icon: GitBranch },
];

export function StandaloneArticleBrowser({ groupedArticles, categories }: { groupedArticles: any, categories: StandaloneArticleCategory[] }) {
    const [isFabOpen, setIsFabOpen] = useState(false);
    const router = useRouter();
    const [view, setView] = useState<'grid' | 'list'>('grid');
    
    const articlesByType = useMemo(() => {
        const allArticles = Array.isArray(groupedArticles) ? groupedArticles.flatMap((g: any) => g.articles) : [];
        return {
            article: allArticles.filter((a: any) => a.type === 'article' && !a.sourceDrift),
            whitepaper: allArticles.filter((a: any) => a.type === 'whitepaper'),
            abstract: allArticles.filter((a: any) => a.type === 'abstract'),
            drift: allArticles.filter((a: any) => !!a.sourceDrift),
        };
    }, [groupedArticles]);
    
    const totalArticles = Object.values(articlesByType).reduce((acc, curr) => acc + curr.length, 0);

    const fabOptions = ARTICLE_TYPES.filter(t => t.id !== 'drift').map(type => ({
        label: `New ${type.label}`,
        icon: type.icon,
        action: () => router.push(`/admin/articles/new/${type.id}`),
    }));

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <CardTitle>Standalone Articles</CardTitle>
                            <CardDescription>
                                Manage your individual articles, white papers, and abstracts.
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <CreateStandaloneCategoryDialog />
                             <ToggleGroup type="single" value={view} onValueChange={(v) => { if (v) setView(v as 'grid' | 'list') }} aria-label="View mode">
                                <ToggleGroupItem value="grid" aria-label="Grid view"><LayoutGrid className="h-4 w-4" /></ToggleGroupItem>
                                <ToggleGroupItem value="list" aria-label="List view"><List className="h-4 w-4" /></ToggleGroupItem>
                            </ToggleGroup>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {totalArticles > 0 ? (
                        <Tabs defaultValue="article">
                            <TabsList className="grid w-full grid-cols-4">
                                 {ARTICLE_TYPES.map(type => (
                                    <TabsTrigger key={type.id} value={type.id}>
                                        {type.label} ({articlesByType[type.id as keyof typeof articlesByType].length})
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                            {ARTICLE_TYPES.map(type => (
                                <TabsContent key={type.id} value={type.id} className="mt-6">
                                    <ArticlesDisplay articles={articlesByType[type.id as keyof typeof articlesByType]} categories={categories} view={view} />
                                </TabsContent>
                            ))}
                        </Tabs>
                    ) : (
                        <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                            <p className="mb-2">No standalone articles have been created yet.</p>
                            <p className="text-sm">Click the '+' button to get started.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-3">
                <AnimatePresence>
                {isFabOpen &&
                    fabOptions.map((option, index) => (
                    <motion.div
                        key={option.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                        className="flex items-center gap-2"
                    >
                        <span className="rounded-md bg-background px-3 py-1.5 text-sm font-medium shadow-md">
                        {option.label}
                        </span>
                        <Button className="h-12 w-12 rounded-full" size="icon" onClick={option.action}>
                            <option.icon className="h-6 w-6" />
                        </Button>
                    </motion.div>
                    ))}
                </AnimatePresence>

                <Button
                    size="icon"
                    className="h-16 w-16 rounded-full shadow-lg"
                    onClick={() => setIsFabOpen(!isFabOpen)}
                >
                    {isFabOpen ? <X className="h-8 w-8" /> : <Plus className="h-8 w-8" />}
                </Button>
            </div>
        </>
    );
}
