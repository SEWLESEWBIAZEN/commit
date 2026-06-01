// Turns recent mood/energy check-ins into one short sentence the coach can use
// to right-size tomorrow's suggestion. Returns undefined when there isn't
// enough signal to say anything useful.

export interface MoodSample {
  mood: number | null;
  energy: number | null;
}

const wordFor = (avg: number): string =>
  avg <= 1.8 ? 'rough' : avg <= 2.6 ? 'low' : avg <= 3.4 ? 'steady' : avg <= 4.2 ? 'good' : 'great';

function avg(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function buildMoodContext(samples: MoodSample[]): string | undefined {
  const moods = samples.map((s) => s.mood).filter((n): n is number => typeof n === 'number' && n > 0);
  const energies = samples.map((s) => s.energy).filter((n): n is number => typeof n === 'number' && n > 0);

  const mAvg = avg(moods);
  const eAvg = avg(energies);
  if (mAvg == null && eAvg == null) return undefined;

  const parts: string[] = [];
  if (mAvg != null) parts.push(`mood has been ${wordFor(mAvg)} (avg ${mAvg.toFixed(1)}/5)`);
  if (eAvg != null) parts.push(`energy has been ${wordFor(eAvg)} (avg ${eAvg.toFixed(1)}/5)`);

  const n = Math.max(moods.length, energies.length);
  return `${parts.join(' and ')} across their last ${n} check-in${n === 1 ? '' : 's'}.`;
}
