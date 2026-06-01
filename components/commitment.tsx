'use client';
import React from 'react';
import type { CommitType } from './types';
import { Icon, Tag, Button, SectionLabel, Wordmark } from './ui';

interface CommitScreenProps {
  value?: string; onChange?: (s: string) => void;
  type?: CommitType; onType?: (t: CommitType) => void;
  repo?: string; onSeal?: () => void; onBack?: () => void;
  suggestion?: string; beginner?: boolean; loading?: boolean;
}

export function CommitScreen({
  value = '', onChange, type = 'build', onType,
  repo = 'auth-service', onSeal, onBack,
  suggestion = 'Add refresh-token rotation: issue a new token on every use, invalidate the old one.',
  beginner = false, loading = false,
}: CommitScreenProps) {
  const empty = !value.trim();

  return (
    <div className="flex h-full flex-col bg-bg">
      {/* nav */}
      <div className="flex shrink-0 items-center gap-3 px-5 pt-3">
        <button onClick={onBack} className="-ml-1 flex border-0 bg-transparent p-0 text-muted">
          <Icon name="chevL" size={24} />
        </button>
        <Wordmark />
      </div>

      {/* body */}
      <div className="cm-scroll flex flex-1 flex-col gap-[22px] overflow-y-auto px-5 py-[22px]">
        <div>
          <SectionLabel>tomorrow&rsquo;s promise</SectionLabel>
          <div className="mt-3 text-[26px] leading-[1.18] tracking-[-0.02em] text-text">What will you commit to tomorrow?</div>
        </div>

        {/* type toggle */}
        <div className="flex gap-2 rounded border border-border bg-surface p-1">
          {([['build', 'code', 'build code'], ['learn', 'book', 'learn']] as [CommitType, 'code' | 'book', string][]).map(([id, icon, label]) => {
            const on = type === id;
            return (
              <button
                key={id}
                onClick={() => onType?.(id)}
                className={`flex flex-1 items-center justify-center gap-[7px] rounded-md border-0 py-2.5 text-sm transition-all ${
                  on ? 'bg-surface-2 text-text font-medium shadow-[inset_0_0_0_1px_var(--border)]' : 'bg-transparent text-hint font-normal'
                }`}
              >
                <Icon name={icon} size={16} />{label}
              </button>
            );
          })}
        </div>

        {/* promise field */}
        <div>
          <textarea
            className="w-full resize-none rounded border border-border bg-bg px-[14px] py-[13px] text-[17px] leading-[1.4] text-text outline-none"
            rows={3}
            placeholder={type === 'learn' ? 'e.g. read the OAuth refresh spec and push notes' : 'e.g. add rotation + replay detection to the token service'}
            value={value} onChange={e => onChange?.(e.target.value)} autoFocus
          />
          {repo && type === 'build' && (
            <div className="mono mt-2.5 flex items-center gap-1.5 text-xs text-hint">
              <Icon name="branch" size={13} sw={1.8} />pushes to {repo}
            </div>
          )}
          {beginner && (
            <div className="mt-3 flex items-start gap-[9px] text-[12.5px] leading-normal text-muted">
              <Tag tone="blue" style={{ flexShrink: 0 }}><Icon name="spark" size={12} />beginner</Tag>
              <span>Early on, learning and pushing notes counts. The bar rises as you build a track record.</span>
            </div>
          )}
        </div>

        {/* coach suggestion */}
        {suggestion && (
          <div className="border-l-2 border-amber pl-[14px]">
            <div className="mono mb-2 flex items-center gap-[7px] text-[10.5px] uppercase tracking-[0.07em] text-amber">
              <Icon name="spark" size={13} />from today&rsquo;s lesson
            </div>
            <div className="text-sm leading-normal text-muted">{suggestion}</div>
            <button
              onClick={() => { onType?.('build'); onChange?.(suggestion); }}
              className="mono mt-2.5 inline-flex items-center gap-1.5 border-0 bg-transparent p-0 text-[13px] text-blue">
              <Icon name="plus" size={14} />Use this
            </button>
          </div>
        )}
      </div>

      {/* footer CTA */}
      <div className="shrink-0 border-t border-border-soft bg-bg px-5 pb-7 pt-[14px]">
        <Button kind={empty ? 'ghost' : 'green'} icon="commit" onClick={onSeal} disabled={empty} loading={loading}>
          {loading ? 'Sealing…' : 'Seal tomorrow’s commitment'}
        </Button>
      </div>
    </div>
  );
}
