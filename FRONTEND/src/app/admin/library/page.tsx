
'use client';

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Library, BookmarkCheck, Filter, X } from "lucide-react";
import { motion } from "framer-motion";
import { getBooksWithStats, getFullBookHierarchy, type HierarchicalGenre } from '@/services/book.service';
import { getStandaloneArticles } from '@/services/standalone-article.service';
import { getBookmarksForUser, getUserProfile } from '@/services/user.service';
import type { BookWithStats, StandaloneArticle, Bookmark, UserProfile } from '@/types';
import Link from 'next/link';
import Image from 'next/image';
import { LoadingAnimation } from "@/components/loading-animation";

// -------------------- Types --------------------
export type DocType = 'all' | 'series' | 'books' | 'articles' | 'whitepapers' | 'abstracts';

export interface LibraryItem {
  id: string;
  title: string;
  authors: string[];
  year: number;
  language: string; 
  subjects: string[]; 
  type: DocType;
  description: string;
  cover?: string; 
  collected?: boolean; 
  href: string;
  genreId?: string;
  categoryId?: string;
  subCategoryId?: string;
}

// -------------------- Utilities --------------------
const typeLabels: Record<string, string> = {
  all: 'All',
  series: 'Series',
  books: 'Books',
  articles: 'Articles',
  whitepapers: 'White Papers',
  abstracts: 'Abstracts',
};

const languages = [
  { value: 'en', label: 'English' },
  { value: 'sa', label: 'Sanskrit' },
  { value: 'kn', label: 'Kannada' },
];

const subjectsPool = [
  'Samhita', 'Kaya Chikitsa', 'Sutrasthana', 'Prameha', 'Diabetes', 'Search', 'Architecture', 'Community', 'Research', 'Rasayana', 'Geriatrics', 'Philosophy', 'Metaphysics', 'Epistemology'
];

// -------------------- Pure Query Function --------------------
export type QueryOptions = {
  mode: 'collection' | 'my';
  activeType: DocType | 'all';
  language?: string;
  selectedSubjects: Set<string>;
  query: string;
  yearRange: [number, number];
  sort: 'newest' | 'az' | 'authors';
  genre?: string;
  category?: string;
  subCategory?: string;
};

export function applyLibraryQuery(items: LibraryItem[], opts: QueryOptions): LibraryItem[] {
  let data = [...items];

  if (opts.mode === 'my') data = data.filter((d) => d.collected);
  
  if (opts.activeType !== 'all') {
    if (opts.activeType === 'books') {
        data = data.filter((d) => d.type === 'books' || d.type === 'series');
    } else if (['articles', 'whitepapers', 'abstracts'].includes(opts.activeType)) {
        data = data.filter((d) => ['articles', 'whitepapers', 'abstracts'].includes(d.type));
    }
  }

  if (opts.language) data = data.filter((d) => d.language === opts.language);
  if (opts.genre) data = data.filter((d) => d.genreId === opts.genre);
  if (opts.category) data = data.filter((d) => d.categoryId === opts.category);
  if (opts.subCategory) data = data.filter((d) => d.subCategoryId === opts.subCategory);
  
  if (opts.selectedSubjects.size) data = data.filter((d) => d.subjects.some((s) => opts.selectedSubjects.has(s)));

  if (opts.query.trim()) {
    const q = opts.query.toLowerCase();
    data = data.filter((d) =>
      d.title.toLowerCase().includes(q) ||
      d.authors.join(" ").toLowerCase().includes(q) ||
      d.subjects.join(" ").toLowerCase().includes(q)
    );
  }

  data = data.filter((d) => d.year >= opts.yearRange[0] && d.year <= opts.yearRange[1]);

  if (opts.sort === 'newest') data.sort((a, b) => b.year - a.year);
  if (opts.sort === 'az') data.sort((a, b) => a.title.localeCompare(b.title));
  if (opts.sort === 'authors') data.sort((a, b) => (a.authors[0] ?? '').localeCompare(b.authors[0] ?? ''));
  return data;
}

// -------------------- UI Components --------------------
function ModeToggle({ mode, onChange }: { mode: 'collection' | 'my'; onChange: (m: 'collection' | 'my') => void }) {
  return (
    <div className="inline-flex items-center rounded-2xl border px-1 py-1 gap-1 bg-background shadow-sm">
      <Button variant={mode === 'collection' ? 'default' : 'ghost'} className="rounded-2xl" onClick={() => onChange('collection')}>
        <Library className="mr-2 h-4 w-4" /> Collection
      </Button>
      <Button variant={mode === 'my' ? 'default' : 'ghost'} className="rounded-2xl" onClick={() => onChange('my')}>
        <BookmarkCheck className="mr-2 h-4 w-4" /> My Library
      </Button>
    </div>
  );
}

