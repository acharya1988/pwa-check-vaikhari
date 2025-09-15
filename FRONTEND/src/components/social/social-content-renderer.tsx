
'use client';

import React, { useCallback, useState, useEffect } from 'react';
import parse, { domToReact, type HTMLReactParserOptions, type Element } from 'html-react-parser';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getCitationByRefId } from '@/services/citation.service';
import type { Citation as CitationType, Quote, QuoteCategory } from '@/types';
import { TextSelectionMenu } from '../text-selection-menu';
import { UserCitationDialog } from '../user-citation-dialog';
import { CreateQuoteDialog } from '@/components/admin/quote-forms';
import { getQuoteData } from '@/services/quote.service';
import type { Range } from '@tiptap/react';

function PublicCitationTooltip({ refId }: { refId: string }) {
  const [citation, setCitation] = React.useState<CitationType | null>(null);
  const [isMounted, setIsMounted] = React.useState(false);
  React.useEffect(() => setIsMounted(true), []);

  React.useEffect(() => {
    async function fetchCitation() {
      const data = await getCitationByRefId(refId);
      setCitation(data);
    }
    fetchCitation();
  }, [refId]);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="text-primary font-semibold cursor-pointer hover:underline decoration-primary/50 underline-offset-4">
            [[{refId}]]
          </span>
        </TooltipTrigger>
        {isMounted && (
            <TooltipContent className="max-w-sm">
            {citation ? (
                <div className="flex flex-col gap-1">
                    <span className="block font-bold">{citation.source}, {citation.location}</span>
                    <span className="block font-headline text-primary">{citation.sanskrit}</span>
                    <span className="block text-sm text-muted-foreground italic">{citation.translation}</span>
                </div>
            ) : (
                <span className="block">Loading citation...</span>
            )}
            </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
};

export function SocialContentRenderer({ htmlString }: { htmlString?: string }) {
    const [selectedText, setSelectedText] = useState('');
    const [isCitationDialogOpen, setIsCitationDialogOpen] = useState(false);
    const [isQuoteDialogOpen, setIsQuoteDialogOpen] = useState(false);
    const [quoteCategories, setQuoteCategories] = useState<QuoteCategory[]>([]);
    
    useEffect(() => {
        getQuoteData().then(setQuoteCategories);
    }, []);

    const handleTextSelection = useCallback((text: string) => {
        if (text) {
            setSelectedText(text);
        }
    }, []);

    const handleSaveCitation = () => setIsCitationDialogOpen(true);
    const handleCreateQuote = () => setIsQuoteDialogOpen(true);

    if (!htmlString) return null;

    const options: HTMLReactParserOptions = {
        replace: (domNode) => {
            if (domNode.type === 'tag') {
                const node = domNode as Element;
                if (node.name === 'span' && node.attribs['data-citation']) {
                    const refId = node.attribs['data-ref-id'];
                    if (refId) {
                        return <PublicCitationTooltip refId={refId} />;
                    }
                }
                 if (node.name === 'blockquote' && node.attribs['data-author']) {
                    const childNodes = domToReact(node.children, options);
                    return (
                        <figure className="my-4">
                            <blockquote className="border-l-4 pl-4 italic">
                                {childNodes}
                            </blockquote>
                            <figcaption className="text-right text-sm text-muted-foreground mt-1">
                                — {node.attribs['data-author']}
                            </figcaption>
                        </figure>
                    );
                }
            }
        }
    };
    return (
        <>
            <UserCitationDialog
                open={isCitationDialogOpen}
                onOpenChange={setIsCitationDialogOpen}
                sanskritText={selectedText}
                source={{ name: `Post`, location: `Activity Wall` }}
                defaultCategoryId="collected-from-post"
            />
             <CreateQuoteDialog
                open={isQuoteDialogOpen}
                onOpenChange={setIsQuoteDialogOpen}
                categories={quoteCategories}
                initialQuote={selectedText}
                defaultCategoryId="collected-from-post"
              />
            <TextSelectionMenu
                onSelectText={handleTextSelection}
                onSaveCitation={handleSaveCitation}
                onCreateQuote={handleCreateQuote}
            >
                <div className="prose prose-sm dark:prose-invert max-w-none break-words">
                    {parse(htmlString, options)}
                </div>
            </TextSelectionMenu>
        </>
    );
}
