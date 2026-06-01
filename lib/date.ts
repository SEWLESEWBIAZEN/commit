// Timezone-aware date helpers. "Today" must be computed in the user's own
// timezone, since the whole streak mechanic hinges on the local calendar day.

// Offset in ms such that: localWallClock = utcInstant + offset.
function tzOffsetMs(date: Date, tz: string): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts = dtf.formatToParts(date);
  const m: Record<string, number> = {};
  for (const p of parts) if (p.type !== 'literal') m[p.type] = +p.value;
  const asUTC = Date.UTC(m.year, m.month - 1, m.day, m.hour, m.minute, m.second);
  return asUTC - date.getTime();
}

// Local calendar date (in `tz`) of an arbitrary instant, as 'YYYY-MM-DD'.
export function tzDateOf(date: Date | string, tz: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date(date));
}

// Current local calendar date in `tz`, as 'YYYY-MM-DD'.
export function todayInTz(tz: string): string {
  // en-CA renders ISO-style YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date());
}

// 'YYYY-MM-DD' offset by `days` from today in `tz`.
export function dateInTz(tz: string, days: number): string {
  const base = todayInTz(tz);
  const [y, mo, d] = base.split('-').map(Number);
  const shifted = new Date(Date.UTC(y, mo - 1, d + days));
  return shifted.toISOString().slice(0, 10);
}

// UTC instant of local midnight (start of today) in `tz` — for GitHub `since`.
export function startOfTodayUtc(tz: string): Date {
  const now = new Date();
  const off = tzOffsetMs(now, tz);
  const local = new Date(now.getTime() + off);
  const localMidnight = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate());
  return new Date(localMidnight - off);
}

export function minutesSince(iso: string): number {
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
}

// Compact relative time, e.g. "3h ago", "2d ago".
export function relativeTime(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w}w ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
}
