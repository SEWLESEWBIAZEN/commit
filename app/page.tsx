'use client';
import React, { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { ResolvePhase, ResolveVerdict, CommitType, NavTab, OnbStep } from '@/components/types';
import type { TodayResponse, VerdictPayload, InsightsData, RepoCommit, NotificationSettings } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import { BottomNav } from '@/components/ui';
import { TodayScreen } from '@/components/today';
import { ResolveScreen } from '@/components/resolve';
import { CommitScreen } from '@/components/commitment';
import { OnboardingScreen } from '@/components/onboarding';
import { InsightsScreen } from '@/components/insights';
import { SettingsScreen, type SettingsPatch } from '@/components/settings';
import { RepoSelect } from '@/components/repo-select';
import { SideNav } from '@/components/side-nav';
import { subscribeToPush, unsubscribeFromPush, pushSupported } from '@/lib/push-client';

type Theme = 'light' | 'dark';

// Reads the theme set on <html> by the no-flash script in layout.tsx, and
// persists changes to localStorage.
function useTheme(): { theme: Theme; setTheme: (t: Theme) => void } {
  const [theme, setThemeState] = useState<Theme>('dark');
  useEffect(() => {
    const t = (document.documentElement.dataset.theme as Theme) || 'dark';
    setThemeState(t === 'light' ? 'light' : 'dark');
  }, []);
  const setTheme = useCallback((t: Theme) => {
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem('theme', t); } catch { /* ignore */ }
    setThemeState(t);
  }, []);
  return { theme, setTheme };
}

