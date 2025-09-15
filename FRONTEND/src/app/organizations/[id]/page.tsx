


import { getOrganization } from '@/services/organization.service';
import { notFound } from 'next/navigation';
import { OrganizationOnePageRenderer } from '@/components/OrganizationOnePage';
import type { Organization } from '@/types';
import { THEME_PRESETS } from '@/components/theme/theme-presets';

export default async function OrgPublicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const orgRaw = await getOrganization(id);

  // A more robust check for verification status.
  const isVerified = orgRaw?.verificationStatus === "verified" || orgRaw?.compliance?.verificationStatus === "verified";
  
  if (!orgRaw || !isVerified) {
    return (
        <div className="flex items-center justify-center h-screen">
            <div className="text-center">
                <h1 className="text-2xl font-bold">Organization Not Found</h1>
                <p className="text-muted-foreground">This organization may not exist or is pending verification.</p>
            </div>
        </div>
    );
  }
  
  // Resolve theme locally to avoid server Firestore access
  const themeName = orgRaw.theme || 'Saraswati';
  const themeObject = THEME_PRESETS.find(p => p.themeName === themeName) || THEME_PRESETS[0];
  
  const org = {
      ...orgRaw,
      themeObject, // Attach the theme object to the organization data
  };

  return <OrganizationOnePageRenderer org={org} />;
}
