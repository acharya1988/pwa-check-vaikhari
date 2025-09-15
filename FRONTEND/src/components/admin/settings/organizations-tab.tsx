
'use client';

import React, { useState, useEffect } from 'react';
import type { UserProfile, Organization } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Building, Edit } from 'lucide-react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { OrganizationDesignerPage } from '@/app/admin/organizations/organization-designer/page';

function OrganizationList({ organizations, onEdit }: { organizations: Organization[], onEdit: (org: Organization) => void }) {
    if (organizations.length === 0) {
        return (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <Building className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No organizations in this category.</p>
            </div>
        );
    }
    
    return (
        <div className="space-y-3">
            {organizations.map(org => (
                <Card key={org.id} className="flex items-center p-4">
                    <div className="flex-1">
                        <p className="font-semibold">{org.name}</p>
                        <p className="text-sm text-muted-foreground">{org.tagline || 'No tagline'}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => onEdit(org)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                    </Button>
                </Card>
            ))}
        </div>
    );
}


export function OrganizationsTab({ userProfile, userCircles, onOrganizationCreated }: { userProfile: UserProfile, userCircles: (Organization & {type?: 'organization'})[], onOrganizationCreated: () => void }) {
    const [editingOrg, setEditingOrg] = useState<Organization | null>(null);

    const myOrganizations = userCircles.filter(c => c.ownerId === userProfile.email);
    const sharedOrganizations = userCircles.filter(c => c.ownerId !== userProfile.email);
    
    const handleEditComplete = () => {
        setEditingOrg(null);
        onOrganizationCreated(); // Re-fetch data
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <CardTitle>Organizations</CardTitle>
                        <CardDescription>Manage your formal affiliations and institutions.</CardDescription>
                    </div>
                     <Button asChild>
                        <Link href="/admin/organizations/organization-designer">
                            <Plus className="mr-2 h-4 w-4" /> Create New
                        </Link>
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    <div>
                        <h4 className="font-semibold mb-2">My Organizations</h4>
                        <OrganizationList organizations={myOrganizations} onEdit={setEditingOrg} />
                    </div>
                    <div>
                        <h4 className="font-semibold mb-2">Organizations Shared With Me</h4>
                         <OrganizationList organizations={sharedOrganizations} onEdit={setEditingOrg} />
                    </div>
                </div>

                <Dialog open={!!editingOrg} onOpenChange={(isOpen) => !isOpen && setEditingOrg(null)}>
                    <DialogContent className="max-w-6xl h-[90vh]">
                       <OrganizationDesignerPage organizationToEdit={editingOrg} onComplete={handleEditComplete} />
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}
