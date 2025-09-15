
import { redirect } from 'next/navigation';

export default function DeprecatedOnboardingProfilePage() {
    // This page is no longer needed as the AdminLayout now handles the MFA check.
    // Redirecting to the main dashboard as a safe fallback.
    redirect('/admin/activity');
}
