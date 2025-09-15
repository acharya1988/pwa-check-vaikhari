
'use client';

import Link from 'next/link';
import {
  type BookContent,
  type Chapter,
  type Article,
} from '@/lib/data-service';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, Columns, PanelLeft, GalleryVertical, Menu, X } from 'lucide-react';
import { ScriptSwitcher } from '@/components/script-switcher';
import { BookmarkButton } from './bookmark-button';
import { SharePopover } from './share-popover';
import { Separator } from './ui/separator';
import { PrintDialog } from './print-dialog';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import { Label } from './ui/label';
import { FontSizeSwitcher } from '@/components/font-size-switcher';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';


function LayoutSwitcher({ layout, onLayoutChange, hasCommentaries }: {
    layout: 'single' | 'two' | 'three';
    onLayoutChange: (layout: 'single' | 'two' | 'three') => void;
    hasCommentaries: boolean;
}) {
    const cycleLayout = () => {
        if (layout === 'single') {
            onLayoutChange(hasCommentaries ? 'two' : 'single');
        } else if (layout === 'two') {
             onLayoutChange(hasCommentaries ? 'three' : 'single');
        } else {
            onLayoutChange('single');
        }
    };

    return (
        <Button variant="outline" size="icon" onClick={cycleLayout} title="Cycle Layout">
            {layout === 'single' && <PanelLeft className="h-4 w-4" />}
            {layout === 'two' && <Columns className="h-4 w-4" />}
            {layout === 'three' && <GalleryVertical className="h-4 w-4" />}
        </Button>
    )
}

export function ReaderHeader({
  book,
  chapter,
  article,
  isArticleBookmarked,
  layout,
  onLayoutChange,
  fontSize,
  onFontSizeChange,
  hasCommentaries,
  isSidebarOpen,
  onToggleSidebar,
}: {
  book: BookContent;
  chapter: Chapter;
  article: Article;
  isArticleBookmarked: boolean;
  layout: 'single' | 'two' | 'three';
  onLayoutChange: (layout: 'single' | 'two' | 'three') => void;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  hasCommentaries: boolean;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 w-full border-b backdrop-blur-sm no-print">
      <div className="container flex h-14 items-center justify-between mx-auto max-w-7xl px-4">
        <div className="flex items-center gap-2 md:gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link
              href={`/admin/books/${book.bookId}`}
              title={`Back to ${book.bookName}`}
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="hidden sm:block">
            <p className="font-semibold text-sm truncate">{book.bookName}</p>
            <p className="text-xs text-muted-foreground truncate">
              {chapter.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden md:flex items-center gap-2">
                <LayoutSwitcher layout={layout} onLayoutChange={onLayoutChange} hasCommentaries={hasCommentaries} />
                 <Separator orientation="vertical" className="h-6" />
                <FontSizeSwitcher onFontSizeChange={onFontSizeChange} fontSize={fontSize} />
                 <Separator orientation="vertical" className="h-6" />
                <ScriptSwitcher />
            </div>
            <div className="flex items-center gap-1">
              <BookmarkButton
                  isBookmarked={isArticleBookmarked}
                  type="article"
                  book={book}
                  chapter={chapter}
                  article={article}
                  size="icon"
              />
              <SharePopover />
              <PrintDialog articleInfo={{ book, chapter, article }}>
                  <Button variant="ghost" size="icon" title="Print">
                      <Printer className="h-5 w-5" />
                  </Button>
              </PrintDialog>
               <Button variant="ghost" size="icon" onClick={onToggleSidebar} title="Toggle Sidebar">
                <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                        key={isSidebarOpen ? 'close' : 'open'}
                        initial={{ rotate: -90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: 90, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </motion.div>
                </AnimatePresence>
              </Button>
            </div>
        </div>
      </div>
    </header>
  );
}
