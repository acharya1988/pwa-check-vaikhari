
'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, MoreVertical, Bookmark, Trash2, Pencil } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { ChintanaThread } from '@/types';
import { SocialContentRenderer } from '@/components/social/social-content-renderer';
import { ChintanaReactionButtons } from '@/components/social/chintana-reaction-buttons';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

export function ChintanaThreadListItem({ thread }: { thread: ChintanaThread }) {
    const postCount = thread.posts.reduce((acc, post) => acc + 1 + (post.replies?.length || 0), 0);
    const initialPost = thread.posts[0];
    
    return (
        <Card className="relative hover:shadow-md transition-shadow">
             <div className="absolute top-2 right-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem>
                            <Bookmark className="mr-2 h-4 w-4" /> Save for Later
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
             <CardHeader className="p-4">
                <div className="flex items-start gap-3">
                    <Avatar>
                        <AvatarImage src={thread.author.avatarUrl} alt={thread.author.name} />
                        <AvatarFallback>{thread.author.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <p className="font-semibold">{thread.author.name}</p>
                        <small className="text-muted-foreground">Updated {formatDistanceToNow(new Date(thread.updatedAt), { addSuffix: true })}</small>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <Link href={`/admin/chintana/${thread.id}`} className="block w-full">
                    <h3 className="font-bold hover:underline">{thread.title}</h3>
                </Link>
                <div className="flex items-center gap-2 mt-2">
                    {thread.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                </div>
                 <div className="mt-2 text-sm text-muted-foreground line-clamp-3">
                    <SocialContentRenderer htmlString={initialPost.content} />
                </div>
            </CardContent>
            <CardFooter className="p-4 pt-0 flex justify-between">
                 <div className="flex items-center gap-2">
                    <ChintanaReactionButtons threadId={thread.id} postId={initialPost.id} reactions={initialPost.reactions} />
                </div>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                             <Button asChild variant="ghost" size="sm">
                                <Link href={`/admin/chintana/${thread.id}`}>
                                    <MessageSquare className="mr-2 h-4 w-4" />
                                    {postCount} {postCount === 1 ? 'post' : 'posts'}
                                </Link>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>View Full Discussion</p></TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </CardFooter>
        </Card>
    );
}
