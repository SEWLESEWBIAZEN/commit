import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Profile } from '@/lib/types';

// Resolves the signed-in user plus everything the route handlers need:
// their profile and their GitHub connection (token + selected repo + login).
// Token comes via the service-role client since RLS hides it from the client.
export interface Context {
  userId: string;
  profile: Profile;
  token: string | null;
  repos: string[];        // all tracked repos ("owner/name")
  repo: string | null;    // primary (repos[0]) — kept for single-repo call sites
  login: string | null;
}

export async function getContext(): Promise<Context | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>();

  if (!profile) return null;

  // Select * (not named columns) so this still works before migration 0003 adds
  // selected_repos — a missing named column would fail the whole query and make
  // the user look disconnected.
  const { data: conn } = await admin
    .from('github_connections')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle<{ provider_token: string | null; selected_repo: string | null; selected_repos?: string[] | null }>();

  // Prefer the array; fall back to the legacy single column.
  const repos = (conn?.selected_repos && conn.selected_repos.length > 0)
    ? conn.selected_repos
    : conn?.selected_repo ? [conn.selected_repo] : [];

  return {
    userId: user.id,
    profile,
    token: conn?.provider_token ?? null,
    repos,
    repo: repos[0] ?? null,
    login: profile.github_login,
  };
}
