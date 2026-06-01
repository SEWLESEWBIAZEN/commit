'use client';
import React from 'react';
import type { ResolvePhase, ResolveVerdict, LayoutVariant } from './types';
import { Icon, Tag, Button, DiffStat, CoachQuote, VerdictBlock, SectionLabel } from './ui';

// ── Answer echo ───────────────────────────────────────────────
function AnswerEcho({ text }: { text: string }) {
  return (
    <div style={{ display: 'flex', gap: 11 }}>
      <div style={{ width: 22, height: 22, borderRadius: 5, background: 'var(--surface-2)', border: '1px solid var(--border)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
        <Icon name="user" size={13} />
      </div>
      <div style={{ flex: 1, fontSize: 14.5, lineHeight: 1.5, color: 'var(--muted)' }}>{text}</div>
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
    <div style={{ display: 'flex', background: c.fill }}>
      <div style={{ width: 3, background: c.line, flexShrink: 0 }} />
      <div style={{ padding: 15, flex: 1 }}>
        <div className="mono" style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.08em', color: c.line }}>{rail}</div>
        <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)', marginTop: 7 }}>{head}</div>
        <div style={{ fontSize: 13.5, lineHeight: 1.5, color: 'var(--muted)', marginTop: 5 }}>{body}</div>
        {action && <div style={{ marginTop: 10 }}>{action}</div>}
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
      <div className="cm-rise" style={{ border: '1px solid var(--border)', borderRadius: 'var(--r)', overflow: 'hidden' }}>
        <LedgerRow
          tone={isNone ? 'muted' : 'green'}
          rail="streak"
          head={isNone ? 'not counted' : `counted · streak ${streak}`}
          body={isNone ? 'That answer was evasive. Show you understood it.' : isGood ? 'You showed up and answered honestly.' : 'Being wrong doesn\u2019t break it \u2014 hiding does.'}
        />
        <div style={{ height: 1, background: 'var(--border)' }} />
        <LedgerRow
          tone="amber"
          rail="lesson"
          head={isGood ? 'Solid \u2014 here\u2019s the next level.' : 'httpOnly is not the whole story.'}
          body={isGood ? 'Next: think about replay. A stolen token used twice should invalidate the family.' : 'You\u2019re missing rotation: issue a new refresh token on every use, invalidate the old one.'}
          action={<button onClick={onContinue} className="mono" style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', fontSize: 12.5, color: 'var(--blue)' }}>+ make it tomorrow&rsquo;s commitment</button>}
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
          <div className="mono" style={{ textAlign: 'center', fontSize: 10.5, color: 'var(--hint)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>&#8212; separate verdict &#8212;</div>
          <div className="cm-rise" style={{ animationDelay: '.12s' }}>
            <VerdictBlock
              variant="lesson"
              label="the lesson"
              title={lTitle}
              footer={
                <Button kind="ghost" icon="plus" onClick={onContinue} style={{ fontSize: 14, padding: '11px 14px' }}>
                  {isGood ? 'Make it tomorrow\u2019s commitment' : 'Make the fix tomorrow\u2019s commitment'}
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 9 }}>
        <span style={{ fontSize: 14, color: 'var(--text)' }}>{label}</span>
        <span className="mono" style={{ fontSize: 12, color: value ? color : 'var(--hint)' }}>{value ? `${value}/5` : '—'}</span>
      </div>
      <div style={{ display: 'flex', gap: 7 }}>
        {[1,2,3,4,5].map(n => {
          const on = value >= n;
          return (
            <button key={n} onClick={() => onChange(n)} style={{ flex: 1, height: 38, borderRadius: 6, cursor: 'pointer', border: `1px solid ${on ? color : 'var(--border)'}`, background: on ? color : 'var(--bg)', color: on ? 'var(--bg)' : 'var(--hint)', fontFamily: 'var(--font-mono)', fontSize: 13, transition: 'all .12s' }}>{n}</button>
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
        <span style={{ fontSize: 11, color: 'var(--hint)' }}>{lowLabel}</span>
        <span style={{ fontSize: 11, color: 'var(--hint)' }}>{highLabel}</span>
      </div>
    </div>
  );
}

// ── Emotion check-in ──────────────────────────────────────────
interface EmotionProps { mood: number; energy: number; onMood: (n: number) => void; onEnergy: (n: number) => void; note: string; onNote: (s: string) => void; onDone: () => void; busy?: boolean; }
function EmotionCheckin({ mood, energy, onMood, onEnergy, note, onNote, onDone, busy = false }: EmotionProps) {
  const coachLine = mood <= 2 ? 'That\u2019s exactly the day that builds you. You shipped anyway.'
    : mood >= 4 ? 'Good day. The coach is watching for what made it one.'
    : 'Logged. Energy and mood shape the advice you\u2019ll get.';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div>
        <SectionLabel>before you go</SectionLabel>
        <div style={{ fontSize: 18, marginTop: 9, color: 'var(--text)' }}>How did today feel?</div>
        <div style={{ fontSize: 13.5, color: 'var(--hint)', marginTop: 5 }}>Optional. Takes five seconds.</div>
      </div>
      <FivePoint label="Mood" value={mood} onChange={onMood} lowLabel="rough" highLabel="great" color="var(--blue)" />
      <FivePoint label="Energy" value={energy} onChange={onEnergy} lowLabel="drained" highLabel="wired" color="var(--green)" />
      <textarea
        style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--r)', color: 'var(--text)', fontFamily: 'var(--font-sans)', fontSize: 15, padding: '13px 14px', resize: 'none', outline: 'none' }}
        rows={2} placeholder="A note to your future self (optional)" value={note} onChange={e => onNote(e.target.value)}
      />
      {(mood > 0 || energy > 0) && (
        <div style={{ borderLeft: '2px solid var(--blue)', paddingLeft: 13, fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.5 }}>{coachLine}</div>
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
  question = 'You set httpOnly on the refresh cookie. Walk me through what that actually protects against \u2014 and what it doesn\u2019t.',
  answerText = '', submittedAnswer = 'httpOnly means JavaScript can\u2019t read the cookie, so an XSS script can\u2019t grab the token. I set it along with Secure and SameSite=strict.',
  mood = 0, energy = 0, note = '', emotionBusy = false,
  onAnswer, onSubmit, onClose, onContinue,
  onMood = () => {}, onEnergy = () => {}, onNote = () => {}, onEmotionDone = () => {},
}: ResolveScreenProps) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* header */}
      <div style={{ flexShrink: 0, padding: '12px 20px 14px', borderBottom: '1px solid var(--border-soft)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onClose} style={{ background: 'none', border: 0, color: 'var(--muted)', cursor: 'pointer', padding: 0, display: 'flex' }}><Icon name="close" size={22} /></button>
          <div style={{ flex: 1, fontSize: 16, fontWeight: 500 }}>Resolve today</div>
          <Tag tone="green"><Icon name="check" size={12} sw={2.4} />pushed</Tag>
        </div>
        <div style={{ marginTop: 12 }}><DiffStat repo={repo} add={add} del={del} files={files} /></div>
      </div>

      {/* body */}
      <div className="cm-scroll" style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {phase === 'emotion' ? (
          <EmotionCheckin mood={mood} energy={energy} onMood={onMood} onEnergy={onEnergy} note={note} onNote={onNote} onDone={onEmotionDone} busy={emotionBusy} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            <CoachQuote>{question}</CoachQuote>

            {phase === 'question' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <textarea
                  style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--r)', color: 'var(--text)', fontFamily: 'var(--font-sans)', fontSize: 16, padding: '13px 14px', resize: 'none', outline: 'none', lineHeight: 1.5 }}
                  rows={5} placeholder="Explain it in your own words. The coach can tell." value={answerText} onChange={e => onAnswer?.(e.target.value)} autoFocus
                />
                <Button kind="green" iconRight="arrow" onClick={onSubmit}>Submit answer</Button>
                <div className="mono" style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--hint)' }}>honesty keeps the streak — not being right</div>
              </div>
            )}

            {phase === 'loading' && (
              <>
                <AnswerEcho text={submittedAnswer} />
                <div style={{ height: 1, background: 'var(--border-soft)' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 11, color: 'var(--muted)', fontSize: 14 }}>
                  <span style={{ display: 'inline-flex', gap: 4, color: 'var(--blue)' }}><span className="cm-dot"/><span className="cm-dot"/><span className="cm-dot"/></span>
                  <span className="mono" style={{ fontSize: 12.5 }}>reading your answer against the diff</span>
                </div>
              </>
            )}

            {phase === 'verdict' && (
              <>
                <AnswerEcho text={submittedAnswer} />
                <div style={{ height: 1, background: 'var(--border-soft)' }} />
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
