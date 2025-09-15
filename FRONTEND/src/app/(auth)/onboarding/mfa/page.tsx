
import { redirect } from 'next/navigation';

export default function DeprecatedOnboardingMfaPage() {
    // This page is no longer needed. The MFA component is now shown conditionally
    // inside the protected admin layout. Redirecting to a safe page.
    redirect('/admin/activity');
}
