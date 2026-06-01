import { NextResponse, type NextRequest } from 'next/server';
import { getContext } from '@/lib/server-context';
import { listCommitsInRange } from '@/lib/github';
import { tzDateOf } from '@/lib/date';

// Per-day commit counts for a given month (in the user's timezone), for the
// navigable monthly commit graph.
export async function GET(request: NextRequest) {
  const ctx = await getContext();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const now = new Date();
  const year = parseInt(searchParams.get('year') || '', 10) || now.getUTCFullYear();
  const month = parseInt(searchParams.get('month') || '', 10) || now.getUTCMonth() + 1; // 1-12

  if (!ctx.repo || !ctx.token) {
    return NextResponse.json({ year, month, counts: {}, total: 0 });
  }

  // Pad the UTC window by ~14h on each side so timezone-edge commits land in
  // the right local day after bucketing.
  const since = new Date(Date.UTC(year, month - 1, 1, -14));
  const until = new Date(Date.UTC(year, month, 1, 14));

  try {
    const dates = await listCommitsInRange(ctx.repo, since.toISOString(), until.toISOString(), {
      token: ctx.token,
    });
    const counts: Record<string, number> = {};
    for (const d of dates) {
      const key = tzDateOf(d, ctx.profile.timezone);
      counts[key] = (counts[key] || 0) + 1;
    }
    const total = Object.entries(counts)
      .filter(([k]) => k.startsWith(`${year}-${String(month).padStart(2, '0')}`))
      .reduce((sum, [, n]) => sum + n, 0);
    return NextResponse.json({ year, month, counts, total });
  } catch (e) {
    return NextResponse.json({ year, month, counts: {}, total: 0, error: (e as Error).message });
  }
}
