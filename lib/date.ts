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
