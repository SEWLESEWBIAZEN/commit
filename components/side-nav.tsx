'use client';
import React from 'react';
import { Icon, Wordmark } from './ui';
import type { IconName } from './types';

interface SideNavProps {
  active: string;
  onNav: (tab: string) => void;
  login?: string | null;
  avatar?: string | null;
  streak?: number;
  theme?: 'light' | 'dark';
  onSetTheme?: (t: 'light' | 'dark') => void;
}

// Desktop-only left rail (replaces the mobile bottom tab bar on wide screens).
export function SideNav({ active, onNav, login, avatar, streak, theme, onSetTheme }: SideNavProps) {
  const tabs: { id: string; label: string; icon: IconName }[] = [
    { id: 'today', label: 'Today', icon: 'home' },
    { id: 'insights', label: 'Insights', icon: 'chart' },
    { id: 'settings', label: 'Settings', icon: 'gear' },
  ];
  return (
    <aside className="box-border flex h-screen w-[248px] shrink-0 flex-col border-r border-border-soft bg-surface px-4 py-[22px]">
      <div className="px-2.5 pb-[22px] pt-1"><Wordmark size={18} /></div>

      <nav className="flex flex-1 flex-col gap-1">
        {tabs.map((t) => {
          const on = active === t.id || (active === 'insightsEmpty' && t.id === 'insights');
          return (
            <button
              key={t.id}
              onClick={() => onNav(t.id)}
              className={`flex w-full items-center gap-3 rounded-[9px] border-0 px-3 py-[11px] text-left text-[15px] transition-colors ${
                on ? 'bg-surface-2 text-text font-medium' : 'bg-transparent text-muted font-normal'
              }`}
            >
              <Icon name={t.icon} size={20} sw={on ? 2 : 1.7} />
              {t.label}
              {t.id === 'today' && streak != null && streak > 0 && (
                <span className="mono ml-auto text-xs text-green">{streak}</span>
              )}
            </button>
          );
        })}
      </nav>

      {onSetTheme && (
        <div className="mb-2.5 flex gap-1 rounded border border-border bg-surface-2 p-[3px]">
          {(['light', 'dark'] as const).map((t) => {
            const on = theme === t;
            return (
              <button
                key={t}
                onClick={() => onSetTheme(t)}
                className={`flex-1 rounded-md border-0 py-1.5 text-[12.5px] capitalize ${
                  on ? 'bg-bg text-text font-medium shadow-[inset_0_0_0_1px_var(--border)]' : 'bg-transparent text-hint font-normal'
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-2.5 border-t border-border-soft px-2 pb-0.5 pt-3">
        <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center overflow-hidden rounded-[7px] border border-border bg-surface-2 text-muted">
          {avatar ? <img src={avatar} alt="" width={30} height={30} className="object-cover" /> : <Icon name="user" size={16} />}
        </div>
        <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[13.5px] text-muted">@{login ?? 'you'}</span>
      </div>
    </aside>
  );
}
