'use client';
import React, { useEffect, useState } from 'react';
import { Icon, Toggle } from './ui';
import type { NotificationSettings } from '@/lib/types';

function Row({ icon, label, value, onClick, danger = false, last = false, control }: {
  icon?: 'clock' | 'globe' | 'bell' | 'mail' | 'user' | 'branch' | 'install' | 'lock' | 'close' | 'gear' | 'spark';
  label: string; value?: string; onClick?: () => void;
  danger?: boolean; last?: boolean; control?: React.ReactNode;
}) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-[13px] px-4 py-[14px] ${onClick ? 'cursor-pointer' : 'cursor-default'} ${last ? '' : 'border-b border-border-soft'}`}
    >
      {icon && <span className={`shrink-0 ${danger ? 'text-red' : 'text-muted'}`}><Icon name={icon} size={18} /></span>}
      <span className={`flex-1 text-[15px] ${danger ? 'text-red' : 'text-text'}`}>{label}</span>
      {value && <span className="mono text-[13px] text-muted">{value}</span>}
      {control}
      {onClick && !control && <Icon name="chevron" size={16} style={{ color: 'var(--hint)' }} />}
    </div>
  );
}

function Group({ header, children }: { header: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mono mb-2.5 px-1 text-[11px] uppercase tracking-[0.08em] text-hint">{header}</div>
      <div className="overflow-hidden rounded border border-border bg-surface">{children}</div>
    </div>
  );
}

export type SettingsPatch = Partial<{
  reminderTime: string;
  remindersEnabled: boolean;
  emailEnabled: boolean;
  partnerEmail: string | null;
}>;

interface SettingsScreenProps {
  login?: string | null;
  avatar?: string | null;
  timezone?: string | null;
  repo?: string | null;
  repos?: string[];
  disconnecting?: boolean;
  onDisconnect?: () => void;
  settings?: NotificationSettings | null;
  onSaveSettings?: (patch: SettingsPatch) => void;
  onTogglePush?: (next: boolean) => void;
  pushBusy?: boolean;
  pushSupported?: boolean;
  notice?: string | null;
  onTest?: () => void;
  testBusy?: boolean;
  theme?: 'light' | 'dark';
  onSetTheme?: (t: 'light' | 'dark') => void;
  share?: { publicEnabled: boolean; token: string | null; login: string | null } | null;
  onTogglePublic?: (enabled: boolean) => void;
  onGenerateLink?: () => void;
  onRevokeLink?: () => void;
}

export function SettingsScreen({
  login, avatar, timezone, repo, repos, disconnecting = false, onDisconnect,
  settings, onSaveSettings, onTogglePush, pushBusy = false, pushSupported = true, notice,
  onTest, testBusy = false, theme = 'dark', onSetTheme,
  share, onTogglePublic, onGenerateLink, onRevokeLink,
}: SettingsScreenProps = {}) {
  // Local mirror of server prefs for optimistic toggles + the partner draft.
  const [reminders, setReminders] = useState(true);
  const [time, setTime] = useState('20:00');
  const [email, setEmail] = useState(true);
  const [partnerDraft, setPartnerDraft] = useState('');
  const [partnerSaved, setPartnerSaved] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const publicUrl = share?.login ? `${origin}/u/${share.login}` : '';
  const tokenUrl = share?.token ? `${origin}/share/${share.token}` : '';
  const copy = async (url: string) => {
    try { await navigator.clipboard.writeText(url); setCopied(url); setTimeout(() => setCopied(null), 1500); } catch { /* ignore */ }
  };

  useEffect(() => {
    if (!settings) return;
    setReminders(settings.remindersEnabled);
    setTime(settings.reminderTime);
    setEmail(settings.emailEnabled);
    setPartnerDraft(settings.partnerEmail ?? '');
    setPartnerSaved(settings.partnerEmail ?? null);
  }, [settings]);

  const loading = !settings;
  const push = settings?.pushEnabled ?? false;
  const repoList = repos && repos.length ? repos : repo ? [repo] : [];

  const toggleReminders = () => { const n = !reminders; setReminders(n); onSaveSettings?.({ remindersEnabled: n }); };
  const toggleEmail = () => { const n = !email; setEmail(n); onSaveSettings?.({ emailEnabled: n }); };
  const changeTime = (v: string) => { setTime(v); onSaveSettings?.({ reminderTime: v }); };
  const savePartner = () => {
    const v = partnerDraft.trim();
    if (v === (partnerSaved ?? '')) return;
    setPartnerSaved(v || null);
    onSaveSettings?.({ partnerEmail: v || null });
  };

  return (
    <div className="flex h-full flex-col bg-bg">
      <div className="shrink-0 px-5 py-2.5 text-[17px] font-medium">Settings</div>

      <div className="cm-scroll flex flex-1 flex-col gap-[22px] overflow-y-auto px-5 pb-7 pt-1">

        {/* account */}
        <div className="flex items-center gap-[13px] rounded border border-border bg-surface p-4">
          <div className="flex h-[42px] w-[42px] items-center justify-center overflow-hidden rounded-[9px] border border-border bg-surface-2 text-muted">
            {avatar
              ? <img src={avatar} alt="" width={42} height={42} className="object-cover" />
              : <Icon name="user" size={22} />}
          </div>
          <div className="flex-1">
            <div className="text-[15.5px] font-semibold text-text">@{login ?? 'you'}</div>
            <div className="mono mt-[3px] flex items-center gap-[5px] text-xs text-green">
              <Icon name="branch" size={12} sw={1.8} />GitHub connected
            </div>
          </div>
        </div>

        {notice && (
          <div className="rounded border border-amber-edge bg-amber-fill px-[14px] py-[11px] text-[13px] leading-normal text-amber">
            {notice}
          </div>
        )}

        <Group header="daily">
          <Row icon="bell" label="Daily reminder" control={<Toggle on={reminders} />} onClick={loading ? undefined : toggleReminders} />
          <Row icon="clock" label="Reminder time" control={
            <input
              type="time"
              value={time}
              disabled={loading || !reminders}
              onChange={(e) => changeTime(e.target.value)}
              className="mono rounded-[7px] border border-border bg-surface-2 px-2 py-[5px] text-[13px] text-text outline-none"
              style={{ opacity: reminders ? 1 : 0.5 }}
            />
          } />
          <Row icon="globe" label="Timezone" value={timezone ?? '—'} last />
        </Group>

        <Group header="notifications">
          <Row
            icon="bell"
            label="Push notifications"
            value={pushSupported ? undefined : 'unsupported'}
            control={pushSupported ? <Toggle on={push} /> : undefined}
            onClick={pushSupported && !pushBusy && !loading ? () => onTogglePush?.(!push) : undefined}
          />
          <Row icon="mail" label="Email fallback" value={settings?.email ?? undefined} control={<Toggle on={email} />} onClick={loading ? undefined : toggleEmail} />
          <Row icon="spark" label={testBusy ? 'Sending…' : 'Send test notification'} onClick={loading || testBusy ? undefined : onTest} last />
        </Group>

        <Group header="accountability">
          <div className="border-b border-border-soft px-4 py-[14px]">
            <div className="mb-2.5 flex items-center gap-[13px]">
              <span className="shrink-0 text-muted"><Icon name="user" size={18} /></span>
              <span className="flex-1 text-[15px] text-text">Accountability partner</span>
            </div>
            <div className="flex flex-1 items-center gap-[9px] rounded border border-border bg-surface-2 px-[11px]">
              <Icon name="mail" size={16} style={{ color: 'var(--hint)' }} />
              <input
                type="email"
                value={partnerDraft}
                disabled={loading}
                onChange={(e) => setPartnerDraft(e.target.value)}
                onBlur={savePartner}
                onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                placeholder="partner@example.com"
                className="flex-1 border-0 bg-transparent py-2.5 text-sm text-text outline-none"
              />
            </div>
            <div className="mt-2 text-xs leading-[1.45] text-hint">
              {partnerSaved ? 'They get an email on a missed day.' : 'Optional. On a missed day, Commit emails one person.'}
            </div>
          </div>
          {repoList.length <= 1 ? (
            <Row icon="globe" label="Repo that counts" value={repoList[0] ?? '—'} last />
          ) : (
            <div className="px-4 py-3">
              <div className="mb-2.5 flex items-center gap-[13px]">
                <span className="shrink-0 text-muted"><Icon name="globe" size={18} /></span>
                <span className="flex-1 text-[15px] text-text">Repos that count</span>
                <span className="mono text-[13px] text-muted">{repoList.length}</span>
              </div>
              <div className="flex flex-col gap-[7px]">
                {repoList.map((r) => (
                  <div key={r} className="mono flex items-center gap-[7px] text-[12.5px] text-muted">
                    <Icon name="branch" size={13} sw={1.8} style={{ color: 'var(--hint)' }} />{r}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Group>

        {onSetTheme && (
          <Group header="appearance">
            <div className="flex items-center gap-[13px] px-4 py-3">
              <span className="shrink-0 text-muted"><Icon name="spark" size={18} /></span>
              <span className="flex-1 text-[15px] text-text">Theme</span>
              <div className="flex gap-1 rounded border border-border bg-surface-2 p-[3px]">
                {(['light', 'dark'] as const).map((t) => {
                  const on = theme === t;
                  return (
                    <button
                      key={t}
                      onClick={() => onSetTheme(t)}
                      className={`rounded-md border-0 px-[14px] py-1.5 text-[13px] capitalize ${on ? 'bg-bg text-text font-medium shadow-[inset_0_0_0_1px_var(--border)]' : 'bg-transparent text-hint font-normal'}`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
          </Group>
        )}

        {share && (
          <Group header="share">
            {/* public profile */}
            <div className="border-b border-border-soft px-4 py-[14px]">
              <div className="flex items-center gap-[13px]">
                <span className="shrink-0 text-muted"><Icon name="globe" size={18} /></span>
                <div className="flex-1">
                  <div className="text-[15px] text-text">Public profile</div>
                  <div className="mt-0.5 text-xs text-hint">A recruiter-safe page — streak, rate, heatmap. No repos or notes.</div>
                </div>
                <div onClick={() => onTogglePublic?.(!share.publicEnabled)} className="cursor-pointer">
                  <Toggle on={share.publicEnabled} />
                </div>
              </div>
              {share.publicEnabled && publicUrl && (
                <button onClick={() => copy(publicUrl)} className="mono mt-2.5 flex w-full items-center gap-2 rounded border-0 bg-surface-2 px-3 py-2 text-left text-[12px] text-muted">
                  <span className="flex-1 truncate">{publicUrl}</span>
                  <span className="text-blue">{copied === publicUrl ? 'copied' : 'copy'}</span>
                </button>
              )}
            </div>
            {/* unlisted revocable link */}
            <div className="px-4 py-[14px]">
              <div className="flex items-center gap-[13px]">
                <span className="shrink-0 text-muted"><Icon name="lock" size={18} /></span>
                <div className="flex-1">
                  <div className="text-[15px] text-text">Private share link</div>
                  <div className="mt-0.5 text-xs text-hint">Unlisted &amp; revocable — send to one recruiter.</div>
                </div>
                {share.token
                  ? <button onClick={onRevokeLink} className="border-0 bg-transparent p-0 text-[13px] text-red">Revoke</button>
                  : <button onClick={onGenerateLink} className="border-0 bg-transparent p-0 text-[13px] text-blue">Create</button>}
              </div>
              {share.token && tokenUrl && (
                <button onClick={() => copy(tokenUrl)} className="mono mt-2.5 flex w-full items-center gap-2 rounded border-0 bg-surface-2 px-3 py-2 text-left text-[12px] text-muted">
                  <span className="flex-1 truncate">{tokenUrl}</span>
                  <span className="text-blue">{copied === tokenUrl ? 'copied' : 'copy'}</span>
                </button>
              )}
            </div>
          </Group>
        )}

        <Group header="account">
          <Row icon="close" label={disconnecting ? 'Disconnecting…' : 'Disconnect GitHub'} danger onClick={disconnecting ? undefined : onDisconnect} last />
        </Group>

        <div className="mono pt-1 text-center text-[11.5px] text-hint">commit · v1.0.0 · build the habit</div>
      </div>
    </div>
  );
}
