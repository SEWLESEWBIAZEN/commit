'use client';
import React from 'react';
import type { IconName, Tone, VerdictVariant } from './types';

// ── Icons ─────────────────────────────────────────────────────
interface IconProps { name: IconName; size?: number; sw?: number; style?: React.CSSProperties; }

export function Icon({ name, size = 18, sw = 1.7, style = {} }: IconProps) {
  const p = {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: sw, strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const, style,
  };
  switch (name) {
    case 'check':     return <svg {...p}><path d="M20 6L9 17l-5-5"/></svg>;
    case 'arrow':     return <svg {...p}><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
    case 'chevron':   return <svg {...p}><path d="M9 6l6 6-6 6"/></svg>;
    case 'chevL':     return <svg {...p}><path d="M15 6l-6 6 6 6"/></svg>;
    case 'chevD':     return <svg {...p}><path d="M6 9l6 6 6-6"/></svg>;
    case 'plus':      return <svg {...p}><path d="M12 5v14M5 12h14"/></svg>;
    case 'close':     return <svg {...p}><path d="M18 6L6 18M6 6l12 12"/></svg>;
    case 'branch':    return <svg {...p}><circle cx="6" cy="6" r="2.4"/><circle cx="6" cy="18" r="2.4"/><circle cx="18" cy="8" r="2.4"/><path d="M6 8.4v7.2M18 10.4c0 4-4 3.4-6 5.2"/></svg>;
    case 'commit':    return <svg {...p}><circle cx="12" cy="12" r="3.2"/><path d="M12 3v5.8M12 15.2V21"/></svg>;
    case 'push':      return <svg {...p}><path d="M12 19V7M6 11l6-6 6 6"/></svg>;
    case 'bell':      return <svg {...p}><path d="M18 8a6 6 0 10-12 0c0 7-3 8-3 8h18s-3-1-3-8"/><path d="M13.7 21a2 2 0 01-3.4 0"/></svg>;
    case 'clock':     return <svg {...p}><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 1.8"/></svg>;
    case 'globe':     return <svg {...p}><circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.4 2.5 14.6 0 17M12 3.5c-2.5 2.4-2.5 14.6 0 17"/></svg>;
    case 'mail':      return <svg {...p}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5l8.5 6 8.5-6"/></svg>;
    case 'lock':      return <svg {...p}><rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 018 0v2.5"/></svg>;
    case 'gear':      return <svg {...p}><circle cx="12" cy="12" r="3"/><path d="M12 2.5v2.5M12 19v2.5M21.5 12H19M5 12H2.5M18.7 5.3l-1.8 1.8M7.1 16.9l-1.8 1.8M18.7 18.7l-1.8-1.8M7.1 7.1L5.3 5.3"/></svg>;
    case 'chart':     return <svg {...p}><path d="M3 21h18"/><rect x="5" y="11" width="3" height="7"/><rect x="10.5" y="6" width="3" height="12"/><rect x="16" y="9" width="3" height="9"/></svg>;
    case 'home':      return <svg {...p}><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="2.6" fill="currentColor" stroke="none"/></svg>;
    case 'install':   return <svg {...p}><rect x="6" y="3" width="12" height="18" rx="2.4"/><path d="M12 7v6m0 0l-2.2-2.2M12 13l2.2-2.2"/></svg>;
    case 'user':      return <svg {...p}><circle cx="12" cy="8" r="3.6"/><path d="M5 20c0-3.6 3.1-5.5 7-5.5s7 1.9 7 5.5"/></svg>;
    case 'spark':     return <svg {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18"/></svg>;
    case 'quote':     return <svg {...p}><path d="M9 7H5v6h4l-1.5 4M19 7h-4v6h4l-1.5 4"/></svg>;
    case 'flag':      return <svg {...p}><path d="M5 21V4M5 4h11l-2 3.5L16 11H5"/></svg>;
    case 'flame-off': return <svg {...p}><path d="M8.5 14.5A5 5 0 0 0 17 11c0-3-3-5.5-3-5.5s-.5 2.5-2 3.5c0-2.5-2-4-2-6C6 4 4 7 4 10a7 7 0 0 0 4.5 4.5"/><path d="M2 2l20 20"/><path d="M10 17.5a4 4 0 0 0 6-3.5"/></svg>;
    case 'book':      return <svg {...p}><path d="M4 5.5A2.5 2.5 0 016.5 3H20v15H6.5A2.5 2.5 0 014 20.5z"/><path d="M4 20.5A2.5 2.5 0 016.5 18H20"/></svg>;
    case 'code':      return <svg {...p}><path d="M9 8l-4 4 4 4M15 8l4 4-4 4"/></svg>;
    case 'eye':       return <svg {...p}><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.6"/></svg>;
    default:          return <svg {...p} />;
  }
}

// ── Tag / chip ────────────────────────────────────────────────
const toneMap: Record<Tone, { color: string; border: string; bg: string }> = {
  muted: { color: 'var(--muted)', border: 'var(--border)',      bg: 'transparent' },
  green: { color: 'var(--green)', border: 'var(--green-edge)',  bg: 'var(--green-fill)' },
  amber: { color: 'var(--amber)', border: 'var(--amber-edge)',  bg: 'var(--amber-fill)' },
  red:   { color: 'var(--red)',   border: 'var(--red-edge)',    bg: 'var(--red-fill)' },
  blue:  { color: 'var(--blue)',  border: 'var(--blue-edge)',   bg: 'var(--blue-fill)' },
};

interface TagProps { tone?: Tone; style?: React.CSSProperties; children: React.ReactNode; }
export function Tag({ tone = 'muted', style = {}, children }: TagProps) {
  const c = toneMap[tone];
  return (
    <span
      className="mono inline-flex items-center gap-1.5 rounded-full border px-2 py-[5px] text-[11px] leading-none"
      style={{ borderColor: c.border, color: c.color, background: c.bg, ...style }}
    >{children}</span>
  );
}

// ── Section label ─────────────────────────────────────────────
export function SectionLabel({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div className="mono text-[11px] uppercase tracking-[0.08em] text-hint" style={style}>
      {children}
    </div>
  );
}

// ── Button ────────────────────────────────────────────────────
type BtnKind = 'solid' | 'green' | 'ghost' | 'quiet';
interface ButtonProps {
  kind?: BtnKind; children: React.ReactNode;
  onClick?: () => void; icon?: IconName; iconRight?: IconName;
  style?: React.CSSProperties; disabled?: boolean; loading?: boolean;
}
export function Button({ kind = 'solid', children, onClick, icon, iconRight, style = {}, disabled, loading = false }: ButtonProps) {
  const kindStyles: Record<BtnKind, React.CSSProperties> = {
    solid: { background: 'var(--text)', color: 'var(--bg)', border: '1px solid transparent' },
    green: { background: 'var(--green-act)', color: '#fff', border: '1px solid transparent' },
    ghost: { background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)' },
    quiet: { background: 'transparent', color: 'var(--muted)', border: '1px solid transparent' },
  };
  const blocked = disabled || loading;
  return (
    <button
      onClick={blocked ? undefined : onClick} disabled={blocked}
      className="flex w-full items-center justify-center gap-[9px] rounded px-[18px] py-[14px] text-base font-medium tracking-[-0.01em] transition-[filter]"
      style={{
        cursor: blocked ? (loading ? 'progress' : 'not-allowed') : 'pointer',
        opacity: blocked ? 0.6 : 1,
        ...kindStyles[kind], ...style,
      }}
    >
      {loading
        ? <span className="inline-flex gap-1"><span className="cm-dot" /><span className="cm-dot" /><span className="cm-dot" /></span>
        : icon && <Icon name={icon} size={18} />}
      <span>{children}</span>
      {iconRight && !loading && <Icon name={iconRight} size={18} />}
    </button>
  );
}

// ── DiffStat ──────────────────────────────────────────────────
interface DiffStatProps { repo: string; add: number; del: number; files?: number; style?: React.CSSProperties; }
export function DiffStat({ repo, add, del, files, style = {} }: DiffStatProps) {
  return (
    <div className="mono flex flex-wrap items-center gap-2.5 text-[12.5px]" style={style}>
      <span className="inline-flex items-center gap-1.5 text-muted">
        <Icon name="branch" size={13} sw={1.8} style={{ color: 'var(--hint)' }} />{repo}
      </span>
      <span className="text-green">+{add}</span>
      <span className="text-red">&minus;{del}</span>
      {files != null && <span className="text-hint">{files} {files === 1 ? 'file' : 'files'}</span>}
    </div>
  );
}

// ── StreakHero ────────────────────────────────────────────────
interface StreakHeroProps { days: number; label?: string; tone?: 'green' | 'red' | 'muted'; sub?: string; big?: number; }
export function StreakHero({ days, label = 'day streak', tone = 'green', sub, big = 104 }: StreakHeroProps) {
  const color = tone === 'red' ? 'var(--red)' : tone === 'muted' ? 'var(--muted)' : 'var(--green)';
  return (
    <div className="text-center">
      <div className="mono font-medium" style={{
        fontSize: big, lineHeight: 0.92, color,
        letterSpacing: '-0.04em', fontFeatureSettings: '"tnum" 1',
        textShadow: tone === 'green' ? '0 0 40px rgba(63,185,80,0.22)' : 'none',
      }}>{days}</div>
      <div className="mono mt-3 text-[13px] tracking-[0.04em] text-muted">{label}</div>
      {sub && <div className="mt-1.5 text-[13.5px] text-hint">{sub}</div>}
    </div>
  );
}

// ── Week strip ────────────────────────────────────────────────
type DayState = 'counted' | 'missed' | 'none';
interface WeekStripProps { days: DayState[]; today?: 'counted' | 'pending'; }
export function WeekStrip({ days, today = 'pending' }: WeekStripProps) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {days.map((d, i) => (
        <div key={i} style={{
          width: 16, height: 16, borderRadius: 4,
          background: d === 'counted' ? 'var(--green)' : d === 'missed' ? 'var(--red-fill)' : 'var(--surface-2)',
          border: d === 'missed' ? '1px solid var(--red-edge)' : d === 'counted' ? 'none' : '1px solid var(--border)',
          opacity: d === 'counted' ? Math.min(1, 0.55 + i * 0.07) : 1,
        }} />
      ))}
      <div style={{
        width: 16, height: 16, borderRadius: 4, marginLeft: 2,
        border: '1.5px dashed var(--green-edge)',
        background: today === 'counted' ? 'var(--green)' : 'transparent',
      }} />
    </div>
  );
}

