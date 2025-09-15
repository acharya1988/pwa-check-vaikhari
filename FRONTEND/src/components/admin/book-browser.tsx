
'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Book, SeriesGroup } from '@/types';
import type { HierarchicalGenre } from '@/services/book.service';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookFormDialog, GroupBooksDialog } from './profile-forms';
import { Input } from '../ui/input';
import { Search } from 'lucide-react';
import { BookActions } from './book-actions';

const BookCard = ({ book, hierarchy }: { book: Book; hierarchy: HierarchicalGenre[] }) => {
    const breadcrumb = useMemo(() => {
        const genre = hierarchy.find(g => g.id === book.genreId);
        const category = genre?.categories.find(c => c.id === book.categoryId);
        const subCategory = category?.subCategories.find(sc => sc.id === (book as any).subCategoryId);
        return [genre?.name, category?.name, subCategory?.name].filter(Boolean).join(' → ');
    }, [book, hierarchy]);

    return (
        <div className="book-card-container">
            <Card className="book-card">
                <div className="book-card-cover">
                    <Image 
                        src={book.profileUrl || 'https://placehold.co/400x600.png'} 
                        alt={`${book.name} cover`} 
                        fill 
                        sizes="(max-width: 768px) 33vw, 20vw"
                        className="object-cover"
                        data-ai-hint="book cover"
                    />
                </div>
                <div className="book-card-content">
                    <CardHeader className="p-4">
                        <div className="flex justify-between items-start">
                           <CardTitle className="text-base leading-tight line-clamp-2 flex-1 pr-2">{book.name}</CardTitle>
                           <BookActions book={book} />
                        </div>
                        <CardDescription className="text-xs truncate" title={breadcrumb}>{breadcrumb}</CardDescription>
                    </CardHeader>
                    <CardFooter className="p-4 pt-0">
                         <Button asChild size="sm" className="w-full">
                            <Link href={`/admin/books/${book.id}`}>Manage Content</Link>
                        </Button>
                    </CardFooter>
                </div>
            </Card>
        </div>
    );
};

const SeriesCard = ({ series, hierarchy, allBooks }: { series: SeriesGroup; hierarchy: HierarchicalGenre[]; allBooks: Book[] }) => {
    const firstVolume = series.volumes[0];
    const breadcrumb = useMemo(() => {
        if (!firstVolume) return 'Unknown Path';
        const genre = hierarchy.find(g => g.id === firstVolume.genreId);
        const category = genre?.categories.find(c => c.id === firstVolume.categoryId);
        const subCategory = category?.subCategories.find(sc => sc.id === (firstVolume as any).subCategoryId);
        return [genre?.name, category?.name, subCategory?.name].filter(Boolean).join(' → ');
    }, [firstVolume, hierarchy]);
    
    return (
        <Card className="hover:shadow-md transition-colors bg-muted/50 border-dashed md:col-span-2 lg:col-span-3 xl:col-span-4">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-base text-primary">{series.seriesName} (Series)</CardTitle>
                        <CardDescription>{series.volumes.length} volumes • {breadcrumb}</CardDescription>
                    </div>
                     <GroupBooksDialog seriesToEdit={series} allBooks={allBooks}>
                        <Button variant="secondary" size="sm">Manage Series</Button>
                    </GroupBooksDialog>
                </div>
            </CardHeader>
            <CardContent className="space-y-1">
                {series.volumes.map(vol => (
                    <div key={vol.id} className="text-sm text-muted-foreground pl-3 py-1 border-l-2 border-primary/30 flex justify-between items-center">
                        <span>{vol.name}</span>
                        <Button asChild size="sm" variant="ghost">
                           <Link href={`/admin/books/${vol.id}`}>Manage</Link>
                        </Button>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
};


export function BookBrowser({ allBooksByGenre, hierarchy }: {
    allBooksByGenre: any[],
    hierarchy: HierarchicalGenre[],
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const { allSeries, allStandalone } = useMemo(() => {
    const series = allBooksByGenre.flatMap(g => g.series);
    const standalone = allBooksByGenre.flatMap(g => g.standaloneBooks);
    return { allSeries: series, allStandalone: standalone };
  }, [allBooksByGenre]);

  const filteredItems = useMemo(() => {
    const lowercasedQuery = searchQuery.toLowerCase();
    if (!lowercasedQuery) {
      return [...allSeries, ...allStandalone];
    }
    
    const filteredSeries = allSeries.filter(series => 
        series.seriesName.toLowerCase().includes(lowercasedQuery) ||
        series.volumes.some(vol => vol.name.toLowerCase().includes(lowercasedQuery))
    );

    const filteredStandalone = allStandalone.filter(book => 
        book.name.toLowerCase().includes(lowercasedQuery)
    );

    return [...filteredSeries, ...filteredStandalone];
  }, [searchQuery, allSeries, allStandalone]);


  return (
    <div className="w-full">
      <div className="mb-6">
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
                placeholder="Search all books and series by name..."
                className="pl-10 h-12 text-base rounded-full"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
            />
        </div>
      </div>
      
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
          {filteredItems.map(item =>
            'seriesName' in item
              ? <SeriesCard key={item.seriesName} series={item} hierarchy={hierarchy} allBooks={allStandalone} />
              : <BookCard key={item.id} book={item} hierarchy={hierarchy} />
          )}
        </div>
      ) : (
        <div className="text-center text-muted-foreground py-10">
            <p>No works found matching your search.</p>
        </div>
      )}
    </div>
  );
}
