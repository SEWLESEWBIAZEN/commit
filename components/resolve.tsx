'use client';
import React from 'react';
import type { ResolvePhase, ResolveVerdict, LayoutVariant } from './types';
import { Icon, Tag, Button, DiffStat, CoachQuote, VerdictBlock, SectionLabel } from './ui';

// ── Answer echo ───────────────────────────────────────────────
function AnswerEcho({ text }: { text: string }) {
  return (
    <div className="flex gap-[11px]">
      <div className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[5px] border border-border bg-surface-2 text-muted">
        <Icon name="user" size={13} />
      </div>
      <div className="flex-1 text-[14.5px] leading-normal text-muted">{text}</div>
    </div>
  );
}

// ── Ledger layout row ─────────────────────────────────────────
function LedgerRow({ tone, rail, head, body, action }: { tone: 'green' | 'amber' | 'muted'; rail: string; head: string; body: string; action?: React.ReactNode }) {
  const colors = {
    green: { line: 'var(--green)', fill: 'var(--green-fill)' },
    amber: { line: 'var(--amber)', fill: 'var(--amber-fill)' },
    muted: { line: 'var(--muted)', fill: 'transparent' },
  };
  const c = colors[tone];
  return (
    <div className="flex" style={{ background: c.fill }}>
      <div className="w-[3px] shrink-0" style={{ background: c.line }} />
      <div className="flex-1 p-[15px]">
        <div className="mono text-[10.5px] uppercase tracking-[0.08em]" style={{ color: c.line }}>{rail}</div>
        <div className="mt-[7px] text-[15px] font-medium text-text">{head}</div>
        <div className="mt-[5px] text-[13.5px] leading-normal text-muted">{body}</div>
        {action && <div className="mt-2.5">{action}</div>}
      </div>
    </div>
  );
}

// ── The two verdicts ──────────────────────────────────────────
interface VerdictContent {
  verdictTitle?: string; verdictBody?: string;
  lessonTitle?: string; lessonBody?: string; suggestion?: string;
}
function Verdicts({ verdict, streak, layout, onContinue, content }: { verdict: ResolveVerdict; streak: number; layout: LayoutVariant; onContinue: () => void; content?: VerdictContent }) {
  const isNone = verdict === 'none';
  const isGood = verdict === 'good';

  if (layout === 'ledger') {
    return (
      <div className="cm-rise overflow-hidden rounded border border-border">
        <LedgerRow
          tone={isNone ? 'muted' : 'green'}
          rail="streak"
          head={isNone ? 'not counted' : `counted · streak ${streak}`}
          body={isNone ? 'That answer was evasive. Show you understood it.' : isGood ? 'You showed up and answered honestly.' : 'Being wrong doesn’t break it — hiding does.'}
        />
        <div className="h-px bg-border" />
        <LedgerRow
          tone="amber"
          rail="lesson"
          head={isGood ? 'Solid — here’s the next level.' : 'httpOnly is not the whole story.'}
          body={isGood ? 'Next: think about replay. A stolen token used twice should invalidate the family.' : 'You’re missing rotation: issue a new refresh token on every use, invalidate the old one.'}
          action={<button onClick={onContinue} className="mono border-0 bg-transparent p-0 text-[12.5px] text-blue">+ make it tomorrow&rsquo;s commitment</button>}
        />
      </div>
    );
  }

  // stacked layout (default)
  const vTitle = content?.verdictTitle ?? (isNone ? 'That answer was evasive.' : 'You showed up and answered honestly.');
  const vBody = content?.verdictBody ?? (isNone
    ? 'You described what the code does, not why it matters. Show you understood it.'
    : isGood ? 'Clear reasoning, grounded in the diff.' : 'The streak holds. Honesty keeps it.');
  const lTitle = content?.lessonTitle ?? (isGood ? 'Here is the next level.' : 'Here is what you are missing.');
  const lBody = content?.lessonBody ?? 'Take the next concrete step on this tomorrow.';

  return (
    <div className="flex flex-col gap-[14px]">
      <div className="cm-rise">
        <VerdictBlock
          variant={isNone ? 'null_' : 'streak'}
          label={isNone ? 'not counted' : `counted · streak ${streak}`}
          title={vTitle}
        >
          {vBody}
        </VerdictBlock>
      </div>
      {!isNone && (
        <>
          <div className="mono text-center text-[10.5px] uppercase tracking-[0.1em] text-hint">&#8212; separate verdict &#8212;</div>
          <div className="cm-rise" style={{ animationDelay: '.12s' }}>
            <VerdictBlock
              variant="lesson"
              label="the lesson"
              title={lTitle}
              footer={
                <Button kind="ghost" icon="plus" onClick={onContinue} style={{ fontSize: 14, padding: '11px 14px' }}>
                  {isGood ? 'Make it tomorrow’s commitment' : 'Make the fix tomorrow’s commitment'}
                </Button>
              }
            >
              {lBody}
            </VerdictBlock>
          </div>
        </>
      )}
    </div>
  );
}

