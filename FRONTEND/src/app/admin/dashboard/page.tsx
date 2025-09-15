
'use client';

import { getDashboardStats } from "@/services/dashboard.service";
import type { DashboardStats } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  BookOpen,
  FileText,
  Quote,
  Bookmark,
  MessageSquare,
  Book,
  ThumbsUp,
  ThumbsDown,
  BrainCircuit,
  MessageCircle,
} from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { formatDistanceToNow } from 'date-fns';
import Link from "next/link";
import React, { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { LoadingAnimation } from "@/components/loading-animation";


function DashboardSkeleton() {
    return <LoadingAnimation />;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getDashboardStats().then(data => {
        setStats(data);
        setIsLoading(false);
    });
  }, []);
  
  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  const gridCards = useMemo(() => {
    if (!stats) return [];
        
    return [
        { id: "totalBooks", title: "My Books", icon: Book, value: stats.totalBooks },
        { id: "publishedArticles", title: "My Published Articles", icon: FileText, value: stats.publishedArticles },
        { id: "totalCitations", title: "Total Citations", icon: Quote, value: stats.totalCitations },
        { id: "totalBookmarks", title: "My Bookmarks", icon: Bookmark, value: stats.totalBookmarks },
        { id: "likes", title: "Total Likes on my Work", icon: ThumbsUp, value: stats.engagementStats.likes },
        { id: "dislikes", title: "Total Dislikes on my Work", icon: ThumbsDown, value: stats.engagementStats.dislikes },
        { id: "totalComments", title: "Total Comments on my Work", icon: MessageSquare, value: stats.engagementStats.totalComments },
        { id: "totalChintanaThreads", title: "My Chintana Threads", icon: BrainCircuit, value: stats.totalChintanaThreads },
        { id: "totalChintanaPosts", title: "My Chintana Posts", icon: MessageCircle, value: stats.totalChintanaPosts },
    ];
  }, [stats]);


  if (isLoading || !stats) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
             <h1 className="text-3xl font-bold">Dashboard</h1>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {gridCards.slice(0, 4).map(card => (
                 <Card key={card.id}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                        <card.icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{card.value}</div>
                    </CardContent>
                </Card>
            ))}
        </div>
        
        <div className="grid gap-4 grid-cols-1 xl:grid-cols-3">
             <Card className="xl:col-span-2">
                <CardHeader>
                    <CardTitle>Recent Comments on My Work</CardTitle>
                    <CardDescription>The latest discussions happening across your content.</CardDescription>
                </CardHeader>
                <CardContent>
                    {stats.recentComments.length > 0 ? (
                        <Table>
                        <TableHeader><TableRow><TableHead>Comment</TableHead><TableHead>Article</TableHead><TableHead className="text-right">Time</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {stats.recentComments.map(comment => (
                            <TableRow key={comment.id}>
                                <TableCell className="font-medium truncate max-w-xs">"{comment.body}"</TableCell>
                                <TableCell>
                                    <Link href={`/articles/${comment.bookId}/${comment.chapterId}/${comment.articleVerse}`} className="hover:underline text-primary">
                                        {comment.articleTitle}
                                    </Link>
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground text-xs">
                                    {formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}
                                </TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                        </Table>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center p-8">No recent comments on your articles.</p>
                    )}
                </CardContent>
            </Card>
            
            <div className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Comment Topics</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {stats.engagementStats.commentReasonCounts.length > 0 ? (
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                <Pie
                                    data={stats.engagementStats.commentReasonCounts}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {stats.engagementStats.commentReasonCounts.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                             <p className="text-sm text-muted-foreground text-center p-8">No comment data available.</p>
                        )}
                    </CardContent>
                </Card>
                <Card>
                     <CardHeader>
                        <CardTitle>Engagement Stats</CardTitle>
                    </CardHeader>
                     <CardContent className="grid grid-cols-2 gap-4">
                          {gridCards.slice(4, 7).map(card => (
                            <div key={card.id} className="p-2 rounded-lg border">
                                <div className="flex items-center gap-2">
                                     <card.icon className="h-5 w-5 text-muted-foreground" />
                                    <div className="text-xl font-bold">{card.value}</div>
                                </div>
                                <p className="text-xs text-muted-foreground">{card.title}</p>
                            </div>
                        ))}
                     </CardContent>
                </Card>
                 <Card>
                     <CardHeader>
                        <CardTitle>Chintana Stats</CardTitle>
                    </CardHeader>
                     <CardContent className="grid grid-cols-2 gap-4">
                          {gridCards.slice(7).map(card => (
                            <div key={card.id} className="p-2 rounded-lg border">
                                <div className="flex items-center gap-2">
                                     <card.icon className="h-5 w-5 text-muted-foreground" />
                                    <div className="text-xl font-bold">{card.value}</div>
                                </div>
                                <p className="text-xs text-muted-foreground">{card.title}</p>
                            </div>
                        ))}
                     </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}
