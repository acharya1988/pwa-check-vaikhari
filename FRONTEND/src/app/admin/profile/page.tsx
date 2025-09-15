
import { getUserProfile } from '@/services/user.service';
import { redirect } from 'next/navigation';

// This page now redirects to the logged-in user's dynamic profile page.
export default async function ProfileRedirectPage() {
    const user = await getUserProfile();
    if (user) {
        redirect(`/admin/profile/${encodeURIComponent(user.email)}`);
    } else {
        // If for some reason there's no user, fall back to login.
        redirect('/login');
    }
}
