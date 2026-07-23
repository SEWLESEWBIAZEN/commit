import { notFound } from 'next/navigation';
import { getPublicProfileByLogin } from '@/lib/share';
import { ShareView } from '@/components/share-view';

export const dynamic = 'force-dynamic';

export default async function PublicProfilePage({ params }: { params: { login: string } }) {
  const p = await getPublicProfileByLogin(params.login);
  if (!p) notFound();
  return <ShareView p={p} />;
}

export function generateMetadata({ params }: { params: { login: string } }) {
  return {
    title: `@${params.login} — verified discipline · Commit`,
    description: `${params.login}'s GitHub-verified shipping streak on Commit.`,
  };
}
