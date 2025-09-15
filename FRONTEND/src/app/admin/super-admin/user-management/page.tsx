
'use client';

import { getDiscoverableUsers } from '@/services/user.service';
import type { UserProfile } from '@/types';
import { useEffect, useState } from 'react';
import { VerificationAdminClient } from '../verification-admin';
import { LoadingAnimation } from '@/components/loading-animation';

function PageSkeleton() {
    return <LoadingAnimation />;
}

export default function UserManagementPage() {
    const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        getDiscoverableUsers().then(users => {
            setAllUsers(users);
            setIsLoading(false);
        });
    }, []);

    if (isLoading) {
        return <PageSkeleton />;
    }
    
    return <VerificationAdminClient users={allUsers} />;
}
