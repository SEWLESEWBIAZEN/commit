'use client';
import React, { useState, useEffect } from 'react';
import { Icon, SectionLabel, Button } from './ui';
import { relativeTime } from '@/lib/date';
import type { InsightsData, MoodPoint, AdviceItem, RepoCommit, EmotionLogEntry } from '@/lib/types';

// ── GitHub-green heatmap (12 weeks) ───────────────────────────
// Authentic GH contribution colors. Cell values: -1 none/pending, 0 missed, 1..4 kept.
const GH_GREENS = ['#0E4429', '#006D32', '#26A641', '#39D353'];

function bgFor(v: number) {
  if (v <= -1) return 'var(--cell)';
  if (v === 0) return 'var(--border)';
  return GH_GREENS[Math.min(v, 4) - 1];
}

function Legend() {
  return (
    <div className="mt-2.5 flex items-center justify-end gap-1.5">
      <span className="mono text-[10px] text-hint">less</span>
      {[1, 2, 3, 4].map(v => <div key={v} className="h-2.5 w-2.5 rounded-[2px]" style={{ background: GH_GREENS[v - 1] }} />)}
      <span className="mono text-[10px] text-hint">more</span>
    </div>
  );
}

function Heatmap({ levels, weeks = 12 }: { levels?: number[]; weeks?: number }) {
  // Fall back to a sample pattern if no real data is passed.
  let flat = levels;
  if (!flat) {
    let seed = 7;
    const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    flat = Array.from({ length: weeks * 7 }, (_, i) => {
      if (i % 17 === 5 || i % 23 === 11) return 0;
      return 1 + Math.floor(rnd() * 4);
    });
  }
  const cells = Array.from({ length: weeks }, (_, w) => flat!.slice(w * 7, w * 7 + 7));

  return (
    <div>
      <div className="flex gap-[3px]">
        {cells.map((col, w) => (
          <div key={w} className="flex flex-1 flex-col gap-[3px]">
            {col.map((v, d) => (
              <div key={d} className="aspect-square w-full rounded-[2.5px]" style={{ background: bgFor(v) }} />
            ))}
          </div>
        ))}
      </div>
      <Legend />
    </div>
  );
}

// ── Mood / energy bar chart (filled = committed, gray = missed/none) ─────
function MoodBars({ mood, fill = '#26A641' }: { mood?: MoodPoint[]; fill?: string }) {
  const data: MoodPoint[] =
    mood ??
    [4, 3, 5, 2, 4, 4, 3, 1, 4, 5, 3, 4, 2, 5].map((value, i) => ({
      value,
      committed: [1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1][i] === 1,
    }));
  return (
    <div className="flex h-[46px] items-end gap-1">
      {data.map((m, i) => (
        <div
          key={i}
          className="flex-1 rounded-[2px] transition-[height]"
          style={{
            background: m.value > 0 ? (m.committed ? fill : 'var(--hint)') : 'var(--border)',
            height: `${Math.max(m.value / 5, 0.08) * 100}%`,
          }}
        />
      ))}
    </div>
  );
}

// ── Reflections (past notes + mood/energy badges) ──────────────
function ScaleBadge({ label, value, color }: { label: string; value: number | null; color: string }) {
  if (!value) return null;
  return (
    <span className="mono inline-flex items-center gap-1 text-[10.5px]" style={{ color }}>
      {label} {value}/5
    </span>
  );
}

function formatRefDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const wd = dt.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }).toLowerCase();
  const mo = dt.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }).toLowerCase();
  return `${wd} · ${mo} ${d}`;
}

function Reflections({ entries }: { entries: EmotionLogEntry[] }) {
  if (!entries || entries.length === 0) {
    return <div className="text-[13px] leading-normal text-hint">Notes from your check-ins will collect here.</div>;
  }
  return (
    <div className="flex flex-col gap-2.5">
      {entries.map((e, i) => (
        <div key={i} className="rounded border border-border bg-surface p-[14px]">
          <div className="flex items-center gap-2.5" style={{ marginBottom: e.note ? 8 : 0 }}>
            <span className="mono text-[11px] text-hint">{formatRefDate(e.date)}</span>
            <span className="flex-1" />
            <ScaleBadge label="mood" value={e.mood} color="var(--blue)" />
            <ScaleBadge label="energy" value={e.energy} color="var(--green)" />
          </div>
          {e.note && <div className="text-sm leading-[1.55] text-muted">{e.note}</div>}
        </div>
      ))}
    </div>
  );
}

