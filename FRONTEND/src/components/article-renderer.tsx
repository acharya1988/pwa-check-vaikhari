
'use client';

import type { ContentBlock, Citation as CitationType } from '@/types';
import { useEffect, useState } from 'react';
import React from 'react';
import parse, { domToReact, type HTMLReactParserOptions, type Element } from 'html-react-parser';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getCitationByRefId } from '@/services/citation.service';
import { Transliterate } from './transliteration-provider';
import { ALL_COMMENTARY_TYPES, getTypeLabelById } from '@/types';
import { Separator } from './ui/separator';

function PublicCitation({ refId }: { refId: string }) {
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
                <>
                    <span className="block font-bold">{citation.source}, {citation.location}</span>
                    <span className="block font-headline text-primary">{citation.sanskrit}</span>
                    <span className="block text-sm text-muted-foreground italic">{citation.translation}</span>
                </>
            ) : (
                <span className="block">Loading citation...</span>
            )}
            </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
};

function PublicNote({ dataType, noteNumber, noteContent }: { dataType: string, noteNumber: number, noteContent: string }) {
    const className = dataType === 'footnote'
        ? 'text-blue-600 dark:text-blue-400 font-bold select-none'
        : 'text-red-600 dark:text-red-400 font-bold select-none';

    const content = dataType === 'footnote' ? `[${noteNumber}]` : `[*${noteNumber}]`;
    const noteId = `${dataType}-${noteNumber}`;
    
    const [isMounted, setIsMounted] = React.useState(false);
    React.useEffect(() => setIsMounted(true), []);

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <sup className={className}>
                        <a href={`#${noteId}`} id={`ref-${noteId}`} className="no-underline hover:underline">
                            {content}
                        </a>
                    </sup>
                </TooltipTrigger>
                {isMounted && (
                    <TooltipContent>
                        <span dangerouslySetInnerHTML={{ __html: noteContent }} />
                    </TooltipContent>
                )}
            </Tooltip>
        </TooltipProvider>
    );
}

function HtmlRenderer({ htmlString }: { htmlString: string | null }) {
    if (!htmlString) return null;

    class ParserState {
        footnoteCounter = 0;
        specialnoteCounter = 0;
    }
    const state = new ParserState();

    const hasCustomChild = (children: any[]): boolean => {
        if (!children) return false;
        return children.some(child => {
            if (child.type === 'tag') {
                if (child.name === 'span' && child.attribs['data-citation']) return true;
                if (child.name === 'sup' && child.attribs['data-type']) return true;
                if (child.children) return hasCustomChild(child.children);
            }
            return false;
        });
    }

    const options: HTMLReactParserOptions = {
        replace: (domNode) => {
            if (domNode.type === 'tag') {
                const node = domNode as Element;
                
                if (node.name === 'p' && hasCustomChild(node.children)) {
                    return <div>{domToReact(node.children, options)}</div>;
                }

                if (node.name === 'span' && node.attribs['data-citation']) {
                    const refId = node.attribs['data-ref-id'];
                    if (refId) {
                        return <PublicCitation refId={refId} />;
                    }
                }
                if (node.name === 'sup' && node.attribs['data-type']) {
                    const dataType = node.attribs['data-type'];
                    const dataContent = node.attribs['data-content'];
                    if (dataType === 'footnote') {
                        const noteNumber = ++state.footnoteCounter;
                        return <PublicNote dataType={dataType} noteNumber={noteNumber} noteContent={dataContent} />;
                    }
                    if (dataType === 'specialnote') {
                        const noteNumber = ++state.specialnoteCounter;
                        return <PublicNote dataType={dataType} noteNumber={noteNumber} noteContent={dataContent} />;
                    }
                }
            }
        }
    };

    return <>{parse(htmlString, options)}</>;
}


