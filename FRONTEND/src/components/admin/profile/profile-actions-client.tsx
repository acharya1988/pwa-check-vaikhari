

'use client';

import React, { useState, useEffect, useRef, useActionState, useMemo } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Plus, Download, UserPlus, Check } from 'lucide-react';
import type { UserProfile, Circle } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { getAdministeredCircles } from '@/services/profile.service';
import { getUserProfile } from '@/services/user.service';
import { addUserToCircleAction, toggleFollowUser } from '@/actions/profile.actions';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import html2pdf from 'html2pdf.js';
import { ScrollArea } from '@/components/ui/scroll-area';

function FollowButton({ currentUser, targetUser, onFollowToggle }: { 
    currentUser: UserProfile, 
    targetUser: UserProfile, 
    onFollowToggle: () => void 
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
        <form action={formAction}>
            <input type="hidden" name="targetUserId" value={targetUser.email} />
            <Button type="submit" variant={isFollowing ? 'secondary' : 'default'}>
                {isFollowing ? (
                    <>
                        <Check className="mr-2 h-4 w-4" /> Following
                    </>
                ) : (
                    <>
                         <UserPlus className="mr-2 h-4 w-4" /> Follow
                    </>
                )}
            </Button>
        </form>
    );
}

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

const resumeCss = `
    body { font-family: 'Open Sans', sans-serif; font-size: 10px; }
    main { display: flex; }
    section { padding: 52px 22px; }
    h2 { font-size: 1.5em; text-transform: uppercase; font-weight: bold; }
    h3 { font-size: 1.2em; text-transform: uppercase; font-weight: bold; }
    p { font-size: 1.4em; text-align: justify; }
    ul { list-style: none; padding: 0; margin: 0; }
    a { text-decoration: none; color: inherit; }
    #left-side { width: 33.33%; background: #3B5168; color: white; }
    #right-side { width: 66.67%; }
    .name { text-transform: uppercase; text-align: center; }
    .job-titles { text-align: center; margin-bottom: 60px; font-size: 1.1em; }
    .icon-title { display: flex; align-items: center; gap: 12px; }
    .icon-title h3 { margin: 0; }
    .info-content { padding: 0 32px; margin-top: 40px; margin-bottom: 40px; }
    .list-icons li { display: flex; align-items: center; margin: 15px 0; }
    .list-icons p { margin: 0 0 0 12px; }
    .list-skills li { margin: 16px 0; font-size: 1.4em; text-transform: uppercase; }
    .list-experience li { margin-bottom: 20px; }
    .list-experience label { font-size: 1.6em; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; }
    .list-experience span { font-weight: 300; color: #a7a7a7; font-size: 1.2em; }
    .list-experience p { margin-top: 5px; color: black; }
`;

function getResumeHtml(user: UserProfile) {
    const nameParts = user.name.split(' ');
    const firstName = nameParts.slice(0, -1).join(' ');
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';

    const renderSection = (title: string, items: any[] | undefined, renderer: (item: any) => string) => {
        if (!items || items.length === 0) return '';
        return `
            <section class="icon-title"><h3>${title}</h3></section>
            <section class="info-content">
                <ul class="list-experience">
                    ${items.map(renderer).join('')}
                </ul>
            </section>
        `;
    };

    return `
        <style>${resumeCss}</style>
        <main>
          <section id="left-side">
            <h2 class="name">${firstName} <strong>${lastName}</strong></h2>
            ${user.tagline ? `<h3 class="job-titles">${user.tagline}</h3>` : ''}
            
            <section class="icon-title"><h3>Profile</h3></section>
            <section class="info-content"><p>${user.bio || 'Not provided.'}</p></section>
            
            <section class="icon-title"><h3>Contact</h3></section>
            <section class="info-content">
              <ul class="list-icons">
                <li><p><a href="mailto:${user.email}">${user.email}</a></p></li>
                ${user.links?.website ? `<li><p><a href="${user.links.website}">Website</a></p></li>` : ''}
                ${user.links?.linkedin ? `<li><p><a href="${user.links.linkedin}">LinkedIn</a></p></li>` : ''}
                ${user.links?.github ? `<li><p><a href="${user.links.github}">GitHub</a></p></li>` : ''}
              </ul>
            </section>
            
            ${user.skills && user.skills.length > 0 ? `
            <section class="icon-title"><h3>Skills</h3></section>
            <section class="info-content">
              <ul class="list-skills">
                ${(user.skills as any[]).map(skill => `<li>${skill.name || skill}</li>`).join('')}
              </ul>
            </section>` : ''}
          </section>
          
          <section id="right-side">
            ${renderSection("Professional Experience", user.experience, (exp) => `
                <li><label>${exp.title} <span>/ ${exp.startDate} - ${exp.endDate || 'Present'}</span></label>
                  <p><strong>${exp.organization}</strong></p>
                  <p>${exp.description || ''}</p>
                </li>
            `)}
            
            ${renderSection("Education", user.education, (edu) => `
                <li><label>${edu.degree} in ${edu.fieldOfStudy} <span>/ ${edu.startYear} - ${edu.endYear || 'Present'}</span></label>
                  <p><strong>${edu.institution}</strong></p>
                   <p>${edu.achievements || ''}</p>
                </li>
            `)}
          </section>
        </main>
    `;
}


function ResumePreviewDialog({ user }: { user: UserProfile }) {
    const [open, setOpen] = useState(false);
    const resumeHtml = getResumeHtml(user);

    const handleDownload = () => {
        const opt = {
          margin: 0,
          filename: `${user.name.replace(/\s+/g, '_')}_Resume.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
        const element = document.createElement('div');
        element.innerHTML = resumeHtml;
        html2pdf().from(element).set(opt).save();
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                 <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" /> Download Resume
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Resume Preview</DialogTitle>
                </DialogHeader>
                <ScrollArea className="flex-grow border rounded-lg bg-gray-50">
                    <div className="p-4" dangerouslySetInnerHTML={{ __html: resumeHtml }} />
                </ScrollArea>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
                    <Button onClick={handleDownload}>Download PDF</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export function ProfileActionsClient({ user, isOwner }: { user: UserProfile, isOwner: boolean }) {
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

    const fetchCurrentUser = React.useCallback(async () => {
        const u = await getUserProfile();
        setCurrentUser(u);
    }, []);

    useEffect(() => {
        fetchCurrentUser();
    }, [fetchCurrentUser]);

    return (
        <div className="flex items-center gap-2">
            <ResumePreviewDialog user={user} />
            {!isOwner && currentUser && (
                 <>
                    <FollowButton currentUser={currentUser} targetUser={user} onFollowToggle={fetchCurrentUser} />
                    <AddToCircleDialog user={user} trigger={
                        <Button variant="secondary">
                            <Plus className="mr-2 h-4 w-4" /> Add to Circle
                        </Button>
                    }/>
                 </>
            )}
        </div>
    )
}

    