// ── Five-point scale ──────────────────────────────────────────
interface FivePointProps { label: string; value: number; onChange: (n: number) => void; lowLabel: string; highLabel: string; color?: string; }
function FivePoint({ label, value, onChange, lowLabel, highLabel, color = 'var(--blue)' }: FivePointProps) {
  return (
    <div>
      <div className="mb-[9px] flex items-baseline justify-between">
        <span className="text-sm text-text">{label}</span>
        <span className="mono text-xs" style={{ color: value ? color : 'var(--hint)' }}>{value ? `${value}/5` : '—'}</span>
      </div>
      <div className="flex gap-[7px]">
        {[1,2,3,4,5].map(n => {
          const on = value >= n;
          return (
            <button
              key={n}
              onClick={() => onChange(n)}
              className="mono h-[38px] flex-1 rounded-md text-[13px] transition-all"
              style={{ border: `1px solid ${on ? color : 'var(--border)'}`, background: on ? color : 'var(--bg)', color: on ? 'var(--bg)' : 'var(--hint)' }}
            >{n}</button>
          );
        })}
      </div>
      <div className="mt-1.5 flex justify-between">
        <span className="text-[11px] text-hint">{lowLabel}</span>
        <span className="text-[11px] text-hint">{highLabel}</span>
      </div>
    </div>
  );
}

// ── Emotion check-in ──────────────────────────────────────────
interface EmotionProps { mood: number; energy: number; onMood: (n: number) => void; onEnergy: (n: number) => void; note: string; onNote: (s: string) => void; onDone: () => void; busy?: boolean; }
function EmotionCheckin({ mood, energy, onMood, onEnergy, note, onNote, onDone, busy = false }: EmotionProps) {
  const coachLine = mood <= 2 ? 'That’s exactly the day that builds you. You shipped anyway.'
    : mood >= 4 ? 'Good day. The coach is watching for what made it one.'
    : 'Logged. Energy and mood shape the advice you’ll get.';
  return (
    <div className="flex flex-col gap-[22px]">
      <div>
        <SectionLabel>before you go</SectionLabel>
        <div className="mt-[9px] text-lg text-text">How did today feel?</div>
        <div className="mt-[5px] text-[13.5px] text-hint">Optional. Takes five seconds.</div>
      </div>
      <FivePoint label="Mood" value={mood} onChange={onMood} lowLabel="rough" highLabel="great" color="var(--blue)" />
      <FivePoint label="Energy" value={energy} onChange={onEnergy} lowLabel="drained" highLabel="wired" color="var(--green)" />
      <textarea
        className="w-full resize-none rounded border border-border bg-bg px-[14px] py-[13px] text-[15px] text-text outline-none"
        rows={2} placeholder="A note to your future self (optional)" value={note} onChange={e => onNote(e.target.value)}
      />
      {(mood > 0 || energy > 0) && (
        <div className="border-l-2 border-blue pl-[13px] text-[13.5px] leading-normal text-muted">{coachLine}</div>
      )}
      <Button kind="solid" iconRight="arrow" onClick={onDone} loading={busy}>{busy ? 'Saving…' : 'Set tomorrow’s commitment'}</Button>
    </div>
  );
}

