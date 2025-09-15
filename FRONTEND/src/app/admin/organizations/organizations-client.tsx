

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Building, Edit } from 'lucide-react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import OrganizationDesignerPage from './organization-designer/page';
import type { Organization, UserProfile } from '@/types';
import { getAdministeredOrganizations, getOrganizations } from '@/services/organization.service';
import { getUserProfile } from '@/services/user.service';
import { LoadingAnimation } from '@/components/loading-animation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OrganizationBrowser } from './organization-browser';


function OrganizationsPageSkeleton() {
    return <LoadingAnimation />;
}

export default function OrganizationsClient() {
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [myOrganizations, setMyOrganizations] = useState<Organization[]>([]);
    const [sharedOrganizations, setSharedOrganizations] = useState<Organization[]>([]);
    const [allOrganizations, setAllOrganizations] = useState<Organization[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingOrg, setEditingOrg] = useState<Organization | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const profile = await getUserProfile();
            if (profile) {
                setUserProfile(profile);
                const [allOrgs, administeredOrgs] = await Promise.all([
                    getOrganizations(),
                    getAdministeredOrganizations(),
                ]);
                setAllOrganizations(allOrgs);
                setMyOrganizations(administeredOrgs.filter(o => o.ownerId === profile.email));
                setSharedOrganizations(administeredOrgs.filter(o => o.ownerId !== profile.email));
            }
        } catch (error) {
            console.error("Failed to fetch organizations data:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    const handleActionComplete = () => {
        setEditingOrg(null);
        fetchData();
    };

    if (isLoading || !userProfile) {
        return <OrganizationsPageSkeleton />;
    }

    return (
        <div className="space-y-6">
            <Dialog open={!!editingOrg} onOpenChange={(isOpen) => !isOpen && setEditingOrg(null)}>
                <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
                   <DialogHeader>
                        <DialogTitle>Edit Organization</DialogTitle>
                        <DialogDescription>
                            Make changes to your organization's profile. Click save when you're done.
                        </DialogDescription>
                   </DialogHeader>
                   <div className="flex-1 overflow-hidden -mx-6 -mb-6">
                        <OrganizationDesignerPage organizationToEdit={editingOrg} onComplete={handleActionComplete} />
                   </div>
                </DialogContent>
            </Dialog>

            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Organizations</h1>
                    <p className="text-muted-foreground">Manage your affiliations or explore other institutions.</p>
                </div>
                 <Button asChild>
                    <Link href="/admin/organizations/organization-designer">
                        <Plus className="mr-2 h-4 w-4" /> Create Organization
                    </Link>
                </Button>
            </div>
            <Tabs defaultValue="explore" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="explore">Explore Organizations ({allOrganizations.length})</TabsTrigger>
                    <TabsTrigger value="my-organizations">My Organizations ({myOrganizations.length})</TabsTrigger>
                    <TabsTrigger value="shared-organizations">Shared With Me ({sharedOrganizations.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="explore" className="pt-4">
                   <OrganizationBrowser organizations={allOrganizations} onEdit={setEditingOrg} onActionComplete={handleActionComplete} />
                </TabsContent>
                <TabsContent value="my-organizations" className="pt-4">
                     {myOrganizations.length > 0 ? (
                        <OrganizationBrowser organizations={myOrganizations} onEdit={setEditingOrg} onActionComplete={handleActionComplete} />
                     ) : (
                         <div className="text-center py-12 border-2 border-dashed rounded-lg">
                            <Building className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">You haven't created any organizations yet.</p>
                        </div>
                     )}
                </TabsContent>
                 <TabsContent value="shared-organizations" className="pt-4">
                     {sharedOrganizations.length > 0 ? (
                        <OrganizationBrowser organizations={sharedOrganizations} onEdit={setEditingOrg} onActionComplete={handleActionComplete} />
                     ) : (
                         <div className="text-center py-12 border-2 border-dashed rounded-lg">
                            <Building className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">No organizations have been shared with you.</p>
                        </div>
                     )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
