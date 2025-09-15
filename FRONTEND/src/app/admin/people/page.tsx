
'use client';

import { getDiscoverableUsers, getUserProfile } from '@/services/user.service';
import { getCirclesForUser } from '@/services/profile.service';
import type { UserProfile, Circle } from '@/types';
import { PeopleBrowser } from '@/components/admin/profile/people-browser';
import { useEffect, useState, useCallback } from 'react';
import { LoadingAnimation } from '@/components/loading-animation';

function PeoplePageSkeleton() {
    return <LoadingAnimation />;
}


export default function PeoplePage() {
    const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
    const [circles, setCircles] = useState<Circle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        const user = await getUserProfile();
        setCurrentUser(user);
        
        if (user) {
            const [all, circleData] = await Promise.all([
                getDiscoverableUsers(),
                getCirclesForUser(user.email)
            ]);
            setAllUsers(all);
            setCircles(circleData);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (isLoading || !currentUser) {
        return <PeoplePageSkeleton />;
    }

    return (
        <div className="space-y-6">
            <PeopleBrowser 
                allUsers={allUsers}
                currentUser={currentUser}
                currentUserCircles={circles}
                onDataNeeded={fetchData}
            />
        </div>
    );
}
