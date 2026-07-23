import { createAdminClient } from '@/lib/supabase/admin';
import { todayInTz, dateInTz } from '@/lib/date';
import type { Profile } from '@/lib/types';

// The recruiter-safe public payload. Derived purely from streak/commitment
// history — deliberately NO repo names, commit messages, reflections, mood,
// or coach lessons.
export interface PublicProfile {
  login: string;
  avatar: string | null;
  currentStreak: number;
  longestStreak: number;
  commitRate: number | null; // 0..100
  daysCounted: number;
  totalDays: number;
  heatmap: number[]; // 84 cells (12 weeks), -1 none, 0 missed, 1..4 kept
  memberSince: string; // e.g. "Jun 2026"
}

interface CommitRow { id: string; target_date: string }
interface ResRow { commitment_id: string; additions: number }

function level(additions: number): number {
  if (additions < 20) return 1;
  if (additions < 80) return 2;
  if (additions < 200) return 3;
  return 4;
}

async function build(profile: Profile): Promise<PublicProfile> {
  const admin = createAdminClient();
  const tz = profile.timezone || 'UTC';
  const today = todayInTz(tz);

  const [{ data: commits }, { data: res }] = await Promise.all([
    admin.from('commitments').select('id, target_date').eq('user_id', profile.id).returns<CommitRow[]>(),
    admin.from('resolutions').select('commitment_id, additions').eq('user_id', profile.id).eq('counted', true).returns<ResRow[]>(),
  ]);

  const commitList = commits ?? [];
  const keptByCommit = new Map<string, ResRow>();
  for (const r of res ?? []) if (!keptByCommit.has(r.commitment_id)) keptByCommit.set(r.commitment_id, r);

  type Day = { status: 'kept' | 'missed' | 'pending'; additions: number };
  const byDate = new Map<string, Day>();
  for (const c of commitList) {
    const r = keptByCommit.get(c.id);
    const status: Day['status'] = r ? 'kept' : c.target_date < today ? 'missed' : 'pending';
    byDate.set(c.target_date, { status, additions: r?.additions ?? 0 });
  }

  const heatmap: number[] = [];
  for (let i = 83; i >= 0; i--) {
    const e = byDate.get(dateInTz(tz, -i));
    if (!e || e.status === 'pending') heatmap.push(-1);
    else if (e.status === 'missed') heatmap.push(0);
    else heatmap.push(level(e.additions));
  }

  const past = commitList.filter((c) => c.target_date < today);
  const keptPast = past.filter((c) => keptByCommit.has(c.id)).length;
  const commitRate = past.length ? Math.round((keptPast / past.length) * 100) : null;

  const memberSince = new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  return {
    login: profile.github_login ?? 'developer',
    avatar: profile.github_avatar,
    currentStreak: profile.current_streak,
    longestStreak: profile.longest_streak,
    commitRate,
    daysCounted: keptByCommit.size,
    totalDays: commitList.filter((c) => c.target_date <= today).length,
    heatmap,
    memberSince,
  };
}

// Public profile at /u/<login> — only if the owner opted in.
export async function getPublicProfileByLogin(login: string): Promise<PublicProfile | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('profiles')
    .select('*')
    .ilike('github_login', login)
    .eq('public_enabled', true)
    .limit(1)
    .maybeSingle<Profile>();
  return data ? build(data) : null;
}

// Unlisted revocable link at /share/<token>.
export async function getPublicProfileByToken(token: string): Promise<PublicProfile | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('profiles')
    .select('*')
    .eq('share_token', token)
    .limit(1)
    .maybeSingle<Profile>();
  return data ? build(data) : null;
}