function ArticleNotes({ blocks }: { blocks: ContentBlock[] }) {
    const [notes, setNotes] = useState<{ footnotes: string[], specialNotes: string[] }>({ footnotes: [], specialNotes: [] });
    const [isMounted, setIsMounted] = useState(false);
    
    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!isMounted || typeof window === 'undefined') return;

        const allFootnotes: string[] = [];
        const allSpecialnotes: string[] = [];
        const parser = new DOMParser();
        
        const allOriginalHtml = blocks.map(b => b.sanskrit).join('');
        if (!allOriginalHtml) {
            setNotes({ footnotes: [], specialNotes: [] });
            return;
        }

        const doc = parser.parseFromString(`<div>${allOriginalHtml}</div>`, 'text/html');
        
        doc.querySelectorAll('sup[data-type="footnote"]').forEach(el => {
            const content = el.getAttribute('data-content');
            if (content) allFootnotes.push(content);
        });
        doc.querySelectorAll('sup[data-type="specialnote"]').forEach(el => {
            const content = el.getAttribute('data-content');
            if (content) allSpecialnotes.push(content);
        });

        setNotes({ footnotes: allFootnotes, specialNotes: allSpecialnotes });
    }, [blocks, isMounted]);

    const { footnotes, specialNotes } = notes;
    const hasNotes = footnotes.length > 0 || specialNotes.length > 0;
    if (!hasNotes) return null;

    return (
        <div className="mt-12 pt-8 border-t">
             <div className="footnotes-container font-devanagari">
                {footnotes.length > 0 && (
                    <div className="space-y-2 md:border-r md:pr-8">
                        <h3 className="font-bold text-lg mb-2 font-headline text-blue-600 dark:text-blue-400">Footnotes</h3>
                        <ol className="footnotes-list space-y-2 text-sm text-muted-foreground prose-styling max-w-none">
                            {footnotes.map((note, index) => (
                                <li key={`fn-${index}`} id={`footnote-${index + 1}`} className="flex items-start gap-2">
                                    <a href={`#ref-footnote-${index + 1}`} className="w-5 text-right font-bold text-blue-600 dark:text-blue-400 text-xs leading-snug pt-0.5 no-underline hover:underline">{index + 1}.</a>
                                    <span className="flex-1" dangerouslySetInnerHTML={{ __html: note }} />
                                </li>
                            ))}
                        </ol>
                    </div>
                )}
                
                {specialNotes.length > 0 && (
                    <div className="space-y-2">
                        <h3 className="font-bold text-lg mb-2 font-headline text-red-600 dark:text-red-400">Special Notes</h3>
                        <ol className="footnotes-list space-y-2 text-sm text-muted-foreground prose-styling max-w-none">
                            {specialNotes.map((note, index) => (
                                <li key={`sn-${index}`} id={`specialnote-${index + 1}`} className="flex items-start gap-2">
                                    <a href={`#ref-specialnote-${index + 1}`} className="w-5 text-right font-bold text-red-600 dark:text-red-400 text-xs leading-snug pt-0.5 no-underline hover:underline">[* {index + 1}]</a>
                                    <span className="flex-1" dangerouslySetInnerHTML={{ __html: note }} />
                                </li>
                            ))}
                        </ol>
                    </div>
                )}
            </div>
        </div>
    );
}

export function ArticleRenderer({ blocks, hideNotes = false }: { blocks: ContentBlock[], hideNotes?: boolean }) {
    const POETIC_TYPES = ['shloka', 'sutra', 'padya', 'richa', 'mantra', 'upanishad'];
    
    return (
        <Transliterate>
            <div className="prose-content note-context">
                {blocks.map((block, index) => {
                    const prevBlock = index > 0 ? blocks[index - 1] : null;
                    const isCommentary = ALL_COMMENTARY_TYPES.includes(block.type);
                    const useTightSpacing = prevBlock && POETIC_TYPES.includes(block.type) && POETIC_TYPES.includes(prevBlock.type);

                    return (
                        <div key={block.id} className={useTightSpacing ? 'mt-2' : 'mt-6'}>
                            {isCommentary && <span role="separator" className="block my-4 h-px w-full bg-border" />}
                            {isCommentary && block.commentary && (
                                <h3 className="font-semibold text-xl mb-4 font-headline text-primary/80">
                                    {block.commentary.shortName}: {getTypeLabelById(block.type)}
                                </h3>
                            )}
                            <HtmlRenderer htmlString={block.sanskrit} />
                        </div>
                    );
                })}
                {!hideNotes && <ArticleNotes blocks={blocks} />}
            </div>
        </Transliterate>

        
    );
}
