// Plain, GitHub-dark styled HTML emails. Kept inline (no build step) and small.
// Each builder returns { subject, html, text }.

const BG = '#0D1117';
const SURFACE = '#161B22';
const BORDER = '#21262D';
const TEXT = '#E6EDF3';
const MUTED = '#8B949E';
const GREEN = '#3FB950';

function shell(inner: string): string {
  return `<!doctype html><html><body style="margin:0;background:${BG};padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <div style="max-width:480px;margin:0 auto;background:${SURFACE};border:1px solid ${BORDER};border-radius:14px;overflow:hidden;">
    <div style="padding:20px 24px;border-bottom:1px solid ${BORDER};font-family:'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace;font-size:15px;font-weight:600;color:${TEXT};">
      <span style="color:${GREEN};">$</span>commit
    </div>
    <div style="padding:24px;">${inner}</div>
    <div style="padding:16px 24px;border-top:1px solid ${BORDER};color:#6E7681;font-size:12px;font-family:'JetBrains Mono',ui-monospace,monospace;">
      commit · build the habit
    </div>
  </div>
</body></html>`;
}

function button(label: string, url: string): string {
  return `<a href="${url}" style="display:inline-block;background:${TEXT};color:${BG};text-decoration:none;font-weight:600;font-size:15px;padding:12px 20px;border-radius:10px;">${label}</a>`;
}

export interface ReminderArgs {
  login: string | null;
  streak: number;
  commitmentBody: string | null;
  appUrl: string;
}

export function reminderEmail({ login, streak, commitmentBody, appUrl }: ReminderArgs) {
  const name = login ? `@${login}` : 'developer';
  const streakLine =
    streak > 0
      ? `You're on a <strong style="color:${GREEN};">${streak}-day streak</strong>. Don't let today be the day it resets.`
      : `No streak yet — today's a good day to start one.`;
  const promise = commitmentBody
    ? `<div style="background:${BG};border:1px solid ${BORDER};border-radius:10px;padding:14px 16px;margin:16px 0;color:${TEXT};font-size:15px;line-height:1.5;">${escapeHtml(commitmentBody)}</div>`
    : `<p style="color:${MUTED};font-size:14px;line-height:1.55;">You haven't set today's commitment yet. Make the promise, then keep it.</p>`;

  const inner = `
    <div style="color:${TEXT};font-size:18px;line-height:1.35;margin-bottom:10px;">Did you commit today, ${escapeHtml(name)}?</div>
    <p style="color:${MUTED};font-size:14px;line-height:1.55;margin:0 0 12px;">${streakLine}</p>
    ${promise}
    <div style="margin-top:8px;">${button('Open Commit', appUrl)}</div>
  `;
  return {
    subject: streak > 0 ? `Keep your ${streak}-day streak alive` : 'Did you commit today?',
    html: shell(inner),
    text: `Did you commit today, ${name}? ${commitmentBody ?? 'Set your commitment and push your work.'} Open Commit: ${appUrl}`,
  };
}

export interface PartnerArgs {
  partnerEmail: string;
  login: string | null;
  prevStreak: number;
  commitmentBody: string | null;
  appUrl: string;
}

export function partnerMissedEmail({ login, prevStreak, commitmentBody, appUrl }: PartnerArgs) {
  const name = login ? `@${login}` : 'Your developer';
  const promise = commitmentBody
    ? `<div style="background:${BG};border:1px solid ${BORDER};border-radius:10px;padding:14px 16px;margin:16px 0;color:${MUTED};font-size:14px;line-height:1.5;">"${escapeHtml(commitmentBody)}"</div>`
    : '';
  const inner = `
    <div style="color:${TEXT};font-size:18px;line-height:1.35;margin-bottom:10px;">${escapeHtml(name)} missed a day.</div>
    <p style="color:${MUTED};font-size:14px;line-height:1.55;margin:0 0 4px;">
      They asked you to hold them accountable on Commit. A commitment passed without being kept${prevStreak > 0 ? `, so a <strong style="color:#F85149;">${prevStreak}-day streak</strong> just reset to zero` : ''}.
    </p>
    ${promise}
    <p style="color:${MUTED};font-size:13.5px;line-height:1.55;">A short nudge from you goes a long way. You're getting this because they set you as their accountability partner.</p>
    <div style="margin-top:8px;">${button('See Commit', appUrl)}</div>
  `;
  return {
    subject: `${name} missed a commitment`,
    html: shell(inner),
    text: `${name} missed a day on Commit${prevStreak > 0 ? ` and reset a ${prevStreak}-day streak` : ''}. They set you as their accountability partner. ${appUrl}`,
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
