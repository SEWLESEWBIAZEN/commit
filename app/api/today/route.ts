import { NextResponse } from 'next/server';
import { getContext } from '@/lib/server-context';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { latestPushAcrossRepos, commitDiffStat } from '@/lib/github';
import { todayInTz, startOfTodayUtc, minutesSince } from '@/lib/date';
import { notifyMissed } from '@/lib/notify';
import type { Commitment, Resolution, TodayResponse } from '@/lib/types';

export async function GET() {
  const ctx = await getContext();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const supabase = await createClient();
  const tz = ctx.profile.timezone;
  const today = todayInTz(tz);

  let streak = ctx.profile.current_streak;
  const prevStreak = ctx.profile.current_streak;
  const beginner = streak < 7;
  const repos = ctx.repos;
  let repo = ctx.repo; // becomes the push repo once a push is detected
  const partnerEmail = ctx.profile.partner_email;

  // Today's commitment (the one due today).
  const { data: todays } = await supabase
    .from('commitments')
    .select('*')
    .eq('user_id', ctx.userId)
    .eq('target_date', today)
    .maybeSingle<Commitment>();

  // ── Missed detection: a past commitment that was never kept resets the streak.
  const { data: pastOpen } = await supabase
    .from('commitments')
    .select('*')
    .eq('user_id', ctx.userId)
    .eq('status', 'open')
    .lt('target_date', today)
    .order('target_date', { ascending: false })
    .limit(1)
    .maybeSingle<Commitment>();

  if (pastOpen) {
    // Burn the streak and mark the day missed so this only fires once.
    const admin = createAdminClient();
    await admin
      .from('commitments')
      .update({ status: 'missed', partner_notified: true })
      .eq('id', pastOpen.id);
    await admin
      .from('profiles')
      .update({ current_streak: 0 })
      .eq('id', ctx.userId);

    // Notify (partner email + push to the user). Only fires once because the
    // commitment flips to 'missed' above and won't be re-detected.
    if (!pastOpen.partner_notified) {
      await notifyMissed(ctx.profile, prevStreak, pastOpen.body);
    }

    streak = 0;

    const res: TodayResponse = {
      state: 'missed',
      streak: 0,
      prevStreak,
      repo,
      repos,
      commitment: todays ?? null,
      push: null,
      resolution: null,
      beginner: true,
      partnerEmail,
    };
    return NextResponse.json(res);
  }

  // No commitment due today → first day / empty.
  if (!todays) {
    const res: TodayResponse = {
      state: 'empty',
      streak,
      prevStreak,
      repo,
      repos,
      commitment: null,
      push: null,
      resolution: null,
      beginner,
      partnerEmail,
    };
    return NextResponse.json(res);
  }

  // Already resolved (counted) today → rest.
  const { data: resolution } = await supabase
    .from('resolutions')
    .select('*')
    .eq('commitment_id', todays.id)
    .eq('counted', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle<Resolution>();

  if (resolution) {
    const res: TodayResponse = {
      state: 'rest',
      streak,
      prevStreak,
      repo,
      repos,
      commitment: todays,
      push: null,
      resolution,
      beginner,
      partnerEmail,
    };
    return NextResponse.json(res);
  }

  // Has a commitment, not yet resolved → look for today's push across ALL
  // tracked repos. The most recent push wins and becomes the repo we resolve.
  let push: TodayResponse['push'] = null;
  if (repos.length > 0 && ctx.token && ctx.login) {
    try {
      const latest = await latestPushAcrossRepos(
        repos,
        startOfTodayUtc(tz).toISOString(),
        ctx.login,
        { token: ctx.token },
      );
      if (latest) {
        const stat = await commitDiffStat(latest.repo, latest.commit_sha, { token: ctx.token });
        repo = latest.repo;
        push = {
          commit_sha: latest.commit_sha,
          commits: latest.commits,
          additions: stat.additions,
          deletions: stat.deletions,
          files: stat.files,
          minutesAgo: minutesSince(latest.authoredAt),
          repo: latest.repo,
        };
      }
    } catch {
      // GitHub hiccup — fall through to "awaiting" rather than erroring the screen.
      push = null;
    }
  }

  const res: TodayResponse = {
    state: push ? 'ready' : 'awaiting',
    streak,
    prevStreak,
    repo,
    repos,
    commitment: todays,
    push,
    resolution: null,
    beginner,
    partnerEmail,
  };
  return NextResponse.json(res);
}
