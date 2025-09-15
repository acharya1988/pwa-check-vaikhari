
import { getStandaloneArticles } from "@/services/standalone-article.service";
import type { StandaloneArticle } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wind } from "lucide-react";
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

function StandaloneArticleCard({ article }: { article: StandaloneArticle }) {
    const snippet = article.content.replace(/<[^>]+>/g, '').substring(0, 150);
    return (
        <Card>
            <CardHeader>
                <CardTitle>{article.title}</CardTitle>
                <CardDescription>
                    {article.type.charAt(0).toUpperCase() + article.type.slice(1)} - Created {formatDistanceToNow(new Date(article.createdAt), { addSuffix: true })}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">{snippet}...</p>
            </CardContent>
            <CardFooter>
                 <Button asChild>
                    <Link href={`/admin/articles/edit/${article.id}?from=/drift`}>View & Edit</Link>
                </Button>
            </CardFooter>
        </Card>
    );
}

export default async function DriftStreamPage() {
    const articles = await getStandaloneArticles();
    // sort by most recent
    const sortedArticles = articles.sort((a,b) => b.createdAt - a.createdAt);

    return (
        <div className="container mx-auto max-w-2xl py-8">
            <h1 className="text-3xl font-bold mb-6">Drift Stream</h1>
            
            {sortedArticles.length > 0 ? (
                <div className="space-y-6">
                    {sortedArticles.map(article => (
                        <StandaloneArticleCard key={article.id} article={article} />
                    ))}
                </div>
            ) : (
                <Card className="text-center">
                    <CardHeader>
                        <div className="mx-auto bg-muted rounded-full p-4 w-fit">
                            <Wind className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <CardTitle className="mt-4">Drift Stream is Clear</CardTitle>
                        <CardDescription>
                            No articles have been "drifted" from the main corpus yet.
                            Start a drift from a block in the Living Document reader to see it here.
                        </CardDescription>
                    </CardHeader>
                </Card>
            )}
        </div>
    );
}
