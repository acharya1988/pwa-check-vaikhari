
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import type { Circle, UserProfile } from '@/types';
import { UserCircles } from '@/components/admin/profile/user-circles';
import { getCirclesForUser } from '@/services/profile.service';
import { getUserProfile } from '@/services/user.service';
import { Skeleton } from '@/components/ui/skeleton';
import { LoadingAnimation } from '@/components/loading-animation';


function CirclesPageSkeleton() {
    return <LoadingAnimation />;
}

export default function CirclesPage() {
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [userCircles, setUserCircles] = useState<Circle[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const profile = await getUserProfile();
            if (profile) {
                setUserProfile(profile);
                const allCircles = await getCirclesForUser(profile.email);
                setUserCircles(allCircles);
            }
        } catch (error) {
            console.error("Failed to fetch user data and circles:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (isLoading || !userProfile) {
        return <CirclesPageSkeleton />;
    }

    return (
        <div className="space-y-6">
            <UserCircles
                circles={userCircles}
                onActionComplete={fetchData}
                currentUser={userProfile}
            />
        </div>
    );
}
