'use client';
import React from 'react';
import type { CommitType } from './types';
import { Icon, Tag, Button, SectionLabel, Wordmark } from './ui';

interface CommitScreenProps {
  value?: string; onChange?: (s: string) => void;
  type?: CommitType; onType?: (t: CommitType) => void;
  repo?: string; onSeal?: () => void; onBack?: () => void;
  suggestion?: string; beginner?: boolean;
}

export function CommitScreen({
  value = '', onChange, type = 'build', onType,
  repo = 'auth-service', onSeal, onBack,
  suggestion = 'Add refresh-token rotation: issue a new token on every use, invalidate the old one.',
  beginner = false,
}: CommitScreenProps) {
  const empty = !value.trim();

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* nav */}
      <div style={{ flexShrink: 0, padding: '12px 20px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} style={{ background: 'none', border: 0, color: 'var(--muted)', cursor: 'pointer', padding: 0, display: 'flex', marginLeft: -4 }}>
          <Icon name="chevL" size={24} />
        </button>
        <Wordmark />
      </div>

      {/* body */}
      <div className="cm-scroll" style={{ flex: 1, overflowY: 'auto', padding: '22px 20px', display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div>
          <SectionLabel>tomorrow&rsquo;s promise</SectionLabel>
          <div style={{ fontSize: 26, lineHeight: 1.18, marginTop: 12, color: 'var(--text)', letterSpacing: '-0.02em' }}>What will you commit to tomorrow?</div>
        </div>

        {/* type toggle */}
        <div style={{ display: 'flex', gap: 8, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: 4 }}>
          {([['build', 'code', 'build code'], ['learn', 'book', 'learn']] as [CommitType, 'code' | 'book', string][]).map(([id, icon, label]) => {
            const on = type === id;
            return (
              <button key={id} onClick={() => onType?.(id)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '10px 0', borderRadius: 6, cursor: 'pointer', border: 0, background: on ? 'var(--surface-2)' : 'transparent', color: on ? 'var(--text)' : 'var(--hint)', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: on ? 500 : 400, boxShadow: on ? 'inset 0 0 0 1px var(--border)' : 'none', transition: 'all .12s' }}>
                <Icon name={icon} size={16} />{label}
              </button>
            );
          })}
        </div>

        {/* promise field */}
        <div>
          <textarea
            style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--r)', color: 'var(--text)', fontFamily: 'var(--font-sans)', fontSize: 17, padding: '13px 14px', resize: 'none', outline: 'none', lineHeight: 1.4 }}
            rows={3}
            placeholder={type === 'learn' ? 'e.g. read the OAuth refresh spec and push notes' : 'e.g. add rotation + replay detection to the token service'}
            value={value} onChange={e => onChange?.(e.target.value)} autoFocus
          />
          {repo && type === 'build' && (
            <div className="mono" style={{ marginTop: 10, fontSize: 12, color: 'var(--hint)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="branch" size={13} sw={1.8} />pushes to {repo}
            </div>
          )}
          {beginner && (
            <div style={{ marginTop: 12, display: 'flex', gap: 9, alignItems: 'flex-start', fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5 }}>
              <Tag tone="blue" style={{ flexShrink: 0 }}><Icon name="spark" size={12} />beginner</Tag>
              <span>Early on, learning and pushing notes counts. The bar rises as you build a track record.</span>
            </div>
          )}
        </div>

        {/* coach suggestion */}
        {suggestion && (
        <div style={{ borderLeft: '2px solid var(--amber)', paddingLeft: 14 }}>
          <div className="mono" style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--amber)', display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
            <Icon name="spark" size={13} />from today&rsquo;s lesson
          </div>
          <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.5 }}>{suggestion}</div>
          <button
            onClick={() => { onType?.('build'); onChange?.(suggestion); }}
            style={{ background: 'none', border: 0, padding: 0, marginTop: 10, fontSize: 13, color: 'var(--blue)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Icon name="plus" size={14} />Use this
          </button>
        </div>
        )}
      </div>

      {/* footer CTA */}
      <div style={{ flexShrink: 0, padding: '14px 20px 28px', borderTop: '1px solid var(--border-soft)', background: 'rgba(13,17,23,0.9)' }}>
        <Button kind={empty ? 'ghost' : 'green'} icon="commit" onClick={empty ? undefined : onSeal} disabled={empty}>
          Seal tomorrow&rsquo;s commitment
        </Button>
      </div>
    </div>
  );
}