function SearchBar({ query, setQuery }: { query: string; setQuery: (q: string) => void }) {
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60" />
        <Input placeholder="Search titles, authors, subjectsâ€¦" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9 rounded-full h-12" />
      </div>
    </div>
  );
}

function FilterSidebar({
  yearRange,
  setYearRange,
  language,
  setLanguage,
  selectedSubjects,
  toggleSubject,
  sort,
  setSort,
  show,
  onClose,
  hierarchy,
  genre, setGenre,
  category, setCategory,
  subCategory, setSubCategory
}: {
  yearRange: number[];
  setYearRange: (v: number[]) => void;
  language: string | undefined;
  setLanguage: (v: string | undefined) => void;
  selectedSubjects: Set<string>;
  toggleSubject: (s: string) => void;
  sort: string;
  setSort: (s: string) => void;
  show?: boolean;
  onClose?: () => void;
  hierarchy: HierarchicalGenre[];
  genre?: string;
  setGenre: (g?: string) => void;
  category?: string;
  setCategory: (c?: string) => void;
  subCategory?: string;
  setSubCategory: (sc?: string) => void;
}) {
  
  const categories = useMemo(() => {
    if (!genre) return [];
    return hierarchy.find(g => g.id === genre)?.categories || [];
  }, [genre, hierarchy]);

  const subCategories = useMemo(() => {
    if (!category) return [];
    return categories.find(c => c.id === category)?.subCategories || [];
  }, [category, categories]);
  
  return (
    <aside className={`relative w-full md:w-72 shrink-0 ${show ? 'block' : 'hidden md:block'}`}>
      <Card className="md:sticky md:top-4 rounded-2xl">
        <div className="flex items-center justify-between px-4 pt-4">
          <div className="flex items-center gap-2"><Filter className="h-4 w-4" /><span className="font-semibold">Filters</span></div>
          <Button size="icon" variant="ghost" className="md:hidden" onClick={onClose}><X className="h-4 w-4"/></Button>
        </div>
        <CardContent className="space-y-6 pt-4">
           <div>
            <div className="text-sm font-medium mb-2">Category</div>
             <div className="space-y-2">
                <Select value={genre} onValueChange={(v) => { setGenre(v === 'all' ? undefined : v); setCategory(undefined); setSubCategory(undefined); }}>
                  <SelectTrigger><SelectValue placeholder="All Genres" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Genres</SelectItem>
                    {hierarchy.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={category} onValueChange={(v) => { setCategory(v === 'all' ? undefined : v); setSubCategory(undefined); }} disabled={!genre}>
                  <SelectTrigger><SelectValue placeholder="All Categories" /></SelectTrigger>
                  <SelectContent>
                     <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                 <Select value={subCategory} onValueChange={(v) => setSubCategory(v === 'all' ? undefined : v)} disabled={!category}>
                  <SelectTrigger><SelectValue placeholder="All Sub-Categories" /></SelectTrigger>
                  <SelectContent>
                     <SelectItem value="all">All Sub-Categories</SelectItem>
                    {subCategories.map(sc => <SelectItem key={sc.id} value={sc.id}>{sc.name}</SelectItem>)}
                  </SelectContent>
                </Select>
             </div>
          </div>
          <div>
            <div className="text-sm font-medium mb-2">Year</div>
            <Slider value={yearRange} min={1900} max={new Date().getFullYear() + 1} step={1} onValueChange={setYearRange} />
            <div className="text-xs mt-2 opacity-70">{yearRange[0]} â€“ {yearRange[1]}</div>
          </div>
          <div>
            <div className="text-sm font-medium mb-2">Language</div>
            <Select onValueChange={(v) => setLanguage(v === 'all' ? undefined : v)} value={language ?? 'all'}>
              <SelectTrigger className="w-full"><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {languages.map((l) => (<SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="text-sm font-medium mb-2">Subjects</div>
            <ScrollArea className="h-40 rounded-md border p-2">
              <div className="grid grid-cols-1 gap-2">
                {subjectsPool.map((s) => (
                  <label className="flex items-center gap-2" key={s}>
                    <Checkbox checked={selectedSubjects.has(s)} onCheckedChange={() => toggleSubject(s)} />
                    <span className="text-sm">{s}</span>
                  </label>
                ))}
              </div>
            </ScrollArea>
          </div>
          <div>
            <div className="text-sm font-medium mb-2">Sort</div>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="az">A â†’ Z</SelectItem>
                <SelectItem value="authors">Author</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </aside>
  );
}

function ResultCard({ item }: { item: LibraryItem }) {
    const isBook = item.type === 'books' || item.type === 'series';
    const openHref = isBook ? `/admin/living-document?bookId=${item.id}` : `/admin/articles/edit/${item.id}`;

    const renderVisual = () => {
        if (isBook) {
            return (
                <div className="k-book-container" aria-hidden>
                    <div className="k-book" title={item.title}>
                        <div className="k-front">
                            <Image src={item.cover || 'https://placehold.co/300x420.png'} alt="" className="h-full w-full object-cover" width={300} height={420} data-ai-hint="book cover"/>
                        </div>
                    </div>
                </div>
            );
        }
        return (
            <div className="screen-container">
                <div className="screen">
                    <Image src={item.cover || 'https://placehold.co/288x512.png'} alt="" className="h-full w-full object-cover" width={288} height={512} data-ai-hint="article image" />
                </div>
            </div>
        );
    };
    
    const excerpt = item.description?.replace(/<[^>]+>/g, '').substring(0, 100) + (item.description && item.description.length > 100 ? "..." : "");

    return (
        <Card className="group overflow-hidden rounded-2xl flex flex-col h-full">
            <CardContent className="p-0 flex-grow">
                <div className="grid grid-cols-[30%_70%] items-center h-full">
                    <div className="flex items-center justify-center p-3 h-full bg-muted/50">
                        <Link href={item.href} className="flex-shrink-0">
                            {renderVisual()}
                        </Link>
                    </div>
                    <div className="flex flex-col min-w-0 p-4 h-full">
                        <div className="flex items-start justify-between gap-2">
                            <Link href={item.href} className="flex-1 min-w-0">
                                <h3 className="text-base font-semibold leading-tight hover:underline line-clamp-2" title={item.title}>{item.title}</h3>
                            </Link>
                             <Badge variant="secondary" className="shrink-0">{typeLabels[item.type]}</Badge>
                        </div>
                        <div className="text-sm opacity-80 truncate mt-1">{item.authors.join(", ")}</div>
                        <p className="text-xs text-muted-foreground mt-2 flex-grow line-clamp-2">{excerpt}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                            <Badge variant="outline" className="text-xs">{item.year} â€¢ {item.language.toUpperCase()}</Badge>
                            {item.subjects.slice(0, 2).map((s) => (<Badge key={s} variant="outline" className="text-xs">{s}</Badge>))}
                        </div>
                        
                    </div>
                </div>
            </CardContent>
            <CardFooter className="p-2 border-t bg-card flex justify-end">
                 <div className="flex gap-2">
                    <Button size="sm" variant="default" asChild><Link href={openHref}>Open</Link></Button>
                    <Button size="sm" variant="outline" onClick={async () => {
                      try {
                        await fetch('/api/library/collect', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            refId: item.id,
                            refType: item.type === 'books' ? 'Book' : (item.type === 'articles' ? 'Article' : 'Book'),
                            title: item.title,
                            author: item.authors?.[0],
                            coverUrl: item.cover,
                          })
                        });
                        item.collected = true; // optimistic
                      } catch (e) {
                        console.error('Collect failed', e);
                      }
                    }}>Collect</Button>
                </div>
            </CardFooter>
        </Card>
    );
}

function PageSkeleton() {
    return <LoadingAnimation />;
}

// -------------------- Main Page --------------------
export default function LibraryPage() {
  const [mode, setMode] = useState<'collection' | 'my'>('collection');
  const [activeType, setActiveType] = useState<DocType | 'all'>('all');
  const [query, setQuery] = useState("");
  const [yearRange, setYearRange] = useState<number[]>([1900, new Date().getFullYear() + 1]);
  const [language, setLanguage] = useState<string | undefined>(undefined);
  const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<'newest' | 'az' | 'authors'>('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [allData, setAllData] = useState<LibraryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hierarchy, setHierarchy] = useState<HierarchicalGenre[]>([]);
  const [genre, setGenre] = useState<string>();
  const [category, setCategory] = useState<string>();
  const [subCategory, setSubCategory] = useState<string>();

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const currentUser = await getUserProfile();
      if (!currentUser) {
          setIsLoading(false);
          return;
      };

      const [bookmarks, books, articles, fetchedHierarchy] = await Promise.all([
        getBookmarksForUser(currentUser.email),
        getBooksWithStats(),
        getStandaloneArticles(),
        getFullBookHierarchy()
      ]);
      setHierarchy(fetchedHierarchy);
      
      const bookmarkedIds = new Set(bookmarks.map(b => b.bookId));

      const bookItems: LibraryItem[] = books.map(book => ({
        id: book.id,
        title: book.name,
        authors: [book.authorName || 'Unknown Author'],
        year: book.publishedAt ? new Date(book.publishedAt).getFullYear() : new Date().getFullYear(),
        language: 'sa', 
        subjects: [book.categoryId, book.subject || ''].filter(Boolean),
        type: 'books',
        description: book.shortDescription || '',
        cover: book.profileUrl || 'https://placehold.co/300x420.png',
        collected: bookmarkedIds.has(book.id),
        href: `/library/item/${book.id}`,
        genreId: book.genreId,
        categoryId: book.categoryId,
        subCategoryId: (book as any).subCategoryId,
      }));

      const articleItems: LibraryItem[] = articles.map(article => ({
        id: article.id,
        title: article.title,
        authors: [article.ownerId || 'Unknown'],
        year: new Date(article.createdAt).getFullYear(),
        language: 'en',
        subjects: [article.categoryId],
        type: article.type as DocType,
        description: article.content,
        cover: 'https://placehold.co/288x512.png',
        collected: bookmarkedIds.has(article.id),
        href: `/admin/articles/edit/${article.id}`,
        genreId: '', // Standalone articles may not have genre
        categoryId: article.categoryId,
      }));

      // Merge My Library items to mark collected and add unknowns
      try {
        const myLib = await fetch('/api/library', { cache: 'no-store' }).then(r => r.json()).catch(() => ({ items: [] }));
        const myItems: any[] = (myLib?.items) || [];
        const byId = new Map<string, LibraryItem>([...bookItems, ...articleItems].map(i => [i.id, i]));
        for (const li of myItems) {
          const existing = byId.get(li.refId);
          if (existing) {
            existing.collected = true;
          } else {
            byId.set(li.refId, {
              id: li.refId,
              title: li.title || li.refId,
              authors: [li.author || 'Unknown'],
              year: new Date().getFullYear(),
              language: 'sa',
              subjects: [],
              type: 'books',
              description: '',
              cover: li.coverUrl,
              collected: true,
              href: `/library/item/${li.refId}`,
            } as any);
          }
        }
        setAllData(Array.from(byId.values()));
      } catch {
        setAllData([...bookItems, ...articleItems]);
      }
    } catch (error) {
      console.error("Failed to load library data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const toggleSubject = (subject: string) => {
    setSelectedSubjects((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(subject)) {
        newSet.delete(subject);
      } else {
        newSet.add(subject);
      }
      return newSet;
    });
  };

  const items = useMemo(() => applyLibraryQuery(allData, {
    mode,
    activeType: activeType as DocType,
    language,
    selectedSubjects,
    query,
    yearRange: [yearRange[0], yearRange[1]],
    sort,
    genre,
    category,
    subCategory,
  }), [mode, activeType, language, selectedSubjects, query, yearRange, sort, allData, genre, category, subCategory]);
  
  const clearFilters = () => {
    setLanguage(undefined);
    setSelectedSubjects(new Set());
    setQuery("");
    setYearRange([1900, new Date().getFullYear() + 1]);
    setGenre(undefined);
    setCategory(undefined);
    setSubCategory(undefined);
  }

  if (isLoading) {
    return <PageSkeleton />;
  }

  return (
    <div className="mx-auto max-w-7xl px-3 md:px-6 py-6">
      <style>{`
        /* ---------- 3D Book (scoped) ---------- */
        .k-book-container { width: var(--book-w, 96px); height: var(--book-h, 144px); display: flex; align-items: center; justify-content: center; perspective: var(--book-persp, 400px); }
        .k-book { transform: rotateY(-30deg); position: relative; transform-style: preserve-3d; width: var(--book-w, 96px); height: var(--book-h, 144px); transition: transform .9s ease; }
        .group:hover .k-book { transform: rotateY(0deg); }
        .k-book > .k-front { position: absolute; background: var(--book-front-bg, color-mix(in srgb, var(--foreground, #0d47a1) 60%, transparent)); width: 100%; height: 100%; border-top-right-radius: var(--book-radius, 4px); border-bottom-right-radius: var(--book-radius, 4px); box-shadow: 5px 5px 20px rgba(0,0,0,.35); overflow: hidden; }
        .k-book::before { content: " "; background: var(--book-pages-bg, #fff); height: calc(var(--book-h, 144px) - 6px); width: var(--book-d, 20px); top: 3px; position: absolute; transform: translateX(calc(var(--book-w, 96px) - var(--book-d, 20px)/2 - 3px)) rotateY(90deg) translateX(calc(var(--book-d, 20px) / 2)); border-radius: 2px; box-shadow: inset 0 0 2px rgba(0,0,0,.2); }
        .k-book::after { content: " "; position: absolute; left: 0; width: var(--book-w, 96px); height: var(--book-h, 144px); border-top-right-radius: var(--book-radius, 4px); border-bottom-right-radius: var(--book-radius, 4px); background: var(--book-back-bg, #0a0a0a); transform: translateZ(calc(var(--book-d, 20px) * -1)); box-shadow: -10px 0 50px 10px rgba(0,0,0,.35); }
        
        /* ---------- 3D Page/Screen ---------- */
        .screen-container { width: 96px; height: 170px; display: flex; align-items: center; justify-content: center; }
        .screen {
            position:relative;
            margin:0 auto;
            background:#ffffff;
            transform: perspective(1400px) rotateX(60deg) rotateZ(40deg);
            box-shadow:1px 2px 5px #444;
            transition: all 0.6s ease-in-out;
            width: 96px;
            height: 170px;
            border-radius: 4px;
        }
        .group:hover .screen {
            transform: perspective(1250px) rotateX(0deg) rotateZ(0deg) translateY(0px);
            box-shadow: 0px 20px 50px #999;
        }
      `}</style>
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="space-y-2">
          <motion.h1 initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="text-2xl md:text-3xl font-bold">Library</motion.h1>
        </div>
      </div>
      
      <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
        <Tabs value={activeType} onValueChange={(v) => setActiveType(v as DocType | "all")}>
            <TabsList className="flex flex-wrap h-auto">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="series">Serials</TabsTrigger>
            <TabsTrigger value="books">Books</TabsTrigger>
            <TabsTrigger value="articles">Articles</TabsTrigger>
            <TabsTrigger value="whitepapers">White Papers</TabsTrigger>
            <TabsTrigger value="abstracts">Abstracts</TabsTrigger>
            </TabsList>
        </Tabs>
        <ModeToggle mode={mode} onChange={setMode} />
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-[18rem_1fr] gap-4">
        <FilterSidebar
          yearRange={yearRange}
          setYearRange={setYearRange}
          language={language}
          setLanguage={setLanguage}
          selectedSubjects={selectedSubjects}
          toggleSubject={toggleSubject}
          sort={sort}
          setSort={(s) => setSort(s as any)}
          show={showFilters}
          onClose={() => setShowFilters(false)}
          hierarchy={hierarchy}
          genre={genre}
          setGenre={setGenre}
          category={category}
          setCategory={setCategory}
          subCategory={subCategory}
          setSubCategory={setSubCategory}
        />

        <div>
          <div className="flex items-start md:items-center gap-2 mb-3 flex-col md:flex-row">
            <div className="flex-1 w-full">
              <SearchBar query={query} setQuery={setQuery} />
            </div>
            <Button variant="outline" className="md:hidden" onClick={() => setShowFilters(true)}>
              <Filter className="mr-2 h-4 w-4" /> Filters
            </Button>
          </div>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm opacity-80">{items.length} results</div>
            <div className="flex flex-wrap gap-2">
              {[
                language && `Lang: ${language.toUpperCase()}`,
                genre && `Genre: ${hierarchy.find(g => g.id === genre)?.name}`,
                category && `Category: ${hierarchy.flatMap(g => g.categories).find(c => c.id === category)?.name}`,
                subCategory && `Sub: ${hierarchy.flatMap(g => g.categories).flatMap(c => c.subCategories).find(sc => sc.id === subCategory)?.name}`,
                ...[...selectedSubjects],
              ].filter(Boolean).map((f) => (
                <Badge key={f} variant="outline">{f}</Badge>
              ))}
              {(language || selectedSubjects.size > 0 || query || yearRange[0] !== 1900 || yearRange[1] !== new Date().getFullYear() + 1 || genre || category || subCategory) && (
                <Button size="sm" variant="ghost" onClick={clearFilters}>Clear</Button>
              )}
            </div>
          </div>
          
          <div className="space-y-4">
            {items.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                    {items.map((it) => (
                        <ResultCard key={it.id} item={it} />
                    ))}
                </div>
            ) : (
                <Card className="h-[180px] flex items-center justify-center text-muted-foreground">
                    No results found.
                </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


