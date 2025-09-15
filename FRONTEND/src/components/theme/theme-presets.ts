
import type { BookTheme } from '@/types';

export const THEME_PRESETS: BookTheme[] = [
    {
      bookId: 'preset-classic',
      themeName: 'Vaikhari Classic (Default)',
      styles: {
        body: {},
        h1: { fontSize: '2em', fontWeight: 'bold', fontFamily: 'Literata' },
        h2: { fontSize: '1.5em', fontWeight: 'bold', fontFamily: 'Literata' },
        h3: { fontSize: '1.17em', fontWeight: 'bold', fontFamily: 'Literata' },
        h4: { fontSize: '1em', fontWeight: 'bold', fontFamily: 'Literata' },
        h5: { fontSize: '0.83em', fontWeight: 'bold', fontFamily: 'Literata' },
        h6: { fontSize: '0.67em', fontWeight: 'bold', fontFamily: 'Literata' },
        paragraph: { fontSize: '1em', fontFamily: 'Inter' },
        sutra: { fontFamily: 'Adishila', color: 'hsl(var(--primary))', fontWeight: '600' },
        bhashya: { fontStyle: 'italic', color: 'hsl(var(--muted-foreground))', fontFamily: 'Inter' },
        teeka: { color: 'hsl(var(--secondary-foreground))', fontFamily: 'Inter' },
        citation: { color: 'hsl(var(--accent))' },
        quotation: { fontStyle: 'italic', color: 'hsl(var(--info))' },
        version: { backgroundColor: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' },
        footnote: { fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))' },
        note: { border: '1px dashed hsl(var(--destructive))', padding: '0.5rem', color: 'hsl(var(--destructive))' }
      }
    },
    {
      bookId: 'preset-monochrome',
      themeName: 'Minimalist Monochrome',
      styles: {
        body: { color: '#111111', backgroundColor: '#FFFFFF' },
        h1: { fontSize: '2.5em', fontWeight: '300', fontFamily: 'Literata', color: '#000000' },
        h2: { fontSize: '2em', fontWeight: '400', fontFamily: 'Literata', color: '#111111' },
        h3: { fontSize: '1.75em', fontWeight: '400', fontFamily: 'Literata', color: '#222222' },
        h4: { fontSize: '1.5em', fontWeight: '500', fontFamily: 'Literata', color: '#333333' },
        h5: { fontSize: '1.25em', fontWeight: '600', fontFamily: 'Literata', color: '#444444' },
        h6: { fontSize: '1em', fontWeight: '600', fontFamily: 'Literata', color: '#555555' },
        paragraph: { fontSize: '1.1em', fontFamily: 'Inter', color: '#333333', fontWeight: '400' },
        sutra: { fontFamily: 'Adishila', color: '#000000', fontWeight: '600' },
        bhashya: { fontStyle: 'italic', color: '#555555', fontFamily: 'Inter' },
        teeka: { color: '#666666', fontFamily: 'Inter' },
        citation: { color: '#000000', fontWeight: 'bold' },
        quotation: { fontStyle: 'italic', color: '#444444', borderLeft: '3px solid #000000' },
        version: { backgroundColor: '#DDDDDD', color: '#000000' },
        footnote: { fontSize: '0.9em', color: '#666666' },
        note: { border: '1px solid #000000', padding: '0.5rem', color: '#000000' }
      }
    },
    {
      bookId: 'preset-oceanic',
      themeName: 'Oceanic Sapphire',
      styles: {
        body: { color: '#E0E7FF', backgroundColor: '#0A192F' },
        h1: { fontSize: '2.8em', fontWeight: '700', fontFamily: 'Literata', color: '#64FFDA' },
        h2: { fontSize: '2.2em', fontWeight: '700', fontFamily: 'Literata', color: '#CCD6F6' },
        h3: { fontSize: '1.8em', fontWeight: '600', fontFamily: 'Literata', color: '#CCD6F6' },
        h4: { fontSize: '1.5em', fontWeight: '600', fontFamily: 'Literata', color: '#8892B0' },
        h5: { fontSize: '1.25em', fontWeight: '500', fontFamily: 'Literata', color: '#8892B0' },
        h6: { fontSize: '1em', fontWeight: '500', fontFamily: 'Literata', color: '#8892B0' },
        paragraph: { fontSize: '1.1em', fontFamily: 'Inter', color: '#A8B2D1' },
        sutra: { fontFamily: 'Adishila', color: '#64FFDA', fontWeight: 'bold' },
        bhashya: { fontStyle: 'italic', color: '#A8B2D1', fontFamily: 'Inter' },
        teeka: { color: '#8892B0', fontFamily: 'Inter' },
        citation: { color: '#64FFDA' },
        quotation: { fontStyle: 'italic', color: '#A8B2D1', borderLeft: '3px solid #64FFDA' },
        version: { backgroundColor: '#112240', color: '#64FFDA' },
        footnote: { fontSize: '0.9em', color: '#8892B0' },
        note: { border: '1px dashed #64FFDA', padding: '0.5rem', color: '#64FFDA' }
      }
    },
    {
      bookId: 'preset-clay',
      themeName: 'Earthy Clay',
      styles: {
        body: { color: '#3E2723', backgroundColor: '#F5F5DC' },
        h1: { fontSize: '2.5em', fontWeight: '900', fontFamily: 'Literata', color: 'linear-gradient(to right, #BF360C, #8D6E63)' },
        h2: { fontSize: '2em', fontWeight: '800', fontFamily: 'Literata', color: '#4E342E' },
        h3: { fontSize: '1.75em', fontWeight: '700', fontFamily: 'Literata', color: '#5D4037' },
        h4: { fontSize: '1.5em', fontWeight: '600', fontFamily: 'Literata', color: '#6D4C41' },
        h5: { fontSize: '1.25em', fontWeight: '600', fontFamily: 'Literata', color: '#795548' },
        h6: { fontSize: '1em', fontWeight: '600', fontFamily: 'Literata', color: '#795548' },
        paragraph: { fontSize: '1.1em', fontFamily: 'Inter', color: '#3E2723' },
        sutra: { fontFamily: 'Adishila', color: '#BF360C', fontWeight: 'bold' },
        bhashya: { fontStyle: 'italic', color: '#5D4037', fontFamily: 'Inter' },
        teeka: { color: '#6D4C41', fontFamily: 'Inter' },
        citation: { color: '#A1887F' },
        quotation: { fontStyle: 'italic', color: '#5D4037', borderLeft: '3px solid #A1887F' },
        version: { backgroundColor: '#D7CCC8', color: '#3E2723' },
        footnote: { fontSize: '0.9em', color: '#6D4C41' },
        note: { border: '1px dashed #BF360C', padding: '0.5rem', color: '#BF360C' }
      }
    },
    {
      bookId: 'preset-manuscript',
      themeName: 'Royal Manuscript',
      styles: {
        body: { color: '#4A148C', backgroundColor: '#FFF8E1' },
        h1: { fontSize: '2.6em', fontWeight: '700', fontFamily: 'Literata', color: '#6A1B9A' },
        h2: { fontSize: '2.1em', fontWeight: '700', fontFamily: 'Literata', color: '#7B1FA2' },
        h3: { fontSize: '1.8em', fontWeight: '600', fontFamily: 'Literata', color: '#8E24AA' },
        h4: { fontSize: '1.5em', fontWeight: '600', fontFamily: 'Literata', color: '#9C27B0' },
        h5: { fontSize: '1.2em', fontWeight: '600', fontFamily: 'Literata', color: '#AB47BC' },
        h6: { fontSize: '1em', fontWeight: '600', fontFamily: 'Literata', color: '#AB47BC' },
        paragraph: { fontSize: '1.1em', fontFamily: 'Inter', color: '#4A148C' },
        sutra: { fontFamily: 'Adishila', color: '#D5A100', fontWeight: 'bold' },
        bhashya: { fontStyle: 'italic', color: '#6A1B9A', fontFamily: 'Inter' },
        teeka: { color: '#8E24AA', fontFamily: 'Inter' },
        citation: { color: '#D5A100' },
        quotation: { fontStyle: 'italic', color: '#7B1FA2', borderLeft: '3px solid #D5A100' },
        version: { backgroundColor: '#F3E5F5', color: '#6A1B9A' },
        footnote: { fontSize: '0.9em', color: '#8E24AA' },
        note: { border: '1px dashed #D5A100', padding: '0.5rem', color: '#D5A100' }
      }
    },
     {
      bookId: 'preset-forest-sage',
      themeName: 'Forest Sage',
      styles: {
        body: { color: '#263238', backgroundColor: '#F1F8E9' },
        h1: { fontSize: '2.5em', fontWeight: '700', fontFamily: 'Literata', color: '#33691E' },
        h2: { fontSize: '2em', fontWeight: '700', fontFamily: 'Literata', color: '#558B2F' },
        h3: { fontSize: '1.75em', fontWeight: '600', fontFamily: 'Literata', color: '#689F38' },
        h4: { fontSize: '1.5em', fontWeight: '600', fontFamily: 'Literata', color: '#7CB342' },
        h5: { fontSize: '1.25em', fontWeight: '600', fontFamily: 'Literata', color: '#8BC34A' },
        h6: { fontSize: '1em', fontWeight: '600', fontFamily: 'Literata', color: '#8BC34A' },
        paragraph: { fontSize: '1.1em', fontFamily: 'Inter', color: '#37474F' },
        sutra: { fontFamily: 'Adishila', color: '#AFB42B', fontWeight: 'bold' },
        bhashya: { fontStyle: 'italic', color: '#558B2F', fontFamily: 'Inter' },
        teeka: { color: '#689F38', fontFamily: 'Inter' },
        citation: { color: '#AFB42B' },
        quotation: { fontStyle: 'italic', color: '#558B2F', borderLeft: '3px solid #AFB42B' },
        version: { backgroundColor: '#DCEDC8', color: '#558B2F' },
        footnote: { fontSize: '0.9em', color: '#689F38' },
        note: { border: '1px dashed #AFB42B', padding: '0.5rem', color: '#AFB42B' }
      }
    }
  ];
