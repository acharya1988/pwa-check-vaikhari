
'use client';

import React, { useState, useEffect } from 'react';
import type { ContentBlock, Citation as CitationType } from '@/types';
import { getCitationByRefId } from '@/services/citation.service';
import { Badge } from '@/components/ui/badge';

function CitationListItem({ refId }: { refId: string }) {
    const [citation, setCitation] = React.useState<CitationType | null>(null);

    React.useEffect(() => {
        getCitationByRefId(refId).then(setCitation);
    }, [refId]);

    if (!citation) {
        return <li className="text-sm text-muted-foreground">Loading {refId}...</li>;
    }

    return (
        <li className="text-sm text-muted-foreground flex items-center gap-2">
            <Badge variant="outline">{citation.refId}</Badge>
            <span>{citation.source}, {citation.location}</span>
        </li>
    );
}

export function EditorNotesDisplay({ blocks }: { blocks: Partial<ContentBlock>[] }) {
    const [notes, setNotes] = useState<{
        footnotes: string[];
        specialnotes: string[];
        citations: string[];
    }>({ footnotes: [], specialnotes: [], citations: [] });

    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!isMounted || typeof window === 'undefined') return;

        const allFootnotes: string[] = [];
        const allSpecialnotes: string[] = [];
        const allCitations = new Set<string>();
        const parser = new DOMParser();

        const combinedHtml = blocks.map(b => b?.sanskrit || '').join('');
        if (!combinedHtml) {
            setNotes({ footnotes: [], specialnotes: [], citations: [] });
            return;
        }

        const doc = parser.parseFromString(`<div>${combinedHtml}</div>`, 'text/html');

        doc.querySelectorAll('sup[data-type="footnote"]').forEach(el => {
            const content = el.getAttribute('data-content');
            if (content) allFootnotes.push(content);
        });
        doc.querySelectorAll('sup[data-type="specialnote"]').forEach(el => {
            const content = el.getAttribute('data-content');
            if (content) allSpecialnotes.push(content);
        });
        doc.querySelectorAll('span[data-citation="true"]').forEach(el => {
            const refId = el.getAttribute('data-ref-id');
            if (refId) allCitations.add(refId);
        });

        setNotes({
            footnotes: allFootnotes,
            specialnotes: allSpecialnotes,
            citations: Array.from(allCitations).sort(),
        });
    }, [blocks, isMounted]);

    const { footnotes, specialnotes, citations } = notes;
    const hasFootnotes = footnotes.length > 0;
    const hasSpecialNotes = specialnotes.length > 0;
    const hasCitations = citations.length > 0;

    if (!hasFootnotes && !hasSpecialNotes && !hasCitations) return null;

    return (
        <div className="mt-8 pt-6 border-t bg-background p-4 sm:p-6 rounded-b-lg space-y-6">
            <div className="footnotes-container">
                {hasFootnotes && (
                    <div className="space-y-2 md:border-r md:pr-8">
                        <h4 className="font-semibold text-lg text-blue-600 dark:text-blue-400">Footnotes</h4>
                        <ol className="footnotes-list space-y-2 text-sm text-muted-foreground prose-styling max-w-none">
                            {footnotes.map((note, index) => (
                                <li key={`fn-${index}`} className="flex items-start gap-2">
                                    <span className="w-5 text-right font-bold text-blue-600 dark:text-blue-400 text-[11px] leading-snug pt-0.5">{index + 1}.</span>
                                    <span className="flex-1" dangerouslySetInnerHTML={{ __html: note }} />
                                </li>
                            ))}
                        </ol>
                    </div>
                )}

                {hasSpecialNotes && (
                    <div className="space-y-2">
                        <h4 className="font-semibold text-lg text-red-600 dark:text-red-400">Special Notes</h4>
                        <ol className="footnotes-list space-y-2 text-sm text-muted-foreground prose-styling max-w-none">
                            {specialnotes.map((note, index) => (
                                <li key={`sn-${index}`} className="flex items-start gap-2">
                                    <span className="w-5 text-right font-bold text-red-600 dark:text-red-400 text-[11px] leading-snug pt-0.5">[* {index + 1}]</span>
                                    <span className="flex-1" dangerouslySetInnerHTML={{ __html: note }} />
                                </li>
                            ))}
                        </ol>
                    </div>
                )}
            </div>

            {hasCitations && (
                <div>
                    <h4 className="font-semibold text-lg text-purple-600 dark:text-purple-400">Citations in this Article</h4>
                    <ul className="list-none mt-2 space-y-1">
                        {citations.map(refId => <CitationListItem key={refId} refId={refId} />)}
                    </ul>
                </div>
            )}
        </div>
    );
}
