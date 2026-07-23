import React from 'react';
import type { PublicProfile } from '@/lib/share';

// Recruiter-facing public page. Server-rendered, no interactivity. Shows only
// the safe, verified-discipline subset — no repo names, messages, or notes.

const GH_GREENS = ['#0E4429', '#006D32', '#26A641', '#39D353'];
function cellBg(v: number) {
  if (v <= -1) return 'var(--cell)';
  if (v === 0) return 'var(--border)';
  return GH_GREENS[Math.min(v, 4) - 1];
}

function Stat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex-1 rounded border border-border bg-surface px-3 py-3 text-center">
      <div className={`mono text-[22px] font-medium ${accent ? 'text-green' : 'text-text'}`}>{value}</div>
      <div className="mt-1 text-[11px] text-muted">{label}</div>
    </div>
  );
}

export function ShareView({ p }: { p: PublicProfile }) {
  const weeks = Array.from({ length: 12 }, (_, w) => p.heatmap.slice(w * 7, w * 7 + 7));
  return (
    <div className="min-h-screen w-full bg-page">
      <div className="mx-auto flex min-h-screen w-full max-w-[560px] flex-col px-5 py-10">
        {/* header */}
        <div className="mono mb-8 flex items-center gap-2 text-[15px] font-medium text-text">
          <span className="text-green">$</span>commit
          <span className="ml-auto text-[11px] text-hint">verified daily discipline</span>
        </div>

        {/* identity */}
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border border-border bg-surface-2 text-muted">
            {p.avatar
              ? <img src={p.avatar} alt="" width={56} height={56} className="object-cover" />
              : <span className="mono text-xl">{p.login.slice(0, 1).toUpperCase()}</span>}
          </div>
          <div className="min-w-0">
            <div className="text-xl font-semibold text-text">@{p.login}</div>
            <div className="mono mt-1 flex items-center gap-2 text-xs text-green">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-green" />
              GitHub-verified · shipping since {p.memberSince}
            </div>
          </div>
        </div>

        {/* streak hero */}
        <div className="mt-10 text-center">
          <div className="mono text-[88px] font-medium leading-none tracking-[-0.04em] text-green" style={{ fontFeatureSettings: '"tnum" 1' }}>
            {p.currentStreak}
          </div>
          <div className="mono mt-2 text-[13px] tracking-[0.04em] text-muted">day streak</div>
        </div>

        {/* stats */}
        <div className="mt-8 flex gap-2.5">
          <Stat label="longest streak" value={String(p.longestStreak)} accent />
          <Stat label="commit rate" value={p.commitRate == null ? '—' : `${p.commitRate}%`} />
          <Stat label="days shipped" value={String(p.daysCounted)} />
        </div>

        {/* heatmap */}
        <div className="mt-6 rounded border border-border bg-surface p-4">
          <div className="mono mb-3 text-[11px] uppercase tracking-[0.08em] text-hint">commitments kept · last 12 weeks</div>
          <div className="flex gap-[3px]">
            {weeks.map((col, w) => (
              <div key={w} className="flex flex-1 flex-col gap-[3px]">
                {col.map((v, d) => (
                  <div key={d} className="aspect-square w-full rounded-[2.5px]" style={{ background: cellBg(v) }} />
                ))}
              </div>
            ))}
          </div>
          <div className="mt-2.5 flex items-center justify-end gap-1.5">
            <span className="mono text-[10px] text-hint">less</span>
            {[1, 2, 3, 4].map((v) => <div key={v} className="h-2.5 w-2.5 rounded-[2px]" style={{ background: GH_GREENS[v - 1] }} />)}
            <span className="mono text-[10px] text-hint">more</span>
          </div>
        </div>

        {/* trust note */}
        <div className="mt-5 text-[12.5px] leading-relaxed text-muted">
          Every counted day is a real GitHub push, verified by Commit — not self-reported. Private-repo
          activity is included only as anonymous totals; no repo names or code are shown.
        </div>

        <div className="flex-1" />
        <div className="mono mt-10 border-t border-border-soft pt-5 text-center text-[11.5px] text-hint">
          built with <span className="text-green">$</span>commit — did you commit today?
        </div>
      </div>
    </div>
  );
}