// ── Resolve screen ────────────────────────────────────────────
export interface ResolveScreenProps {
  phase?: ResolvePhase; verdict?: ResolveVerdict; layout?: LayoutVariant;
  streak?: number; repo?: string;
  add?: number; del?: number; files?: number;
  verdictTitle?: string; verdictBody?: string; lessonTitle?: string; lessonBody?: string; suggestion?: string;
  question?: string; answerText?: string; submittedAnswer?: string;
  mood?: number; energy?: number; note?: string; emotionBusy?: boolean;
  onAnswer?: (s: string) => void; onSubmit?: () => void; onClose?: () => void;
  onContinue?: () => void; onMood?: (n: number) => void; onEnergy?: (n: number) => void;
  onNote?: (s: string) => void; onEmotionDone?: () => void;
}

export function ResolveScreen({
  phase = 'question', verdict = 'wrong', layout = 'stacked', streak = 24,
  repo = 'auth-service', add = 142, del = 37, files = 4,
  verdictTitle, verdictBody, lessonTitle, lessonBody, suggestion,
  question = 'You set httpOnly on the refresh cookie. Walk me through what that actually protects against — and what it doesn’t.',
  answerText = '', submittedAnswer = 'httpOnly means JavaScript can’t read the cookie, so an XSS script can’t grab the token. I set it along with Secure and SameSite=strict.',
  mood = 0, energy = 0, note = '', emotionBusy = false,
  onAnswer, onSubmit, onClose, onContinue,
  onMood = () => {}, onEnergy = () => {}, onNote = () => {}, onEmotionDone = () => {},
}: ResolveScreenProps) {
  return (
    <div className="flex h-full flex-col bg-bg">
      {/* header */}
      <div className="shrink-0 border-b border-border-soft px-5 pb-[14px] pt-3">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="flex border-0 bg-transparent p-0 text-muted"><Icon name="close" size={22} /></button>
          <div className="flex-1 text-base font-medium">Resolve today</div>
          <Tag tone="green"><Icon name="check" size={12} sw={2.4} />pushed</Tag>
        </div>
        <div className="mt-3"><DiffStat repo={repo} add={add} del={del} files={files} /></div>
      </div>

      {/* body */}
      <div className="cm-scroll flex-1 overflow-y-auto p-5">
        {phase === 'emotion' ? (
          <EmotionCheckin mood={mood} energy={energy} onMood={onMood} onEnergy={onEnergy} note={note} onNote={onNote} onDone={onEmotionDone} busy={emotionBusy} />
        ) : (
          <div className="flex flex-col gap-[22px]">
            <CoachQuote>{question}</CoachQuote>

            {phase === 'question' && (
              <div className="flex flex-col gap-3">
                <textarea
                  className="w-full resize-none rounded border border-border bg-bg px-[14px] py-[13px] text-base leading-normal text-text outline-none"
                  rows={5} placeholder="Explain it in your own words. The coach can tell." value={answerText} onChange={e => onAnswer?.(e.target.value)} autoFocus
                />
                <Button kind="green" iconRight="arrow" onClick={onSubmit}>Submit answer</Button>
                <div className="mono text-center text-[11.5px] text-hint">honesty keeps the streak — not being right</div>
              </div>
            )}

            {phase === 'loading' && (
              <>
                <AnswerEcho text={submittedAnswer} />
                <div className="h-px bg-border-soft" />
                <div className="flex items-center gap-[11px] text-sm text-muted">
                  <span className="inline-flex gap-1 text-blue"><span className="cm-dot"/><span className="cm-dot"/><span className="cm-dot"/></span>
                  <span className="mono text-[12.5px]">reading your answer against the diff</span>
                </div>
              </>
            )}

            {phase === 'verdict' && (
              <>
                <AnswerEcho text={submittedAnswer} />
                <div className="h-px bg-border-soft" />
                <Verdicts verdict={verdict} streak={streak} layout={layout} onContinue={onContinue ?? (() => {})} content={{ verdictTitle, verdictBody, lessonTitle, lessonBody, suggestion }} />
                {verdict === 'none'
                  ? <Button kind="ghost" onClick={onClose} style={{ marginTop: 8 }}>Answer again</Button>
                  : <Button kind="solid" iconRight="arrow" onClick={onContinue} style={{ marginTop: 8 }}>Continue</Button>}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
