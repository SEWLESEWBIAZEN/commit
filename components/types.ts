// Commit — shared TypeScript types

export type TodayState   = 'ready' | 'awaiting' | 'rest' | 'empty' | 'missed';
export type ResolvePhase = 'question' | 'loading' | 'verdict' | 'emotion';
export type ResolveVerdict = 'good' | 'wrong' | 'none';
export type CommitType   = 'build' | 'learn';
export type HeroVariant  = 'number' | 'graph';
export type LayoutVariant = 'stacked' | 'ledger';
export type NavTab       = 'today' | 'insights' | 'insightsEmpty' | 'settings';
export type OnbStep      = 'welcome' | 'permission' | 'schedule' | 'install' | 'partner' | 'first';
export type AppMode      = 'onb' | 'app';
export type Overlay      = 'resolve' | 'commit' | null;
export type Tone         = 'green' | 'amber' | 'red' | 'blue' | 'muted';
export type VerdictVariant = 'streak' | 'lesson' | 'miss' | 'null_';
export type IconName =
  | 'check' | 'arrow' | 'chevron' | 'chevL' | 'chevD' | 'plus' | 'close'
  | 'branch' | 'commit' | 'push' | 'bell' | 'clock' | 'globe' | 'mail'
  | 'lock' | 'gear' | 'chart' | 'home' | 'install' | 'user' | 'spark'
  | 'quote' | 'flag' | 'book' | 'code' | 'eye' | 'flame-off';

export interface AppState {
  mode: AppMode;
  onbStep: OnbStep;
  tab: NavTab;
  todayState: TodayState;
  overlay: Overlay;
  resolvePhase: ResolvePhase;
  resolveVerdict: ResolveVerdict;
  streak: number;
  prevStreak: number;
}