// ── Coach quote ───────────────────────────────────────────────
interface CoachQuoteProps { children: React.ReactNode; label?: string; tone?: 'blue' | 'amber'; }
export function CoachQuote({ children, label = 'the coach read your diff', tone = 'blue' }: CoachQuoteProps) {
  const edge = tone === 'amber' ? 'var(--amber)' : 'var(--blue)';
  return (
    <div className="pl-4" style={{ borderLeft: `2px solid ${edge}` }}>
      <div className="mono mb-[9px] flex items-center gap-[7px] text-[11px] uppercase tracking-[0.07em] text-hint">
        <Icon name="quote" size={13} style={{ color: edge }} />{label}
      </div>
      <div className="text-lg leading-[1.42] text-text">{children}</div>
    </div>
  );
}

// ── Verdict block ─────────────────────────────────────────────
const verdictMap: Record<VerdictVariant, { color: string; edge: string; fill: string; icon: IconName }> = {
  streak: { color: 'var(--green)', edge: 'var(--green-edge)', fill: 'var(--green-fill)', icon: 'check' },
  lesson: { color: 'var(--amber)', edge: 'var(--amber-edge)', fill: 'var(--amber-fill)', icon: 'spark' },
  miss:   { color: 'var(--red)',   edge: 'var(--red-edge)',   fill: 'var(--red-fill)',   icon: 'close' },
  null_:  { color: 'var(--muted)', edge: 'var(--border)',     fill: 'transparent',       icon: 'eye' },
};
interface VerdictBlockProps {
  variant?: VerdictVariant; label: string; title?: string;
  children?: React.ReactNode; footer?: React.ReactNode; style?: React.CSSProperties;
}
export function VerdictBlock({ variant = 'streak', label, title, children, footer, style = {} }: VerdictBlockProps) {
  const c = verdictMap[variant];
  return (
    <div className="rounded p-4" style={{ background: c.fill, border: `1px solid ${c.edge}`, ...style }}>
      <div className="mono flex items-center gap-2 text-[11.5px] uppercase tracking-[0.07em]" style={{ color: c.color }}>
        <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] text-bg" style={{ background: c.color }}>
          <Icon name={c.icon} size={13} sw={2.4} />
        </span>
        {label}
      </div>
      {title && <div className="mt-[11px] text-base font-medium text-text">{title}</div>}
      {children && <div className="text-[14.5px] leading-normal text-muted" style={{ marginTop: title ? 5 : 11 }}>{children}</div>}
      {footer && <div className="mt-[14px]">{footer}</div>}
    </div>
  );
}

