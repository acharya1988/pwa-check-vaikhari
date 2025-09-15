
'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bookmark as BookmarkIcon, Star, Users, Building, Camera, Library, BadgeCheck, UserSearch, ArrowRight } from 'lucide-react';
import type { UserProfile as UserProfileType, Bookmark, BookWithStats, Circle, Post, StandaloneArticle, LayerAnnotation } from '@/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { UserCircles } from '@/components/admin/profile/user-circles';
import { UserWorks } from '@/components/admin/profile/user-works';
import { Wall } from '@/components/social/wall';
import { PeopleBrowser } from '@/components/admin/profile/people-browser';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { MobileNav } from '@/app/admin/profile/mobile-nav';
import { ProfileActionsClient } from './profile-actions-client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { UserWithExclamationIcon, VerifiedBadgeIcon, PendingVerificationIcon } from '@/components/icons';
import { UserAbout } from '@/components/admin/profile/user-about';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { MediaUploader } from '@/components/admin/media-uploader';
import { getMediaFiles } from '@/services/media.service';
import { updateProfileImage } from '@/actions/profile.actions';
import { useActionState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Check } from 'lucide-react';
import { getFollowers, getFollowing } from '@/services/user.service';
import { Progress } from '@/components/ui/progress';

// A new component for the cover image adjustment UI
function CoverPhotoAdjuster({
    imageUrl,
    onSave,
    onCancel,
}: {
    imageUrl: string;
    onSave: (position: string) => void;
    onCancel: () => void;
}) {
    const [position, setPosition] = useState(50); // Vertical position in %
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef({ y: 0, startPosition: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
        dragStartRef.current = { y: e.clientY, startPosition: position };
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isDragging || !containerRef.current) return;
        const deltaY = e.clientY - dragStartRef.current.y;
        
        const sensitivityFactor = 50 / containerRef.current.offsetHeight;
        const positionChange = deltaY * sensitivityFactor;
        
        let newPosition = dragStartRef.current.startPosition + positionChange;
        newPosition = Math.max(0, Math.min(100, newPosition));
        
        setPosition(newPosition);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };
    
    const handleSaveClick = () => {
        onSave(`50% ${position.toFixed(2)}%`);
    };

    return (
        <div className="flex flex-col h-full">
            <div className="p-6 pt-0 space-y-2">
                <h4 className="font-semibold text-sm">Adjust Cover Photo</h4>
                <p className="text-xs text-muted-foreground">Click and drag the image vertically to reposition it.</p>
            </div>
            <div 
                ref={containerRef}
                className="relative aspect-[16/9] w-full overflow-hidden bg-muted rounded-lg cursor-grab active:cursor-grabbing mx-6"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <Image 
                    src={imageUrl} 
                    alt="Cover preview" 
                    fill 
                    className="object-cover pointer-events-none" 
                    style={{ objectPosition: `50% ${position}%`}} 
                    priority
                />
            </div>
            <div className="mt-auto p-6 border-t flex justify-between items-center">
                <Button type="button" variant="ghost" onClick={onCancel}>Back to Library</Button>
                <Button type="button" onClick={handleSaveClick}>Save Position</Button>
            </div>
        </div>
    );
}

