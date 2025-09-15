import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export default function GlowFeedPage() {
    return (
        <div className="container mx-auto max-w-2xl py-8">
            <h1 className="text-3xl font-bold mb-6">Glow Feed</h1>
            <Card className="text-center">
                <CardHeader>
                    <div className="mx-auto bg-muted rounded-full p-4 w-fit">
                        <Sparkles className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <CardTitle className="mt-4">Glow Feed</CardTitle>
                    <CardDescription>
                        This feature is coming soon. Discover the most insightful content highlighted by scholars across Vaikhari.
                    </CardDescription>
                </CardHeader>
            </Card>
        </div>
    );
}
