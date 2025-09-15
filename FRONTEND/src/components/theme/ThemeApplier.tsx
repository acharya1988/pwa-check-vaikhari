
'use client';

import React from 'react';
import type { BookTheme, StyleProperty } from '@/types';

function generateCssRules(styles: BookTheme['styles'], scopeSelector: string, dynamicFontSize?: number): string {
    let css = ``;

    const applyStyles = (selector: string, style?: StyleProperty) => {
        if (!style) return '';

        let rule = `${scopeSelector} ${selector} {`;
        let hasProps = false;
        for (let [prop, value] of Object.entries(style)) {
            if (value) {
                const isParagraphFontSize = selector.includes('p') && prop === 'fontSize';
                
                // If we have a dynamic font size and we are styling the paragraph font size,
                // use the dynamic one instead of the one from the theme.
                if (isParagraphFontSize && dynamicFontSize) {
                    value = `${dynamicFontSize}px`;
                }

                 if (prop === 'color' && typeof value === 'string' && value.includes('gradient')) {
                    rule += `background: ${value} !important;`;
                    rule += `-webkit-background-clip: text !important; background-clip: text !important; color: transparent !important;`;
                } else if (prop === 'backgroundColor' && typeof value === 'string' && value.includes('gradient')) {
                    rule += `background-image: ${value} !important;`;
                }
                else {
                    const cssPropName = prop.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
                    rule += `${cssPropName}: ${value} !important;`;
                }
                hasProps = true;
            }
        }
        rule += `}\n`;
        return hasProps ? rule : '';
    };
    
    css += applyStyles('', styles.body); // Global styles for the container
    css += applyStyles('.prose-content h1', styles.h1);
    css += applyStyles('.prose-content h2', styles.h2);
    css += applyStyles('.prose-content h3', styles.h3);
    css += applyStyles('.prose-content h4', styles.h4);
    css += applyStyles('.prose-content h5', styles.h5);
    css += applyStyles('.prose-content h6', styles.h6);
    css += applyStyles('.prose-content p', styles.paragraph);
    css += applyStyles('[data-block-type="sutra"]', styles.sutra);
    css += applyStyles('[data-block-type="bhashya"]', styles.bhashya);
    css += applyStyles('[data-block-type="teeka"]', styles.teeka);
    css += applyStyles('.prose-content span[data-citation]', styles.citation);
    css += applyStyles('.prose-content blockquote', styles.quotation);
    css += applyStyles('.version-word', styles.version);
    css += applyStyles('.footnotes-list', styles.footnote);
    
    return css;
}


export function ThemeApplier({ theme, scopeToId, dynamicFontSize }: { theme: BookTheme, scopeToId?: string, dynamicFontSize?: number }) {
    const css = React.useMemo(() => {
        const scope = scopeToId ? `#${scopeToId}` : 'body';
        return generateCssRules(theme.styles, scope, dynamicFontSize);
    }, [theme, scopeToId, dynamicFontSize]);

    return (
        <style dangerouslySetInnerHTML={{ __html: css }} />
    );
}
