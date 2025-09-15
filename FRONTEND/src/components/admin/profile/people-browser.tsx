
'use client';

import React, { useState, useEffect, useRef, useActionState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Star, Building, Search, Plus, Book, FileText, FileSignature, Loader2, List, LayoutGrid, UserPlus, Users, Check } from 'lucide-react';
import type { UserProfile, Circle, Post } from '@/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { getAdministeredCircles } from '@/services/profile.service';
import { getUserProfile } from '@/services/user.service';
import { addUserToCircleAction, toggleFollowUser } from '@/actions/profile.actions';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import './people-card.css';

function FollowButton({ currentUser, targetUser, onFollowToggle }: { 
    currentUser: UserProfile, 
    targetUser: UserProfile, 
    onFollowToggle: () => void,
}) {
    const isFollowing = useMemo(() => currentUser.following?.includes(targetUser.email), [currentUser.following, targetUser.email]);
    const [state, formAction] = useActionState(toggleFollowUser, null);
    const { toast } = useToast();

    useEffect(() => {
        if (state?.success) {
            toast({ description: state.message });
            onFollowToggle();
        }
        if (state?.error) {
            toast({ variant: 'destructive', title: 'Error', description: state.error });
        }
    }, [state, toast, onFollowToggle]);

    return (
        <form action={formAction} className="w-full">
            <input type="hidden" name="targetUserId" value={targetUser.email} />
             <button type="submit" className={cn(
                "inline-flex items-center justify-center rounded-xl px-3 py-1.5 text-xs font-semibold transition border backdrop-blur w-full",
                isFollowing ? "bg-white/70 text-gray-900 border-white/60 hover:bg-white/80 dark:bg-gray-100/90 dark:text-gray-900 dark:border-gray-100/90" : "bg-transparent text-gray-900 border-gray-300 hover:bg-gray-50/60 dark:text-gray-100 dark:border-gray-600 dark:hover:bg-white/5"
            )}>
                {isFollowing ? 'Following' : 'Follow'}
            </button>
        </form>
    );
}

