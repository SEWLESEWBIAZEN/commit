import { NextResponse, type NextRequest } from 'next/server';
import { getContext } from '@/lib/server-context';
import { createClient } from '@/lib/supabase/server';
import { dateInTz } from '@/lib/date';
import type { CommitType } from '@/components/types';

// Create/replace a commitment. `target` decides the day it must be kept:
//   'today'    — first promise / filling an empty day (you can act on it now)
//   'tomorrow' — the usual "set tomorrow's commitment" after resolving
export async function POST(request: NextRequest) {
  const ctx = await getContext();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = (await request.json()) as {
    body?: string;
    type?: CommitType;
    target?: 'today' | 'tomorrow';
  };
  const text = body.body?.trim();
  if (!text) return NextResponse.json({ error: 'missing_body' }, { status: 400 });

  const type: CommitType = body.type === 'learn' ? 'learn' : 'build';
  const tz = ctx.profile.timezone;
  const target_date = dateInTz(tz, body.target === 'tomorrow' ? 1 : 0);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('commitments')
    .upsert(
      {
        user_id: ctx.userId,
        body: text,
        type,
        target_date,
        repo: ctx.repo,
        status: 'open',
      },
      { onConflict: 'user_id,target_date' },
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ commitment: data });
}
