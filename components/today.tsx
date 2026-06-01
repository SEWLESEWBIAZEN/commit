'use client';
import React from 'react';
import type { TodayState, HeroVariant } from './types';
import { Icon, Tag, SectionLabel, Button, DiffStat, StreakHero, WeekStrip, StatusRow, Wordmark } from './ui';

// ── CommitmentCard ─────────────────────────────────────────────
interface CommitmentCardProps {
  text: string; type?: 'build' | 'learn'; repo?: string;
  beginner?: boolean; done?: boolean;
}
function CommitmentCard({ text, type = 'build', repo, beginner = false, done = false }: CommitmentCardProps) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 11 }}>
        <Tag tone="muted" style={{ color: type === 'learn' ? 'var(--blue)' : 'var(--muted)', borderColor: type === 'learn' ? 'var(--blue-edge)' : 'var(--border)' }}>
          <Icon name={type === 'learn' ? 'book' : 'code'} size={12} />{type}
        </Tag>
        {beginner && <Tag tone="blue"><Icon name="spark" size={12} />beginner</Tag>}
        <span style={{ flex: 1 }} />
        {done && <span className="mono" style={{ fontSize: 11, color: 'var(--green)', display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icon name="check" size={13} sw={2.4} />done</span>}
      </div>
      <div style={{ fontSize: 16.5, lineHeight: 1.4, color: 'var(--text)' }}>{text}</div>
      {repo && <div className="mono" style={{ marginTop: 12, fontSize: 12, color: 'var(--hint)', display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="branch" size={13} sw={1.8} />{repo}</div>}
    </div>
  );
}

// ── Streak hero (number | graph) ──────────────────────────────
function Hero({ variant, streak, tone = 'green' }: { variant: HeroVariant; streak: number; tone?: 'green' | 'red' | 'muted' }) {
  if (variant === 'graph') {
    return (
      <div style={{ textAlign: 'center' }}>
        <StreakHero days={streak} big={88} tone={tone} />
        <div style={{ marginTop: 22 }}>
          <WeekStrip days={['counted','counted','counted','missed','counted','counted','counted']} today="pending" />
          <div className="mono" style={{ marginTop: 10, fontSize: 11, color: 'var(--hint)', letterSpacing: '0.04em' }}>last 7 days</div>
        </div>
      </div>
    );
  }
  return <StreakHero days={streak} big={108} tone={tone} />;
}

// ── Screen scaffold ────────────────────────────────────────────
function Scaffold({ children, beginner, date }: { children: React.ReactNode; beginner?: boolean; date?: string }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 20px 4px', flexShrink: 0 }}>
        <Wordmark />
        <span style={{ flex: 1 }} />
        {beginner && <Tag tone="blue" style={{ marginRight: 8 }}><Icon name="spark" size={12} />beginner</Tag>}
        <span className="mono" style={{ fontSize: 12, color: 'var(--hint)' }}>{date ?? 'thu · may 29'}</span>
      </div>
      <div className="cm-scroll" style={{ flex: 1, padding: '12px 20px 18px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        {children}
      </div>
    </div>
  );
}

// ── Today screen props ─────────────────────────────────────────
interface TodayScreenProps {
  state: TodayState;
  streak?: number;
  prevStreak?: number;
  repo?: string;
  commitment?: string;
  ctype?: 'build' | 'learn';
  beginner?: boolean;
  heroVariant?: HeroVariant;
  date?: string;
  pushCommits?: number;
  pushMinutesAgo?: number;
  pushAdd?: number;
  pushDel?: number;
  pushFiles?: number;
  partnerEmail?: string | null;
  onResolve?: () => void;
  onSetCommitment?: () => void;
  onView?: () => void;
}

export function TodayScreen({
  state = 'ready', streak = 24, prevStreak = 24, repo = 'auth-service',
  commitment = 'Add refresh-token rotation to the auth flow.',
  ctype = 'build', beginner = false, heroVariant = 'number',
  date, pushCommits = 2, pushMinutesAgo = 14, pushAdd = 142, pushDel = 37, pushFiles = 4,
  partnerEmail,
  onResolve, onSetCommitment, onView,
}: TodayScreenProps) {

  // ── empty / first day ──────────────────────────────────────
  if (state === 'empty') {
    return (
      <Scaffold beginner={beginner} date={date}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 26, padding: '0 4px' }}>
          <Hero variant={heroVariant} streak={0} tone="muted" />
          <div style={{ textAlign: 'center', padding: '0 14px' }}>
            <div style={{ fontSize: 18, color: 'var(--text)' }}>No streak yet.</div>
            <div style={{ fontSize: 15, color: 'var(--muted)', marginTop: 6 }}>Make tomorrow&rsquo;s promise.</div>
          </div>
          <Button kind="solid" iconRight="arrow" onClick={onSetCommitment}>Make tomorrow&rsquo;s promise</Button>
        </div>
      </Scaffold>
    );
  }

  // ── missed / streak reset ──────────────────────────────────
  if (state === 'missed') {
    return (
      <Scaffold beginner={beginner} date={date}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 20 }}>
          {/* streak reset hero: gray 0 + flame-off */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'var(--hint)' }}>
              <Icon name="flame-off" size={28} sw={1.5} />
              <span className="mono" style={{ fontSize: 80, lineHeight: 0.92, fontWeight: 500, letterSpacing: '-0.04em' }}>0</span>
            </div>
            <div className="mono" style={{ marginTop: 10, fontSize: 13 }}>
              <span style={{ color: 'var(--muted)' }}>streak reset &middot; </span>
              <span style={{ color: 'var(--red)' }}>was {prevStreak}</span>
            </div>
          </div>
          {/* plain statement */}
          <div style={{ textAlign: 'center', fontSize: 14.5, color: 'var(--muted)', lineHeight: 1.55, padding: '0 8px' }}>
            You didn&rsquo;t commit yesterday. The streak resets to zero &mdash; that was the deal.
          </div>
          {/* forward card */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '13px 14px' }}>
            <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.55 }}>
              The work still counts the moment you come back. One missed day isn&rsquo;t the story &mdash; the next {prevStreak} are. Build it again.
            </div>
          </div>
          {/* accountability ping */}
          {partnerEmail && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="bell" size={15} style={{ color: 'var(--hint)', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: 'var(--hint)' }}>{partnerEmail} was notified &mdash; the deal you set</span>
            </div>
          )}
          <Button kind="green" iconRight="arrow" onClick={onSetCommitment}>Set tomorrow&rsquo;s promise</Button>
        </div>
      </Scaffold>
    );
  }

  // ── rest — done for today ──────────────────────────────────
  if (state === 'rest') {
    return (
      <Scaffold beginner={beginner} date={date}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 28, paddingTop: 14 }}>
          <div style={{ paddingTop: 18 }}><Hero variant={heroVariant} streak={streak} /></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <StatusRow tone="green"><span style={{ color: 'var(--text)' }}>Done for today.</span> Counted · streak {streak}.</StatusRow>
            <SectionLabel style={{ marginTop: 6 }}>tomorrow</SectionLabel>
            <CommitmentCard text={commitment} type={ctype} repo={repo} beginner={beginner} />
          </div>
          <div style={{ flex: 1 }} />
          <button onClick={onView} style={{ background: 'none', border: 0, color: 'var(--muted)', fontSize: 14, cursor: 'pointer', padding: '8px 0' }}>View today&rsquo;s resolution</button>
        </div>
      </Scaffold>
    );
  }

  // ── awaiting — no push yet ─────────────────────────────────
  if (state === 'awaiting') {
    return (
      <Scaffold beginner={beginner} date={date}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 26, paddingTop: 14 }}>
          <div style={{ paddingTop: 12 }}><Hero variant={heroVariant} streak={streak} /></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <SectionLabel>today&rsquo;s commitment</SectionLabel>
            <CommitmentCard text={commitment} type={ctype} repo={repo} beginner={beginner} />
          </div>
          <div style={{ background: 'transparent', border: '1px dashed var(--border)', borderRadius: 'var(--r)', padding: 16 }}>
            <StatusRow tone="muted" pulse>Waiting for your push to <span className="mono" style={{ color: 'var(--muted)', marginLeft: 4 }}>{repo}</span></StatusRow>
          </div>
          <div style={{ flex: 1 }} />
          <div className="mono" style={{ textAlign: 'center', fontSize: 12, color: 'var(--hint)' }}>commit. push. resolve.</div>
        </div>
      </Scaffold>
    );
  }

  // ── ready — push detected (hero state) ────────────────────
  return (
    <Scaffold beginner={beginner} date={date}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24, paddingTop: 14 }}>
        <div style={{ paddingTop: 12 }}><Hero variant={heroVariant} streak={streak} /></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <SectionLabel>today&rsquo;s commitment</SectionLabel>
          <CommitmentCard text={commitment} type={ctype} repo={repo} beginner={beginner} />
        </div>
        <div className="cm-rise" style={{ background: 'var(--green-fill)', border: '1px solid var(--green-edge)', borderRadius: 'var(--r)', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <StatusRow tone="green"><span style={{ color: 'var(--text)' }}>Push detected.</span> {pushCommits} {pushCommits === 1 ? 'commit' : 'commits'}, {pushMinutesAgo} min ago.</StatusRow>
          <DiffStat repo={repo} add={pushAdd} del={pushDel} files={pushFiles} />
        </div>
        <div style={{ flex: 1 }} />
        <div>
          <Button kind="green" iconRight="arrow" onClick={onResolve}>Resolve today</Button>
          <div className="mono" style={{ textAlign: 'center', fontSize: 12, color: 'var(--hint)', marginTop: 11 }}>the coach has 1 question</div>
        </div>
      </div>
    </Scaffold>
  );
}