function ProfileImageUpdater({ 
    children, 
    imageType 
}: { 
    children: React.ReactNode; 
    imageType: 'avatar' | 'cover';
}) {
    const [open, setOpen] = useState(false);
    const [mediaFiles, setMediaFiles] = useState<string[]>([]);
    const [view, setView] = useState<'library' | 'adjust'>('library');
    const [imageToAdjust, setImageToAdjust] = useState<string | null>(null);

    const [state, formAction] = useActionState(updateProfileImage, null);
    const { toast } = useToast();
    const router = useRouter();

    const fetchMedia = useCallback(() => {
        getMediaFiles().then(setMediaFiles);
    }, []);

    useEffect(() => {
        if (open) {
            fetchMedia();
        } else {
            setTimeout(() => {
                setView('library');
                setImageToAdjust(null);
            }, 300);
        }
    }, [open, fetchMedia]);

    useEffect(() => {
        if (state?.success) {
            toast({ title: state.message });
            setOpen(false);
            router.refresh();
        }
        if (state?.error) {
            toast({ variant: 'destructive', title: 'Update failed', description: state.error });
        }
    }, [state, toast, router]);

    const handleSelectImage = (imageUrl: string) => {
        if (imageType === 'avatar') {
            const formData = new FormData();
            formData.append('imageType', 'avatar');
            formData.append('imageUrl', imageUrl);
            formAction(formData);
        } else { // cover
            setImageToAdjust(imageUrl);
            setView('adjust');
        }
    };

    const handleSavePosition = (position: string) => {
        if (!imageToAdjust) return;
        const formData = new FormData();
        formData.append('imageType', 'cover');
        formData.append('imageUrl', imageToAdjust);
        formData.append('imagePosition', position);
        formAction(formData);
    }
    
    const captureMode = imageType === 'avatar' ? 'user' : 'environment';

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>{children}</SheetTrigger>
            <SheetContent className="flex flex-col p-0">
                <SheetHeader className="p-6 pb-2">
                    <SheetTitle>Select new {imageType} image</SheetTitle>
                </SheetHeader>
                
                {view === 'library' && (
                    <>
                        <div className="p-6 pt-2 border-y">
                            <MediaUploader showCard={false} onUploadSuccess={fetchMedia} capture={captureMode} />
                        </div>
                        <ScrollArea className="flex-1">
                            {mediaFiles.length > 0 ? (
                                <div className="grid grid-cols-2 gap-4 p-6">
                                    {mediaFiles.map(fileUrl => (
                                        <button 
                                            key={fileUrl} 
                                            className="relative aspect-square overflow-hidden rounded-lg border group focus:outline-none focus:ring-2 focus:ring-primary"
                                            onClick={() => handleSelectImage(fileUrl)}
                                        >
                                            <Image
                                                src={fileUrl}
                                                alt=""
                                                fill
                                                sizes="(max-width: 768px) 50vw, 25vw"
                                                className="object-cover"
                                            />
                                             <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                <Check className="h-8 w-8 text-white" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                                    <p>Your media library is empty.</p>
                                </div>
                            )}
                        </ScrollArea>
                    </>
                )}

                {view === 'adjust' && imageToAdjust && (
                    <CoverPhotoAdjuster 
                        imageUrl={imageToAdjust} 
                        onSave={handleSavePosition} 
                        onCancel={() => setView('library')} 
                    />
                )}
            </SheetContent>
        </Sheet>
    );
}

function calculateProfileCompletion(profile?: UserProfileType | null): number {
    if (!profile) return 0;
    const totalPoints = 11;
    let completedPoints = 0;

    if (profile.name) completedPoints++;
    if (profile.tagline) completedPoints++;
    if (profile.bio) completedPoints++;
    if (profile.links?.website || profile.links?.github || profile.links?.linkedin) completedPoints++;
    if (profile.experience && profile.experience.length > 0) completedPoints++;
    if (profile.education && profile.education.length > 0) completedPoints++;
    if (profile.skills && profile.skills.length > 0) completedPoints++;
    if (profile.languages && profile.languages.length > 0) completedPoints++;
    if (profile.publications && profile.publications.length > 0) completedPoints++;
    if (profile.projects && profile.projects.length > 0) completedPoints++;
    if (profile.associations && profile.associations.length > 0) completedPoints++;

    return Math.round((completedPoints / totalPoints) * 100);
}

interface ProfileClientPageProps {
  userProfile: UserProfileType;
  isOwner: boolean;
  bookmarks: Bookmark[];
  allBooks: BookWithStats[];
  userCircles: Circle[];
  posts: Post[];
  discoverableUsers: UserProfileType[];
  allStandaloneArticles: StandaloneArticle[];
  userLayers: LayerAnnotation[];
}

export function ProfileClientPage({
  userProfile,
  isOwner,
  bookmarks,
  allBooks,
  userCircles,
  posts,
  discoverableUsers,
  allStandaloneArticles,
  userLayers,
}: ProfileClientPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'wall';
  
  const [followers, setFollowers] = useState<UserProfileType[]>([]);
  const [following, setFollowing] = useState<UserProfileType[]>([]);

  const fetchData = useCallback(() => {
    getFollowers(userProfile.email).then(setFollowers);
    getFollowing(userProfile.email).then(setFollowing);
  }, [userProfile.email]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);


  const handleTabChange = (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', value);
      router.replace(`${pathname}?${params.toString()}`);
  };
  
  const userBooks = allBooks.filter((book: BookWithStats) => book.ownerId === userProfile.email);
  const userStandaloneArticles = allStandaloneArticles.filter((article: StandaloneArticle) => article.ownerId === userProfile.email);
  const userPosts = posts.filter(p => p.author.id === userProfile.email);
  const userEvolutions = userPosts.filter(p => p.status === 'evolving');
  const favoriteBooks = bookmarks.filter(b => b.type === 'book');

  const verificationBadgeMap = {
    verified: { icon: VerifiedBadgeIcon, color: 'text-blue-400', tooltip: 'Verified Scholar' },
    pending: { icon: PendingVerificationIcon, color: 'text-amber-500', tooltip: 'Verification Pending' },
    unverified: { icon: UserWithExclamationIcon, color: 'text-muted-foreground', tooltip: 'Not Verified - Click to request' },
    revoked: { icon: UserWithExclamationIcon, color: 'text-destructive', tooltip: 'Verification Revoked' },
    banned: { icon: UserWithExclamationIcon, color: 'text-destructive', tooltip: 'User Banned' },
  };

  const currentBadge = verificationBadgeMap[userProfile.verificationStatus] || verificationBadgeMap.unverified;
  const BadgeIcon = currentBadge.icon;
  
  const completionPercentage = calculateProfileCompletion(userProfile);

  const tabs = [
    { value: 'wall', label: 'Wall' },
    { value: 'about', label: 'About' },
    { value: 'works', label: 'Works' },
    { value: 'followers', label: `Followers (${followers.length})` },
    { value: 'following', label: `Following (${following.length})` },
    { value: 'circles', label: `Circles (${userCircles.length})` },
  ];

  return (
    <div className="w-full pb-16 md:pb-0">
      <div>
        <div className="relative h-32 md:h-[26rem] w-full bg-muted group rounded-b-2xl">
          {isOwner && (
            <ProfileImageUpdater imageType="cover">
              <button className="absolute inset-0 w-full h-full z-20 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-b-2xl">
                <Camera className="h-8 w-8 text-white" />
              </button>
            </ProfileImageUpdater>
          )}
          <Image src={userProfile.coverUrl} alt="Cover photo" data-ai-hint="abstract landscape" fill className="h-full w-full object-cover rounded-b-2xl" style={{ objectPosition: userProfile.coverPosition || '50% 50%' }} priority />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background to-transparent" />
        </div>
        <div className="container mx-auto px-4 sm:px-6 md:px-8 relative z-10">
          <div className="relative flex items-end gap-4 -mt-24 sm:-mt-20">
            <div className="relative group shrink-0">
              {isOwner && (
                <ProfileImageUpdater imageType="avatar">
                  <button className="absolute inset-0 z-20 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Camera className="h-8 w-8 text-white" />
                  </button>
                </ProfileImageUpdater>
              )}
              <Avatar className="h-32 w-32 sm:h-40 sm:w-40 border-4 border-background bg-card">
                <AvatarImage src={userProfile.avatarUrl} alt={userProfile.name} data-ai-hint="person avatar" />
                <AvatarFallback>{userProfile.name.charAt(0)}</AvatarFallback>
              </Avatar>
            </div>
            <div className="pb-4 pt-10 flex-1 flex flex-col sm:flex-row justify-between sm:items-end">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-4xl font-bold">
                    {userProfile.name}
                  </h1>
                   <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                         <Link href={isOwner ? "/admin/settings?tab=verification" : "#"}>
                          <BadgeIcon className={`h-7 w-7 ${currentBadge.color}`} />
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent><p>{currentBadge.tooltip}</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-muted-foreground">@{userProfile.email.split('@')[0]}</p>
              </div>
              <div className="mt-4 sm:mt-0">
                <ProfileActionsClient user={userProfile} isOwner={isOwner} />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <div className="border-b hidden md:block">
          <div className="container mx-auto px-4 sm:px-6 md:px-8 mt-4">
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex justify-center pb-2">
                <TabsList className="rounded-full h-12 inline-flex">
                  {tabs.map(tab => <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>)}
                </TabsList>
              </div>
              <ScrollBar orientation="horizontal" className="invisible" />
            </ScrollArea>
          </div>
        </div>
        <div className="container mx-auto mt-6">
          <TabsContent value="wall">
            <Wall posts={userPosts} userProfile={userProfile} readOnly={!isOwner} circles={userCircles} />
          </TabsContent>
          <TabsContent value="about">
             {isOwner && completionPercentage < 100 && (
                <Card className="mb-6 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                    <CardHeader className="flex flex-row items-center gap-4">
                         <div className="flex-1">
                            <CardTitle className="text-amber-900 dark:text-amber-100">Complete Your Profile</CardTitle>
                            <CardDescription className="text-amber-700 dark:text-amber-200">
                                Your profile is {completionPercentage}% complete. A full profile helps others connect with you.
                            </CardDescription>
                            <Progress value={completionPercentage} className="w-full mt-2 h-2" />
                        </div>
                        <Button asChild>
                            <Link href="/admin/settings">Go to Settings <ArrowRight className="ml-2 h-4 w-4"/></Link>
                        </Button>
                    </CardHeader>
                </Card>
            )}
            <UserAbout user={userProfile} />
          </TabsContent>
          <TabsContent value="works">
            <UserWorks 
              books={userBooks} 
              works={userStandaloneArticles} 
              isOwner={isOwner} 
              layers={userLayers}
              bookmarks={bookmarks}
            />
          </TabsContent>
          <TabsContent value="followers">
              <PeopleBrowser 
                allUsers={followers} 
                currentUser={userProfile} 
                currentUserCircles={userCircles} 
                onDataNeeded={fetchData} 
              />
          </TabsContent>
          <TabsContent value="following">
              <PeopleBrowser 
                allUsers={following} 
                currentUser={userProfile} 
                currentUserCircles={userCircles} 
                onDataNeeded={fetchData} 
              />
          </TabsContent>
          <TabsContent value="circles">
              <UserCircles circles={userCircles} currentUser={userProfile} onActionComplete={fetchData} />
          </TabsContent>
        </div>
      </Tabs>
      <MobileNav activeTab={activeTab} onTabChange={handleTabChange} isOwner={isOwner}/>
    </div>
  );
}
