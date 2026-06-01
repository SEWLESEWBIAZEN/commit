'use client';
import React from 'react';
import type { OnbStep } from './types';
import { Icon, Tag, Button, SectionLabel, Toggle, Wordmark } from './ui';

const ONB_ORDER: OnbStep[] = ['permission', 'schedule', 'install', 'partner', 'first'];

function Progress({ step }: { step: OnbStep }) {
  const i = ONB_ORDER.indexOf(step);
  if (i < 0) return null;
  return (
    <div className="flex gap-1.5 px-5">
      {ONB_ORDER.map((_, n) => (
        <div key={n} className="h-[3px] flex-1 rounded-[2px] transition-colors" style={{ background: n <= i ? 'var(--green)' : 'var(--border)' }} />
      ))}
    </div>
  );
}

function Scaffold({ children, footer, step, onBack }: { children: React.ReactNode; footer?: React.ReactNode; step: OnbStep; onBack?: () => void }) {
  return (
    <div className="flex h-full flex-col bg-bg">
      <div className="flex shrink-0 flex-col gap-[14px] pt-[14px]">
        <div className="flex min-h-[24px] items-center px-5">
          {onBack
            ? <button onClick={onBack} className="-ml-1 flex border-0 bg-transparent p-0 text-muted"><Icon name="chevL" size={22} /></button>
            : <Wordmark />}
        </div>
        <Progress step={step} />
      </div>
      <div className="cm-scroll flex flex-1 flex-col overflow-y-auto px-6 py-[26px]">{children}</div>
      {footer && <div className="shrink-0 px-6 pb-7 pt-[14px]">{footer}</div>}
    </div>
  );
}

function ExplainRow({ icon, tone, title, body }: { icon: 'check' | 'close'; tone: 'green' | 'red'; title: string; body: string }) {
  return (
    <div className="flex items-start gap-[13px]">
      <span className="mt-px shrink-0" style={{ color: tone === 'green' ? 'var(--green)' : 'var(--red)' }}><Icon name={icon} size={18} /></span>
      <div>
        <div className="text-[14.5px] text-text">{title}</div>
        <div className="mt-[3px] text-[13px] leading-[1.45] text-muted">{body}</div>
      </div>
    </div>
  );
}

interface OnboardingScreenProps { step?: OnbStep; busy?: boolean; onNext?: () => void; onBack?: () => void; onSkip?: () => void; }

