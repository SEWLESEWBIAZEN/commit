'use client';
import React, { useState, useEffect } from 'react';
import { Icon, SectionLabel, Button } from './ui';
import { relativeTime } from '@/lib/date';
import type { InsightsData, MoodPoint, AdviceItem, RepoCommit } from '@/lib/types';

// ── GitHub-green heatmap (12 weeks) ───────────────────────────
// Authentic GH contribution colors. Cell values: -1 none/pending, 0 missed, 1..4 kept.
const GH_GREENS = ['#0E4429', '#006D32', '#26A641', '#39D353'];

function bgFor(v: number) {
  if (v <= -1) return '#161B22';
  if (v === 0) return '#30363D';
  return GH_GREENS[Math.min(v, 4) - 1];
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
      <div style={{ display: 'flex', gap: 3 }}>
        {cells.map((col, w) => (
          <div key={w} style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
            {col.map((v, d) => (
              <div key={d} style={{ width: '100%', aspectRatio: '1', borderRadius: 2.5, background: bgFor(v) }} />
            ))}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, justifyContent: 'flex-end' }}>
        <span className="mono" style={{ fontSize: 10, color: 'var(--hint)' }}>less</span>
        {[1, 2, 3, 4].map(v => <div key={v} style={{ width: 10, height: 10, borderRadius: 2, background: GH_GREENS[v - 1] }} />)}
        <span className="mono" style={{ fontSize: 10, color: 'var(--hint)' }}>more</span>
      </div>
    </div>
  );
}

// ── Mood bar chart (green = committed, gray = missed/none) ─────
function MoodBars({ mood }: { mood?: MoodPoint[] }) {
  const data: MoodPoint[] =
    mood ??
    [4, 3, 5, 2, 4, 4, 3, 1, 4, 5, 3, 4, 2, 5].map((value, i) => ({
      value,
      committed: [1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1][i] === 1,
    }));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 46 }}>
      {data.map((m, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            borderRadius: 2,
            background: m.committed ? '#26A641' : '#30363D',
            height: `${Math.max(m.value / 5, 0.08) * 100}%`,
            transition: 'height .3s',
          }}
        />
      ))}
    </div>
  );
}

// ── Advice card ────────────────────────────────────────────────
interface AdviceCardProps { tone: 'amber' | 'green'; category: string; text: string; acked: boolean; onAck: () => void; }
function AdviceCard({ tone, category, text, acked, onAck }: AdviceCardProps) {
  const color = tone === 'amber' ? 'var(--amber)' : 'var(--green)';
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <Icon name="spark" size={15} style={{ color }} />
        <span className="mono" style={{ fontSize: 10.5, color, letterSpacing: '0.04em' }}>{category}</span>
      </div>
      <div style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.55 }}>{text}</div>
      <button onClick={onAck} className="mono" style={{ background: 'none', border: 0, padding: 0, marginTop: 10, fontSize: 11.5, cursor: 'pointer', color: acked ? 'var(--green)' : 'var(--blue)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
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
      style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 7, width: 30, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: disabled ? 'default' : 'pointer', color: disabled ? 'var(--hint)' : 'var(--muted)', opacity: disabled ? 0.4 : 1 }}
    >
      <Icon name={dir === 'prev' ? 'chevL' : 'chevron'} size={16} />
    </button>
  );

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ flex: 1, fontSize: 14.5, fontWeight: 500, color: 'var(--text)' }}>{label}</div>
        <span className="mono" style={{ fontSize: 11, color: 'var(--hint)', marginRight: 10 }}>{loading ? '…' : `${total} commits`}</span>
        <div style={{ display: 'flex', gap: 6 }}>{navBtn('prev', false)}{navBtn('next', atCurrent)}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="mono" style={{ textAlign: 'center', fontSize: 10, color: 'var(--hint)', marginBottom: 2 }}>{d}</div>
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
              style={{
                aspectRatio: '1', borderRadius: 5, background: bgFor(v),
                border: isToday ? '1px solid var(--blue)' : '1px solid transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-mono)', fontSize: 11,
                color: bright ? '#0D1117' : v === 0 ? 'var(--hint)' : 'var(--muted)',
              }}
            >
              {day}
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, justifyContent: 'flex-end' }}>
        <span className="mono" style={{ fontSize: 10, color: 'var(--hint)' }}>less</span>
        {[1, 2, 3, 4].map((v) => <div key={v} style={{ width: 10, height: 10, borderRadius: 2, background: GH_GREENS[v - 1] }} />)}
        <span className="mono" style={{ fontSize: 10, color: 'var(--hint)' }}>more</span>
      </div>
    </div>
  );
}

