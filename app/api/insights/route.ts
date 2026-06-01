import { NextResponse } from 'next/server';
import { getContext } from '@/lib/server-context';
import { createClient } from '@/lib/supabase/server';
import { todayInTz, dateInTz, tzDateOf } from '@/lib/date';
import type { AdviceItem, EmotionLogEntry, InsightsData, MoodPoint } from '@/lib/types';

interface CommitRow { id: string; target_date: string; status: string }
interface ResRow {
  commitment_id: string;
  counted: boolean;
  mood: number | null;
  energy: number | null;
  note: string | null;
  additions: number;
  verdict: string | null;
  lesson_title: string | null;
  lesson_body: string | null;
  created_at: string;
}

// Diff size → heatmap intensity (GitHub-style 1..4).
function level(additions: number): number {
  if (additions < 20) return 1;
  if (additions < 80) return 2;
  if (additions < 200) return 3;
  return 4;
}

export async function GET() {
  const ctx = await getContext();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const supabase = await createClient();
  const tz = ctx.profile.timezone;
  const today = todayInTz(tz);

  const [{ data: commits }, { data: resolutions }] = await Promise.all([
    supabase
      .from('commitments')
      .select('id, target_date, status')
      .eq('user_id', ctx.userId)
      .returns<CommitRow[]>(),
    supabase
      .from('resolutions')
      .select('commitment_id, counted, mood, energy, note, additions, verdict, lesson_title, lesson_body, created_at')
      .eq('user_id', ctx.userId)
      .eq('counted', true)
      .order('created_at', { ascending: false })
      .returns<ResRow[]>(),
  ]);

  const commitList = commits ?? [];
  const resList = resolutions ?? [];

  // Latest counted resolution per commitment.
  const resByCommit = new Map<string, ResRow>();
  for (const r of resList) if (!resByCommit.has(r.commitment_id)) resByCommit.set(r.commitment_id, r);

  // Per-date status.
  type Day = { status: 'kept' | 'missed' | 'pending'; mood: number | null; energy: number | null; additions: number };
  const byDate = new Map<string, Day>();
  for (const c of commitList) {
    const r = resByCommit.get(c.id);
    const status: Day['status'] = r ? 'kept' : c.target_date < today ? 'missed' : 'pending';
    byDate.set(c.target_date, { status, mood: r?.mood ?? null, energy: r?.energy ?? null, additions: r?.additions ?? 0 });
  }

  // Heatmap: last 84 days, oldest → newest.
  const heatmap: number[] = [];
  for (let i = 83; i >= 0; i--) {
    const d = dateInTz(tz, -i);
    const e = byDate.get(d);
    if (!e || e.status === 'pending') heatmap.push(-1);
    else if (e.status === 'missed') heatmap.push(0);
    else heatmap.push(level(e.additions));
  }

  // Mood + energy: last 14 days (parallel series).
  const mood: MoodPoint[] = [];
  const energy: MoodPoint[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = dateInTz(tz, -i);
    const e = byDate.get(d);
    mood.push({ value: e?.mood ?? 0, committed: e?.status === 'kept' });
    energy.push({ value: e?.energy ?? 0, committed: e?.status === 'kept' });
  }

  // Reflections: recent check-ins that carry a note (the journal view).
  const reflections: EmotionLogEntry[] = resList
    .filter((r) => (r.note && r.note.trim()) || r.mood || r.energy)
    .slice(0, 30)
    .map((r) => ({
      date: tzDateOf(r.created_at, tz),
      mood: r.mood,
      energy: r.energy,
      note: r.note?.trim() || null,
    }));

  // Commit rate over fully-past commitments.
  const past = commitList.filter((c) => c.target_date < today);
  const keptPast = past.filter((c) => resByCommit.has(c.id)).length;
  const commitRate = past.length ? Math.round((keptPast / past.length) * 100) : null;

  const totalDays = commitList.filter((c) => c.target_date <= today).length;

  // Advice log: most recent lessons.
  const advice: AdviceItem[] = resList
    .filter((r) => (r.lesson_body ?? r.lesson_title))
    .slice(0, 6)
    .map((r) => ({
      tone: r.verdict === 'good' ? 'green' : 'amber',
      category: r.verdict === 'good' ? 'what worked' : 'the lesson',
      text: r.lesson_body || r.lesson_title || '',
    }));

  const data: InsightsData = {
    currentStreak: ctx.profile.current_streak,
    longestStreak: ctx.profile.longest_streak,
    daysCounted: resByCommit.size,
    commitRate,
    totalDays,
    heatmap,
    mood,
    energy,
    reflections,
    advice,
  };

  return NextResponse.json(data);
}