// ── Status row (pulsing dot + label) ─────────────────────────
interface StatusRowProps { tone?: Tone; children: React.ReactNode; pulse?: boolean; }
export function StatusRow({ tone = 'muted', children, pulse = false }: StatusRowProps) {
  const color = { green: 'var(--green)', amber: 'var(--amber)', red: 'var(--red)', muted: 'var(--hint)', blue: 'var(--blue)' }[tone];
  return (
    <div className="flex items-center gap-2.5 text-[13.5px] text-muted">
      <span className={`h-2 w-2 shrink-0 rounded-full ${pulse ? 'cm-pulse' : ''}`} style={{ background: color, boxShadow: tone === 'green' ? '0 0 8px var(--green)' : 'none' }} />
      <span className="flex-1">{children}</span>
    </div>
  );
}

// ── Bottom nav ────────────────────────────────────────────────
interface BottomNavProps { active: string; onNav: (tab: string) => void; }
export function BottomNav({ active, onNav }: BottomNavProps) {
  const tabs = [
    { id: 'today', label: 'Today', icon: 'home' as IconName },
    { id: 'insights', label: 'Insights', icon: 'chart' as IconName },
    { id: 'settings', label: 'Settings', icon: 'gear' as IconName },
  ];
  return (
    <div className="flex shrink-0 border-t border-border-soft bg-bg pb-[var(--safe-bottom)]">
      {tabs.map(t => {
        const on = active === t.id || (active === 'insightsEmpty' && t.id === 'insights');
        return (
          <button
            key={t.id}
            onClick={() => onNav(t.id)}
            className={`flex flex-1 flex-col items-center gap-[5px] border-0 bg-transparent pb-[9px] pt-[11px] transition-colors ${on ? 'text-text' : 'text-hint'}`}
          >
            <Icon name={t.icon} size={22} sw={on ? 2 : 1.7} />
            <span className={`text-[11px] ${on ? 'font-medium' : 'font-normal'}`}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Wordmark ──────────────────────────────────────────────────
export function Wordmark({ size = 15 }: { size?: number }) {
  return (
    <span className="mono inline-flex items-center gap-[7px] font-medium tracking-[-0.02em] text-text" style={{ fontSize: size }}>
      <span className="text-green">$</span>commit
    </span>
  );
}

// ── Toggle ────────────────────────────────────────────────────
export function Toggle({ on = false }: { on?: boolean }) {
  return (
    <div
      className="relative h-[25px] w-[42px] shrink-0 rounded-full border transition-all"
      style={{ background: on ? 'var(--green-act)' : 'var(--surface-2)', borderColor: on ? 'var(--green-act)' : 'var(--border)' }}
    >
      <div className="absolute top-0.5 h-[19px] w-[19px] rounded-full bg-white transition-[left]" style={{ left: on ? 19 : 2 }} />
    </div>
  );
}
