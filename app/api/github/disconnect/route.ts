import { NextResponse } from 'next/server';
import { getContext } from '@/lib/server-context';
import { createAdminClient } from '@/lib/supabase/admin';

// Clears the stored GitHub connection (token + selected repo). The client then
// signs out; on next login the user re-authorizes and re-picks a repo. History
// (commitments/resolutions) is kept.
export async function POST() {
  const ctx = await getContext();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const { error } = await admin.from('github_connections').delete().eq('user_id', ctx.userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
