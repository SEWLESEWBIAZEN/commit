// Database row types + API DTOs for the core daily loop.
import type { TodayState, CommitType, ResolveVerdict } from '@/components/types';

export interface Profile {
  id: string;
  github_login: string | null;
  github_avatar: string | null;
  timezone: string;
  current_streak: number;
  longest_streak: number;
  last_counted_date: string | null;
  created_at: string;
  // notifications + accountability (migration 0002)
  email: string | null;
  reminder_time: string; // 'HH:MM' local to timezone
  reminders_enabled: boolean;
  email_enabled: boolean;
  push_enabled: boolean;
  partner_email: string | null;
  last_reminder_date: string | null;
}

// A stored Web Push endpoint (one per browser/device).
export interface PushSubscriptionRow {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
}

// The user-editable notification + accountability preferences.
export interface NotificationSettings {
  reminderTime: string; // 'HH:MM'
  remindersEnabled: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
  partnerEmail: string | null;
  email: string | null; // the user's own email (read-only, from GitHub)
}

export interface Commitment {
  id: string;
  user_id: string;
  body: string;
  type: CommitType;
  target_date: string; // YYYY-MM-DD
  repo: string | null;
  status: 'open' | 'kept' | 'missed';
  partner_notified: boolean;
  created_at: string;
}

export interface Resolution {
  id: string;
  user_id: string;
  commitment_id: string;
  repo: string | null;
  commit_sha: string | null;
  additions: number;
  deletions: number;
  files: number;
  question: string | null;
  answer: string | null;
  verdict: ResolveVerdict | null;
  verdict_title: string | null;
  verdict_body: string | null;
  lesson_title: string | null;
  lesson_body: string | null;
  suggestion: string | null;
  mood: number | null;
  energy: number | null;
  note: string | null;
  counted: boolean;
  created_at: string;
}

// ── API payloads ──────────────────────────────────────────────────────────────

export interface PushInfo {
  commit_sha: string;
  commits: number;
  additions: number;
  deletions: number;
  files: number;
  minutesAgo: number;
  repo: string; // which tracked repo this push was to
}

export interface TodayResponse {
  state: TodayState;
  streak: number;
  prevStreak: number;
  repo: string | null;     // push repo (ready) or primary
  repos: string[];         // all tracked repos
  commitment: Commitment | null;
  push: PushInfo | null;
  resolution: Resolution | null;
  beginner: boolean;
  partnerEmail: string | null;
}

export interface RepoCommit {
  sha: string;
  message: string; // first line only
  authoredAt: string;
  author: string | null;
  repo: string; // "owner/name" the commit belongs to
}

export interface AdviceItem {
  tone: 'amber' | 'green';
  category: string;
  text: string;
}

export interface MoodPoint {
  value: number; // 0 (no check-in) .. 5
  committed: boolean;
}

// One past emotion check-in, for the reflections history list.
export interface EmotionLogEntry {
  date: string; // YYYY-MM-DD (local)
  mood: number | null; // 1..5
  energy: number | null; // 1..5
  note: string | null;
}

export interface InsightsData {
  currentStreak: number;
  longestStreak: number;
  daysCounted: number; // days you kept your commitment
  commitRate: number | null; // 0..100, null when there's no past history yet
  totalDays: number; // days tracked so far (header "N days")
  heatmap: number[]; // length 84 (12 weeks × 7), oldest→newest: -1 none/pending, 0 missed, 1..4 kept
  mood: MoodPoint[]; // last 14 days
  energy: MoodPoint[]; // last 14 days (parallel to mood)
  reflections: EmotionLogEntry[]; // recent check-ins that carry a note
  advice: AdviceItem[]; // recent lessons from the coach
}

export interface VerdictPayload {
  verdict: ResolveVerdict;
  verdict_title: string;
  verdict_body: string;
  lesson_title: string;
  lesson_body: string;
  suggestion: string;
}
