
'use client';

import React, { useState, useEffect, useRef, useActionState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Star, Building, Search, Plus, Book, FileText, FileSignature, Loader2 } from 'lucide-react';
import type { UserProfile, Circle } from '@/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { getAdministeredCircles } from '@/services/profile.service';
import { getUserProfile } from '@/services/user.service';
import { addUserToCircleAction } from '@/actions/profile.actions';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

function AddToCircleDialog({ user, trigger }: { user: UserProfile, trigger: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const [circles, setCircles] = useState<Circle[]>([]);
    const [state, formAction] = useActionState(addUserToCircleAction, null);
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);
    const [isLoadingCircles, setIsLoadingCircles] = useState(false);

    useEffect(() => {
        if (open) {
            setIsLoadingCircles(true);
            getUserProfile().then(currentUser => {
                if (currentUser) {
                    getAdministeredCircles(currentUser.email).then(setCircles).finally(() => setIsLoadingCircles(false));
                }
            })
        }
    }, [open]);
    
    useEffect(() => {
        if (state?.success) {
            toast({ title: "Success!", description: state.message });
            setOpen(false);
            formRef.current?.reset();
        }
        if (state?.error) {
            toast({ variant: 'destructive', title: "Error", description: state.error });
        }
    }, [state, toast]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add {user.name} to a Circle</DialogTitle>
                    <DialogDescription>Select a circle and assign a role to this user.</DialogDescription>
                </DialogHeader>
                <form ref={formRef} action={formAction} className="space-y-4">
                    <input type="hidden" name="userId" value={user.email} />
                    <input type="hidden" name="userName" value={user.name} />
                    <input type="hidden" name="userAvatarUrl" value={user.avatarUrl} />
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="circleId">Select Circle</Label>
                            <Select name="circleId" required>
                                <SelectTrigger id="circleId">
                                    <SelectValue placeholder={isLoadingCircles ? "Loading..." : "Choose a circle..."} />
                                </SelectTrigger>
                                <SelectContent>
                                    {circles.length > 0 ? (
                                        circles.map(circle => (
                                            <SelectItem key={circle.id} value={circle.id}>{circle.name}</SelectItem>
                                        ))
                                    ) : (
                                        <div className="p-4 text-center text-sm text-muted-foreground">No circles found.</div>
                                    )}
                                </SelectContent>
                            </Select>
                            {state?.fieldErrors?.circleId && <p className="text-sm text-destructive mt-1">{state.fieldErrors.circleId[0]}</p>}
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="role">Assign Role</Label>
                            <Select name="role" required defaultValue="reader">
                                <SelectTrigger id="role">
                                    <SelectValue placeholder="Choose a role..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="reader">Reader</SelectItem>
                                    <SelectItem value="contributor">Contributor</SelectItem>
                                </SelectContent>
                            </Select>
                             {state?.fieldErrors?.role && <p className="text-sm text-destructive mt-1">{state.fieldErrors.role[0]}</p>}
                        </div>
                    </div>

                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
                        <Button type="submit">Add to Circle</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function PersonCard({ user }: { user: UserProfile }) {
    const rating = user.stats.rating ?? 0;
    const filledStars = Math.round(rating);

    return (
        <Card className="flex flex-col hover:shadow-lg transition-shadow">
            <Link href={`/profile/${encodeURIComponent(user.email)}`}>
                <CardHeader className="flex flex-row items-center gap-4">
                    <Image src={user?.avatarUrl} alt={user.name} width={64} height={64} className="w-16 h-16 rounded-full border" data-ai-hint="person avatar" />
                    <div className="flex-1">
                        <CardTitle>{user.name}</CardTitle>
                        <div className="flex items-center gap-1 mt-1">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} className={cn('h-4 w-4', i < filledStars ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30')} />
                            ))}
                            <span className="text-xs text-muted-foreground ml-1">{rating.toFixed(1)}</span>
                        </div>
                    </div>
                </CardHeader>
            </Link>
            <CardContent className="flex-grow space-y-3">
                <div className="text-sm text-muted-foreground grid grid-cols-3 gap-2 text-center">
                    <div className="border rounded-md p-2">
                        <Book className="h-5 w-5 mx-auto mb-1" />
                        <span className="font-bold block text-foreground">{user.stats.bookCount || 0}</span>
                        <span>Books</span>
                    </div>
                    <div className="border rounded-md p-2">
                        <FileText className="h-5 w-5 mx-auto mb-1" />
                        <span className="font-bold block text-foreground">{user.stats.articlesPublished || 0}</span>
                        <span>Articles</span>
                    </div>
                     <div className="border rounded-md p-2">
                        <FileSignature className="h-5 w-5 mx-auto mb-1" />
                        <span className="font-bold block text-foreground">{user.stats.whitepapersPublished || 0}</span>
                        <span>Papers</span>
                    </div>
                </div>
                 {user.organizations && user.organizations.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                        {user.organizations.map(org => (
                            <Badge key={org} variant="secondary" className="gap-1.5"><Building className="h-3 w-3" /> {org}</Badge>
                        ))}
                    </div>
                 )}
            </CardContent>
            <CardFooter>
                 <AddToCircleDialog user={user} trigger={
                    <Button className="w-full">
                        <Plus className="mr-2 h-4 w-4" /> Add to Circle
                    </Button>
                }/>
            </CardFooter>
        </Card>
    );
}

export function PeopleBrowser({ users }: { users: UserProfile[] }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    const filteredUsers = users.filter(user => 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.organizations || []).some(org => org.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="space-y-6">
            <Card>
                 <CardHeader>
                    <CardTitle>Find People</CardTitle>
                    <CardDescription>Discover other scholars and contributors in the VAIKHARI ecosystem.</CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input 
                            placeholder="Search by name or organization..." 
                            className="pl-10" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredUsers.map(user => (
                    <PersonCard key={user.email} user={user} />
                ))}
            </div>
            {filteredUsers.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    <p>No people found matching your search.</p>
                </div>
            )}
        </div>
    );
}
