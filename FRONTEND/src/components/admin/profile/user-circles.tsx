

'use client';

import React, { useState, useEffect, useRef, useActionState, useMemo } from 'react';
import { useFormStatus } from 'react-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import type { Circle, CircleMember, CircleRequest, UserProfile } from '@/types';
import { createCircleAction, manageCircleRequest, deleteCircleAction } from '@/actions/profile.actions';
import { Users, Building, Plus, Loader2, Check, X, ShieldCheck, User, Eye, BookOpen, MoreVertical, Edit, Trash2, LayoutGrid, List } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GenreSelector } from '@/app/admin/genre/genre-provider-system';

function CreateCircleDialog({ children, onCircleCreated, forceType }: { 
    children: React.ReactNode; 
    onCircleCreated?: () => void;
    forceType?: 'organization' | 'personal';
}) {
    const [open, setOpen] = useState(false);
    const [state, formAction] = useActionState(createCircleAction, null);
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);
    const router = useRouter();

    useEffect(() => {
        if (state?.success) {
            toast({ title: state.message });
            formRef.current?.reset();
            setOpen(false);
            onCircleCreated?.();
            if (state.id) {
                router.push(`/admin/circles/${state.id}`);
            }
        }
        if (state?.error) {
            toast({ variant: 'destructive', title: 'Error', description: state.error });
        }
    }, [state, toast, onCircleCreated]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create a New Circle</DialogTitle>
                    <DialogDescription>Build a community around a topic or interest.</DialogDescription>
                </DialogHeader>
                <form ref={formRef} action={formAction} className="space-y-4">
                     <div>
                        <Label htmlFor="name">Circle Name</Label>
                        <Input id="name" name="name" required />
                        {state?.fieldErrors?.name && <p className="text-sm text-destructive mt-1">{state.fieldErrors.name[0]}</p>}
                    </div>
                     <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" name="description" required />
                        {state?.fieldErrors?.description && <p className="text-sm text-destructive mt-1">{state.fieldErrors.description[0]}</p>}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="avatarUrl">Profile Image URL (optional)</Label>
                            <Input id="avatarUrl" name="avatarUrl" placeholder="https://..." />
                            {state?.fieldErrors?.avatarUrl && <p className="text-sm text-destructive mt-1">{state.fieldErrors.avatarUrl[0]}</p>}
                        </div>
                        <div>
                            <Label htmlFor="coverUrl">Cover Image URL (optional)</Label>
                            <Input id="coverUrl" name="coverUrl" placeholder="https://..." />
                            {state?.fieldErrors?.coverUrl && <p className="text-sm text-destructive mt-1">{state.fieldErrors.coverUrl[0]}</p>}
                        </div>
                    </div>
                     <div>
                        <Label>Circle Type</Label>
                        <input type="hidden" name="type" value={forceType || 'personal'} />
                         <RadioGroup defaultValue={forceType || 'personal'} name="type" className="flex gap-4">
                            <Label htmlFor="type-personal" className="flex items-center gap-2 border rounded-md p-3 flex-1 cursor-pointer has-[:checked]:border-primary">
                                <RadioGroupItem value="personal" id="type-personal" disabled={!!forceType} />
                                <div><p className="font-semibold">Personal</p><p className="text-xs text-muted-foreground">A group for friends or colleagues.</p></div>
                            </Label>
                             <Label htmlFor="type-org" className="flex items-center gap-2 border rounded-md p-3 flex-1 cursor-pointer has-[:checked]:border-primary">
                                <RadioGroupItem value="organization" id="type-org" disabled={!!forceType} />
                                <div><p className="font-semibold">Organization</p><p className="text-xs text-muted-foreground">Represents an institution or company.</p></div>
                            </Label>
                        </RadioGroup>
                    </div>
                    <div>
                        <Label>Categorization</Label>
                        <div className="p-4 border rounded-md">
                           <GenreSelector />
                        </div>
                         {state?.fieldErrors?.genreId && <p className="text-sm text-destructive mt-1">{state.fieldErrors.genreId[0]}</p>}
                         {state?.fieldErrors?.categoryId && <p className="text-sm text-destructive mt-1">{state.fieldErrors.categoryId[0]}</p>}
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
                        <Button type="submit">Create Circle</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

function SubmitActionButton({action, children}: {action: 'accept' | 'reject', children: React.ReactNode}) {
    const { pending } = useFormStatus();
    return (
        <Button 
            type="submit" 
            name="action" 
            value={action} 
            variant={action === 'accept' ? 'default' : 'destructive'}
            disabled={pending}
        >
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : children}
        </Button>
    )
}

