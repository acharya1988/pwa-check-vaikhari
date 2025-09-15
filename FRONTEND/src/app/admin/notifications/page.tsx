
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bell } from "lucide-react";

export default function NotificationsPage() {
    return (
        <div className="container mx-auto max-w-2xl py-8">
            <h1 className="text-3xl font-bold mb-6">Notifications</h1>
            <Card className="text-center">
                <CardHeader>
                    <div className="mx-auto bg-muted rounded-full p-4 w-fit">
                        <Bell className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <CardTitle className="mt-4">Notifications</CardTitle>
                    <CardDescription>
                        This feature is coming soon. Your recent notifications and alerts will appear here.
                    </CardDescription>
                </CardHeader>
            </Card>
        </div>
    );
}
