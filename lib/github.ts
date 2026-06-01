// Thin GitHub REST wrapper. Server-only — always called with a stored OAuth
// token. Polling-based (no webhooks): we ask GitHub for the user's recent
// commits when the app needs to know whether they pushed.

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
