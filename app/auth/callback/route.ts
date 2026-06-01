import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// OAuth callback: exchange the code for a session, then (first sign-in or
// re-auth) capture the GitHub profile + provider token so we can poll later.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const tz = searchParams.get('tz') || 'UTC';
  const next = searchParams.get('next') || '/';

  if (!code) {
    return NextResponse.redirect(`${origin}/?error=missing_code`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session || !data.user) {
    // Surface the real reason in the server log and the URL for debugging.
    console.error('[auth/callback] exchangeCodeForSession failed:', error?.message, error);
    const reason = encodeURIComponent(error?.message ?? 'no_session_returned');
    return NextResponse.redirect(`${origin}/?error=auth&reason=${reason}`);
  }

  const { session, user } = data;
  const meta = user.user_metadata ?? {};
  const admin = createAdminClient();

  // Upsert profile (keep an existing streak; only seed identity + tz on first run).
  await admin
    .from('profiles')
    .upsert(
      {
        id: user.id,
        github_login: meta.user_name ?? meta.preferred_username ?? null,
        github_avatar: meta.avatar_url ?? null,
        timezone: tz,
      },
      { onConflict: 'id', ignoreDuplicates: false },
    );

  // Store provider tokens for GitHub API polling. provider_token is only
  // present right after sign-in, so capture it here.
  if (session.provider_token) {
    await admin.from('github_connections').upsert(
      {
        user_id: user.id,
        provider_token: session.provider_token,
        provider_refresh_token: session.provider_refresh_token ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );
  }

  return NextResponse.redirect(`${origin}${next}`);
}
