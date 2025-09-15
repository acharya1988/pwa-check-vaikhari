
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Palette, ShieldCheck, Building, Bell, Settings as SettingsIcon } from 'lucide-react';
import type { UserProfile, Circle } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { getUserProfile } from '@/services/user.service';
import { getCirclesForUser } from '@/services/profile.service';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ProfileSettingsTab } from '@/components/admin/settings/profile-settings-tab';
import { AppearanceSettingsTab } from '@/components/admin/settings/appearance-settings-tab';
import { VerificationTab } from '@/components/admin/settings/verification-tab';
import { OrganizationsTab } from './organizations-tab';
import { NotificationSettingsTab } from '@/components/admin/settings/notification-settings-tab';
import { GeneralSettingsTab } from '@/components/admin/settings/general-settings-tab';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { LoadingAnimation } from '@/components/loading-animation';


function SettingsPageSkeleton() {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <LoadingAnimation />
      </div>
    );
}

export default function SettingsPage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const activeTab = searchParams.get('tab') || 'profile';

    const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null);
    const [userCircles, setUserCircles] = React.useState<Circle[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    const loadData = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const profile = await getUserProfile();
            if (profile) {
                setUserProfile(profile);
                const circles = await getCirclesForUser(profile.email);
                setUserCircles(circles);
            }
        } catch (error) {
            console.error("Failed to load user data", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    React.useEffect(() => {
        loadData();
    }, [loadData]);
    
    const handleTabChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', value);
        router.replace(`${pathname}?${params.toString()}`);
    };


    if (isLoading || !userProfile) {
        return <SettingsPageSkeleton />;
    }
    
    const tabs = [
        { value: 'profile', label: 'Profile & Account', icon: User, component: <ProfileSettingsTab userProfile={userProfile} /> },
        { value: 'organizations', label: 'Organizations', icon: Building, component: <OrganizationsTab userProfile={userProfile} userCircles={userCircles} onOrganizationCreated={loadData} /> },
        { value: 'notifications', label: 'Notifications', icon: Bell, component: <NotificationSettingsTab userProfile={userProfile} /> },
        { value: 'appearance', label: 'Appearance', icon: Palette, component: <AppearanceSettingsTab /> },
        { value: 'verification', label: 'Verification', icon: ShieldCheck, component: <VerificationTab userProfile={userProfile} /> },
        { value: 'general', label: 'General', icon: SettingsIcon, component: <GeneralSettingsTab /> },
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Settings</h1>
            <Tabs value={activeTab} onValueChange={handleTabChange}>
                <TabsList className="grid w-full grid-cols-6">
                    {tabs.map(tab => (
                         <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
                             <tab.icon className="h-4 w-4" /> {tab.label}
                         </TabsTrigger>
                    ))}
                </TabsList>
                {tabs.map(tab => (
                    <TabsContent key={tab.value} value={tab.value} className="mt-6">
                        {tab.component}
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}
