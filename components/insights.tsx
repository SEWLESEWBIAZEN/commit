'use client';
import React, { useState } from 'react';
import { Icon, Tag, SectionLabel, Button } from './ui';

// ── GitHub-green heatmap (12 weeks) ───────────────────────────
// Uses authentic GH contribution colors: #0E4429 #006D32 #26A641 #39D353
const GH_GREENS = ['#0E4429', '#006D32', '#26A641', '#39D353'];

function Heatmap({ weeks = 12 }: { weeks?: number }) {
  const cells: number[][] = [];
  let seed = 7;
  const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;

  for (let w = 0; w < weeks; w++) {
    const col: number[] = [];
    for (let d = 0; d < 7; d++) {
      const future = w === weeks - 1 && d > 4;
      const r = rnd();
      const isMiss = (w * 7 + d) % 17 === 5 || (w * 7 + d) % 23 === 11;
      col.push(future ? -1 : isMiss ? 0 : Math.floor(r * 4));
    }
    cells.push(col);
  }

  const bg = (v: number) => {
    if (v === -1) return '#161B22';
    if (v === 0)  return '#30363D';
    return GH_GREENS[v];
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 3 }}>
        {cells.map((col, w) => (
          <div key={w} style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
            {col.map((v, d) => (
              <div key={d} style={{ width: '100%', aspectRatio: '1', borderRadius: 2.5, background: bg(v) }} />
            ))}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, justifyContent: 'flex-end' }}>
        <span className="mono" style={{ fontSize: 10, color: 'var(--hint)' }}>less</span>
        {[1,2,3,4].map(v => <div key={v} style={{ width: 10, height: 10, borderRadius: 2, background: GH_GREENS[v - 1] }} />)}
        <span className="mono" style={{ fontSize: 10, color: 'var(--hint)' }}>more</span>
      </div>
    </div>
  );
}

// ── Mood bar chart (green = committed, gray = missed) ─────────
function MoodBars() {
  const data =      [4, 3, 5, 2, 4, 4, 3, 1, 4, 5, 3, 4, 2, 5];
  const committed = [1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1];
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 46 }}>
      {data.map((v, i) => (
        <div key={i} style={{ flex: 1, borderRadius: 2, background: committed[i] ? '#26A641' : '#30363D', height: `${(v / 5) * 100}%`, transition: 'height .3s' }} />
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
      <div style={{ fontSize: 13.5, color: acked ? 'var(--muted)' : 'var(--muted)', lineHeight: 1.55 }}>{text}</div>
      <button onClick={onAck} className="mono" style={{ background: 'none', border: 0, padding: 0, marginTop: 10, fontSize: 11.5, cursor: 'pointer', color: acked ? 'var(--green)' : 'var(--blue)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
        {acked ? <><Icon name="check" size={12} sw={2.4} />acknowledged</> : 'acknowledge'}
      </button>
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
export function InsightsScreen({ empty = false, onNav }: { empty?: boolean; onNav?: (tab: string) => void }) {
  const [acked, setAcked] = useState<Record<number, boolean>>({});
  const toggle = (i: number) => setAcked(s => ({ ...s, [i]: !s[i] }));

  if (empty) {
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
            <div style={{ fontSize: 13.5, color: 'var(--muted)', marginTop: 8, lineHeight: 1.5, maxWidth: 240, margin: '8px auto 0' }}>Patterns appear after a week. Keep showing up — the coach is taking notes.</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <StatCard label="days counted" value="1" />
            <StatCard label="commit rate" value="—" />
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
        <span className="mono" style={{ fontSize: 12, color: 'var(--hint)' }}>89 days</span>
      </div>

      <div className="cm-scroll" style={{ flex: 1, padding: '4px 20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* stat cards */}
        <div style={{ display: 'flex', gap: 10 }}>
          <StatCard label="current streak" value="24" color="var(--green)" />
          <StatCard label="commit rate" value="87%" />
        </div>

        {/* heatmap */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: 16 }}>
          <SectionLabel style={{ marginBottom: 12 }}>last 12 weeks</SectionLabel>
          <Heatmap />
        </div>

        {/* mood bar chart */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: 16 }}>
          <SectionLabel style={{ marginBottom: 12 }}>
            mood · last 14 days · <span style={{ color: 'var(--green)' }}>green = committed</span>
          </SectionLabel>
          <MoodBars />
        </div>

        {/* coach advice */}
        <div>
          <SectionLabel style={{ marginBottom: 10 }}>from your coach</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <AdviceCard
              tone="amber"
              category="emotional pattern"
              text="You skip most on low-energy days after long sessions. Commit smaller there — a 30-minute promise you keep beats a 3-hour one you won&rsquo;t."
              acked={!!acked[0]}
              onAck={() => toggle(0)}
            />
            <AdviceCard
              tone="green"
              category="progress pattern"
              text="Your understanding on auth jumped from 2 to 4 over three weeks. That doubt you keep mentioning? The data disagrees."
              acked={!!acked[1]}
              onAck={() => toggle(1)}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