function ManageRequestDialog({ circleId, request, onActionComplete }: { circleId: string; request: CircleRequest; onActionComplete?: () => void; }) {
    const [open, setOpen] = useState(false);
    const [state, formAction] = useActionState(manageCircleRequest, null);
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        if(state?.success) {
            toast({ description: state.message });
            setOpen(false);
            if (onActionComplete) {
                onActionComplete();
            } else {
                router.refresh();
            }
        }
        if(state?.error) {
            toast({ variant: 'destructive', description: state.error });
        }
    }, [state, toast, onActionComplete, router]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                 <Button variant="outline" size="sm">Manage</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Manage Request</DialogTitle>
                    <DialogDescription>
                        Accept or reject the join request from {request.name}.
                    </DialogDescription>
                </DialogHeader>
                 <form action={formAction} className="space-y-4">
                    <input type="hidden" name="circleId" value={circleId} />
                    <input type="hidden" name="requestUserId" value={request.userId} />

                    <div className="p-4 border rounded-md bg-muted">
                        <div className="flex items-center gap-3">
                             <Avatar className="h-10 w-10">
                                <AvatarImage src={request.avatarUrl} alt={request.name} data-ai-hint="person avatar" />
                                <AvatarFallback>{request.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <p className="font-semibold">{request.name}</p>
                                <p className="text-xs text-muted-foreground">Requested {formatDistanceToNow(new Date(request.requestedAt), { addSuffix: true })}</p>
                            </div>
                        </div>
                        {request.message && <p className="text-sm italic text-muted-foreground mt-2 pt-2 border-t">"{request.message}"</p>}
                    </div>

                    <div>
                        <Label htmlFor={`dialog-role-select-${request.userId}`} className="text-xs">Assign Role</Label>
                        <Select name="role" defaultValue="reader">
                            <SelectTrigger id={`dialog-role-select-${request.userId}`}>
                                <SelectValue placeholder="Select role..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="reader">Reader</SelectItem>
                                <SelectItem value="contributor">Contributor</SelectItem>
                            </SelectContent>
                        </Select>
                        {state?.fieldErrors?.role && <p className="text-sm text-destructive mt-1">{state.fieldErrors.role[0]}</p>}
                    </div>
                    
                    <DialogFooter>
                        <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                        <SubmitActionButton action="reject">
                            <X className="mr-2 h-4 w-4" /> Reject
                        </SubmitActionButton>
                         <SubmitActionButton action="accept">
                            <Check className="mr-2 h-4 w-4" /> Accept
                        </SubmitActionButton>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

const roleConfig: Record<CircleMember['role'], { icon: React.ElementType, label: string, color: string }> = {
    admin: { icon: ShieldCheck, label: "Admin", color: "text-primary" },
    contributor: { icon: User, label: "Contributor", color: "text-info" },
    reader: { icon: Eye, label: "Reader", color: "text-muted-foreground" },
}

function MemberList({ members }: { members: CircleMember[] }) {
    return (
        <div className="space-y-3">
            <h4 className="font-medium">Members ({members.length})</h4>
            {members.map(member => {
                const config = roleConfig[member.role] || roleConfig.reader;
                return (
                    <div key={member.userId} className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                            <AvatarImage src={member.avatarUrl} alt={member.name} data-ai-hint="person avatar"/>
                            <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <p className="text-sm font-semibold">{member.name}</p>
                        </div>
                        <Badge variant="outline" className={`gap-1 ${config.color}`}>
                            <config.icon className="h-3.5 w-3.5" /> {config.label}
                        </Badge>
                    </div>
                )
            })}
        </div>
    )
}

function RequestList({ circleId, requests, onActionComplete }: { 
    circleId: string; 
    requests: CircleRequest[]; 
    onActionComplete: () => void;
}) {
     if (requests.length === 0) return null;

    return (
        <div className="space-y-3 pt-4 mt-4 border-t">
            <h4 className="font-medium">Pending Requests ({requests.length})</h4>
             {requests.map(request => (
                <div key={request.userId} className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={request.avatarUrl} alt={request.name} data-ai-hint="person avatar" />
                        <AvatarFallback>{request.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <p className="text-sm font-semibold">{request.name}</p>
                        <p className="text-xs text-muted-foreground">Requested {formatDistanceToNow(new Date(request.requestedAt), { addSuffix: true })}</p>
                    </div>
                     <ManageRequestDialog circleId={circleId} request={request} onActionComplete={onActionComplete} />
                </div>
            ))}
        </div>
    )
}


function CircleActions({ circle, onActionComplete }: { circle: Circle, onActionComplete: () => void; }) {
    const [state, formAction] = useActionState(deleteCircleAction, null);
    const { toast } = useToast();
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (state?.success) {
            toast({ title: 'Success', description: state.message });
            setIsDeleteOpen(false);
            onActionComplete();
        }
        if (state?.error) {
            toast({ variant: 'destructive', title: 'Error', description: state.error });
        }
    }, [state, toast, onActionComplete]);

    const isGeneral = circle.id.startsWith('general-circle-');

    return (
        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <AlertDialogTrigger asChild>
                        <DropdownMenuItem disabled={isGeneral} onSelect={e => e.preventDefault()} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                    </AlertDialogTrigger>
                </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent>
                <form action={formAction}>
                    <input type="hidden" name="circleId" value={circle.id} />
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the circle "{circle.name}". This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <Button type="submit" variant="destructive">Delete</Button>
                    </AlertDialogFooter>
                </form>
            </AlertDialogContent>
        </AlertDialog>
    );
}

