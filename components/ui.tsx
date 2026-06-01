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
    <span className="mono" style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      fontSize: 11, lineHeight: 1, padding: '5px 8px',
      borderRadius: 999, border: `1px solid ${c.border}`,
      color: c.color, background: c.bg, ...style,
    }}>{children}</span>
  );
}

// ── Section label ─────────────────────────────────────────────
export function SectionLabel({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div className="mono" style={{ fontSize: 11, color: 'var(--hint)', textTransform: 'uppercase', letterSpacing: '0.08em', ...style }}>
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
      style={{
        width: '100%', fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 16,
        borderRadius: 'var(--r)', padding: '14px 18px', display: 'flex',
        alignItems: 'center', justifyContent: 'center', gap: 9,
        letterSpacing: '-0.01em', transition: 'filter .15s',
        cursor: blocked ? (loading ? 'progress' : 'not-allowed') : 'pointer',
        opacity: blocked ? 0.6 : 1,
        ...kindStyles[kind], ...style,
      }}
    >
      {loading
        ? <span style={{ display: 'inline-flex', gap: 4 }}><span className="cm-dot" /><span className="cm-dot" /><span className="cm-dot" /></span>
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
    <div className="mono" style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5, flexWrap: 'wrap', ...style }}>
      <span style={{ color: 'var(--muted)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <Icon name="branch" size={13} sw={1.8} style={{ color: 'var(--hint)' }} />{repo}
      </span>
      <span style={{ color: 'var(--green)' }}>+{add}</span>
      <span style={{ color: 'var(--red)' }}>&minus;{del}</span>
      {files != null && <span style={{ color: 'var(--hint)' }}>{files} {files === 1 ? 'file' : 'files'}</span>}
    </div>
  );
}

// ── StreakHero ────────────────────────────────────────────────
interface StreakHeroProps { days: number; label?: string; tone?: 'green' | 'red' | 'muted'; sub?: string; big?: number; }
export function StreakHero({ days, label = 'day streak', tone = 'green', sub, big = 104 }: StreakHeroProps) {
  const color = tone === 'red' ? 'var(--red)' : tone === 'muted' ? 'var(--muted)' : 'var(--green)';
  return (
    <div style={{ textAlign: 'center' }}>
      <div className="mono" style={{
        fontSize: big, lineHeight: 0.92, fontWeight: 500, color,
        letterSpacing: '-0.04em', fontFeatureSettings: '"tnum" 1',
        textShadow: tone === 'green' ? '0 0 40px rgba(63,185,80,0.22)' : 'none',
      }}>{days}</div>
      <div className="mono" style={{ marginTop: 12, fontSize: 13, color: 'var(--muted)', letterSpacing: '0.04em' }}>{label}</div>
      {sub && <div style={{ marginTop: 6, fontSize: 13.5, color: 'var(--hint)' }}>{sub}</div>}
    </div>
  );
}

// ── Week strip ────────────────────────────────────────────────
type DayState = 'counted' | 'missed' | 'none';
interface WeekStripProps { days: DayState[]; today?: 'counted' | 'pending'; }
export function WeekStrip({ days, today = 'pending' }: WeekStripProps) {
  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'center' }}>
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
    <div style={{ borderLeft: `2px solid ${edge}`, paddingLeft: 16 }}>
      <div className="mono" style={{ fontSize: 11, color: 'var(--hint)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 9, display: 'flex', alignItems: 'center', gap: 7 }}>
        <Icon name="quote" size={13} style={{ color: edge }} />{label}
      </div>
      <div style={{ fontSize: 18, lineHeight: 1.42, color: 'var(--text)' }}>{children}</div>
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
    <div style={{ background: c.fill, border: `1px solid ${c.edge}`, borderRadius: 'var(--r)', padding: 16, ...style }}>
      <div className="mono" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.07em', color: c.color }}>
        <span style={{ width: 20, height: 20, borderRadius: 5, background: c.color, color: 'var(--bg)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name={c.icon} size={13} sw={2.4} />
        </span>
        {label}
      </div>
      {title && <div style={{ fontSize: 16, marginTop: 11, color: 'var(--text)', fontWeight: 500 }}>{title}</div>}
      {children && <div style={{ fontSize: 14.5, lineHeight: 1.5, marginTop: title ? 5 : 11, color: 'var(--muted)' }}>{children}</div>}
      {footer && <div style={{ marginTop: 14 }}>{footer}</div>}
    </div>
  );
}

// ── Status row (pulsing dot + label) ─────────────────────────
interface StatusRowProps { tone?: Tone; children: React.ReactNode; pulse?: boolean; }
export function StatusRow({ tone = 'muted', children, pulse = false }: StatusRowProps) {
  const color = { green: 'var(--green)', amber: 'var(--amber)', red: 'var(--red)', muted: 'var(--hint)', blue: 'var(--blue)' }[tone];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, color: 'var(--muted)' }}>
      <span className={pulse ? 'cm-pulse' : ''} style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0, boxShadow: tone === 'green' ? '0 0 8px var(--green)' : 'none' }} />
      <span style={{ flex: 1 }}>{children}</span>
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
    <div style={{ display: 'flex', borderTop: '1px solid var(--border-soft)', background: 'rgba(13,17,23,0.86)', backdropFilter: 'blur(12px)', paddingBottom: 'var(--safe-bottom)', flexShrink: 0 }}>
      {tabs.map(t => {
        const on = active === t.id || (active === 'insightsEmpty' && t.id === 'insights');
        return (
          <button key={t.id} onClick={() => onNav(t.id)} style={{ flex: 1, background: 'none', border: 0, padding: '11px 0 9px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, color: on ? 'var(--text)' : 'var(--hint)', transition: 'color .15s' }}>
            <Icon name={t.icon} size={22} sw={on ? 2 : 1.7} />
            <span style={{ fontSize: 11, fontWeight: on ? 500 : 400 }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Wordmark ──────────────────────────────────────────────────
export function Wordmark({ size = 15 }: { size?: number }) {
  return (
    <span className="mono" style={{ fontSize: size, color: 'var(--text)', fontWeight: 500, letterSpacing: '-0.02em', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
      <span style={{ color: 'var(--green)' }}>$</span>commit
    </span>
  );
}

// ── Toggle ────────────────────────────────────────────────────
export function Toggle({ on = false }: { on?: boolean }) {
  return (
    <div style={{ width: 42, height: 25, borderRadius: 999, background: on ? 'var(--green-act)' : 'var(--surface-2)', border: `1px solid ${on ? 'var(--green-act)' : 'var(--border)'}`, position: 'relative', flexShrink: 0, transition: 'all .15s' }}>
      <div style={{ position: 'absolute', top: 2, left: on ? 19 : 2, width: 19, height: 19, borderRadius: '50%', background: '#fff', transition: 'left .15s' }} />
    </div>
  );
}
