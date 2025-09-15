import { notFound } from 'next/navigation';

export default function QAPage({ params: { postId } }: { params: { postId: string } }) {
    notFound();
}
