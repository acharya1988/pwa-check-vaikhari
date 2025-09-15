

'use client';

import React, { useState, useMemo, useEffect, useCallback, useActionState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Book,
  PanelLeft,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getBookContent, getBooks } from '@/services/book.service';
import { getFullGlossary } from '@/services/glossary.service';
import { getBookmarksForUser, getUserProfile } from '@/services/user.service';
import { getCirclesForUser } from '@/services/profile.service';
import type { Book as BookInfo, BookContent as BookContentType, Chapter, Article, ContentBlock, GlossaryTerm, Bookmark, QuoteCategory, GlossaryCategory, Quote, BookTheme, ChintanaCategory, UserProfile, Circle } from '@/types';
import { PublicArticleRenderer, ArticleHeader } from '@/components/public-article-renderer';
import { TextSelectionMenu } from '@/components/text-selection-menu';
import { UserCitationDialog } from '@/components/user-citation-dialog';
import { CreateQuoteDialog } from '@/components/admin/quote-forms';
import { CommentFormDialog } from '@/components/comment-form-dialog';
import { LivingDocumentSidebar } from '@/components/admin/living-document/living-document-sidebar';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { ALL_COMMENTARY_TYPES, getTypeLabelById } from '@/types';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import type { Range } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { ChevronDown, Menu, X } from 'lucide-react';
import { ArticleMetadataBar } from '@/components/article-metadata-bar';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { ReaderHeader } from '@/components/reader-header';
import { notFound } from 'next/navigation';
import { ArticleComments } from '@/components/article-comments';
import { handleArticleFeedback } from '@/app/articles/actions';
import { getQuoteData } from '@/services/quote.service';
import { getChintanaCategories } from '@/services/chintana.service';
import { getThemeForBook, getDefaultTheme } from '@/services/theme.service';
import { ThemeApplier } from '@/components/theme/ThemeApplier';
import { useBookTheme } from '@/components/theme/BookThemeContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { CreateThreadDialog } from '@/components/social/create-chintana-thread-dialog';
import { CreatePostForm } from '@/components/social/create-post-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';

function PaneSelector({
  paneIndex,
  onSelectContent,
  availableContent,
  currentTitle,
}: {
  paneIndex: number;
  onSelectContent: (
    paneIndex: number,
    blocks: ContentBlock[] | null,
    title: string
  ) => void;
  availableContent: { id: string; title: string; blocks: ContentBlock[] }[];
  currentTitle: string;
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');

    const filteredContent = availableContent.filter(c => c.title.toLowerCase().includes(search.toLowerCase()));

    const handleSelect = (content: { id: string; title: string; blocks: ContentBlock[] }) => {
        onSelectContent(paneIndex, content.blocks, content.title);
        setOpen(false);
    }
  
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between truncate">
            <span className="truncate">{currentTitle}</span>
            <ChevronDown className="h-4 w-4 flex-shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
             <Command>
                <CommandInput placeholder="Search content..." value={search} onValueChange={setSearch} />
                <CommandList>
                    <CommandEmpty>No content found.</CommandEmpty>
                    {filteredContent.map((content) => (
                        <CommandItem key={content.id} onSelect={() => handleSelect(content)}>
                            {content.title}
                        </CommandItem>
                    ))}
                </CommandList>
            </Command>
        </PopoverContent>
      </Popover>
    );
  }


