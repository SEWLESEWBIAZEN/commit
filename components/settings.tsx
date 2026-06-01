'use client';
import React, { useState } from 'react';
import { Icon, Toggle } from './ui';

function Row({ icon, label, value, onClick, danger = false, last = false, control }: {
  icon?: 'clock' | 'globe' | 'bell' | 'mail' | 'user' | 'branch' | 'install' | 'lock' | 'close' | 'gear';
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

export function SettingsScreen() {
  const [notif, setNotif] = useState(true);
  const [email, setEmail] = useState(true);
  const [pub,   setPub]   = useState(false);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <div style={{ padding: '10px 20px', fontSize: 17, fontWeight: 500, flexShrink: 0 }}>Settings</div>

      <div className="cm-scroll" style={{ flex: 1, padding: '4px 20px 28px', display: 'flex', flexDirection: 'column', gap: 22 }}>

        {/* account */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: 16, display: 'flex', alignItems: 'center', gap: 13 }}>
          <div style={{ width: 42, height: 42, borderRadius: 9, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
            <Icon name="user" size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15.5 }}>@devsam</div>
            <div className="mono" style={{ fontSize: 12, color: 'var(--green)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Icon name="branch" size={12} sw={1.8} />GitHub connected
            </div>
          </div>
        </div>

        <Group header="daily">
          <Row icon="clock" label="Reminder time" value="20:00" onClick={() => {}} />
          <Row icon="globe" label="Timezone" value="Europe/Berlin" onClick={() => {}} last />
        </Group>

        <Group header="notifications">
          <Row icon="bell" label="Push notifications" control={<Toggle on={notif} />} onClick={() => setNotif(v => !v)} />
          <Row icon="mail" label="Email fallback" control={<Toggle on={email} />} onClick={() => setEmail(v => !v)} last />
        </Group>

        <Group header="accountability">
          <Row icon="user" label="Partner" value="maya@" onClick={() => {}} />
          <Row icon="globe" label="Public log" control={<Toggle on={pub} />} onClick={() => setPub(v => !v)} last />
        </Group>

        <Group header="connection">
          <Row icon="branch" label="Repos that count" value="3" onClick={() => {}} />
          <Row icon="install" label="Re-install to home screen" onClick={() => {}} last />
        </Group>

        <Group header="account">
          <Row icon="lock" label="Privacy &amp; data" onClick={() => {}} />
          <Row icon="close" label="Disconnect GitHub" danger onClick={() => {}} last />
        </Group>

        <div className="mono" style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--hint)', paddingTop: 4 }}>commit · v1.0.0 · build the habit</div>
      </div>
    </div>
  );
}
