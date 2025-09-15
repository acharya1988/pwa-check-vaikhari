
'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import type { UserProfile } from '@/types';

interface UserProfileContextType {
    userProfile: UserProfile | null;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export function UserProfileProvider({ children, userProfile }: { children: ReactNode, userProfile: UserProfile | null }) {
    return (
        <UserProfileContext.Provider value={{ userProfile }}>
            {children}
        </UserProfileContext.Provider>
    );
}

export function useUserProfile() {
    const context = useContext(UserProfileContext);
    if (context === undefined) {
        throw new Error('useUserProfile must be used within a UserProfileProvider');
    }
    return context;
}
