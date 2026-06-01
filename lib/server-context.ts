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
  repo: string | null;
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

  const { data: conn } = await admin
    .from('github_connections')
    .select('provider_token, selected_repo')
    .eq('user_id', user.id)
    .maybeSingle<{ provider_token: string | null; selected_repo: string | null }>();

  return {
    userId: user.id,
    profile,
    token: conn?.provider_token ?? null,
    repo: conn?.selected_repo ?? null,
    login: profile.github_login,
  };
}
