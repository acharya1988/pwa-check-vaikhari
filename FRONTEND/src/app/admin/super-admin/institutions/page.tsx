
'use client';

import { getOrganizations } from '@/services/organization.service';
import type { Organization } from '@/types';
import { useEffect, useState } from 'react';
import { LoadingAnimation } from '@/components/loading-animation';
import { InstitutionAdminClient } from '@/components/admin/super-admin/institution-admin-client';

function PageSkeleton() {
    return <LoadingAnimation />;
}

export default function InstitutionsPage() {
    const [allOrganizations, setAllOrganizations] = useState<Organization[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        getOrganizations().then(orgs => {
            setAllOrganizations(orgs);
            setIsLoading(false);
        });
    }, []);

    if (isLoading) {
        return <PageSkeleton />;
    }
    
    return <InstitutionAdminClient organizations={allOrganizations} />;
}
