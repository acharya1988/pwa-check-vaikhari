

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';

export function ArticleTocDisplay({ contentHtml, onClose, onHighlight }: { 
    contentHtml: string; 
    onClose?: () => void; 
    onHighlight?: (id: string) => void;
}) {
    const [toc, setToc] = React.useState<any[]>([]);
    
    React.useEffect(() => {
        if (typeof window === 'undefined') return;
        const parser = new DOMParser();
        const doc = parser.parseFromString(`<div>${contentHtml}</div>`, 'text/html');
        const nodes = doc.querySelectorAll('h1, h2, h3, h4, h5, h6, span[data-toc-mark]');
        const newToc: any[] = [];
        let markCounter = 0;

        nodes.forEach(node => {
            const element = node as HTMLElement;
            if (element.tagName.startsWith('H')) {
                 newToc.push({
                    id: element.id,
                    level: parseInt(element.tagName.substring(1), 10),
                    text: element.textContent || '',
                    isMark: false,
                });
            } else if (element.hasAttribute('data-toc-mark')) {
                const id = `mark-${markCounter++}`;
                newToc.push({
                    id: id,
                    level: 7,
                    text: element.textContent || '',
                    isMark: true,
                    markId: id,
                });
                element.setAttribute('id', id);
            }
        });
        setToc(newToc);
    }, [contentHtml]);

    const handleScroll = (id: string) => {
        onClose?.();
        if(onHighlight) {
            onHighlight(id);
        } else {
            const contentArea = document.querySelector('.printable-content, .article-reader-body');
            const element = contentArea?.querySelector(`#${id}`);
            element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    if (toc.length === 0) {
        return <p className="text-sm text-muted-foreground p-4 text-center">No headings or marked entries in this article.</p>;
    }

    return (
        <div className="p-2 space-y-2">
            <h4 className="font-semibold px-2">Table of Contents</h4>
            <ul className="space-y-1">
                {toc.map((item, index) => (
                    <li key={`${item.id}-${index}`} style={{ paddingLeft: `${(item.isMark ? item.level-6 : item.level - 1) * 1}rem` }}>
                        <Button 
                            variant="ghost"
                            size="sm"
                            onClick={() => handleScroll(item.id)}
                            className="text-left justify-start h-auto py-1 text-muted-foreground hover:text-primary w-full text-ellipsis overflow-hidden whitespace-nowrap"
                            title={item.text}
                        >
                           {item.text}
                        </Button>
                    </li>
                ))}
            </ul>
        </div>
    );
};
