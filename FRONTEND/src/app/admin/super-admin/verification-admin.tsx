
'use client';

import React, { useActionState, useEffect, useState } from 'react';
import type { UserProfile } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { approveVerification, denyVerification, revokeVerificationAction, banUserAction, unbanUserAction } from '@/actions/super-admin.actions';
import { useToast } from '@/hooks/use-toast';
import { Check, X, ShieldAlert, Shield, ShieldOff } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function ActionButton({
  userId,
  action,
  onAction,
  children,
  variant = 'default',
}: {
  userId: string;
  action: 'approve' | 'deny' | 'revoke' | 'ban' | 'unban';
  onAction: (userId: string, action: 'approve' | 'deny' | 'revoke' | 'ban' | 'unban') => void;
  children: React.ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary';
}) {
  return (
    <Button
      variant={variant}
      size="sm"
      onClick={() => onAction(userId, action)}
    >
      {children}
    </Button>
  );
}

function UserTable({
  users,
  onAction,
  actionSet
}: {
  users: UserProfile[];
  onAction: (userId: string, action: 'approve' | 'deny' | 'revoke' | 'ban' | 'unban') => void;
  actionSet: 'pending' | 'verified' | 'revoked' | 'banned' | 'all';
}) {
    if (users.length === 0) {
        return (
            <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                <p>No users in this category.</p>
            </div>
        );
    }
    
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {users.map(user => (
                    <TableRow key={user.email}>
                        <TableCell className="font-medium flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={user.avatarUrl} alt={user.name} />
                                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            {user.name}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                            <Badge variant={user.verificationStatus === 'verified' ? 'success' : 'secondary'}>
                                {user.verificationStatus}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                           {actionSet === 'pending' && <>
                               <ActionButton userId={user.email} action="deny" variant="destructive" onAction={onAction}><X className="mr-2 h-4 w-4" /> Deny</ActionButton>
                               <ActionButton userId={user.email} action="approve" onAction={onAction}><Check className="mr-2 h-4 w-4" /> Approve</ActionButton>
                           </>}
                            {actionSet === 'verified' && <>
                                <ActionButton userId={user.email} action="revoke" variant="outline" onAction={onAction}><ShieldOff className="mr-2 h-4 w-4" /> Revoke</ActionButton>
                            </>}
                             {actionSet === 'revoked' && <>
                                <ActionButton userId={user.email} action="approve" onAction={onAction}><Check className="mr-2 h-4 w-4" /> Re-verify</ActionButton>
                            </>}
                             {actionSet === 'banned' && (
                                <ActionButton userId={user.email} action="unban" variant="outline" onAction={onAction}><Shield className="mr-2 h-4 w-4" /> Un-ban</ActionButton>
                            )}
                             {actionSet === 'all' && (
                                <>
                                    {user.verificationStatus === 'pending' && <ActionButton userId={user.email} action="approve" onAction={onAction}>Approve</ActionButton>}
                                    {user.verificationStatus === 'verified' && <ActionButton userId={user.email} action="revoke" variant="outline" onAction={onAction}>Revoke</ActionButton>}
                                    {user.verificationStatus !== 'banned' && <ActionButton userId={user.email} action="ban" variant="destructive" onAction={onAction}>Ban</ActionButton>}
                                    {user.verificationStatus === 'banned' && <ActionButton userId={user.email} action="unban" variant="outline" onAction={onAction}>Un-ban</ActionButton>}
                                </>
                            )}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}

export function VerificationAdminClient({ users: initialUsers }: { users: UserProfile[] }) {
    const [users, setUsers] = useState(initialUsers);
    const { toast } = useToast();

    const handleAction = async (userId: string, action: 'approve' | 'deny' | 'revoke' | 'ban' | 'unban') => {
        const formData = new FormData();
        formData.append('userId', userId);
        
        let result;
        switch(action) {
            case 'approve': result = await approveVerification({}, formData); break;
            case 'deny': result = await denyVerification({}, formData); break;
            case 'revoke': result = await revokeVerificationAction({}, formData); break;
            case 'ban': result = await banUserAction({}, formData); break;
            case 'unban': result = await unbanUserAction({}, formData); break;
        }
        
        if(result.success) {
            toast({ title: 'Success', description: result.message });
            setUsers(prev => prev.map(u => u.email === userId ? {...u, verificationStatus: action === 'approve' ? 'verified' : action === 'revoke' ? 'revoked' : action === 'ban' ? 'banned' : 'unverified'} : u));
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
    };
    
    const pendingUsers = users.filter(u => u.verificationStatus === 'pending');
    const verifiedUsers = users.filter(u => u.verificationStatus === 'verified');
    const revokedUsers = users.filter(u => u.verificationStatus === 'revoked');
    const bannedUsers = users.filter(u => u.verificationStatus === 'banned');
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>User Verification & Management</CardTitle>
                <CardDescription>Approve requests, manage verified status, and moderate users.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Tabs defaultValue="pending" className="w-full">
                    <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="pending">Pending ({pendingUsers.length})</TabsTrigger>
                        <TabsTrigger value="verified">Verified ({verifiedUsers.length})</TabsTrigger>
                        <TabsTrigger value="revoked">Revoked ({revokedUsers.length})</TabsTrigger>
                        <TabsTrigger value="banned">Banned ({bannedUsers.length})</TabsTrigger>
                        <TabsTrigger value="all">All Users ({users.length})</TabsTrigger>
                    </TabsList>
                    <TabsContent value="pending" className="mt-4">
                        <UserTable users={pendingUsers} onAction={handleAction} actionSet="pending" />
                    </TabsContent>
                    <TabsContent value="verified" className="mt-4">
                        <UserTable users={verifiedUsers} onAction={handleAction} actionSet="verified" />
                    </TabsContent>
                    <TabsContent value="revoked" className="mt-4">
                        <UserTable users={revokedUsers} onAction={handleAction} actionSet="revoked" />
                    </TabsContent>
                    <TabsContent value="banned" className="mt-4">
                         <UserTable users={bannedUsers} onAction={handleAction} actionSet="banned" />
                    </TabsContent>
                    <TabsContent value="all" className="mt-4">
                        <UserTable users={users} onAction={handleAction} actionSet="all" />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
