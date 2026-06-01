'use client';
import React from 'react';
import type { OnbStep } from './types';
import { Icon, Tag, Button, SectionLabel, Toggle, Wordmark } from './ui';

const ONB_ORDER: OnbStep[] = ['permission', 'schedule', 'install', 'partner', 'first'];

function Progress({ step }: { step: OnbStep }) {
  const i = ONB_ORDER.indexOf(step);
  if (i < 0) return null;
  return (
    <div style={{ display: 'flex', gap: 6, padding: '0 20px' }}>
      {ONB_ORDER.map((_, n) => (
        <div key={n} style={{ flex: 1, height: 3, borderRadius: 2, background: n <= i ? 'var(--green)' : 'var(--border)', transition: 'background .2s' }} />
      ))}
    </div>
  );
}

function Scaffold({ children, footer, step, onBack }: { children: React.ReactNode; footer?: React.ReactNode; step: OnbStep; onBack?: () => void }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <div style={{ flexShrink: 0, paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 20px', minHeight: 24 }}>
          {onBack
            ? <button onClick={onBack} style={{ background: 'none', border: 0, color: 'var(--muted)', cursor: 'pointer', padding: 0, display: 'flex', marginLeft: -4 }}><Icon name="chevL" size={22} /></button>
            : <Wordmark />}
        </div>
        <Progress step={step} />
      </div>
      <div className="cm-scroll" style={{ flex: 1, overflowY: 'auto', padding: '26px 24px', display: 'flex', flexDirection: 'column' }}>{children}</div>
      {footer && <div style={{ flexShrink: 0, padding: '14px 24px 28px' }}>{footer}</div>}
    </div>
  );
}

function ExplainRow({ icon, tone, title, body }: { icon: 'check' | 'close'; tone: 'green' | 'red'; title: string; body: string }) {
  return (
    <div style={{ display: 'flex', gap: 13, alignItems: 'flex-start' }}>
      <span style={{ color: tone === 'green' ? 'var(--green)' : 'var(--red)', marginTop: 1, flexShrink: 0 }}><Icon name={icon} size={18} /></span>
      <div>
        <div style={{ fontSize: 14.5, color: 'var(--text)' }}>{title}</div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 3, lineHeight: 1.45 }}>{body}</div>
      </div>
    </div>
  );
}

interface OnboardingScreenProps { step?: OnbStep; onNext?: () => void; onBack?: () => void; onSkip?: () => void; }

