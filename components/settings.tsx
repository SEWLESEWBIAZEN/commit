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
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '14px 16px', cursor: onClick ? 'pointer' : 'default', borderBottom: last ? 'none' : '1px solid var(--border-soft)' }}>
      {icon && <span style={{ color: danger ? 'var(--red)' : 'var(--muted)', flexShrink: 0 }}><Icon name={icon} size={18} /></span>}
      <span style={{ flex: 1, fontSize: 15, color: danger ? 'var(--red)' : 'var(--text)' }}>{label}</span>
      {value && <span className="mono" style={{ fontSize: 13, color: 'var(--muted)' }}>{value}</span>}
      {control}
      {onClick && !control && <Icon name="chevron" size={16} style={{ color: 'var(--hint)' }} />}
    </div>
  );
}

function Group({ header, children }: { header: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mono" style={{ fontSize: 11, color: 'var(--hint)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 4px', marginBottom: 10 }}>{header}</div>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', overflow: 'hidden' }}>{children}</div>
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
}

export function SettingsScreen({
  login, avatar, timezone, repo, disconnecting = false, onDisconnect,
  settings, onSaveSettings, onTogglePush, pushBusy = false, pushSupported = true, notice,
  onTest, testBusy = false, theme = 'dark', onSetTheme,
}: SettingsScreenProps = {}) {
  // Local mirror of server prefs for optimistic toggles + the partner draft.
  const [reminders, setReminders] = useState(true);
  const [time, setTime] = useState('20:00');
  const [email, setEmail] = useState(true);
  const [partnerDraft, setPartnerDraft] = useState('');
  const [partnerSaved, setPartnerSaved] = useState<string | null>(null);

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
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <div style={{ padding: '10px 20px', fontSize: 17, fontWeight: 500, flexShrink: 0 }}>Settings</div>

      <div className="cm-scroll" style={{ flex: 1, padding: '4px 20px 28px', display: 'flex', flexDirection: 'column', gap: 22 }}>

        {/* account */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: 16, display: 'flex', alignItems: 'center', gap: 13 }}>
          <div style={{ width: 42, height: 42, borderRadius: 9, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', overflow: 'hidden' }}>
            {avatar
              ? <img src={avatar} alt="" width={42} height={42} style={{ objectFit: 'cover' }} />
              : <Icon name="user" size={22} />}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15.5, color: 'var(--text)', fontWeight: 600 }}>@{login ?? 'you'}</div>
            <div className="mono" style={{ fontSize: 12, color: 'var(--green)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Icon name="branch" size={12} sw={1.8} />GitHub connected
            </div>
          </div>
        </div>

        {notice && (
          <div style={{ background: 'var(--amber-fill)', border: '1px solid var(--amber-edge)', borderRadius: 'var(--r)', padding: '11px 14px', fontSize: 13, color: 'var(--amber)', lineHeight: 1.5 }}>
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
              className="mono"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--text)', fontSize: 13, padding: '5px 8px', outline: 'none', opacity: reminders ? 1 : 0.5, colorScheme: 'dark' }}
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
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-soft)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 10 }}>
              <span style={{ color: 'var(--muted)', flexShrink: 0 }}><Icon name="user" size={18} /></span>
              <span style={{ flex: 1, fontSize: 15, color: 'var(--text)' }}>Accountability partner</span>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ flex: 1, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 9, padding: '0 11px' }}>
                <Icon name="mail" size={16} style={{ color: 'var(--hint)' }} />
                <input
                  type="email"
                  value={partnerDraft}
                  disabled={loading}
                  onChange={(e) => setPartnerDraft(e.target.value)}
                  onBlur={savePartner}
                  onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                  placeholder="partner@example.com"
                  style={{ flex: 1, background: 'transparent', border: 0, color: 'var(--text)', fontSize: 14, padding: '10px 0', outline: 'none' }}
                />
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--hint)', marginTop: 8, lineHeight: 1.45 }}>
              {partnerSaved ? 'They get an email on a missed day.' : 'Optional. On a missed day, Commit emails one person.'}
            </div>
          </div>
          <Row icon="globe" label="Repo that counts" value={repo ?? '—'} last />
        </Group>

        {onSetTheme && (
          <Group header="appearance">
            <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '12px 16px' }}>
              <span style={{ color: 'var(--muted)', flexShrink: 0 }}><Icon name="spark" size={18} /></span>
              <span style={{ flex: 1, fontSize: 15, color: 'var(--text)' }}>Theme</span>
              <div style={{ display: 'flex', gap: 4, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: 3 }}>
                {(['light', 'dark'] as const).map((t) => {
                  const on = theme === t;
                  return (
                    <button
                      key={t}
                      onClick={() => onSetTheme(t)}
                      style={{ padding: '6px 14px', borderRadius: 6, border: 0, cursor: 'pointer', background: on ? 'var(--bg)' : 'transparent', color: on ? 'var(--text)' : 'var(--hint)', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: on ? 500 : 400, textTransform: 'capitalize', boxShadow: on ? 'inset 0 0 0 1px var(--border)' : 'none' }}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
          </Group>
        )}

        <Group header="account">
          <Row icon="close" label={disconnecting ? 'Disconnecting…' : 'Disconnect GitHub'} danger onClick={disconnecting ? undefined : onDisconnect} last />
        </Group>

        <div className="mono" style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--hint)', paddingTop: 4 }}>commit · v1.0.0 · build the habit</div>
      </div>
    </div>
  );
}
