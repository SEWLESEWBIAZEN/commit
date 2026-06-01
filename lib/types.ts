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
}

export interface Commitment {
  id: string;
  user_id: string;
  body: string;
  type: CommitType;
  target_date: string; // YYYY-MM-DD
  repo: string | null;
  status: 'open' | 'kept' | 'missed';
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
}

export interface TodayResponse {
  state: TodayState;
  streak: number;
  prevStreak: number;
  repo: string | null;
  commitment: Commitment | null;
  push: PushInfo | null;
  resolution: Resolution | null;
  beginner: boolean;
}

export interface RepoCommit {
  sha: string;
  message: string; // first line only
  authoredAt: string;
  author: string | null;
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

export interface InsightsData {
  currentStreak: number;
  longestStreak: number;
  daysCounted: number; // days you kept your commitment
  commitRate: number | null; // 0..100, null when there's no past history yet
  totalDays: number; // days tracked so far (header "N days")
  heatmap: number[]; // length 84 (12 weeks × 7), oldest→newest: -1 none/pending, 0 missed, 1..4 kept
  mood: MoodPoint[]; // last 14 days
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