export function OnboardingScreen({ step = 'welcome', onNext, onBack, onSkip }: OnboardingScreenProps) {

  if (step === 'welcome') {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)', padding: '24px' }}>
        <div style={{ paddingTop: 18 }}><Wordmark size={16} /></div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 26 }}>
          <div>
            <div className="mono" style={{ fontSize: 13, color: 'var(--green)', letterSpacing: '0.02em' }}>$ did you commit today?</div>
            <div style={{ fontSize: 32, lineHeight: 1.12, marginTop: 18, letterSpacing: '-0.025em', color: 'var(--text)' }}>A daily discipline coach for self-taught developers.</div>
            <div style={{ fontSize: 15.5, color: 'var(--muted)', marginTop: 16, lineHeight: 1.55 }}>Promise the work. Push it. The coach reads your diff and tells you the truth &mdash; strict about the code, on your side about you.</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 'var(--safe-bottom)' }}>
          <Button kind="solid" icon="branch" onClick={onNext}>Connect GitHub</Button>
          <div className="mono" style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--hint)' }}>no password. your GitHub is the login.</div>
        </div>
      </div>
    );
  }

  if (step === 'permission') {
    return (
      <Scaffold step={step} onBack={onBack} footer={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Button kind="solid" icon="lock" onClick={onNext}>Authorize on GitHub</Button>
          <Button kind="quiet" onClick={onBack} style={{ fontSize: 13 }}>Not now</Button>
        </div>
      }>
        <div style={{ fontSize: 24, lineHeight: 1.2, letterSpacing: '-0.02em' }}>What Commit reads</div>
        <div style={{ fontSize: 14.5, color: 'var(--muted)', marginTop: 10, lineHeight: 1.5 }}>Verification can&rsquo;t be self-reported &mdash; so Commit watches your pushes. Nothing more.</div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: 18, marginTop: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <ExplainRow icon="check" tone="green" title="Reads your push events + diffs" body="To verify you shipped and to ask one question about the actual change." />
          <ExplainRow icon="check" tone="green" title="Public + private repos you pick" body="You choose which repos count. Change it anytime." />
          <div style={{ height: 1, background: 'var(--border-soft)' }} />
          <ExplainRow icon="close" tone="red" title="Never writes to your code" body="No commits, no pushes, no branches on your behalf. Read-only." />
          <ExplainRow icon="close" tone="red" title="Never sells or shares your data" body="The diff is read, the question is asked, nothing leaves." />
        </div>
      </Scaffold>
    );
  }

  if (step === 'schedule') {
    return (
      <Scaffold step={step} onBack={onBack} footer={<Button kind="solid" iconRight="arrow" onClick={onNext}>Continue</Button>}>
        <div style={{ fontSize: 24, lineHeight: 1.2, letterSpacing: '-0.02em' }}>When&rsquo;s your daily check?</div>
        <div style={{ fontSize: 14.5, color: 'var(--muted)', marginTop: 10, lineHeight: 1.5 }}>&ldquo;Daily&rdquo; and the nudge are local-time. Both required.</div>
        <div style={{ marginTop: 26 }}>
          <SectionLabel>reminder time</SectionLabel>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', marginTop: 12 }}>
            <span className="mono" style={{ fontSize: 56, color: 'var(--text)', letterSpacing: '-0.03em' }}>20:00</span>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            {['08:00','12:00','18:00','20:00','22:00'].map(t => (
              <span key={t} className="mono" style={{ fontSize: 12, padding: '7px 11px', borderRadius: 999, border: `1px solid ${t === '20:00' ? 'var(--green-edge)' : 'var(--border)'}`, color: t === '20:00' ? 'var(--green)' : 'var(--muted)', background: t === '20:00' ? 'var(--green-fill)' : 'transparent', cursor: 'pointer' }}>{t}</span>
            ))}
          </div>
        </div>
        <div style={{ marginTop: 28 }}>
          <SectionLabel>timezone</SectionLabel>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '14px 16px', marginTop: 12, display: 'flex', alignItems: 'center', gap: 11 }}>
            <Icon name="globe" size={18} style={{ color: 'var(--muted)' }} />
            <span style={{ flex: 1, fontSize: 15 }}>Europe/Berlin</span>
            <span className="mono" style={{ fontSize: 12, color: 'var(--hint)' }}>detected</span>
            <Icon name="chevron" size={16} style={{ color: 'var(--hint)' }} />
          </div>
        </div>
      </Scaffold>
    );
  }

  if (step === 'install') {
    return (
      <Scaffold step={step} onBack={onBack} footer={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Button kind="solid" icon="install" onClick={onNext}>I&rsquo;ve added it</Button>
          <Button kind="quiet" onClick={onNext} style={{ fontSize: 13 }}>Skip — I&rsquo;ll do it later</Button>
        </div>
      }>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingTop: 8 }}>
          <div style={{ width: 72, height: 72, borderRadius: 18, background: '#0D1117', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
            <span className="mono" style={{ fontSize: 30, color: 'var(--green)', fontWeight: 500 }}>$</span>
          </div>
          <div style={{ fontSize: 24, lineHeight: 1.2, letterSpacing: '-0.02em', marginTop: 22 }}>Commit lives on your home screen.</div>
          <div style={{ fontSize: 14.5, color: 'var(--muted)', marginTop: 12, lineHeight: 1.5, maxWidth: 280 }}>Like a real app — and the only way the daily nudge reaches you on iPhone.</div>
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: 16, marginTop: 26, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {['Tap Share in the browser bar', 'Choose Add to Home Screen'].map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="mono" style={{ width: 22, height: 22, borderRadius: 5, background: 'var(--surface-2)', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>{i + 1}</span>
              <span style={{ fontSize: 14 }}>{s}</span>
            </div>
          ))}
        </div>
      </Scaffold>
    );
  }

  if (step === 'partner') {
    return (
      <Scaffold step={step} onBack={onBack} footer={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Button kind="solid" iconRight="arrow" onClick={onNext}>Add partner</Button>
          <Button kind="quiet" onClick={onSkip} style={{ fontSize: 13 }}>Skip — just me for now</Button>
        </div>
      }>
        <div style={{ fontSize: 24, lineHeight: 1.2, letterSpacing: '-0.02em' }}>Want someone watching?</div>
        <div style={{ fontSize: 14.5, color: 'var(--muted)', marginTop: 10, lineHeight: 1.5 }}>Optional. On a missed day, Commit pings one person. The stake is real, the choice is yours.</div>
        <div style={{ marginTop: 24 }}>
          <SectionLabel>partner email</SectionLabel>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '4px 14px', marginTop: 12, display: 'flex', alignItems: 'center', gap: 11 }}>
            <Icon name="mail" size={18} style={{ color: 'var(--hint)' }} />
            <input style={{ flex: 1, background: 'transparent', border: 0, color: 'var(--text)', fontFamily: 'var(--font-sans)', fontSize: 15, padding: '13px 0', outline: 'none' }} placeholder="maya@example.com" />
          </div>
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', marginTop: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Icon name="globe" size={18} style={{ color: 'var(--muted)' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14.5 }}>Public log instead</div>
            <div style={{ fontSize: 12.5, color: 'var(--hint)', marginTop: 2 }}>A shareable page of your streak</div>
          </div>
          <Toggle on={false} />
        </div>
      </Scaffold>
    );
  }

  // first commitment
  return (
    <Scaffold step={step} onBack={onBack} footer={<Button kind="green" icon="commit" onClick={onNext}>Seal your first commitment</Button>}>
      <div className="mono" style={{ fontSize: 13, color: 'var(--green)' }}>$ commit init</div>
      <div style={{ fontSize: 25, lineHeight: 1.18, letterSpacing: '-0.02em', marginTop: 14 }}>Make tomorrow&rsquo;s promise.</div>
      <div style={{ fontSize: 14.5, color: 'var(--muted)', marginTop: 10, lineHeight: 1.5 }}>No streak yet. It starts the moment you keep this.</div>
      <div style={{ display: 'flex', gap: 8, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: 4, marginTop: 24 }}>
        {(['build', 'learn'] as const).map((id, n) => (
          <div key={id} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '10px 0', borderRadius: 6, background: n === 0 ? 'var(--surface-2)' : 'transparent', color: n === 0 ? 'var(--text)' : 'var(--hint)', fontSize: 14, boxShadow: n === 0 ? 'inset 0 0 0 1px var(--border)' : 'none' }}>
            <Icon name={id === 'build' ? 'code' : 'book'} size={16} />{id === 'build' ? 'build code' : 'learn'}
          </div>
        ))}
      </div>
      <textarea style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--r)', color: 'var(--text)', fontFamily: 'var(--font-sans)', fontSize: 17, padding: '13px 14px', resize: 'none', outline: 'none', lineHeight: 1.4, marginTop: 14 }} rows={3} placeholder="What will you ship tomorrow?" defaultValue="Set up the project and push a working hello-world endpoint." />
      <div style={{ marginTop: 14, display: 'flex', gap: 9, alignItems: 'flex-start', fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5 }}>
        <Tag tone="blue" style={{ flexShrink: 0 }}><Icon name="spark" size={12} />beginner</Tag>
        <span>You&rsquo;re just starting — learning and pushing notes counts. The bar rises with you.</span>
      </div>
    </Scaffold>
  );
}
