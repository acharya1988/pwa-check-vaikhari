
import { getBooksGroupedByGenre, getFullBookHierarchy } from "@/services/book.service";
import { BookFormDialog, CreateBookCategoryDialog } from "@/components/admin/profile-forms";
import { Button } from "@/components/ui/button";
import { PlusCircle, Plus, UploadCloud } from "lucide-react";
import { BookBrowser } from "@/components/admin/book-browser";
import Link from 'next/link';

export default async function BooksPage() {
    const [books, hierarchy] = await Promise.all([
        getBooksGroupedByGenre(),
        getFullBookHierarchy()
    ]);
    
    const allCategories = hierarchy.flatMap(g => g.categories);
    const allBooksStandalone = books.flatMap(g => g.standaloneBooks);

    return (
        <div className="space-y-8 min-h-[calc(100vh-10rem)]">
            <div className="flex items-center justify-between flex-wrap gap-4">
                 <h1 className="text-3xl font-bold">Manage Books</h1>
                <div className="flex gap-2 flex-wrap">
                    <Link href="/admin/import" passHref>
                        <Button variant="outline">
                            <UploadCloud className="mr-2 h-4 w-4" />
                            Bulk Import
                        </Button>
                    </Link>
                     <CreateBookCategoryDialog genres={hierarchy}>
                         <Button variant="outline">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            New Category
                        </Button>
                    </CreateBookCategoryDialog>
                </div>
            </div>
            
            <BookBrowser 
                allBooksByGenre={books}
                hierarchy={hierarchy}
            />
            
             <BookFormDialog 
                trigger={
                    <Button
                        size="icon"
                        className="fixed z-10 bottom-8 right-8 h-16 w-16 rounded-full shadow-lg"
                        aria-label="Create new work"
                    >
                        <Plus className="h-8 w-8" />
                    </Button>
                }
                categories={allCategories}
            />
        </div>
    )
}