// ── Advice card ────────────────────────────────────────────────
interface AdviceCardProps { tone: 'amber' | 'green'; category: string; text: string; acked: boolean; onAck: () => void; }
function AdviceCard({ tone, category, text, acked, onAck }: AdviceCardProps) {
  const color = tone === 'amber' ? 'var(--amber)' : 'var(--green)';
  return (
    <div className="rounded border border-border bg-surface p-[14px]">
      <div className="mb-2 flex items-center gap-1.5">
        <Icon name="spark" size={15} style={{ color }} />
        <span className="mono text-[10.5px] tracking-[0.04em]" style={{ color }}>{category}</span>
      </div>
      <div className="text-[13.5px] leading-[1.55] text-muted">{text}</div>
      <button onClick={onAck} className="mono mt-2.5 inline-flex items-center gap-[5px] border-0 bg-transparent p-0 text-[11.5px]" style={{ color: acked ? 'var(--green)' : 'var(--blue)' }}>
        {acked ? <><Icon name="check" size={12} sw={2.4} />acknowledged</> : 'acknowledge'}
      </button>
    </div>
  );
}

// ── Navigable monthly commit graph ─────────────────────────────
function graphLevel(count: number): number {
  if (count <= 0) return -1;
  if (count <= 1) return 1;
  if (count <= 3) return 2;
  if (count <= 6) return 3;
  return 4;
}
const pad2 = (n: number) => String(n).padStart(2, '0');