function AddToCircleButton({ user }: { user: UserProfile }) {
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

    const [inCircle, setInCircle] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                 <button className={cn(
                    "inline-flex items-center justify-center rounded-xl px-3 py-1.5 text-xs font-semibold shadow-sm transition border w-full",
                    inCircle ? "bg-white text-gray-900 border-gray-200 hover:bg-gray-50 dark:bg-gray-100 dark:text-gray-900" : "bg-gray-900 text-white border-gray-900 hover:opacity-90 dark:bg-white dark:text-gray-900 dark:border-white"
                )}>
                    {inCircle ? 'In my circle' : 'Add to my circle'}
                </button>
            </DialogTrigger>
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

function TabBar({ active, onChange }: { active: string, onChange: (tab: string) => void }) {
  const tabs = ["BOOKS", "Articles", "Followers", "Following"];
  return (
    <div className="flex items-center gap-3 text-[11px] font-semibold tracking-wider uppercase select-none">
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={cn(
              "relative transition px-0.5 after:content-[''] after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:rounded after:w-0 hover:after:w-full after:transition-all",
              active === t
                ? "text-gray-900 dark:text-gray-100 after:w-full after:bg-gray-900 dark:after:bg-gray-100"
                : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 after:bg-gray-400/60 dark:after:bg-gray-500/60"
            )}
          aria-pressed={active === t}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

function ActionButtons({ user, currentUser, onFollowToggle }: { 
    user: UserProfile,
    currentUser: UserProfile,
    onFollowToggle: () => void,
}) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-3">
      <AddToCircleButton user={user} />
      <FollowButton currentUser={currentUser} targetUser={user} onFollowToggle={onFollowToggle} />
    </div>
  );
}

function PersonCard({ user, currentUser, onFollowToggle }: {
    user: UserProfile,
    currentUser: UserProfile,
    onFollowToggle: () => void,
}) {
  const [activeTab, setActiveTab] = useState("Followers");
  const rating = user.stats?.rating ?? 0;
  const filledStars = Math.round(rating);
  
  const statMap = {
    BOOKS: user.stats?.bookCount || 0,
    Articles: (user.stats?.articlesPublished || 0) + (user.stats?.whitepapersPublished || 0),
    Followers: user.followers?.length || 0,
    Following: user.following?.length || 0,
  };

  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="group relative overflow-hidden rounded-2xl bg-white/80 dark:bg-zinc-900/80 shadow-xl ring-1 ring-black/5 dark:ring-white/10 backdrop-blur-xl"
    >
      <div className="relative h-28 w-full overflow-hidden">
        <Image
          src={user.coverUrl || 'https://placehold.co/400x200.png'}
          alt="cover"
          fill
          className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
          data-ai-hint="abstract background"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/0 to-black/30" />
      </div>

      <div className="relative px-5">
        <Image
          src={user.avatarUrl || 'https://placehold.co/128x128.png'}
          alt={user.name}
          width={64}
          height={64}
          className="-mt-8 h-16 w-16 rounded-2xl object-cover ring-4 ring-white dark:ring-zinc-900 shadow-md"
          data-ai-hint="person avatar"
        />
      </div>

      <div className="px-5 pb-5 pt-3">
        <div className="mb-3">
             <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 leading-tight">
              <Link href={`/admin/profile/${encodeURIComponent(user.email)}`}>{user.name}</Link>
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {user.tagline || user.currentRole || 'Scholar'}
            </p>
             <div className="flex items-center gap-1 mt-1">
                {[...Array(5)].map((_, i) => (
                    <Star key={i} className={cn('h-3 w-3', i < filledStars ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-600')} />
                ))}
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">{rating.toFixed(1)}</span>
            </div>
        </div>

        <div className="flex items-baseline justify-between gap-4">
            <TabBar active={activeTab} onChange={(t) => setActiveTab(t)} />
             <div className="text-right">
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {statMap[activeTab as keyof typeof statMap].toLocaleString("en-IN")}
                </div>
            </div>
        </div>

        <p className="mt-3 line-clamp-3 text-sm text-gray-600 dark:text-gray-300">
          {user.bio}
        </p>

        <ActionButtons user={user} currentUser={currentUser} onFollowToggle={onFollowToggle} />
      </div>
    </motion.article>
  );
}

export function PeopleBrowser({ 
    allUsers, 
    currentUser, 
    currentUserCircles,
    onDataNeeded 
}: { 
    allUsers: UserProfile[], 
    currentUser: UserProfile,
    currentUserCircles: Circle[],
    onDataNeeded: () => void,
}) {
    const [searchQuery, setSearchQuery] = useState('');
    
    const filteredUsers = allUsers.filter(user => 
        (user.email !== currentUser?.email) &&
        (
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (user.tagline || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (user.bio || '').toLowerCase().includes(searchQuery.toLowerCase())
        )
    );
    
    return (
        <div className="w-full bg-gradient-to-b from-white to-gray-50 dark:from-zinc-950 dark:to-zinc-900 px-4 py-10">
          <div className="mx-auto max-w-7xl">
            <header className="mb-8 flex items-end justify-between gap-4">
               <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
                  People Browser
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Discover scholars, vaidyas, and contributors.
                </p>
              </div>
            </header>

            <div className="relative mb-8">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input 
                placeholder="Search by name, title, or bio..." 
                className="pl-12 h-12 rounded-full text-base" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {filteredUsers.length > 0 ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredUsers.map(user => (
                        <PersonCard key={user.email} user={user} currentUser={currentUser} onFollowToggle={onDataNeeded}/>
                    ))}
                </div>
             ) : (
                 <div className="text-center py-12 text-muted-foreground">
                    <p>No users found matching your search.</p>
                </div>
             )}
          </div>
        </div>
    );
}
