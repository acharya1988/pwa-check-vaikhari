
import { getQuoteData } from "@/services/quote.service";
import { CreateQuoteCategoryDialog, CreateQuoteDialog } from "@/components/admin/quote-forms";
import { Button } from "@/components/ui/button";
import { PlusCircle, Plus, Upload } from "lucide-react";
import { QuoteBrowser } from "@/components/admin/quote-browser";
import Link from "next/link";

export default async function QuotesPage() {
    const groupedQuotes = await getQuoteData();
    const totalQuotes = groupedQuotes.reduce((acc, group) => acc + group.quotes.length, 0);

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <h1 className="text-3xl font-bold">Manage Quotes</h1>
                <div className="flex gap-2 flex-wrap">
                    <CreateQuoteCategoryDialog>
                        <Button variant="outline">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            New Category
                        </Button>
                    </CreateQuoteCategoryDialog>
                </div>
            </div>
            
            <QuoteBrowser groupedQuotes={groupedQuotes} totalQuotes={totalQuotes} />

            <CreateQuoteDialog categories={groupedQuotes}>
                <Button
                    size="icon"
                    className="fixed z-10 bottom-8 right-8 h-16 w-16 rounded-full shadow-lg bg-blue-flame"
                    aria-label="Create new quote"
                >
                    <Plus className="h-8 w-8" />
                </Button>
            </CreateQuoteDialog>
        </div>
    )
}
