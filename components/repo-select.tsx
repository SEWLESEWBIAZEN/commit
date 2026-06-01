'use client';
import React, { useEffect, useState } from 'react';
import { Icon, Button, SectionLabel, Wordmark } from './ui';

interface RepoSummary {
  full_name: string;
  private: boolean;
  pushed_at: string | null;
  language: string | null;
}

interface RepoSelectProps {
  onSelected: (repos: string[]) => void;
}

// Onboarding step (replaces the prototype's schedule/install/partner): pick the
// repos whose pushes count toward the streak. Multiple allowed.
export function RepoSelect({ onSelected }: RepoSelectProps) {
  const [repos, setRepos] = useState<RepoSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chosen, setChosen] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/github/repos')
      .then((r) => r.json())
      .then((d) => {
        if (d.repos) setRepos(d.repos);
        else setError(d.error ?? 'Could not load repos');
      })
      .catch(() => setError('Could not load repos'));
  }, []);

  const toggle = (full: string) =>
    setChosen((c) => (c.includes(full) ? c.filter((x) => x !== full) : [...c, full]));

  const save = async () => {
    if (chosen.length === 0) return;
    setSaving(true);
    const res = await fetch('/api/github/select-repo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repos: chosen }),
    });
    if (res.ok) onSelected(chosen);
    else setSaving(false);
  };

  return (
    <div className="flex h-full flex-col bg-bg">
      <div className="shrink-0 px-5 pt-[14px]">
        <Wordmark />
      </div>
      <div className="shrink-0 px-6 pb-2 pt-6">
        <div className="text-2xl leading-tight tracking-[-0.02em] text-text">
          Which repos count?
        </div>
        <div className="mt-2.5 text-[14.5px] leading-normal text-muted">
          Pick one or more. A push to any of them counts toward your streak. You can change this later.
        </div>
        <SectionLabel style={{ marginTop: 22 }}>your repos</SectionLabel>
      </div>

      <div className="cm-scroll flex-1 overflow-y-auto px-5 py-3">
        {error && <div className="py-2 text-[13.5px] text-red">{error}</div>}
        {!repos && !error && (
          <div className="mono py-2 text-[13px] text-hint">loading repos…</div>
        )}
        <div className="flex flex-col gap-2">
          {repos?.map((r) => {
            const on = chosen.includes(r.full_name);
            return (
              <button
                key={r.full_name}
                onClick={() => toggle(r.full_name)}
                className={`flex w-full items-center gap-[11px] rounded border px-[14px] py-[13px] text-left text-text transition-all ${
                  on ? 'border-green-edge bg-green-fill' : 'border-border bg-surface'
                }`}
              >
                <Icon name="branch" size={16} sw={1.8} style={{ color: on ? 'var(--green)' : 'var(--hint)', flexShrink: 0 }} />
                <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[14.5px]">{r.full_name}</span>
                {r.private && <span className="mono text-[11px] text-hint">private</span>}
                {on && <Icon name="check" size={16} sw={2.4} style={{ color: 'var(--green)' }} />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="shrink-0 border-t border-border-soft px-5 pb-7 pt-[14px]">
        <Button kind={chosen.length ? 'green' : 'ghost'} iconRight="arrow" onClick={chosen.length && !saving ? save : undefined} disabled={chosen.length === 0 || saving}>
          {saving ? 'Saving…' : chosen.length > 1 ? `Use these ${chosen.length} repos` : 'Use this repo'}
        </Button>
      </div>
    </div>
  );
}
