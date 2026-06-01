// Thin GitHub REST wrapper. Server-only — always called with a stored OAuth
// token. Polling-based (no webhooks): we ask GitHub for the user's recent
// commits when the app needs to know whether they pushed.

import type { RepoCommit } from '@/lib/types';

const API = 'https://api.github.com';

interface GhOpts {
  token: string;
}

async function gh<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`GitHub ${res.status} on ${path}: ${body.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

export interface RepoSummary {
  full_name: string;
  private: boolean;
  pushed_at: string | null;
  language: string | null;
}

// Repos the user can pick from, most recently pushed first.
export async function listRepos({ token }: GhOpts): Promise<RepoSummary[]> {
  const repos = await gh<RepoSummary[]>(
    '/user/repos?per_page=100&sort=pushed&affiliation=owner,collaborator',
    token,
  );
  return repos.map((r) => ({
    full_name: r.full_name,
    private: r.private,
    pushed_at: r.pushed_at,
    language: r.language,
  }));
}

export interface LatestPush {
  commit_sha: string;
  commits: number;
  authoredAt: string;
}

// Latest push by `login` to `repo` since `sinceISO`. Returns null if none.
export async function latestPushToday(
  repo: string,
  sinceISO: string,
  login: string,
  { token }: GhOpts,
): Promise<LatestPush | null> {
  const commits = await gh<
    { sha: string; commit: { author: { date: string } } }[]
  >(
    `/repos/${repo}/commits?since=${encodeURIComponent(sinceISO)}&author=${encodeURIComponent(login)}&per_page=100`,
    token,
  );
  if (!commits.length) return null;
  return {
    commit_sha: commits[0].sha, // GitHub returns newest first
    commits: commits.length,
    authoredAt: commits[0].commit.author.date,
  };
}

// Recent commits to a repo, for the Insights feed (one API call, no per-commit stats).
export async function listRecentCommits(
  repo: string,
  { token }: GhOpts,
  perPage = 12,
): Promise<RepoCommit[]> {
  const commits = await gh<
    {
      sha: string;
      commit: { message: string; author: { date: string } };
      author: { login: string } | null;
    }[]
  >(`/repos/${repo}/commits?per_page=${perPage}`, token);
  return commits.map((c) => ({
    sha: c.sha,
    message: c.commit.message.split('\n')[0],
    authoredAt: c.commit.author.date,
    author: c.author?.login ?? null,
    repo,
  }));
}

// Recent commits merged across several repos, newest first, each tagged with
// its repo. A failing repo is skipped rather than failing the whole feed.
export async function listRecentCommitsMulti(
  repos: string[],
  opts: GhOpts,
  perPageEach = 8,
): Promise<RepoCommit[]> {
  const results = await Promise.all(
    repos.map((r) => listRecentCommits(r, opts, perPageEach).catch(() => [] as RepoCommit[])),
  );
  return results
    .flat()
    .sort((a, b) => new Date(b.authoredAt).getTime() - new Date(a.authoredAt).getTime());
}

// Latest push across several repos: returns the repo with the most recent
// commit by `login` since `sinceISO`, or null if none pushed.
export async function latestPushAcrossRepos(
  repos: string[],
  sinceISO: string,
  login: string,
  opts: GhOpts,
): Promise<(LatestPush & { repo: string }) | null> {
  const found = await Promise.all(
    repos.map(async (r) => {
      const p = await latestPushToday(r, sinceISO, login, opts).catch(() => null);
      return p ? { ...p, repo: r } : null;
    }),
  );
  return found
    .filter((p): p is LatestPush & { repo: string } => p != null)
    .sort((a, b) => new Date(b.authoredAt).getTime() - new Date(a.authoredAt).getTime())[0] ?? null;
}

// All commit timestamps in a [since, until) window, paginated. For the monthly
// commit graph. Returns raw ISO author dates; caller buckets them by local day.
export async function listCommitsInRange(
  repo: string,
  sinceISO: string,
  untilISO: string,
  { token }: GhOpts,
  maxPages = 5,
): Promise<string[]> {
  const dates: string[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const commits = await gh<{ commit: { author: { date: string } } }[]>(
      `/repos/${repo}/commits?since=${encodeURIComponent(sinceISO)}&until=${encodeURIComponent(untilISO)}&per_page=100&page=${page}`,
      token,
    );
    for (const c of commits) dates.push(c.commit.author.date);
    if (commits.length < 100) break;
  }
  return dates;
}

export interface DiffStat {
  additions: number;
  deletions: number;
  files: number;
  patch: string; // concatenated unified diffs, truncated for the LLM
}

const MAX_PATCH_CHARS = 24_000;

// Stats + truncated diff text for a single commit, for the coach to read.
export async function commitDiffStat(
  repo: string,
  sha: string,
  { token }: GhOpts,
): Promise<DiffStat> {
  const data = await gh<{
    stats: { additions: number; deletions: number };
    files: { filename: string; additions: number; deletions: number; patch?: string }[];
  }>(`/repos/${repo}/commits/${sha}`, token);

  let patch = '';
  for (const f of data.files ?? []) {
    const header = `\n--- ${f.filename} (+${f.additions} / -${f.deletions}) ---\n`;
    if (patch.length + header.length > MAX_PATCH_CHARS) break;
    patch += header + (f.patch ?? '(binary or too large to display)\n');
    if (patch.length > MAX_PATCH_CHARS) {
      patch = patch.slice(0, MAX_PATCH_CHARS) + '\n…(diff truncated)';
      break;
    }
  }

  return {
    additions: data.stats?.additions ?? 0,
    deletions: data.stats?.deletions ?? 0,
    files: data.files?.length ?? 0,
    patch,
  };
}