// True on wide (desktop) viewports. SSR-safe: starts false, resolves on mount.
function useIsDesktop(breakpoint = 1024): boolean {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${breakpoint}px)`);
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, [breakpoint]);
  return isDesktop;
}

interface Me {
  authed: boolean;
  repo: string | null;
  hasCommitments: boolean;
  streak: number;
  login: string | null;
  avatar?: string | null;
  timezone?: string | null;
}

const JSON_HEADERS = { 'Content-Type': 'application/json' };

// ── Centered mobile shell ─────────────────────────────────────
function Shell({ children, nav }: { children: React.ReactNode; nav?: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--bg)', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 440, height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)', overflow: 'hidden' }}>
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>{children}</div>
        {nav}
      </div>
    </div>
  );
}

function Splash({ label = 'loading' }: { label?: string }) {
  return (
    <Shell>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--hint)' }}>
        <span className="mono" style={{ fontSize: 13, display: 'inline-flex', gap: 6, alignItems: 'center' }}>
          <span style={{ color: 'var(--green)' }}>$</span>{label}
          <span style={{ display: 'inline-flex', gap: 4, color: 'var(--blue)' }}><span className="cm-dot" /><span className="cm-dot" /><span className="cm-dot" /></span>
        </span>
      </div>
    </Shell>
  );
}

type Supa = ReturnType<typeof createClient>;

export default function App() {
  const [supabase, setSupabase] = useState<Supa | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [configMissing, setConfigMissing] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [today, setToday] = useState<TodayResponse | null>(null);
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [commits, setCommits] = useState<RepoCommit[]>([]);
  const [commitsLoading, setCommitsLoading] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [pushBusy, setPushBusy] = useState(false);
  const [settingsNotice, setSettingsNotice] = useState<string | null>(null);
  const [testBusy, setTestBusy] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [emotionBusy, setEmotionBusy] = useState(false);
  const [tab, setTab] = useState<NavTab>('today');
  const isDesktop = useIsDesktop();
  const { theme, setTheme } = useTheme();
  const [err, setErr] = useState<string | null>(null);

  // onboarding (pre-auth) sub-step
  const [onbStep, setOnbStep] = useState<OnbStep>('welcome');

  // overlays
  const [overlay, setOverlay] = useState<'resolve' | 'commit' | null>(null);
  const [preparing, setPreparing] = useState(false);

  // resolve flow
  const [phase, setPhase] = useState<ResolvePhase>('question');
  const [verdict, setVerdict] = useState<ResolveVerdict>('wrong');
  const [vContent, setVContent] = useState<VerdictPayload | null>(null);
  const [question, setQuestion] = useState('');
  const [commitSha, setCommitSha] = useState('');
  const [commitmentId, setCommitmentId] = useState('');
  const [resolutionId, setResolutionId] = useState<string | null>(null);
  const [answer, setAnswer] = useState('');
  const [qStats, setQStats] = useState({ add: 0, del: 0, files: 0 });
  const [mood, setMood] = useState(0);
  const [energy, setEnergy] = useState(0);
  const [note, setNote] = useState('');

  // commit form
  const [commitVal, setCommitVal] = useState('');
  const [ctype, setCtype] = useState<CommitType>('build');
  const [commitTarget, setCommitTarget] = useState<'today' | 'tomorrow'>('tomorrow');
  const [sealing, setSealing] = useState(false);

  // ── data loaders ────────────────────────────────────────────
  const loadMe = useCallback(async () => {
    const res = await fetch('/api/me');
    if (res.status === 401) { setMe(null); return; }
    setMe(await res.json());
  }, []);

  const loadToday = useCallback(async () => {
    const res = await fetch('/api/today');
    if (res.ok) setToday(await res.json());
  }, []);

  // ── auth bootstrap (browser-only client) ────────────────────
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setConfigMissing(true);
      setAuthChecked(true);
      return;
    }
    const c = createClient();
    setSupabase(c);
    c.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthChecked(true);
    });
    const { data: sub } = c.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) { loadMe(); } else { setMe(null); }
  }, [session, loadMe]);

  useEffect(() => {
    if (me?.repo && me.hasCommitments) loadToday();
  }, [me, loadToday]);

  // Load insights + recent commits whenever the tab is opened (always fresh).
  useEffect(() => {
    if (tab === 'insights') {
      setInsightsLoading(true);
      fetch('/api/insights')
        .then((r) => (r.ok ? r.json() : null))
        .then(setInsights)
        .finally(() => setInsightsLoading(false));
      setCommitsLoading(true);
      fetch('/api/github/commits')
        .then((r) => (r.ok ? r.json() : { commits: [] }))
        .then((d) => setCommits(d.commits ?? []))
        .finally(() => setCommitsLoading(false));
    }
    if (tab === 'settings') {
      setSettingsNotice(null);
      fetch('/api/settings')
        .then((r) => (r.ok ? r.json() : null))
        .then((d: NotificationSettings | null) => d && setSettings(d));
    }
  }, [tab]);

  // ── settings handlers ───────────────────────────────────────
  const saveSettings = useCallback((patch: SettingsPatch) => {
    setSettings((s) => (s ? { ...s, ...patch } : s));
    fetch('/api/settings', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(patch),
    }).catch(() => {});
  }, []);

  const togglePush = useCallback(async (next: boolean) => {
    setPushBusy(true);
    setSettingsNotice(null);
    try {
      if (next) {
        const result = await subscribeToPush();
        if (result === 'subscribed') {
          setSettings((s) => (s ? { ...s, pushEnabled: true } : s));
        } else {
          const msg =
            result === 'denied' ? 'Notifications are blocked. Enable them in your browser settings, then try again.'
            : result === 'unsupported' ? 'This browser doesn’t support push notifications. On iPhone, add Commit to your home screen first.'
            : result === 'no-key' ? 'Push isn’t configured on the server (missing VAPID key).'
            : 'Couldn’t enable push notifications. Please try again.';
          setSettingsNotice(msg);
        }
      } else {
        await unsubscribeFromPush();
        setSettings((s) => (s ? { ...s, pushEnabled: false } : s));
        await fetch('/api/push/unsubscribe', { method: 'POST', headers: JSON_HEADERS, body: '{}' }).catch(() => {});
      }
    } finally {
      setPushBusy(false);
    }
  }, []);

  const sendTest = useCallback(async () => {
    setTestBusy(true);
    setSettingsNotice(null);
    try {
      const res = await fetch('/api/notifications/test', { method: 'POST' });
      if (!res.ok) { setSettingsNotice('Couldn’t send the test. Please try again.'); return; }
      const d = (await res.json()) as {
        push: { sent: number; reason: string | null };
        email: { sent: boolean; to: string | null; reason: string | null };
      };

      const pushMsg =
        d.push.sent > 0 ? `Push sent to ${d.push.sent} device${d.push.sent === 1 ? '' : 's'}.`
        : d.push.reason === 'no_subscription' ? 'Push: turn on Push notifications first.'
        : d.push.reason === 'not_configured' ? 'Push: not configured on the server.'
        : 'Push: nothing sent.';
      const emailMsg =
        d.email.sent ? `Email sent to ${d.email.to}.`
        : d.email.reason === 'not_configured' ? 'Email: SMTP not configured on the server.'
        : d.email.reason === 'no_address' ? 'Email: no address on your account.'
        : 'Email: send failed.';

      setSettingsNotice(`${pushMsg} ${emailMsg}`);
    } catch {
      setSettingsNotice('Couldn’t send the test. Please try again.');
    } finally {
      setTestBusy(false);
    }
  }, []);

  const disconnect = async () => {
    setDisconnecting(true);
    await fetch('/api/github/disconnect', { method: 'POST' }).catch(() => {});
    await supabase?.auth.signOut();
    setDisconnecting(false);
    setSession(null);
    setMe(null);
    setToday(null);
    setInsights(null);
    setCommits([]);
    setSettings(null);
    setOverlay(null);
    setTab('today');
    setOnbStep('welcome');
  };

  const signInGitHub = async () => {
    if (!supabase) return;
    setAuthBusy(true);
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        scopes: 'repo read:user user:email',
        redirectTo: `${window.location.origin}/auth/callback?tz=${encodeURIComponent(tz)}`,
      },
    });
    if (error) setAuthBusy(false); // otherwise we're redirecting away
  };

  // ── resolve flow ────────────────────────────────────────────
  const onResolve = async () => {
    setErr(null);
    setPreparing(true);
    try {
      const res = await fetch('/api/resolve/question', { method: 'POST' });
      const d = await res.json();
      if (!res.ok) { setErr(errorLabel(d.error)); return; }
      setQuestion(d.question);
      setCommitSha(d.commit_sha);
      setCommitmentId(d.commitment_id);
      setQStats({ add: d.additions, del: d.deletions, files: d.files });
      setAnswer('');
      setVContent(null);
      setPhase('question');
      setOverlay('resolve');
    } finally {
      setPreparing(false);
    }
  };

  const submitAnswer = async () => {
    if (!answer.trim()) return;
    setPhase('loading');
    const res = await fetch('/api/resolve/submit', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ commitment_id: commitmentId, commit_sha: commitSha, question, answer }),
    });
    const d = (await res.json()) as VerdictPayload & { resolution_id: string | null; error?: string };
    if (!res.ok) { setErr(errorLabel(d.error)); setPhase('question'); return; }
    setVerdict(d.verdict);
    setVContent(d);
    setResolutionId(d.resolution_id);
    setPhase('verdict');
  };

  // X / "Answer again": for an evasive verdict, go back and retry; otherwise close.
  const onCloseResolve = () => {
    if (phase === 'verdict' && verdict === 'none') { setPhase('question'); return; }
    setOverlay(null);
  };

  const afterVerdict = () => setPhase('emotion');

  const emotionDone = async () => {
    setEmotionBusy(true);
    if (resolutionId) {
      await fetch('/api/resolve/emotion', {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify({ resolution_id: resolutionId, mood, energy, note }),
      }).catch(() => {});
    }
    setEmotionBusy(false);
    setMood(0); setEnergy(0); setNote('');
    // straight into setting tomorrow's commitment, prefilled from the lesson
    setCommitVal('');
    setCtype('build');
    setCommitTarget('tomorrow');
    setOverlay('commit');
  };

  // open the commit form directly (from empty / missed / rest)
  const openCommit = (target: 'today' | 'tomorrow') => {
    setErr(null);
    setCommitVal('');
    setCtype('build');
    setCommitTarget(target);
    setVContent(null);
    setOverlay('commit');
  };

  const sealCommit = async () => {
    if (!commitVal.trim()) return;
    setSealing(true);
    try {
      const res = await fetch('/api/commitment', {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify({ body: commitVal, type: ctype, target: commitTarget }),
      });
      if (!res.ok) { setErr('Could not save commitment'); return; }
      setOverlay(null);
      await loadToday();
    } finally {
      setSealing(false);
    }
  };

  // first commitment (onboarding gate) — always for today so they can act now
  const sealFirst = async () => {
    if (!commitVal.trim()) return;
    setSealing(true);
    try {
      const res = await fetch('/api/commitment', {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify({ body: commitVal, type: ctype, target: 'today' }),
      });
      if (!res.ok) { setErr('Could not save commitment'); return; }
      setMe((m) => (m ? { ...m, hasCommitments: true } : m));
      setCommitVal('');
      await loadToday();
    } finally {
      setSealing(false);
    }
  };

  // view an already-resolved day (read-only verdict)
  const viewResolution = () => {
    const r = today?.resolution;
    if (!r) return;
    setVerdict((r.verdict ?? 'wrong') as ResolveVerdict);
    setVContent({
      verdict: (r.verdict ?? 'wrong') as ResolveVerdict,
      verdict_title: r.verdict_title ?? '',
      verdict_body: r.verdict_body ?? '',
      lesson_title: r.lesson_title ?? '',
      lesson_body: r.lesson_body ?? '',
      suggestion: r.suggestion ?? '',
    });
    setQuestion(r.question ?? '');
    setAnswer(r.answer ?? '');
    setQStats({ add: r.additions, del: r.deletions, files: r.files });
    setPhase('verdict');
    setOverlay('resolve');
  };

  // ── render gates ────────────────────────────────────────────
  if (configMissing) return <ConfigNeeded />;
  if (!authChecked) return <Splash />;

  if (!session) {
    return (
      <Shell>
        <OnboardingScreen
          step={onbStep}
          busy={authBusy}
          onNext={() => (onbStep === 'welcome' ? setOnbStep('permission') : signInGitHub())}
          onBack={onbStep === 'welcome' ? undefined : () => setOnbStep('welcome')}
          onSkip={signInGitHub}
        />
        <ErrorToast err={err} />
      </Shell>
    );
  }

  if (!me) return <Splash label="signing in" />;

  if (!me.repo) {
    return (
      <Shell>
        <RepoSelect onSelected={(repo) => setMe({ ...me, repo })} />
        <ErrorToast err={err} />
      </Shell>
    );
  }

  if (!me.hasCommitments) {
    return (
      <Shell>
        <CommitScreen
          value={commitVal}
          onChange={setCommitVal}
          type={ctype}
          onType={setCtype}
          repo={me.repo}
          suggestion=""
          beginner
          loading={sealing}
          onSeal={sealFirst}
        />
        <ErrorToast err={err} />
      </Shell>
    );
  }

  // ── main app ────────────────────────────────────────────────
  const renderOverlay = () => {
    if (overlay === 'resolve') {
      return (
        <ResolveScreen
          phase={phase}
          verdict={verdict}
          streak={today?.streak ?? me.streak}
          repo={today?.repo ?? me.repo ?? undefined}
          add={qStats.add}
          del={qStats.del}
          files={qStats.files}
          question={question}
          answerText={answer}
          submittedAnswer={answer}
          verdictTitle={vContent?.verdict_title}
          verdictBody={vContent?.verdict_body}
          lessonTitle={vContent?.lesson_title}
          lessonBody={vContent?.lesson_body}
          suggestion={vContent?.suggestion}
          mood={mood}
          energy={energy}
          note={note}
          emotionBusy={emotionBusy}
          onAnswer={setAnswer}
          onSubmit={submitAnswer}
          onClose={onCloseResolve}
          onContinue={afterVerdict}
          onMood={setMood}
          onEnergy={setEnergy}
          onNote={setNote}
          onEmotionDone={emotionDone}
        />
      );
    }
    if (overlay === 'commit') {
      return (
        <CommitScreen
          value={commitVal}
          onChange={setCommitVal}
          type={ctype}
          onType={setCtype}
          repo={today?.repo ?? me.repo ?? undefined}
          suggestion={vContent?.suggestion ?? ''}
          beginner={(today?.streak ?? 0) < 7}
          loading={sealing}
          onSeal={sealCommit}
          onBack={() => setOverlay(null)}
        />
      );
    }
    return null;
  };

  let body: React.ReactNode;
  if (tab === 'insights') {
    body = <InsightsScreen data={insights} commits={commits} loading={insightsLoading} commitsLoading={commitsLoading} wide={isDesktop} onNav={(t: string) => setTab(t as NavTab)} />;
  } else if (tab === 'settings') {
    body = (
      <SettingsScreen
        login={me.login}
        avatar={me.avatar}
        timezone={me.timezone}
        repo={me.repo}
        disconnecting={disconnecting}
        onDisconnect={disconnect}
        settings={settings}
        onSaveSettings={saveSettings}
        onTogglePush={togglePush}
        pushBusy={pushBusy}
        pushSupported={pushSupported()}
        notice={settingsNotice}
        onTest={sendTest}
        testBusy={testBusy}
        theme={theme}
        onSetTheme={setTheme}
      />
    );
  } else if (!today) {
    body = <LoadingPane label="loading today" />;
  } else {
    body = (
      <TodayScreen
        state={today.state}
        streak={today.streak}
        prevStreak={today.prevStreak}
        repo={today.repo ?? undefined}
        commitment={today.commitment?.body}
        ctype={today.commitment?.type}
        beginner={today.beginner}
        date={formatToday()}
        pushCommits={today.push?.commits}
        pushMinutesAgo={today.push?.minutesAgo}
        pushAdd={today.push?.additions}
        pushDel={today.push?.deletions}
        pushFiles={today.push?.files}
        partnerEmail={today.partnerEmail}
        onResolve={onResolve}
        onSetCommitment={() => openCommit(today.state === 'rest' ? 'tomorrow' : 'today')}
        onView={viewResolution}
      />
    );
  }

  // ── desktop: sidebar + content area, overlays as centered modals ──
  if (isDesktop) {
    const mainMax = tab === 'insights' || tab === 'insightsEmpty' ? 1040 : tab === 'settings' ? 640 : 600;
    return (
      <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)', overflow: 'hidden' }}>
        <SideNav
          active={tab === 'insightsEmpty' ? 'insights' : tab}
          onNav={(t: string) => setTab(t as NavTab)}
          login={me.login}
          avatar={me.avatar}
          streak={today?.streak ?? me.streak}
          theme={theme}
          onSetTheme={setTheme}
        />
        <main style={{ flex: 1, minWidth: 0, height: '100vh', display: 'flex', justifyContent: 'center', overflow: 'hidden' }}>
          <div style={{ width: '100%', maxWidth: mainMax, height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {body}
          </div>
        </main>
        {overlay && <CenterModal>{renderOverlay()}</CenterModal>}
        {preparing && <Preparing />}
        <ErrorToast err={err} />
      </div>
    );
  }

  // ── mobile: single column + bottom tab bar, overlays full-screen ──
  return (
    <Shell nav={overlay ? undefined : <BottomNav active={tab === 'insightsEmpty' ? 'insights' : tab} onNav={(t: string) => setTab(t as NavTab)} />}>
      {overlay ? renderOverlay() : body}
      {preparing && <Preparing />}
      <ErrorToast err={err} />
    </Shell>
  );
}

// Centered modal card for overlays (Resolve / Commit) on desktop.
function CenterModal({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(1,4,9,0.62)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 460, height: 'min(90vh, 880px)', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 30px 90px rgba(0,0,0,0.6)' }}>
        {children}
      </div>
    </div>
  );
}

// Inline loading filler (used inside the shell/content area, no full-screen wrapper).
function LoadingPane({ label }: { label: string }) {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--hint)' }}>
      <span className="mono" style={{ fontSize: 13, display: 'inline-flex', gap: 8, alignItems: 'center' }}>
        <span style={{ display: 'inline-flex', gap: 4, color: 'var(--blue)' }}><span className="cm-dot" /><span className="cm-dot" /><span className="cm-dot" /></span>
        {label}
      </span>
    </div>
  );
}

// ── full-screen "reading your diff" while the first question is generated ──
function Preparing() {
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(1,4,9,0.82)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
      <span className="mono" style={{ color: 'var(--muted)', fontSize: 13, display: 'inline-flex', gap: 10, alignItems: 'center' }}>
        <span style={{ display: 'inline-flex', gap: 4, color: 'var(--blue)' }}><span className="cm-dot" /><span className="cm-dot" /><span className="cm-dot" /></span>
        reading your diff
      </span>
    </div>
  );
}

function ConfigNeeded() {
  return (
    <Shell>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16, padding: '0 28px' }}>
        <div className="mono" style={{ fontSize: 13, color: 'var(--amber)' }}>$ setup required</div>
        <div style={{ fontSize: 22, lineHeight: 1.25, color: 'var(--text)' }}>Add your keys to <span className="mono" style={{ color: 'var(--blue)' }}>.env.local</span></div>
        <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.55 }}>
          Set <span className="mono">NEXT_PUBLIC_SUPABASE_URL</span>, <span className="mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</span>,
          <span className="mono"> SUPABASE_SERVICE_ROLE_KEY</span> and <span className="mono">ANTHROPIC_API_KEY</span>, then restart the dev server. See the README for the full setup.
        </div>
      </div>
    </Shell>
  );
}

function ErrorToast({ err }: { err: string | null }) {
  if (!err) return null;
  return (
    <div style={{ position: 'absolute', bottom: 24, left: 16, right: 16, background: 'var(--red-fill)', border: '1px solid var(--red)', borderRadius: 10, padding: '12px 14px', color: 'var(--text)', fontSize: 13.5, zIndex: 400 }}>
      {err}
    </div>
  );
}

// Header date in the prototype's style, e.g. "mon · jun 1" (user's local date).
function formatToday(): string {
  const d = new Date();
  const wd = d.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
  const mo = d.toLocaleDateString('en-US', { month: 'short' }).toLowerCase();
  return `${wd} · ${mo} ${d.getDate()}`;
}

function errorLabel(code?: string): string {
  switch (code) {
    case 'no_push': return 'No push detected yet today — push your work first.';
    case 'no_commitment': return 'Set a commitment for today first.';
    case 'github_not_connected': return 'GitHub isn’t connected. Try signing in again.';
    default: return code ?? 'Something went wrong.';
  }
}
