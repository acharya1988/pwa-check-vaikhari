
'use client';

import Link from 'next/link';
import { Home, Book, Star, Users, UserSearch, GitBranch, User as UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

export function MobileNav({ activeTab, onTabChange, isOwner }: { activeTab: string, onTabChange: (tab: string) => void, isOwner: boolean }) {
  const navItems = [
    { href: 'wall', icon: Home, label: 'Wall' },
    { href: 'about', icon: UserIcon, label: 'About' },
    { href: 'works', icon: Book, label: 'Works' },
    { href: 'evolutions', icon: GitBranch, label: 'Evolutions', ownerOnly: true },
    { href: 'favorites', icon: Star, label: 'Favorites' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-sm md:hidden">
      <nav className="container mx-auto flex h-16 items-center justify-around px-2">
        {navItems.map((item) => {
          if (item.ownerOnly && !isOwner) return null;

          const isActive = activeTab === item.href;
          return (
            <button
              key={item.href}
              onClick={() => onTabChange(item.href)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 p-2 rounded-md transition-colors w-16',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:bg-muted/50'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
