
import { getLayersForUser } from '@/services/layer.service';
import { getUserProfile } from '@/services/user.service';
import type { LayerAnnotation } from '@/types';
import { MyLayersClient } from './my-layers-client';


interface GroupedLayers {
    [bookId: string]: {
        bookName: string;
        chapters: {
            [chapterId: string]: {
                chapterName: string;
                articles: {
                    [verse: string]: {
                        articleTitle: string;
                        layers: LayerAnnotation[];
                    }
                }
            }
        }
    }
}

export default async function MyLayersPage() {
    const user = await getUserProfile();
    const layers = await getLayersForUser(user.email);

    const groupedLayers = layers.reduce((acc, layer) => {
        const { bookId, bookName, chapterId, chapterName, verse, articleTitle } = layer;

        if (!acc[bookId]) {
            acc[bookId] = { bookName, chapters: {} };
        }
        const bookEntry = acc[bookId];

        if (!bookEntry.chapters[chapterId]) {
            bookEntry.chapters[chapterId] = { chapterName, articles: {} };
        }
        const chapterEntry = bookEntry.chapters[chapterId];
        
        const verseKey = String(verse);
        if (!chapterEntry.articles[verseKey]) {
            chapterEntry.articles[verseKey] = { articleTitle, layers: [] };
        }
        const articleEntry = chapterEntry.articles[verseKey];

        articleEntry.layers.push(layer);

        return acc;
    }, {} as GroupedLayers);

    return (
        <MyLayersClient groupedLayers={groupedLayers} totalLayers={layers.length} />
    );
}
