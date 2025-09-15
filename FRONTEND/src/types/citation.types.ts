
export interface Citation {
    id: string; // Unique document ID from Firestore
    refId: string;
    keywords: string[];
    sanskrit: string;
    translation: string;
    source: string;
    location: string;
}

export interface CitationCategory {
    id: string;
    name: string;
    citations: Citation[];
}
