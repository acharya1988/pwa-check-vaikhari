
import { redirect } from 'next/navigation';

// Redirects the base /articles path to a more useful page.
export default function ArticlesPage() {
    redirect('/admin/books');
}
