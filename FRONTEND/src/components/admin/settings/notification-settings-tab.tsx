
'use client';

import React, { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Loader2, Save } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile } from '@/types';
import { updateProfileSettings } from '@/actions/profile.actions';
import { Separator } from '@/components/ui/separator';

function SubmitButton({ children, disabled }: { children?: React.ReactNode, disabled?: boolean }) {
    const { pending } = useFormStatus();
    return (
        <Button disabled={pending || disabled}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {children || 'Save Changes'}
        </Button>
    );
}

const notificationItems = {
    inApp: [
        { id: 'messages', label: 'New Direct Messages' },
        { id: 'replies', label: 'Replies to your posts & comments' },
        { id: 'circleActivity', label: 'Activity in your circles' },
        { id: 'newFollower', label: 'New followers' },
        { id: 'bookPublished', label: 'New books from followed authors' },
        { id: 'newChapterInBook', label: 'New chapter from followed authors'},
        { id: 'newArticleInBook', label: 'New article from followed authors'},
        { id: 'newSerial', label: 'New serial from followed authors'},
        { id: 'newSerialEpisode', label: 'New episode from followed authors'},
        { id: 'repositoryUpdate', label: 'Updates to subscribed repositories' },
        { id: 'mention', label: 'When someone @mentions you' },
    ],
};

export function NotificationSettingsTab({ userProfile }: { userProfile: UserProfile }) {
    const [state, formAction] = useActionState(updateProfileSettings, null);
    const { toast } = useToast();

    useEffect(() => {
        if (state?.success) {
            toast({ title: "Success", description: "Notification settings updated." });
        }
        if (state?.error) {
            toast({ variant: 'destructive', title: "Error", description: state.error });
        }
    }, [state, toast]);
    
    const prefs = userProfile.preferences?.notifications;

    return (
        <form action={formAction}>
            <Card>
                <CardHeader>
                    <CardTitle>Notification Settings</CardTitle>
                    <CardDescription>Choose how you want to be notified about activity on Vaikhari.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4 p-4 border rounded-lg">
                        <h4 className="font-semibold">In-App Notifications</h4>
                        {notificationItems.inApp.map(item => (
                             <div key={item.id} className="flex items-center justify-between">
                                <Label htmlFor={`inApp.${item.id}`}>{item.label}</Label>
                                <Switch 
                                    id={`inApp.${item.id}`} 
                                    name={`notifications.inApp.${item.id}`}
                                    defaultChecked={prefs?.inApp?.[item.id as keyof typeof prefs.inApp] ?? true}
                                />
                            </div>
                        ))}
                    </div>

                     <div className="space-y-4 p-4 border rounded-lg">
                         <h4 className="font-semibold">Email Notifications</h4>
                        <div className="flex items-center justify-between">
                            <Label>Email Digest</Label>
                            <RadioGroup name="notifications.email.digest" defaultValue={prefs?.email?.digest || 'daily'} className="flex gap-4">
                                <Label className="flex items-center gap-2 cursor-pointer"><RadioGroupItem value="daily" id="daily" />Daily</Label>
                                <Label className="flex items-center gap-2 cursor-pointer"><RadioGroupItem value="weekly" id="weekly" />Weekly</Label>
                                <Label className="flex items-center gap-2 cursor-pointer"><RadioGroupItem value="never" id="never" />Never</Label>
                            </RadioGroup>
                        </div>
                        <Separator />
                         <div className="flex items-center justify-between">
                            <Label htmlFor="email.alerts">Important Alerts</Label>
                            <Switch id="email.alerts" name="notifications.email.alerts" defaultChecked={prefs?.email?.alerts ?? true} />
                        </div>
                     </div>
                     <div className="space-y-4 p-4 border rounded-lg">
                        <h4 className="font-semibold">Sounds</h4>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="sounds">Enable Notification Sounds</Label>
                            <Switch id="sounds" name="notifications.sounds" defaultChecked={prefs?.sounds ?? true} />
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <SubmitButton>Save Notification Settings</SubmitButton>
                </CardFooter>
            </Card>
        </form>
    );
}
