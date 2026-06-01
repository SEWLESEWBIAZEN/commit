'use client';
import React, { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { ResolvePhase, ResolveVerdict, CommitType, NavTab, OnbStep } from '@/components/types';
import type { TodayResponse, VerdictPayload } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import { BottomNav } from '@/components/ui';
import { TodayScreen } from '@/components/today';
import { ResolveScreen } from '@/components/resolve';
import { CommitScreen } from '@/components/commitment';
import { OnboardingScreen } from '@/components/onboarding';
import { InsightsScreen } from '@/components/insights';
import { SettingsScreen } from '@/components/settings';
import { RepoSelect } from '@/components/repo-select';

interface Me {
  authed: boolean;
  repo: string | null;
  hasCommitments: boolean;
  streak: number;
  login: string | null;
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
  const [tab, setTab] = useState<NavTab>('today');
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

  const signInGitHub = async () => {
    if (!supabase) return;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        scopes: 'repo read:user user:email',
        redirectTo: `${window.location.origin}/auth/callback?tz=${encodeURIComponent(tz)}`,
      },
    });
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
    if (resolutionId) {
      await fetch('/api/resolve/emotion', {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify({ resolution_id: resolutionId, mood, energy, note }),
      });
    }
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
          onSeal={sealing ? undefined : sealFirst}
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
          onSeal={sealing ? undefined : sealCommit}
          onBack={() => setOverlay(null)}
        />
      );
    }
    return null;
  };

  let body: React.ReactNode;
  if (tab === 'insights') {
    body = <InsightsScreen empty onNav={(t: string) => setTab(t as NavTab)} />;
  } else if (tab === 'settings') {
    body = <SettingsScreen />;
  } else if (!today) {
    return <Splash label="loading today" />;
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
        pushCommits={today.push?.commits}
        pushMinutesAgo={today.push?.minutesAgo}
        pushAdd={today.push?.additions}
        pushDel={today.push?.deletions}
        pushFiles={today.push?.files}
        onResolve={onResolve}
        onSetCommitment={() => openCommit(today.state === 'rest' ? 'tomorrow' : 'today')}
        onView={viewResolution}
      />
    );
  }

  return (
    <Shell nav={overlay ? undefined : <BottomNav active={tab === 'insightsEmpty' ? 'insights' : tab} onNav={(t: string) => setTab(t as NavTab)} />}>
      {overlay ? renderOverlay() : body}
      {preparing && <Preparing />}
      <ErrorToast err={err} />
    </Shell>
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

function errorLabel(code?: string): string {
  switch (code) {
    case 'no_push': return 'No push detected yet today — push your work first.';
    case 'no_commitment': return 'Set a commitment for today first.';
    case 'github_not_connected': return 'GitHub isn’t connected. Try signing in again.';
    default: return code ?? 'Something went wrong.';
  }
}