export function OnboardingScreen({ step = 'welcome', busy = false, onNext, onBack, onSkip }: OnboardingScreenProps) {

  if (step === 'welcome') {
    return (
      <div className="flex h-full flex-col bg-bg p-6">
        <div className="pt-[18px]"><Wordmark size={16} /></div>
        <div className="flex flex-1 flex-col justify-center gap-[26px]">
          <div>
            <div className="mono text-[13px] tracking-[0.02em] text-green">$ did you commit today?</div>
            <div className="mt-[18px] text-[32px] leading-[1.12] tracking-[-0.025em] text-text">A daily discipline coach for self-taught developers.</div>
            <div className="mt-4 text-[15.5px] leading-[1.55] text-muted">Promise the work. Push it. The coach reads your diff and tells you the truth &mdash; strict about the code, on your side about you.</div>
          </div>
        </div>
        <div className="flex flex-col gap-3 pb-[var(--safe-bottom)]">
          <Button kind="solid" icon="branch" onClick={onNext} loading={busy}>{busy ? 'Connecting…' : 'Connect GitHub'}</Button>
          <div className="mono text-center text-[11.5px] text-hint">no password. your GitHub is the login.</div>
        </div>
      </div>
    );
  }

  if (step === 'permission') {
    return (
      <Scaffold step={step} onBack={onBack} footer={
        <div className="flex flex-col gap-2.5">
          <Button kind="solid" icon="lock" onClick={onNext} loading={busy}>{busy ? 'Redirecting…' : 'Authorize on GitHub'}</Button>
          <Button kind="quiet" onClick={onBack} style={{ fontSize: 13 }}>Not now</Button>
        </div>
      }>
        <div className="text-2xl leading-tight tracking-[-0.02em]">What Commit reads</div>
        <div className="mt-2.5 text-[14.5px] leading-normal text-muted">Verification can&rsquo;t be self-reported &mdash; so Commit watches your pushes. Nothing more.</div>
        <div className="mt-6 flex flex-col gap-[18px] rounded border border-border bg-surface p-[18px]">
          <ExplainRow icon="check" tone="green" title="Reads your push events + diffs" body="To verify you shipped and to ask one question about the actual change." />
          <ExplainRow icon="check" tone="green" title="Public + private repos you pick" body="You choose which repos count. Change it anytime." />
          <div className="h-px bg-border-soft" />
          <ExplainRow icon="close" tone="red" title="Never writes to your code" body="No commits, no pushes, no branches on your behalf. Read-only." />
          <ExplainRow icon="close" tone="red" title="Never sells or shares your data" body="The diff is read, the question is asked, nothing leaves." />
        </div>
      </Scaffold>
    );
  }

  if (step === 'schedule') {
    return (
      <Scaffold step={step} onBack={onBack} footer={<Button kind="solid" iconRight="arrow" onClick={onNext}>Continue</Button>}>
        <div className="text-2xl leading-tight tracking-[-0.02em]">When&rsquo;s your daily check?</div>
        <div className="mt-2.5 text-[14.5px] leading-normal text-muted">&ldquo;Daily&rdquo; and the nudge are local-time. Both required.</div>
        <div className="mt-[26px]">
          <SectionLabel>reminder time</SectionLabel>
          <div className="mt-3 flex items-baseline justify-center">
            <span className="mono text-[56px] tracking-[-0.03em] text-text">20:00</span>
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {['08:00','12:00','18:00','20:00','22:00'].map(t => (
              <span key={t} className="mono cursor-pointer rounded-full border px-[11px] py-[7px] text-xs" style={{ borderColor: t === '20:00' ? 'var(--green-edge)' : 'var(--border)', color: t === '20:00' ? 'var(--green)' : 'var(--muted)', background: t === '20:00' ? 'var(--green-fill)' : 'transparent' }}>{t}</span>
            ))}
          </div>
        </div>
        <div className="mt-7">
          <SectionLabel>timezone</SectionLabel>
          <div className="mt-3 flex items-center gap-[11px] rounded border border-border bg-surface px-4 py-[14px]">
            <Icon name="globe" size={18} style={{ color: 'var(--muted)' }} />
            <span className="flex-1 text-[15px]">Europe/Berlin</span>
            <span className="mono text-xs text-hint">detected</span>
            <Icon name="chevron" size={16} style={{ color: 'var(--hint)' }} />
          </div>
        </div>
      </Scaffold>
    );
  }

  if (step === 'install') {
    return (
      <Scaffold step={step} onBack={onBack} footer={
        <div className="flex flex-col gap-2.5">
          <Button kind="solid" icon="install" onClick={onNext}>I&rsquo;ve added it</Button>
          <Button kind="quiet" onClick={onNext} style={{ fontSize: 13 }}>Skip — I&rsquo;ll do it later</Button>
        </div>
      }>
        <div className="flex flex-col items-center pt-2 text-center">
          <div className="flex h-[72px] w-[72px] items-center justify-center rounded-[18px] border border-border bg-[#0D1117] shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
            <span className="mono text-[30px] font-medium text-green">$</span>
          </div>
          <div className="mt-[22px] text-2xl leading-tight tracking-[-0.02em]">Commit lives on your home screen.</div>
          <div className="mt-3 max-w-[280px] text-[14.5px] leading-normal text-muted">Like a real app — and the only way the daily nudge reaches you on iPhone.</div>
        </div>
        <div className="mt-[26px] flex flex-col gap-[14px] rounded border border-border bg-surface p-4">
          {['Tap Share in the browser bar', 'Choose Add to Home Screen'].map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="mono flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[5px] bg-surface-2 text-xs text-muted">{i + 1}</span>
              <span className="text-sm">{s}</span>
            </div>
          ))}
        </div>
      </Scaffold>
    );
  }

  if (step === 'partner') {
    return (
      <Scaffold step={step} onBack={onBack} footer={
        <div className="flex flex-col gap-2.5">
          <Button kind="solid" iconRight="arrow" onClick={onNext}>Add partner</Button>
          <Button kind="quiet" onClick={onSkip} style={{ fontSize: 13 }}>Skip — just me for now</Button>
        </div>
      }>
        <div className="text-2xl leading-tight tracking-[-0.02em]">Want someone watching?</div>
        <div className="mt-2.5 text-[14.5px] leading-normal text-muted">Optional. On a missed day, Commit pings one person. The stake is real, the choice is yours.</div>
        <div className="mt-6">
          <SectionLabel>partner email</SectionLabel>
          <div className="mt-3 flex items-center gap-[11px] rounded border border-border bg-surface px-[14px] py-1">
            <Icon name="mail" size={18} style={{ color: 'var(--hint)' }} />
            <input className="flex-1 border-0 bg-transparent py-[13px] text-[15px] text-text outline-none" placeholder="maya@example.com" />
          </div>
        </div>
        <div className="mt-[14px] flex items-center gap-3 rounded border border-border bg-surface px-4 py-[14px]">
          <Icon name="globe" size={18} style={{ color: 'var(--muted)' }} />
          <div className="flex-1">
            <div className="text-[14.5px]">Public log instead</div>
            <div className="mt-0.5 text-[12.5px] text-hint">A shareable page of your streak</div>
          </div>
          <Toggle on={false} />
        </div>
      </Scaffold>
    );
  }

  // first commitment
  return (
    <Scaffold step={step} onBack={onBack} footer={<Button kind="green" icon="commit" onClick={onNext}>Seal your first commitment</Button>}>
      <div className="mono text-[13px] text-green">$ commit init</div>
      <div className="mt-[14px] text-[25px] leading-[1.18] tracking-[-0.02em]">Make tomorrow&rsquo;s promise.</div>
      <div className="mt-2.5 text-[14.5px] leading-normal text-muted">No streak yet. It starts the moment you keep this.</div>
      <div className="mt-6 flex gap-2 rounded border border-border bg-surface p-1">
        {(['build', 'learn'] as const).map((id, n) => (
          <div key={id} className="flex flex-1 items-center justify-center gap-[7px] rounded-md py-2.5 text-sm" style={{ background: n === 0 ? 'var(--surface-2)' : 'transparent', color: n === 0 ? 'var(--text)' : 'var(--hint)', boxShadow: n === 0 ? 'inset 0 0 0 1px var(--border)' : 'none' }}>
            <Icon name={id === 'build' ? 'code' : 'book'} size={16} />{id === 'build' ? 'build code' : 'learn'}
          </div>
        ))}
      </div>
      <textarea className="mt-[14px] w-full resize-none rounded border border-border bg-bg px-[14px] py-[13px] text-[17px] leading-[1.4] text-text outline-none" rows={3} placeholder="What will you ship tomorrow?" defaultValue="Set up the project and push a working hello-world endpoint." />
      <div className="mt-[14px] flex items-start gap-[9px] text-[12.5px] leading-normal text-muted">
        <Tag tone="blue" style={{ flexShrink: 0 }}><Icon name="spark" size={12} />beginner</Tag>
        <span>You&rsquo;re just starting — learning and pushing notes counts. The bar rises with you.</span>
      </div>
    </Scaffold>
  );
}
