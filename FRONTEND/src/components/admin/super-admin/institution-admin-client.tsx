
'use client';

import React, { useActionState, useEffect, useState } from 'react';
import type { Organization } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Check, X, ShieldAlert, Shield, ShieldOff, Building } from 'lucide-react';
import { approveOrganization, denyOrganization } from '@/actions/super-admin.actions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from 'date-fns';

function ActionButton({
  orgId,
  action,
  onAction,
  children,
  variant = 'default',
}: {
  orgId: string;
  action: 'approve' | 'deny';
  onAction: (orgId: string, action: 'approve' | 'deny') => void;
  children: React.ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary';
}) {
  return (
    <Button
      variant={variant}
      size="sm"
      onClick={() => onAction(orgId, action)}
    >
      {children}
    </Button>
  );
}

function OrgTable({
  organizations,
  onAction,
}: {
  organizations: Organization[];
  onAction: (orgId: string, action: 'approve' | 'deny') => void;
}) {
    if (organizations.length === 0) {
        return (
            <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                <p>No organizations in this category.</p>
            </div>
        );
    }
    
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Organization</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {organizations.map(org => (
                    <TableRow key={org.id}>
                        <TableCell className="font-medium flex items-center gap-3">
                            <Avatar className="h-9 w-9 rounded-sm">
                                {org.logoUrl ? <AvatarImage src={org.logoUrl} /> : <AvatarFallback><Building /></AvatarFallback>}
                            </Avatar>
                            {org.name}
                        </TableCell>
                        <TableCell>{org.ownerId}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{format(new Date(org.createdAt), 'PPP')}</TableCell>
                        <TableCell>
                            <Badge variant={org.verificationStatus === 'verified' ? 'success' : 'secondary'}>
                                {org.verificationStatus}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                           {org.verificationStatus === 'pending' && <>
                               <Button variant="outline" size="sm">View</Button>
                               <ActionButton orgId={org.id} action="deny" variant="destructive" onAction={onAction}><X className="mr-2 h-4 w-4" /> Deny</ActionButton>
                               <ActionButton orgId={org.id} action="approve" onAction={onAction}><Check className="mr-2 h-4 w-4" /> Approve</ActionButton>
                           </>}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}

export function InstitutionAdminClient({ organizations: initialOrganizations }: { organizations: Organization[] }) {
    const [organizations, setOrganizations] = useState(initialOrganizations);
    const { toast } = useToast();

    const handleAction = async (orgId: string, action: 'approve' | 'deny') => {
        const formData = new FormData();
        formData.append('organizationId', orgId);
        
        let result;
        switch(action) {
            case 'approve': result = await approveOrganization({}, formData); break;
            case 'deny': result = await denyOrganization({}, formData); break;
        }
        
        if(result.success) {
            toast({ title: 'Success', description: result.message });
            setOrganizations(prev => prev.map(o => o.id === orgId ? {...o, verificationStatus: action === 'approve' ? 'verified' : 'unverified'} : o));
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
    };
    
    const pendingOrgs = organizations.filter(o => o.verificationStatus === 'pending');
    const verifiedOrgs = organizations.filter(o => o.verificationStatus === 'verified');
    const otherOrgs = organizations.filter(o => !['pending', 'verified'].includes(o.verificationStatus));
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Institution Management</CardTitle>
                <CardDescription>Approve requests, manage verified status, and moderate institutions.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Tabs defaultValue="pending" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="pending">Pending ({pendingOrgs.length})</TabsTrigger>
                        <TabsTrigger value="verified">Verified ({verifiedOrgs.length})</TabsTrigger>
                        <TabsTrigger value="other">Other ({otherOrgs.length})</TabsTrigger>
                        <TabsTrigger value="all">All ({organizations.length})</TabsTrigger>
                    </TabsList>
                    <TabsContent value="pending" className="mt-4">
                        <OrgTable organizations={pendingOrgs} onAction={handleAction} />
                    </TabsContent>
                    <TabsContent value="verified" className="mt-4">
                        <OrgTable organizations={verifiedOrgs} onAction={handleAction} />
                    </TabsContent>
                    <TabsContent value="other" className="mt-4">
                        <OrgTable organizations={otherOrgs} onAction={handleAction} />
                    </TabsContent>
                    <TabsContent value="all" className="mt-4">
                        <OrgTable organizations={organizations} onAction={handleAction} />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}


    