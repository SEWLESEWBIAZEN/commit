'use client';
import React from 'react';

// Simple CSS-based iOS device frame for the prototype
interface IOSDeviceProps { children: React.ReactNode; }

export function IOSDevice({ children }: IOSDeviceProps) {
  return (
    <div style={{
      width: 402, height: 874, borderRadius: 54, overflow: 'hidden',
      background: '#0D1117', border: '1px solid #30363D',
      boxShadow: '0 0 0 8px #1C1C1E, 0 30px 80px rgba(0,0,0,0.7)',
      position: 'relative', flexShrink: 0,
    }}>
      {/* status bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 54, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px 0', pointerEvents: 'none' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 500, color: '#E6EDF3' }}>9:41</span>
        <div style={{ width: 118, height: 34, borderRadius: 20, background: '#0D1117', position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 0 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <SignalIcon /><WifiIcon /><BatteryIcon />
        </div>
      </div>
      {/* home indicator */}
      <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', width: 134, height: 5, borderRadius: 3, background: 'rgba(230,237,243,0.25)', zIndex: 10 }} />
      {/* content */}
      <div style={{ position: 'absolute', inset: 0, paddingTop: 54 }}>
        {children}
      </div>
    </div>
  );
}

function SignalIcon() {
  return (
    <svg width="17" height="12" viewBox="0 0 17 12" fill="none">
      <rect x="0" y="7" width="3" height="5" rx="0.8" fill="#E6EDF3"/>
      <rect x="4.7" y="4.5" width="3" height="7.5" rx="0.8" fill="#E6EDF3"/>
      <rect x="9.4" y="2" width="3" height="10" rx="0.8" fill="#E6EDF3"/>
      <rect x="14.1" y="0" width="3" height="12" rx="0.8" fill="#E6EDF3"/>
    </svg>
  );
}
function WifiIcon() {
  return (
    <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
      <path d="M8 9.5a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4z" fill="#E6EDF3"/>
      <path d="M2.5 6C4 4.2 6 3 8 3s4 1.2 5.5 3" stroke="#E6EDF3" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M0.5 3.5C2.5 1.4 5.1 0 8 0s5.5 1.4 7.5 3.5" stroke="#E6EDF3" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}
function BatteryIcon() {
  return (
    <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
      <rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke="#E6EDF3" strokeOpacity="0.35"/>
      <rect x="2" y="2" width="16" height="8" rx="2" fill="#E6EDF3"/>
      <path d="M23 4v4a2 2 0 000-4z" fill="#E6EDF3" fillOpacity="0.4"/>
    </svg>
  );
}