function MonthGraph() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1); // 1-12
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/github/commit-graph?year=${year}&month=${month}`)
      .then((r) => (r.ok ? r.json() : { counts: {}, total: 0 }))
      .then((d) => { setCounts(d.counts ?? {}); setTotal(d.total ?? 0); })
      .catch(() => { setCounts({}); setTotal(0); })
      .finally(() => setLoading(false));
  }, [year, month]);

  const atCurrent = year === today.getFullYear() && month === today.getMonth() + 1;
  const prev = () => { if (month === 1) { setYear(year - 1); setMonth(12); } else setMonth(month - 1); };
  const next = () => { if (atCurrent) return; if (month === 12) { setYear(year + 1); setMonth(1); } else setMonth(month + 1); };

  const label = new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstWeekday = new Date(year, month - 1, 1).getDay(); // 0 Sun
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const todayStr = `${today.getFullYear()}-${pad2(today.getMonth() + 1)}-${pad2(today.getDate())}`;

  const navBtn = (dir: 'prev' | 'next', disabled: boolean) => (
    <button
      onClick={dir === 'prev' ? prev : next}
      disabled={disabled}
      className="flex h-7 w-[30px] items-center justify-center rounded-[7px] border border-border bg-surface-2"
      style={{ cursor: disabled ? 'default' : 'pointer', color: disabled ? 'var(--hint)' : 'var(--muted)', opacity: disabled ? 0.4 : 1 }}
    >
      <Icon name={dir === 'prev' ? 'chevL' : 'chevron'} size={16} />
    </button>
  );

  return (
    <div className="rounded border border-border bg-surface p-4">
      <div className="mb-[14px] flex items-center">
        <div className="flex-1 text-[14.5px] font-medium text-text">{label}</div>
        <span className="mono mr-2.5 text-[11px] text-hint">{loading ? '…' : `${total} commits`}</span>
        <div className="flex gap-1.5">{navBtn('prev', false)}{navBtn('next', atCurrent)}</div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="mono mb-0.5 text-center text-[10px] text-hint">{d}</div>
        ))}
        {cells.map((day, i) => {
          if (day == null) return <div key={`b${i}`} />;
          const key = `${year}-${pad2(month)}-${pad2(day)}`;
          const c = counts[key] ?? 0;
          const v = graphLevel(c);
          const bright = v >= 3;
          const isToday = key === todayStr;
          return (
            <div
              key={key}
              title={`${c} commit${c === 1 ? '' : 's'} · ${key}`}
              className="flex aspect-square items-center justify-center rounded-[5px] font-mono text-[11px]"
              style={{
                background: bgFor(v),
                border: isToday ? '1px solid var(--blue)' : '1px solid transparent',
                color: bright ? '#0D1117' : v === 0 ? 'var(--hint)' : 'var(--muted)',
              }}
            >
              {day}
            </div>
          );
        })}
      </div>

      <Legend />
    </div>
  );
}

// ── Recent commits feed ────────────────────────────────────────
function CommitFeed({ commits, loading }: { commits?: RepoCommit[]; loading?: boolean }) {
  if (loading && (!commits || commits.length === 0)) {
    return (
      <div className="mono inline-flex items-center gap-2 text-[12.5px] text-hint">
        <span className="inline-flex gap-1 text-blue"><span className="cm-dot" /><span className="cm-dot" /><span className="cm-dot" /></span>
        loading commits
      </div>
    );
  }
  if (!commits || commits.length === 0) {
    return <div className="text-[13px] leading-normal text-hint">No commits found in your selected repo yet.</div>;
  }
  return (
    <div className="rounded border border-border bg-surface px-[14px] py-1">
      {commits.map((c, i) => (
        <div key={c.sha} className={`flex items-center gap-[11px] py-[11px] ${i === 0 ? '' : 'border-t border-border-soft'}`}>
          <Icon name="commit" size={16} sw={1.8} style={{ color: 'var(--hint)', flexShrink: 0 }} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13.5px] text-text">{c.message}</div>
            <div className="mono mt-0.5 truncate text-[11px] text-hint">
              <span className="text-muted">{c.repo.split('/')[1] ?? c.repo}</span> · {c.sha.slice(0, 7)} · {relativeTime(c.authoredAt)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Stat card ──────────────────────────────────────────────────
function StatCard({ label, value, color = 'var(--text)' }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex-1 rounded border border-border bg-surface px-3 py-2.5">
      <div className="mb-1 text-[11px] text-muted">{label}</div>
      <div className="mono text-[22px] font-medium" style={{ color }}>{value}</div>
    </div>
  );
}

// ── Insights screen ────────────────────────────────────────────
export function InsightsScreen({ data, commits, loading, commitsLoading, wide, onNav }: { data?: InsightsData | null; commits?: RepoCommit[]; loading?: boolean; commitsLoading?: boolean; wide?: boolean; onNav?: (tab: string) => void }) {
  const [acked, setAcked] = useState<Record<number, boolean>>({});
  const toggle = (i: number) => setAcked(s => ({ ...s, [i]: !s[i] }));

  const rate = (r: number | null | undefined) => (r == null ? '—' : `${r}%`);

  // First load: show a spinner rather than the "not enough days" placeholder.
  if (loading && !data) {
    return (
      <div className="flex h-full flex-col bg-bg">
        <div className="shrink-0 px-5 py-2.5 text-[17px] font-medium">Insights</div>
        <div className="flex flex-1 items-center justify-center text-hint">
          <span className="mono inline-flex items-center gap-2 text-[13px]">
            <span className="inline-flex gap-1 text-blue"><span className="cm-dot" /><span className="cm-dot" /><span className="cm-dot" /></span>
            loading insights
          </span>
        </div>
      </div>
    );
  }

  // Empty until there's at least one kept day.
  if (!data || data.daysCounted === 0) {
    return (
      <div className="flex h-full flex-col bg-bg">
        <div className="shrink-0 px-5 py-2.5 text-[17px] font-medium">Insights</div>
        <div className="cm-scroll flex flex-1 flex-col gap-4 overflow-y-auto px-5 pb-6 pt-2">
          <div className="flex flex-col sm:flex-row gap-2.5 w-full">
            <div className="rounded border border-border bg-surface p-[22px] text-center flex-1">
              <div className="mb-4 flex justify-center gap-[3px]">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="h-3 w-3 rounded-[2.5px]" style={{ background: i === 0 ? '#26A641' : 'var(--cell)', border: i === 0 ? 'none' : '1px solid var(--border-soft)' }} />
                ))}
              </div>
              <div className="text-base text-text">Not enough days yet.</div>
              <div className="mx-auto mt-2  text-[13.5px] leading-normal text-muted">Patterns appear once you start keeping commitments — resolve a day and the coach starts taking notes.</div>
            </div>
            <div className="flex flex-col gap-2.5">
              <StatCard label="days counted" value={String(data?.daysCounted ?? 0)} />
              <StatCard label="commit rate" value={rate(data?.commitRate)} />
            </div>
          </div>
          <div>
            <SectionLabel style={{ marginBottom: 10 }}>commits this month</SectionLabel>
            <MonthGraph />
          </div>
          <div>
            <SectionLabel style={{ marginBottom: 10 }}>recent commits</SectionLabel>
            <CommitFeed commits={commits} loading={commitsLoading} />
          </div>
          <Button kind="ghost" onClick={() => onNav?.('today')} iconRight="arrow">Back to today</Button>
        </div>
      </div>
    );
  }

  const statBlock = (
    <div className="flex flex-col gap-2.5">
      <div className="flex gap-2.5">
        <StatCard label="current streak" value={String(data.currentStreak)} color="var(--green)" />
        <StatCard label="commit rate" value={rate(data.commitRate)} />
      </div>
      <div className="flex gap-2.5">
        <StatCard label="longest streak" value={String(data.longestStreak)} />
        <StatCard label="days counted" value={String(data.daysCounted)} />
      </div>
    </div>
  );
  const monthBlock = (
    <div>
      <SectionLabel style={{ marginBottom: 10 }}>commits this month</SectionLabel>
      <MonthGraph />
    </div>
  );
  const heatmapBlock = (
    <div className="rounded border border-border bg-surface p-4">
      <SectionLabel style={{ marginBottom: 12 }}>commitments kept · last 12 weeks</SectionLabel>
      <Heatmap levels={data.heatmap} />
    </div>
  );
  const moodBlock = (
    <div className="rounded border border-border bg-surface p-4">
      <SectionLabel style={{ marginBottom: 12 }}>
        mood · last 14 days · <span className="text-green">green = committed</span>
      </SectionLabel>
      <MoodBars mood={data.mood} fill="#26A641" />
    </div>
  );
  const energyBlock = (
    <div className="rounded border border-border bg-surface p-4">
      <SectionLabel style={{ marginBottom: 12 }}>
        energy · last 14 days · <span className="text-blue">blue = committed</span>
      </SectionLabel>
      <MoodBars mood={data.energy} fill="#1F6FEB" />
    </div>
  );
  const reflectionsBlock = (
    <div>
      <SectionLabel style={{ marginBottom: 10 }}>reflections</SectionLabel>
      <Reflections entries={data.reflections ?? []} />
    </div>
  );
  const commitsBlock = (
    <div>
      <SectionLabel style={{ marginBottom: 10 }}>recent commits</SectionLabel>
      <CommitFeed commits={commits} loading={commitsLoading} />
    </div>
  );
  const adviceBlock = (
    <div>
      <SectionLabel style={{ marginBottom: 10 }}>from your coach</SectionLabel>
      {data.advice.length === 0 ? (
        <div className="text-[13px] leading-normal text-hint">
          Lessons from your resolves will collect here.
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {data.advice.map((a: AdviceItem, i) => (
            <AdviceCard key={i} tone={a.tone} category={a.category} text={a.text} acked={!!acked[i]} onAck={() => toggle(i)} />
          ))}
        </div>
      )}
    </div>
  );

  const col = (children: React.ReactNode) => (
    <div className="flex flex-col gap-[18px]">{children}</div>
  );

  return (
    <div className="flex h-full flex-col bg-bg">
      <div className="flex shrink-0 items-center px-5 py-2.5">
        <div className="flex-1 text-[17px] font-medium">Insights</div>
        <span className="mono text-xs text-hint">{data.totalDays} days</span>
      </div>

      <div className="cm-scroll flex-1 overflow-y-auto px-5 pb-6 pt-1">
        {wide ? (
          <div className="grid grid-cols-2 items-start gap-[18px]">
            {col(<>{statBlock}{monthBlock}{heatmapBlock}{commitsBlock}</>)}
            {col(<>{moodBlock}{energyBlock}{reflectionsBlock}{adviceBlock}</>)}
          </div>
        ) : (
          col(<>{statBlock}{monthBlock}{heatmapBlock}{moodBlock}{energyBlock}{reflectionsBlock}{commitsBlock}{adviceBlock}</>)
        )}
      </div>
    </div>
  );
}
