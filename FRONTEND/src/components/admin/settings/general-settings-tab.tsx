
'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SUPPORTED_LANGUAGES, useLanguage } from '@/components/transliteration-provider';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { Button } from '@/components/ui/button';
import { deleteUser } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';

export function GeneralSettingsTab() {
    const { targetLang, setTargetLang } = useLanguage();
    const { toast } = useToast();
    const { user } = useAuthGuard();
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmText, setConfirmText] = useState('');

    const handleDeleteAccount = async () => {
        if (!user) return;
        try {
            // Re-authentication might be required for this sensitive operation.
            // For simplicity, we are assuming the user has recently signed in.
            await deleteUser(auth.currentUser!);
            toast({ title: 'Account Deleted', description: 'Your account has been successfully deleted.' });
            setConfirmOpen(false);
        } catch(error: any) {
            toast({ variant: 'destructive', title: 'Error', description: `Failed to delete account: ${error.message}` });
        }
    }

    return (
        <Card>
            <CardHeader><CardTitle>General Settings</CardTitle><CardDescription>Manage general application settings.</CardDescription></CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="defaultLanguage">Default Translation Language</Label>
                    <Select value={targetLang} onValueChange={setTargetLang}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {SUPPORTED_LANGUAGES.map(lang => (
                                <SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <Card className="border-destructive">
                    <CardHeader>
                        <CardTitle className="text-destructive">Danger Zone</CardTitle>
                        <CardDescription className="text-destructive/80">These actions are irreversible. Please proceed with caution.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-semibold">Delete Account</h4>
                                <p className="text-sm text-muted-foreground">Permanently delete your account and all associated data.</p>
                            </div>
                             <Button variant="destructive" onClick={() => { setConfirmText(''); setConfirmOpen(true); }}>Delete My Account</Button>
                        </div>
                        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Type "DELETE MY ACCOUNT" to confirm</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action is permanent and cannot be undone. All your data will be removed.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="space-y-2">
                                    <Label htmlFor="confirm-delete">Confirmation</Label>
                                    <Input
                                        id="confirm-delete"
                                        value={confirmText}
                                        onChange={(e) => setConfirmText(e.target.value)}
                                        placeholder="DELETE MY ACCOUNT"
                                    />
                                </div>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction asChild>
                                        <Button
                                            variant="destructive"
                                            onClick={handleDeleteAccount}
                                            disabled={confirmText.trim().toUpperCase() !== 'DELETE MY ACCOUNT'}
                                        >
                                            Delete Account
                                        </Button>
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </CardContent>
                </Card>
            </CardContent>
        </Card>
    );
}
