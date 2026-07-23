import { NextResponse, type NextRequest } from 'next/server';
import { randomBytes } from 'crypto';
import { getContext } from '@/lib/server-context';
import { createAdminClient } from '@/lib/supabase/admin';

interface ShareRow { public_enabled: boolean; share_token: string | null }

async function readShare(userId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from('profiles')
    .select('public_enabled, share_token')
    .eq('id', userId)
    .maybeSingle<ShareRow>();
  return {
    publicEnabled: data?.public_enabled ?? false,
    token: data?.share_token ?? null,
  };
}

export async function GET() {
  const ctx = await getContext();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const s = await readShare(ctx.userId);
  return NextResponse.json({ ...s, login: ctx.login });
}

export async function POST(request: NextRequest) {
  const ctx = await getContext();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { action, enabled } = (await request.json()) as {
    action?: 'setPublic' | 'generateToken' | 'revokeToken';
    enabled?: boolean;
  };
  const admin = createAdminClient();

  if (action === 'setPublic') {
    await admin.from('profiles').update({ public_enabled: !!enabled }).eq('id', ctx.userId);
  } else if (action === 'generateToken') {
    const token = randomBytes(12).toString('base64url'); // unlisted, unguessable
    await admin.from('profiles').update({ share_token: token }).eq('id', ctx.userId);
  } else if (action === 'revokeToken') {
    await admin.from('profiles').update({ share_token: null }).eq('id', ctx.userId);
  } else {
    return NextResponse.json({ error: 'bad_action' }, { status: 400 });
  }

  const s = await readShare(ctx.userId);
  return NextResponse.json({ ...s, login: ctx.login });
}
