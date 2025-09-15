
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
    Home, MessageSquare, Library, FilePenLine, ImageIcon, NotebookText, Quote, Bookmark, 
    Settings, User, GitBranch, Wind, Star, Users, BrainCircuit, UserSearch, Layers3, 
    Building, ShieldCheck, Menu as MenuIcon, LogOut, X, Book, BookHeart, BookOpen, Bell
} from 'lucide-react';
import Link from 'next/link';
import { VaikhariLogo } from '@/components/icons';
import { useCopilot } from '@/contexts/copilot-context';
import { CopilotSidebar } from '@/components/admin/copilot/copilot-sidebar';
import type { UserProfile, Notification } from "@/types";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSidebar } from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { getNotifications } from '@/services/user.service';
import { ProfileCompletionCircle } from '@/components/ui/profile-progress';
import { auth } from '@/lib/firebase/config';


function MenuItem({ label, icon, href }: { label: string, icon: React.ReactElement, href: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentPathWithQuery = `${pathname}?${searchParams.toString()}`;
  
  const isActive = href.includes('?') 
      ? currentPathWithQuery.startsWith(href) 
      : pathname.startsWith(href);

  return (
    <Link href={href}>
      <div style={{ padding: '8px 10px', borderRadius: 8, cursor: 'pointer', color: isActive ? 'hsl(var(--primary))' : 'hsl(var(--foreground))', background: isActive ? 'hsl(var(--primary)/0.1)' : 'transparent', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: 6, background: 'hsl(var(--muted))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--muted-foreground))' }}>
          {React.cloneElement(icon, { className: 'h-4 w-4' })}
        </div>
        <div style={{ fontSize: 14, fontWeight: isActive ? 600 : 400 }}>{label}</div>
      </div>
    </Link>
  );
}

function NotificationBell({ userProfile }: { userProfile: UserProfile | null }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const lastCheckTimestampRef = useRef(Date.now());

    const playSound = useCallback((soundUrl: string) => {
        if (userProfile?.preferences?.notifications?.sounds) {
            new Audio(soundUrl).play().catch(e => console.error("Error playing sound:", e));
        }
    }, [userProfile]);

    const fetchAndProcessNotifications = useCallback(async () => {
        if (!userProfile) return;
        const data = await getNotifications(userProfile.email);
        const newUnread = data.filter(n => !n.isRead && n.createdAt > lastCheckTimestampRef.current);
        
        if (newUnread.length > 0) {
            const hasWorkAnnouncement = newUnread.some(n => n.type === 'book_published');
            if (hasWorkAnnouncement) {
                playSound('/sounds/work_announced.mp3');
            } else {
                playSound('/sounds/default_notification.mp3');
            }
        }
        
        lastCheckTimestampRef.current = Date.now();
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.isRead).length);
    }, [userProfile, playSound]);

    useEffect(() => {
        fetchAndProcessNotifications();
        const interval = setInterval(fetchAndProcessNotifications, 30000); // Poll every 30 seconds
        return () => clearInterval(interval);
    }, [fetchAndProcessNotifications]);

    if (!userProfile) return null;

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 relative" title="Notifications">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">
                            {unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0">
                 <div className="p-4 font-semibold border-b">Notifications</div>
                 <ScrollArea className="h-[300px]">
                    {notifications.length > 0 ? (
                        <div className="p-2">
                            {notifications.map(notif => (
                                <Link href={notif.link || '#'} key={notif.id} className="block p-2 rounded-lg hover:bg-muted">
                                    <div className="flex items-start gap-3">
                                         <Avatar className="h-8 w-8">
                                            <AvatarImage src={notif.actor.avatarUrl} />
                                            <AvatarFallback>{notif.actor.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-sm">{notif.message}</p>
                                            <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}</p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-center text-muted-foreground p-4">No new notifications.</p>
                    )}
                 </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}

function calculateProfileCompletion(profile?: UserProfile | null): number {
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

export function AdminLayoutClient({ children, userProfile }: { children: React.ReactNode, userProfile: UserProfile | null }) {
    const { isCopilotOpen, setCopilotOpen } = useCopilot();
    const router = useRouter();
    const isMobile = useIsMobile();
    const { open, setOpen } = useSidebar();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const hasAutoClosedRef = useRef(false);

    const isSuperAdmin = userProfile?.email === 'acharyjiamahanidhi@gmail.com';
    const handleLogout = async () => {
        try {
            // Firebase sign out
            const { signOut } = await import('firebase/auth');
            await signOut(auth);
        } catch (e) {
            // ignore
        }
        try {
            // Clear session cookie
            await fetch('/api/session', { method: 'DELETE' });
        } catch {}
        router.push('/login');
    };
    const pathname = usePathname();
    useEffect(() => {
    if (pathname.includes('/living-document') && open && !hasAutoClosedRef.current) {
        setOpen(false);
        hasAutoClosedRef.current = true;
    } else if (!pathname.includes('/living-document')) {
        hasAutoClosedRef.current = false;
    }
}, [pathname, open, setOpen]);

    const menuItems = [
        { heading: "Connect & Share", icon: Users, items: [
          { href: "/admin/dashboard", icon: <Home />, label: "Dashboard" },
          { href: "/admin/activity", icon: <BookHeart />, label: "Activity" },
          { href: "/admin/people", icon: <UserSearch />, label: "People" },
          { href: "/admin/organizations", icon: <Building />, label: "Organizations" },
          { href: "/admin/circles", icon: <Users />, label: "Circles" },
          { href: "/admin/messages", icon: <MessageSquare />, label: "Messages" },
        ]},
        { heading: "My Journey", icon: GitBranch, items: [
          { href: `/admin/my-evolutions`, icon: <GitBranch />, label: "My Evolutions" },
          { href: "/admin/drift", icon: <Wind />, label: "My Drifts" },
          { href: `/admin/profile/${encodeURIComponent(userProfile?.email || '')}?tab=favorites`, icon: <Star />, label: "My Favorites" },
          { href: "/admin/my-layers", icon: <Layers3 />, label: "My Layers" },
          { href: "/admin/my-notes", icon: <NotebookText />, label: "My Notes" },
        ]},
        { heading: "My Works", icon: Book, items: [
          { href: "/admin/library", icon: <Library />, label: "Library" },
          { href: "/admin/books", icon: <Book />, label: "Manage Books" },
          { href: "/admin/articles", icon: <FilePenLine />, label: "Manage Articles" },
          { href: "/admin/citations", icon: <Quote />, label: "Citations" },
          { href: "/admin/quotes", icon: <Bookmark />, label: "Quotes" },
          { href: "/admin/glossary", icon: <NotebookText />, label: "Glossary" },
          { href: "/admin/living-document", icon: <BookOpen />, label: "Living Document" },
          { href: "/admin/media", icon: <ImageIcon />, label: "Media" },
        ]},
        { heading: "Tools & Settings", icon: Settings, items: [
          { href: "/admin/settings", icon: <Settings />, label: "Settings" },
        ]}
    ];

    const profileCompletion = calculateProfileCompletion(userProfile);

    const SidebarContent = () => (
      <>
        <div className="flex h-12 items-center justify-between border-b px-4 flex-shrink-0">
          {/* <Link href="/admin/activity" className="flex items-center gap-2 font-bold">
            <VaikhariLogo className="h-7 w-7 text-primary  bg-red" />
            <span>VAIKHARI</span>
          </Link> */}
        </div>

        <nav style={{padding: 12, overflowY: 'auto', flex: 1}} className="scrollable">
            {menuItems.map(section => (
                <div key={section.heading} className="mb-4">
                    <h3 className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <section.icon className="h-4 w-4" /> {section.heading}
                    </h3>
                    <div className="space-y-1">
                        {section.items.map(item => (
                            <MenuItem key={item.href} href={item.href} label={item.label} icon={item.icon} />
                        ))}
                    </div>
                </div>
              ))}
               {isSuperAdmin && (
                 <div className="mb-4">
                    <h3 className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4" /> Super Admin
                    </h3>
                    <div className="space-y-1">
                        <MenuItem href="/admin/super-admin" label="Repository" icon={<BookOpen />} />
                        <MenuItem href="/admin/super-admin/user-management" label="User Management" icon={<UserSearch />} />
                        <MenuItem href="/admin/super-admin/institutions" label="Institutions" icon={<Building />} />
                    </div>
                </div>
               )}
        </nav>

        <div style={{padding: 12, borderTop: '1px solid hsl(var(--border))'}}>
            <div className="flex items-center justify-between">
                <Link href={`/admin/profile/${encodeURIComponent(userProfile?.email || '')}`} className="flex items-center gap-2 rounded-md p-1 -ml-1 hover:bg-muted flex-1">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={userProfile?.avatarUrl} alt={userProfile?.name} data-ai-hint="person avatar" />
                        <AvatarFallback>{userProfile?.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="font-semibold text-foreground text-sm">{userProfile?.name}</span>
                </Link>
                <Link href="/admin/settings" title="Complete your profile">
                    <ProfileCompletionCircle percent={profileCompletion} />
                </Link>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleLogout}>
                    <LogOut className="h-4 w-4" />
                </Button>
            </div>
        </div>
      </>
    );

    if (isMobile) {
        return (
            <div className="h-screen w-full flex flex-col bg-background">{/* overflow-guard: w-screen->w-full */}
                <header className="flex h-12 items-center justify-between border-b px-4 flex-shrink-0 bg-background">
                    <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)}>
                        <MenuIcon />
                    </Button>
                    <Link href="/admin/activity" className="font-headline text-xl font-bold">VAIKHARI</Link>
                    <button onClick={() => setCopilotOpen(true)} className="p-2 rounded-full hover:bg-muted" title="Open Copilot">
                        <VaikhariLogo className="h-8 w-8 text-primary" />
                    </button>
                </header>
                 <AnimatePresence>
                    {isSidebarOpen && (
                        <>
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="fixed h-full w-full inset-0 bg-black/60 z-40" onClick={() => setIsSidebarOpen(false)} />
                            <motion.aside key="left-sidebar-mobile" initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ duration: 0.3, ease: "easeInOut" }} className="fixed h-full w-[280px] inset-y-0 left-0 bg-card z-50 flex flex-col" >
                                <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => setIsSidebarOpen(false)}> <X className="h-5 w-5"/></Button>
                                <SidebarContent />
                            </motion.aside>
                        </>
                    )}
                </AnimatePresence>
                <main className="flex-1 overflow-auto p-4 sm:p-6 md:p-8">{children}</main>
                 <AnimatePresence>
                  {isCopilotOpen && <CopilotSidebar />}
                </AnimatePresence>
            </div>
        );
    }
  
    return (
      <div className="h-screen w-full flex bg-muted/40">
  
          {open && (
            <aside className="w-[280px] min-w-[280px] flex-shrink-0 flex flex-col border-r bg-card">
              <SidebarContent />
            </aside>
          )}
          
          <div className="fixed top-2 left-4 z-50">
            <Button
              onClick={() => setOpen(prev => !prev)}
              className="bg-transparent h-auto p-2 flex items-center justify-center gap-2 rounded-lg"
              style={{
                backgroundColor: "transparent",
                boxShadow: "none",
              }}
            >
              <span className="font-extrabold text-lg text-black dark:text-white">VAIKHARI</span>
              <AnimatePresence mode="wait">
                <motion.div
                  key={open ? "x" : "menu"}
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 90 }}
                  transition={{ duration: 0.2 }}
                >
                  {open ? <X className="h-3 w-3" /> : <MenuIcon className="h-3 w-3" />}
                </motion.div>
              </AnimatePresence>
            </Button>
           </div>
          
          <main id="mainContent" className="flex-1 min-w-0 overflow-y-auto scrollable relative">
            <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
                <div className="flex items-center gap-1 rounded-full p-1 bg-background/80 ">
                    <ThemeSwitcher />
                    {userProfile && <NotificationBell userProfile={userProfile} />}
                </div>
                 <div className="flex items-center gap-1 rounded-full p-1 bg-background/80 ">
                    <button onClick={() => setCopilotOpen(prev => !prev)} className="p-2 rounded-full" title="Toggle Copilot">
                        <VaikhariLogo className="h-8 w-8 text-primary transition-transform duration-200 hover:scale-110" />
                    </button>
                </div>
            </div>

            <div className=" sm:p-6 sm:pt-20 md:p-8 md:pt-20">
               {children}
            </div>
          </main>

          <AnimatePresence>
            {isCopilotOpen && <CopilotSidebar />}
          </AnimatePresence>
      </div>
    );
}
