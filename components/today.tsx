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
    <div className="rounded border border-border bg-surface p-4">
      <div className="mb-[11px] flex items-center gap-2">
        <Tag tone="muted" style={{ color: type === 'learn' ? 'var(--blue)' : 'var(--muted)', borderColor: type === 'learn' ? 'var(--blue-edge)' : 'var(--border)' }}>
          <Icon name={type === 'learn' ? 'book' : 'code'} size={12} />{type}
        </Tag>
        {beginner && <Tag tone="blue"><Icon name="spark" size={12} />beginner</Tag>}
        <span className="flex-1" />
        {done && <span className="mono inline-flex items-center gap-[5px] text-[11px] text-green"><Icon name="check" size={13} sw={2.4} />done</span>}
      </div>
      <div className="text-[16.5px] leading-[1.4] text-text">{text}</div>
      {repo && <div className="mono mt-3 flex items-center gap-1.5 text-xs text-hint"><Icon name="branch" size={13} sw={1.8} />{repo}</div>}
    </div>
  );
}

// ── Streak hero (number | graph) ──────────────────────────────
function Hero({ variant, streak, tone = 'green' }: { variant: HeroVariant; streak: number; tone?: 'green' | 'red' | 'muted' }) {
  if (variant === 'graph') {
    return (
      <div className="text-center">
        <StreakHero days={streak} big={88} tone={tone} />
        <div className="mt-[22px]">
          <WeekStrip days={['counted','counted','counted','missed','counted','counted','counted']} today="pending" />
          <div className="mono mt-2.5 text-[11px] tracking-[0.04em] text-hint">last 7 days</div>
        </div>
      </div>
    );
  }
  return <StreakHero days={streak} big={108} tone={tone} />;
}

// ── Screen scaffold ────────────────────────────────────────────
function Scaffold({ children, beginner, date }: { children: React.ReactNode; beginner?: boolean; date?: string }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center px-5 pb-1 pt-3">
        <Wordmark />
        <span className="flex-1" />
        {beginner && <Tag tone="blue" style={{ marginRight: 8 }}><Icon name="spark" size={12} />beginner</Tag>}
        <span className="mono text-xs text-hint">{date ?? 'thu · may 29'}</span>
      </div>
      <div className="cm-scroll flex flex-1 flex-col overflow-y-auto px-5 pb-[18px] pt-3">
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
        <div className="flex flex-1 flex-col justify-center gap-[26px] px-1">
          <Hero variant={heroVariant} streak={0} tone="muted" />
          <div className="px-[14px] text-center">
            <div className="text-lg text-text">No streak yet.</div>
            <div className="mt-1.5 text-[15px] text-muted">Make tomorrow&rsquo;s promise.</div>
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
        <div className="flex flex-1 flex-col justify-center gap-5">
          {/* streak reset hero: gray 0 + flame-off */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2.5 text-hint">
              <Icon name="flame-off" size={28} sw={1.5} />
              <span className="mono text-[80px] font-medium leading-[0.92] tracking-[-0.04em]">0</span>
            </div>
            <div className="mono mt-2.5 text-[13px]">
              <span className="text-muted">streak reset &middot; </span>
              <span className="text-red">was {prevStreak}</span>
            </div>
          </div>
          {/* plain statement */}
          <div className="px-2 text-center text-[14.5px] leading-[1.55] text-muted">
            You didn&rsquo;t commit yesterday. The streak resets to zero &mdash; that was the deal.
          </div>
          {/* forward card */}
          <div className="rounded border border-border bg-surface px-[14px] py-[13px]">
            <div className="text-sm leading-[1.55] text-text">
              The work still counts the moment you come back. One missed day isn&rsquo;t the story &mdash; the next {prevStreak} are. Build it again.
            </div>
          </div>
          {/* accountability ping */}
          {partnerEmail && (
            <div className="flex items-center gap-2">
              <Icon name="bell" size={15} style={{ color: 'var(--hint)', flexShrink: 0 }} />
              <span className="text-xs text-hint">{partnerEmail} was notified &mdash; the deal you set</span>
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
        <div className="flex flex-1 flex-col gap-7 pt-[14px]">
          <div className="pt-[18px]"><Hero variant={heroVariant} streak={streak} /></div>
          <div className="flex flex-col gap-3">
            <StatusRow tone="green"><span className="text-text">Done for today.</span> Counted · streak {streak}.</StatusRow>
            <SectionLabel style={{ marginTop: 6 }}>tomorrow</SectionLabel>
            <CommitmentCard text={commitment} type={ctype} repo={repo} beginner={beginner} />
          </div>
          <div className="flex-1" />
          <button onClick={onView} className="border-0 bg-transparent py-2 text-sm text-muted">View today&rsquo;s resolution</button>
        </div>
      </Scaffold>
    );
  }

  // ── awaiting — no push yet ─────────────────────────────────
  if (state === 'awaiting') {
    return (
      <Scaffold beginner={beginner} date={date}>
        <div className="flex flex-1 flex-col gap-[26px] pt-[14px]">
          <div className="pt-3"><Hero variant={heroVariant} streak={streak} /></div>
          <div className="flex flex-col gap-3">
            <SectionLabel>today&rsquo;s commitment</SectionLabel>
            <CommitmentCard text={commitment} type={ctype} repo={repo} beginner={beginner} />
          </div>
          <div className="rounded border border-dashed border-border bg-transparent p-4">
            <StatusRow tone="muted" pulse>Waiting for your push to <span className="mono ml-1 text-muted">{repo}</span></StatusRow>
          </div>
          <div className="flex-1" />
          <div className="mono text-center text-xs text-hint">commit. push. resolve.</div>
        </div>
      </Scaffold>
    );
  }

  // ── ready — push detected (hero state) ────────────────────
  return (
    <Scaffold beginner={beginner} date={date}>
      <div className="flex flex-1 flex-col gap-6 pt-[14px]">
        <div className="pt-3"><Hero variant={heroVariant} streak={streak} /></div>
        <div className="flex flex-col gap-3">
          <SectionLabel>today&rsquo;s commitment</SectionLabel>
          <CommitmentCard text={commitment} type={ctype} repo={repo} beginner={beginner} />
        </div>
        <div className="cm-rise flex flex-col gap-3 rounded border border-green-edge bg-green-fill p-4">
          <StatusRow tone="green"><span className="text-text">Push detected.</span> {pushCommits} {pushCommits === 1 ? 'commit' : 'commits'}, {pushMinutesAgo} min ago.</StatusRow>
          <DiffStat repo={repo} add={pushAdd} del={pushDel} files={pushFiles} />
        </div>
        <div className="flex-1" />
        <div>
          <Button kind="green" iconRight="arrow" onClick={onResolve}>Resolve today</Button>
          <div className="mono mt-[11px] text-center text-xs text-hint">the coach has 1 question</div>
        </div>
      </div>
    </Scaffold>
  );
}
