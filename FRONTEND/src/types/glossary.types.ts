
export interface GlossaryTerm {
    id: string;
    term: string;
    transliteration: string;
    definition: string;
}

export interface GlossaryCategory {
    id: string;
    name: string;
    scope: 'global' | 'local';
    colorTheme: 'saffron' | 'blue' | 'green' | 'gray';
    terms: GlossaryTerm[];
}
