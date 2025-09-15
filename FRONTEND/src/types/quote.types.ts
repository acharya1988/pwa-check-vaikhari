
export interface Quote {
    id: string;
    title: string;
    quote: string;
    author: string;
}

export interface QuoteCategory {
    id: string;
    name: string;
    quotes: Quote[];
}