export function LivingDocumentReaderPage({
    books: initialBooks,
    selectedBookId: initialSelectedBookId,
    onSelectBook: onSelectBookProp,
    bookContent: initialBookContent,
    glossary,
    bookmarks: initialBookmarks,
    isLoading,
}: {
    books: BookInfo[];
    selectedBookId: string | null;
    onSelectBook: (bookId: string) => void;
    bookContent: BookContentType | null;
    glossary: GlossaryTerm[];
    bookmarks: Bookmark[];
    isLoading: boolean;
}) {
    const router = useRouter();
    const isMobile = useIsMobile();
    const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);
    const hasAutoClosedRef = useRef(false);

    const [selectedUnit, setSelectedUnit] = useState<Article | null>(null);
    const [search, setSearch] = useState('');
    
    const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks);
    const [activeGlossary, setActiveGlossary] = useState<GlossaryCategory | null>(null);

    const [layout, setLayout] = useState<'single' | 'two' | 'three'>('single');
    const [panes, setPanes] = useState<(ContentBlock[] | null)[]>([null, null, null]);
    const [paneTitles, setPaneTitles] = useState<string[]>(['', '', '']);
    const [fontSize, setFontSize] = useState(18);

    const [selectedText, setSelectedText] = useState('');
    const [isCitationDialogOpen, setIsCitationDialogOpen] = useState(false);
    const [isQuoteDialogOpen, setIsQuoteDialogOpen] = useState(false);
    
    const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false);
    const [isChintanaDialogOpen, setIsChintanaDialogOpen] = useState(false);
    const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
    const [isCirclePostDialogOpen, setIsCirclePostDialogOpen] = useState(false);
    const [quoteCategories, setQuoteCategories] = useState<QuoteCategory[]>([]);
    const [chintanaCategories, setChintanaCategories] = useState<ChintanaCategory[]>([]);
    const [highlightTarget, setHighlightTarget] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
    const [userCircles, setUserCircles] = useState<Circle[]>([]);


    const [feedbackState, formAction] = useActionState(handleArticleFeedback, null);
    const { toast } = useToast();
    const [submittedFeedback, setSubmittedFeedback] = useState<Record<string, boolean>>({});
    
    const { theme: activeTheme } = useBookTheme();
    
    useEffect(() => {
        if (!isMobile && !hasAutoClosedRef.current) {
            const timer = setTimeout(() => {
                setIsSidebarOpen(false);
                hasAutoClosedRef.current = true;
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [isMobile]);

    const bookInfo = useMemo(() => {
        if (!initialBookContent || !selectedUnit) return null;
        
        const findChapter = (chapters: Chapter[], unit: Article): Chapter | null => {
            for (const chapter of chapters) {
                if (chapter.articles.some(a => a.verse === unit.verse)) {
                    return chapter;
                }
                if (chapter.children) {
                    const found = findChapter(chapter.children, unit);
                    if (found) return found;
                }
            }
            return null;
        };
        const chapter = findChapter(initialBookContent.chapters, selectedUnit);
        
        return chapter ? { book: initialBookContent, chapter, article: selectedUnit } : null;
    }, [initialBookContent, selectedUnit]);
    
     const availableContentForPanes = useMemo(() => {
        if (!selectedUnit) return [];
        
        const sourceBlocks = selectedUnit.content.filter(
          (block) => !ALL_COMMENTARY_TYPES.includes(block.type)
        );

        const commentaries = selectedUnit.content.filter(
          (block) => ALL_COMMENTARY_TYPES.includes(block.type) && block.commentary
        ).map(c => ({
            id: c.id,
            title: `${selectedUnit.title} - ${c.commentary?.shortName}: ${getTypeLabelById(c.type)}`,
            blocks: [c],
        }));

        return [
            { id: 'mula', title: `${selectedUnit.title} - Mūla (Source Text)`, blocks: sourceBlocks },
            ...commentaries
        ];
    }, [selectedUnit]);
    
    const handleLayoutChange = useCallback((newLayout: 'single' | 'two' | 'three') => {
        setLayout(newLayout);
        const newPanes = [null, null, null];
        const newTitles = ['', '', ''];
        
        if (newLayout === 'single') {
            newPanes[0] = selectedUnit?.content || null;
            newTitles[0] = 'Full Article';
        } else if (newLayout === 'two') {
            newPanes[0] = availableContentForPanes.find(c => c.id === 'mula')?.blocks || null;
            newTitles[0] = availableContentForPanes.find(c => c.id === 'mula')?.title || 'Mūla';
            newPanes[1] = availableContentForPanes.length > 1 ? availableContentForPanes[1].blocks : null;
            newTitles[1] = availableContentForPanes.length > 1 ? availableContentForPanes[1].title : 'Select Content';
        } else if (newLayout === 'three') {
            newPanes[0] = availableContentForPanes.find(c => c.id === 'mula')?.blocks || null;
            newTitles[0] = availableContentForPanes.find(c => c.id === 'mula')?.title || 'Mūla';
            newPanes[1] = availableContentForPanes.length > 1 ? availableContentForPanes[1].blocks : null;
            newTitles[1] = availableContentForPanes.length > 1 ? availableContentForPanes[1].title : 'Select Content';
            newPanes[2] = availableContentForPanes.length > 2 ? availableContentForPanes[2].blocks : null;
            newTitles[2] = availableContentForPanes.length > 2 ? availableContentForPanes[2].title : 'Select Content';
        }
        setPanes(newPanes);
        setPaneTitles(newTitles);
    }, [availableContentForPanes, selectedUnit]);
    
    const handleHighlight = (elementId: string) => {
        setHighlightTarget(elementId);
        setTimeout(() => setHighlightTarget(null), 1200);
    };

    useEffect(() => {
        if(initialBookContent && !selectedUnit) {
            const firstArticle = initialBookContent.chapters?.[0]?.articles?.[0];
            if (firstArticle) {
                setSelectedUnit(firstArticle);
            }
        }
    }, [initialBookContent, selectedUnit]);


    useEffect(() => {
        if (selectedUnit) {
            handleLayoutChange(layout);
        }
    }, [selectedUnit, layout, handleLayoutChange]);


     useEffect(() => {
        getUserProfile().then(user => {
            setCurrentUser(user);
            if (user) {
                getCirclesForUser(user.email).then(setUserCircles);
            }
        });
        if (!selectedUnit || !bookInfo) return;
        getQuoteData().then(setQuoteCategories);
        getChintanaCategories().then(setChintanaCategories);
        getBookmarksForUser('default-user').then(setBookmarks);
    }, [selectedUnit, bookInfo]);

  useEffect(() => {
    if (feedbackState?.success) {
      toast({ title: 'Feedback Received', description: 'Thank you for your input!' });
    }
    if (feedbackState?.error) {
      toast({ variant: 'destructive', title: 'Error', description: feedbackState.error });
    }
  }, [feedbackState, toast]);

  const onFeedbackSubmit = (formData: FormData) => {
    const action = formData.get('action');
    const score = formData.get('score');

    if (action) {
        setSubmittedFeedback(prev => ({ ...prev, like_dislike: true }));
    }
    if (score) {
        setSubmittedFeedback(prev => ({ ...prev, score: true }));
    }
    formAction(formData);
  };
  
  const handleTextSelection = useCallback((text: string) => {
    if (text) {
      setSelectedText(text);
    }
  }, []);

  const handleSaveCitation = () => setIsCitationDialogOpen(true);
  const handleCreateQuote = () => setIsQuoteDialogOpen(true);
  const handleAddComment = () => setIsCommentDialogOpen(true);
  const handleDiscuss = () => setIsChintanaDialogOpen(true);

  const handlePostActivity = () => {
    if (selectedText) {
        setIsPostDialogOpen(true);
    }
  }

  const handlePostToCircle = () => {
    if (selectedText) {
        setIsCirclePostDialogOpen(true);
    }
  }
    
    const handlePaneContentSelect = (paneIndex: number, newBlocks: ContentBlock[] | null, newTitle: string) => {
        setPanes(currentPanes => {
            const newPaneState = [...currentPanes];
            newPaneState[paneIndex] = newBlocks;
            return newPaneState;
        });
        setPaneTitles(currentTitles => {
            const newTitleState = [...currentTitles];
            newTitleState[paneIndex] = newTitle;
            return newTitleState;
        });
    };
    
    const articleHtmlForToc = useMemo(() => {
        if (!selectedUnit) return '';
        return selectedUnit.content.map(b => b.sanskrit).join('');
    }, [selectedUnit]);
    
    const isArticleBookmarked = useMemo(() => {
        if (!bookInfo) return false;
        return bookmarks.some(b => 
            b.type === 'article' && 
            b.bookId === bookInfo.book.bookId && 
            String(b.chapterId) === String(bookInfo.chapter.id) && 
            String(b.verse) === String(bookInfo.article.verse)
        );
    }, [bookmarks, bookInfo]);

    const activeGlossaryTerms = useMemo(() => {
        if(!activeGlossary) return [];
        return activeGlossary.terms;
    }, [activeGlossary]);

    const activeGlossaryColor = activeGlossary?.colorTheme;
    const isGlossaryOn = activeGlossary !== null;
    
    const handleGlossaryModeChange = useCallback((enabled: boolean, category?: GlossaryCategory) => {
        if (enabled) {
            if (category) {
                 setActiveGlossary(category);
            } else {
                 getFullGlossary().then(fullGlossary => {
                    setActiveGlossary({id: "vedanta-terms", name:"Vedanta Terms", terms: fullGlossary, scope: "global", colorTheme: "saffron" });
                });
            }
        } else {
            setActiveGlossary(null);
        }
    }, []);
    
    const sidebar = (
        <LivingDocumentSidebar
            isOpen={isSidebarOpen}
            onToggle={() => setIsSidebarOpen(prev => !prev)}
            books={initialBooks}
            selectedBookId={initialSelectedBookId}
            onSelectBook={onSelectBookProp}
            bookContent={initialBookContent}
            onSelectUnit={(unit) => {
                setSelectedUnit(unit);
                 if(isMobile) setIsSidebarOpen(false);
            }}
            search={search}
            setSearch={setSearch}
            isLoading={isLoading}
            selectedUnit={selectedUnit}
            activeGlossary={activeGlossary}
            onActiveGlossaryChange={handleGlossaryModeChange}
            tocContentHtml={articleHtmlForToc}
            articleInfo={bookInfo}
            isArticleBookmarked={isArticleBookmarked}
            onHighlight={handleHighlight}
        />
    );

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <>
            <UserCitationDialog
                open={isCitationDialogOpen}
                onOpenChange={setIsCitationDialogOpen}
                sanskritText={selectedText}
                source={bookInfo ? { name: bookInfo.book.bookName, location: `${bookInfo.chapter.name} - ${bookInfo.article.verse}` } : { name: '', location: '' }}
                defaultCategoryId="user-saved-notes"
            />
             <CreateQuoteDialog
                open={isQuoteDialogOpen}
                onOpenChange={(isOpen) => setQuoteDialogState(prev => ({ ...prev, open: isOpen }))}
                categories={quoteCategories}
                initialQuote={selectedText}
                onQuoteCreated={() => {}}
                defaultCategoryId="collected-from-post"
              />
            <CommentFormDialog
              open={isCommentDialogOpen}
              onOpenChange={setIsCommentDialogOpen}
              targetText={selectedText}
              articleInfo={bookInfo ? { bookId: bookInfo.book.bookId, chapterId: String(bookInfo.chapter.id), verse: String(bookInfo.article.verse) } : { bookId: '', chapterId: '', verse: '' }}
            />
             <CreateThreadDialog 
                open={isChintanaDialogOpen}
                onOpenChange={setIsChintanaDialogOpen}
                categories={chintanaCategories || []}
                initialContent={selectedText}
             />
           
             <Dialog open={isPostDialogOpen} onOpenChange={setIsPostDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Create a New Post</DialogTitle></DialogHeader>
                    {currentUser && <CreatePostForm userProfile={currentUser} onPostCreated={() => setIsPostDialogOpen(false)} initialContent={selectedText} />}
                </DialogContent>
             </Dialog>
              <Dialog open={isCirclePostDialogOpen} onOpenChange={setIsCirclePostDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Create a Post in Your Circle</DialogTitle></DialogHeader>
                    {currentUser && <CreatePostForm userProfile={currentUser} onPostCreated={() => setIsCirclePostDialogOpen(false)} initialContent={selectedText} context={{type: 'circle-feed'}} circles={userCircles} />}
                </DialogContent>
              </Dialog>
           
             <div className="h-screen w-full flex flex-col overflow-hidden">
                {activeTheme && <ThemeApplier theme={activeTheme} scopeToId="reader-content-area" dynamicFontSize={fontSize} />}
                <div className="flex-1 flex flex-row overflow-hidden">
                    <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
                         <ReaderHeader
                            book={bookInfo?.book || initialBookContent || { bookName: 'VAIKHARI' } as any}
                            chapter={bookInfo?.chapter || { name: 'Living Document' } as any}
                            article={bookInfo?.article || { title: 'Select a text to begin' } as any}
                            isArticleBookmarked={isArticleBookmarked}
                            layout={layout}
                            onLayoutChange={handleLayoutChange}
                            fontSize={fontSize}
                            onFontSizeChange={setFontSize}
                            hasCommentaries={availableContentForPanes.length > 1}
                            isSidebarOpen={isSidebarOpen}
                            onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
                        />
                        <div id="reader-content-area" className={cn("flex-1 overflow-y-auto", layout === 'single' && 'page-container')}>
                            <TextSelectionMenu 
                                onSelectText={handleTextSelection}
                                onSaveCitation={handleSaveCitation}
                                onAddComment={handleAddComment}
                                onCreateQuote={handleCreateQuote}
                                onPostActivity={handlePostActivity}
                                onPostToCircle={handlePostToCircle}
                                onDiscuss={handleDiscuss}
                            >
                                <div className={cn(layout === 'single' && 'page')} data-size="A4">
                                    {layout === 'single' && (
                                        <>
                                            <div className="page-header">
                                                <span>{bookInfo?.book.bookName}</span>
                                                <span>{bookInfo?.chapter.name}</span>
                                            </div>
                                            <div className="page-footer" />
                                        </>
                                    )}
                                  {layout === 'single' ? (
                                      <div className="printable-content">
                                          {!selectedUnit ? (
                                              <div className="h-full flex items-center justify-center flex-1 min-w-0 pt-20">
                                                  <div className="text-center text-muted-foreground">
                                                      <Book className="h-12 w-12 mx-auto mb-4" />
                                                      <p>Select an article from the navigator to view its content.</p>
                                                  </div>
                                              </div>
                                          ) : bookInfo ? (
                                              <div className="printable-content">
                                                  <PublicArticleRenderer
                                                      blocks={selectedUnit.content}
                                                      isGlossaryMode={isGlossaryOn}
                                                      glossary={activeGlossaryTerms}
                                                      bookmarks={initialBookmarks}
                                                      articleInfo={bookInfo}
                                                      activeGlossaryColor={activeGlossaryColor}
                                                      highlightTarget={highlightTarget}
                                                      isPreviewMode={false}
                                                      onPostActivity={handlePostActivity}
                                                      onDiscuss={handleDiscuss}
                                                  />
                                              </div>
                                          ) : null}
                                      </div>
                                  ) : (
                                      <div className={cn(
                                          'grid gap-x-8 h-full',
                                          layout === 'two' ? 'md:grid-cols-2' : 'md:grid-cols-3'
                                      )}>
                                          {Array.from({ length: layout === 'two' ? 2 : 3 }).map((_, index) => (
                                              <div key={index} className="flex flex-col h-full border-l first:border-l-0 pl-4 first:pl-0 min-w-0">
                                                  <div className="flex-shrink-0 mb-4 no-print">
                                                      <PaneSelector 
                                                          paneIndex={index}
                                                          onSelectContent={handlePaneContentSelect}
                                                          availableContent={availableContentForPanes}
                                                          currentTitle={paneTitles[index] || 'Select Content'}
                                                      />
                                                  </div>
                                                  <ScrollArea className="flex-1">
                                                      {panes[index] && bookInfo ? (
                                                          <div className="printable-content p-4">
                                                              <PublicArticleRenderer 
                                                                  blocks={panes[index]!} 
                                                                  isGlossaryMode={isGlossaryOn}
                                                                  glossary={activeGlossaryTerms}
                                                                  bookmarks={initialBookmarks}
                                                                  articleInfo={bookInfo}
                                                                  hideNotes={true}
                                                                  showTitle={false}
                                                                  activeGlossaryColor={activeGlossaryColor}
                                                                  highlightTarget={highlightTarget}
                                                                  isPreviewMode={false}
                                                                  onPostActivity={handlePostActivity}
                                                                  onDiscuss={handleDiscuss}
                                                              />
                                                          </div>
                                                      ) : (
                                                              <div className="flex items-center justify-center h-full border-2 border-dashed rounded-lg min-h-[200px]">
                                                                  <p className="text-muted-foreground">Select content to display</p>
                                                              </div>
                                                          )}
                                                  </ScrollArea>
                                              </div>
                                          ))}
                                      </div>
                                  )}
                                  
                                {selectedUnit && bookInfo && (
                                    <div className="max-w-4xl mx-auto">
                                        
                                    </div>
                                )}
                                </div>
                            </TextSelectionMenu>
                            
                            {layout === 'single' && bookInfo && (
                                <div className="px-4 md:px-8 lg:px-12 pb-12 max-w-4xl mx-auto">
                                    <ArticleComments articleId={String(bookInfo.article?.verse)} bookId={bookInfo.book.bookId} chapterId={String(bookInfo.chapter.id)} comments={bookInfo.article.comments || []} />
                                </div>
                            )}
                        </div>
                    </main>

                    {/* Right Sidebar */}
                    <div className="flex-shrink-0 no-print">
                        {isMobile ? (
                             <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                                <SheetTrigger asChild>
                                    <Button className="fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full shadow-lg no-print" size="icon">
                                        <PanelLeft className="h-6 w-6" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="left" className="w-[320px] p-0">
                                    <SheetHeader>
                                        <SheetTitle className="sr-only">Reader Navigation</SheetTitle>
                                        <SheetDescription className="sr-only">Navigate books and chapters, view notes, and change display settings.</SheetDescription>
                                    </SheetHeader>
                                    {sidebar}
                                </SheetContent>
                            </Sheet>
                        ) : (
                            sidebar
                        )}
                    </div>
                </div>
            </div>
        </>

    );
}

