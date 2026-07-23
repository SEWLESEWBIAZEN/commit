import { notFound } from 'next/navigation';
import { getPublicProfileByToken } from '@/lib/share';
import { ShareView } from '@/components/share-view';

export const dynamic = 'force-dynamic';

export default async function SharedProfilePage({ params }: { params: { token: string } }) {
  const p = await getPublicProfileByToken(params.token);
  if (!p) notFound();
  return <ShareView p={p} />;
}

export const metadata = {
  title: 'Verified discipline · Commit',
  robots: { index: false, follow: false }, // unlisted link — don't index
};
