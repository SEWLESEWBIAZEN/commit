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
  onSelected: (repo: string) => void;
}

// Onboarding step (replaces the prototype's schedule/install/partner): pick the
// repo whose pushes count toward the streak.
export function RepoSelect({ onSelected }: RepoSelectProps) {
  const [repos, setRepos] = useState<RepoSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chosen, setChosen] = useState<string | null>(null);
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

  const save = async () => {
    if (!chosen) return;
    setSaving(true);
    const res = await fetch('/api/github/select-repo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repo: chosen }),
    });
    if (res.ok) onSelected(chosen);
    else setSaving(false);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <div style={{ flexShrink: 0, padding: '14px 20px 0' }}>
        <Wordmark />
      </div>
      <div style={{ padding: '24px 24px 8px', flexShrink: 0 }}>
        <div style={{ fontSize: 24, lineHeight: 1.2, letterSpacing: '-0.02em', color: 'var(--text)' }}>
          Which repo counts?
        </div>
        <div style={{ fontSize: 14.5, color: 'var(--muted)', marginTop: 10, lineHeight: 1.5 }}>
          Commit watches your pushes here to verify the work. You can change it later.
        </div>
        <SectionLabel style={{ marginTop: 22 }}>your repos</SectionLabel>
      </div>

      <div className="cm-scroll" style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>
        {error && (
          <div style={{ color: 'var(--red)', fontSize: 13.5, padding: '8px 0' }}>{error}</div>
        )}
        {!repos && !error && (
          <div className="mono" style={{ color: 'var(--hint)', fontSize: 13, padding: '8px 0' }}>
            loading repos…
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {repos?.map((r) => {
            const on = chosen === r.full_name;
            return (
              <button
                key={r.full_name}
                onClick={() => setChosen(r.full_name)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 11, width: '100%', textAlign: 'left',
                  padding: '13px 14px', borderRadius: 'var(--r)', cursor: 'pointer',
                  background: on ? 'var(--green-fill)' : 'var(--surface)',
                  border: `1px solid ${on ? 'var(--green-edge)' : 'var(--border)'}`,
                  color: 'var(--text)', transition: 'all .12s',
                }}
              >
                <Icon name="branch" size={16} sw={1.8} style={{ color: on ? 'var(--green)' : 'var(--hint)', flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 14.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.full_name}</span>
                {r.private && <span className="mono" style={{ fontSize: 11, color: 'var(--hint)' }}>private</span>}
                {on && <Icon name="check" size={16} sw={2.4} style={{ color: 'var(--green)' }} />}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ flexShrink: 0, padding: '14px 20px 28px', borderTop: '1px solid var(--border-soft)' }}>
        <Button kind={chosen ? 'green' : 'ghost'} iconRight="arrow" onClick={chosen && !saving ? save : undefined} disabled={!chosen || saving}>
          {saving ? 'Saving…' : 'Use this repo'}
        </Button>
      </div>
    </div>
  );
}