function CircleCard({ circle, onActionComplete }: { circle: Circle, onActionComplete: () => void; }) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
            <Link href={`/admin/circles/${circle.id}`} className="flex items-center gap-3 group">
                {circle.type === 'organization' ? <Building className="h-8 w-8 text-primary" /> : <Users className="h-8 w-8 text-primary" />}
                <CardTitle className="group-hover:underline">{circle.name}</CardTitle>
            </Link>
            <CircleActions circle={circle} onActionComplete={onActionComplete} />
        </div>
        <CardDescription>{circle.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <MemberList members={circle.members} />
        <RequestList circleId={circle.id} requests={circle.requests} onActionComplete={onActionComplete} />
      </CardContent>
    </Card>
  );
}

function CircleListItem({ circle, onActionComplete }: { circle: Circle, onActionComplete: () => void; }) {
    return (
        <AccordionItem value={circle.id} key={circle.id}>
            <AccordionTrigger>
                <div className="flex items-center justify-between w-full pr-4">
                     <div className="flex items-center gap-3">
                        {circle.type === 'organization' ? <Building className="h-5 w-5 text-primary" /> : <Users className="h-5 w-5 text-primary" />}
                        <div className="text-left">
                            <Link href={`/admin/circles/${circle.id}`} className="font-semibold hover:underline">{circle.name}</Link>
                            <p className="text-sm text-muted-foreground font-normal">{circle.description}</p>
                        </div>
                    </div>
                </div>
            </AccordionTrigger>
            <AccordionContent className="p-4 bg-muted/50 rounded-b-md">
                <div className="flex justify-end mb-2">
                    <CircleActions circle={circle} onActionComplete={onActionComplete} />
                </div>
                <MemberList members={circle.members} />
                <RequestList circleId={circle.id} requests={circle.requests} onActionComplete={onActionComplete} />
            </AccordionContent>
        </AccordionItem>
    );
}

const CirclesView = ({ circles, view, currentUser, onActionComplete }: { circles: Circle[], view: 'grid' | 'list', currentUser: UserProfile, onActionComplete: () => void; }) => {
     if (circles.length === 0) {
        return (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No circles found in this view.</p>
            </div>
        );
    }
    
    if (view === 'grid') {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {circles.map(circle => <CircleCard key={circle.id} circle={circle} onActionComplete={onActionComplete} />)}
            </div>
        );
    }

    return (
         <Accordion type="multiple" className="w-full">
            {circles.map(circle => <CircleListItem key={circle.id} circle={circle} onActionComplete={onActionComplete} />)}
        </Accordion>
    );
};

export function UserCircles({ circles, onActionComplete, currentUser }: { 
    circles: Circle[], 
    onActionComplete: () => void;
    currentUser: UserProfile,
}) {
    const [view, setView] = useState<'grid' | 'list'>('grid');
    const router = useRouter();

    const handleAction = () => {
        if (onActionComplete) {
            onActionComplete();
        } else {
            router.refresh();
        }
    };
    
    const personalCircles = useMemo(() => circles.filter(c => c.type === 'personal'), [circles]);
    const organizationCircles = useMemo(() => circles.filter(c => c.type === 'organization'), [circles]);

    return (
        <div className="relative">
            <Card>
                <CardHeader className="flex-row items-center justify-between">
                    <div>
                        <CardTitle>My Circles</CardTitle>
                        <CardDescription>Your personal and organizational affiliations.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                         <CreateCircleDialog onCircleCreated={handleAction}>
                            <Button variant="outline">
                                <Plus className="mr-2 h-4 w-4" /> New Circle
                            </Button>
                        </CreateCircleDialog>
                         <ToggleGroup type="single" value={view} onValueChange={(v) => { if (v) setView(v as any) }}>
                            <ToggleGroupItem value="grid" aria-label="Grid view"><LayoutGrid className="h-4 w-4" /></ToggleGroupItem>
                            <ToggleGroupItem value="list" aria-label="List view"><List className="h-4 w-4" /></ToggleGroupItem>
                        </ToggleGroup>
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="all" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="all">All ({circles.length})</TabsTrigger>
                            <TabsTrigger value="personal">Personal ({personalCircles.length})</TabsTrigger>
                            <TabsTrigger value="organizations">Organizations ({organizationCircles.length})</TabsTrigger>
                        </TabsList>
                        <TabsContent value="all" className="pt-6">
                            <CirclesView circles={circles} view={view} currentUser={currentUser} onActionComplete={handleAction} />
                        </TabsContent>
                        <TabsContent value="personal" className="pt-6">
                             <CirclesView circles={personalCircles} view={view} currentUser={currentUser} onActionComplete={handleAction} />
                        </TabsContent>
                        <TabsContent value="organizations" className="pt-6">
                             <CirclesView circles={organizationCircles} view={view} currentUser={currentUser} onActionComplete={handleAction} />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    )
}
