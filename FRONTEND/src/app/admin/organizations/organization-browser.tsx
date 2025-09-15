

'use client';

import React, { useState, useActionState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Star, Building, Search, LayoutGrid, List, MoreVertical, Edit, Trash2 } from 'lucide-react';
import type { Organization } from '@/types';
import { cn } from '@/lib/utils';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { deleteOrganizationAction } from '@/actions/profile.actions';

function OrganizationActions({ organization, onEdit, onActionComplete }: { 
    organization: Organization, 
    onEdit: (org: Organization) => void,
    onActionComplete: () => void,
}) {
    const { toast } = useToast();
    const [state, formAction] = useActionState(deleteOrganizationAction, null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    useEffect(() => {
        if (state?.success) {
            toast({ description: state.message });
            onActionComplete();
            setIsDeleteOpen(false);
        }
        if (state?.error) {
            toast({ variant: 'destructive', title: "Error", description: state.error });
        }
    }, [state, toast, onActionComplete]);
    
    return (
        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                     <DropdownMenuItem onSelect={() => onEdit(organization)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                    </DropdownMenuItem>
                    <AlertDialogTrigger asChild>
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={e => e.preventDefault()}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </DropdownMenuItem>
                    </AlertDialogTrigger>
                </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent>
                 <form action={formAction}>
                    <input type="hidden" name="organizationId" value={organization.id} />
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the organization "{organization.name}". This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction asChild>
                            <Button type="submit" variant="destructive">Delete</Button>
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </form>
            </AlertDialogContent>
        </AlertDialog>
    );
}

function OrganizationCard({ organization, onEdit, onActionComplete }: { 
    organization: Organization, 
    onEdit: (org: Organization) => void, 
    onActionComplete: () => void 
}) {
    const rating = 4.5; // Mock data
    const filledStars = Math.round(rating);

    return (
        <Card className="flex flex-col hover:shadow-lg transition-shadow h-full">
             <CardHeader className="flex-row items-center gap-4">
                <div className="w-16 h-16 rounded-lg border flex items-center justify-center bg-muted flex-shrink-0">
                     {organization.logoUrl ? (
                        <Image src={organization.logoUrl} alt={`${organization.name} logo`} width={64} height={64} className="object-contain" data-ai-hint="organization logo"/>
                     ) : (
                        <Building className="h-8 w-8 text-muted-foreground" />
                     )}
                </div>
                <div className="flex-1 min-w-0">
                    <CardTitle className="truncate">{organization.name}</CardTitle>
                    <CardDescription className="truncate">{organization.tagline}</CardDescription>
                     <div className="flex items-center gap-1 mt-1">
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} className={cn('h-4 w-4', i < filledStars ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30')} />
                        ))}
                    </div>
                </div>
                <OrganizationActions organization={organization} onEdit={onEdit} onActionComplete={onActionComplete} />
            </CardHeader>
            <CardContent className="flex-grow space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-3">
                    {organization.about?.longDescription || 'No description provided.'}
                </p>
                 {organization.taxonomy?.tags && organization.taxonomy.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                        {organization.taxonomy.tags.slice(0,3).map(tag => (
                            <Badge key={tag} variant="secondary">{tag}</Badge>
                        ))}
                    </div>
                 )}
            </CardContent>
            <CardFooter>
                 <Button asChild className="w-full">
                    <Link href={`/organizations/${organization.id}`}>View Organization</Link>
                </Button>
            </CardFooter>
        </Card>
    );
}

function OrganizationListItem({ organization, onEdit, onActionComplete }: { 
    organization: Organization,
    onEdit: (org: Organization) => void,
    onActionComplete: () => void 
}) {
    const rating = 4.5;
    const filledStars = Math.round(rating);

    return (
        <Card className="hover:shadow-md transition-shadow">
            <div className="flex items-center p-4 gap-4">
                <div className="w-16 h-16 rounded-lg border flex items-center justify-center bg-muted flex-shrink-0">
                     {organization.logoUrl ? (
                        <Image src={organization.logoUrl} alt={`${organization.name} logo`} width={64} height={64} className="object-contain" data-ai-hint="organization logo"/>
                     ) : (
                        <Building className="h-8 w-8 text-muted-foreground" />
                     )}
                </div>
                <div className="flex-1 min-w-0">
                    <Link href={`/organizations/${organization.id}`}>
                        <h3 className="font-semibold hover:underline">{organization.name}</h3>
                    </Link>
                    <p className="text-sm text-muted-foreground truncate">{organization.tagline}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                        {organization.taxonomy?.tags?.slice(0, 4).map(tag => (
                            <Badge key={tag} variant="outline">{tag}</Badge>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                     <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} className={cn('h-4 w-4', i < filledStars ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30')} />
                        ))}
                    </div>
                    <Button asChild size="sm" variant="secondary">
                        <Link href={`/organizations/${organization.id}`}>View</Link>
                    </Button>
                    <OrganizationActions organization={organization} onEdit={onEdit} onActionComplete={onActionComplete} />
                </div>
            </div>
        </Card>
    );
}


export function OrganizationBrowser({ organizations, onEdit, onActionComplete }: {
  organizations: Organization[];
  onEdit: (org: Organization) => void;
  onActionComplete: () => void;
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [view, setView] = useState<'grid' | 'list'>('grid');

    const filteredOrgs = organizations.filter(org => 
        org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (org.tagline || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (org.taxonomy?.tags || []).some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex-row items-center justify-between">
                     <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input 
                            placeholder="Search by name, tag, or description..." 
                            className="pl-10 h-12 text-base rounded-full" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <ToggleGroup type="single" value={view} onValueChange={(v) => { if (v) setView(v as any) }}>
                        <ToggleGroupItem value="grid" aria-label="Grid view"><LayoutGrid className="h-4 w-4" /></ToggleGroupItem>
                        <ToggleGroupItem value="list" aria-label="List view"><List className="h-4 w-4" /></ToggleGroupItem>
                    </ToggleGroup>
                </CardHeader>
            </Card>

            {filteredOrgs.length > 0 ? (
                view === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredOrgs.map(org => (
                            <OrganizationCard key={org.id} organization={org} onEdit={onEdit} onActionComplete={onActionComplete} />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredOrgs.map(org => (
                            <OrganizationListItem key={org.id} organization={org} onEdit={onEdit} onActionComplete={onActionComplete} />
                        ))}
                    </div>
                )
            ) : (
                <div className="text-center py-12 text-muted-foreground">
                    <p>No organizations found matching your search.</p>
                </div>
            )}
        </div>
    );
}