// ── Recent commits feed ────────────────────────────────────────
function CommitFeed({ commits, loading }: { commits?: RepoCommit[]; loading?: boolean }) {
  if (loading && (!commits || commits.length === 0)) {
    return (
      <div className="mono" style={{ fontSize: 12.5, color: 'var(--hint)', display: 'inline-flex', gap: 8, alignItems: 'center' }}>
        <span style={{ display: 'inline-flex', gap: 4, color: 'var(--blue)' }}><span className="cm-dot" /><span className="cm-dot" /><span className="cm-dot" /></span>
        loading commits
      </div>
    );
  }
  if (!commits || commits.length === 0) {
    return <div style={{ fontSize: 13, color: 'var(--hint)', lineHeight: 1.5 }}>No commits found in your selected repo yet.</div>;
  }
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '4px 14px' }}>
      {commits.map((c, i) => (
        <div key={c.sha} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 0', borderTop: i === 0 ? 'none' : '1px solid var(--border-soft)' }}>
          <Icon name="commit" size={16} sw={1.8} style={{ color: 'var(--hint)', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.message}</div>
            <div className="mono" style={{ fontSize: 11, color: 'var(--hint)', marginTop: 2 }}>{c.sha.slice(0, 7)} · {relativeTime(c.authoredAt)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Stat card ──────────────────────────────────────────────────
function StatCard({ label, value, color = 'var(--text)' }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ flex: 1, background: 'var(--surface)', borderRadius: 'var(--r)', padding: '10px 12px', border: '1px solid var(--border)' }}>
      <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>{label}</div>
      <div className="mono" style={{ fontSize: 22, fontWeight: 500, color }}>{value}</div>
    </div>
  );
}

// ── Insights screen ────────────────────────────────────────────
export function InsightsScreen({ data, commits, loading, commitsLoading, onNav }: { data?: InsightsData | null; commits?: RepoCommit[]; loading?: boolean; commitsLoading?: boolean; onNav?: (tab: string) => void }) {
  const [acked, setAcked] = useState<Record<number, boolean>>({});
  const toggle = (i: number) => setAcked(s => ({ ...s, [i]: !s[i] }));

  const rate = (r: number | null | undefined) => (r == null ? '—' : `${r}%`);

  // First load: show a spinner rather than the "not enough days" placeholder.
  if (loading && !data) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
        <div style={{ padding: '10px 20px', fontSize: 17, fontWeight: 500, flexShrink: 0 }}>Insights</div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--hint)' }}>
          <span className="mono" style={{ fontSize: 13, display: 'inline-flex', gap: 8, alignItems: 'center' }}>
            <span style={{ display: 'inline-flex', gap: 4, color: 'var(--blue)' }}><span className="cm-dot" /><span className="cm-dot" /><span className="cm-dot" /></span>
            loading insights
          </span>
        </div>
      </div>
    );
  }

  // Empty until there's at least one kept day.
  if (!data || data.daysCounted === 0) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
        <div style={{ padding: '10px 20px', fontSize: 17, fontWeight: 500, flexShrink: 0 }}>Insights</div>
        <div className="cm-scroll" style={{ flex: 1, padding: '8px 20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: 22, textAlign: 'center' }}>
            <div style={{ display: 'flex', gap: 3, justifyContent: 'center', marginBottom: 16 }}>
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} style={{ width: 12, height: 12, borderRadius: 2.5, background: i === 0 ? '#26A641' : '#161B22', border: i === 0 ? 'none' : '1px solid #21262D' }} />
              ))}
            </div>
            <div style={{ fontSize: 16, color: 'var(--text)' }}>Not enough days yet.</div>
            <div style={{ fontSize: 13.5, color: 'var(--muted)', marginTop: 8, lineHeight: 1.5, maxWidth: 240, margin: '8px auto 0' }}>Patterns appear once you start keeping commitments — resolve a day and the coach starts taking notes.</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <StatCard label="days counted" value={String(data?.daysCounted ?? 0)} />
            <StatCard label="commit rate" value={rate(data?.commitRate)} />
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

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '10px 20px', flexShrink: 0 }}>
        <div style={{ fontSize: 17, fontWeight: 500, flex: 1 }}>Insights</div>
        <span className="mono" style={{ fontSize: 12, color: 'var(--hint)' }}>{data.totalDays} days</span>
      </div>

      <div className="cm-scroll" style={{ flex: 1, padding: '4px 20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* stat cards */}
        <div style={{ display: 'flex', gap: 10 }}>
          <StatCard label="current streak" value={String(data.currentStreak)} color="var(--green)" />
          <StatCard label="commit rate" value={rate(data.commitRate)} />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <StatCard label="longest streak" value={String(data.longestStreak)} />
          <StatCard label="days counted" value={String(data.daysCounted)} />
        </div>

        {/* monthly commit graph */}
        <div>
          <SectionLabel style={{ marginBottom: 10 }}>commits this month</SectionLabel>
          <MonthGraph />
        </div>

        {/* kept-commitment heatmap */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: 16 }}>
          <SectionLabel style={{ marginBottom: 12 }}>commitments kept · last 12 weeks</SectionLabel>
          <Heatmap levels={data.heatmap} />
        </div>

        {/* mood bar chart */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: 16 }}>
          <SectionLabel style={{ marginBottom: 12 }}>
            mood · last 14 days · <span style={{ color: 'var(--green)' }}>green = committed</span>
          </SectionLabel>
          <MoodBars mood={data.mood} />
        </div>

        {/* recent commits */}
        <div>
          <SectionLabel style={{ marginBottom: 10 }}>recent commits</SectionLabel>
          <CommitFeed commits={commits} loading={commitsLoading} />
        </div>

        {/* coach advice */}
        <div>
          <SectionLabel style={{ marginBottom: 10 }}>from your coach</SectionLabel>
          {data.advice.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--hint)', lineHeight: 1.5 }}>
              Lessons from your resolves will collect here.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.advice.map((a: AdviceItem, i) => (
                <AdviceCard
                  key={i}
                  tone={a.tone}
                  category={a.category}
                  text={a.text}
                  acked={!!acked[i]}
                  onAck={() => toggle(i)}
                />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
