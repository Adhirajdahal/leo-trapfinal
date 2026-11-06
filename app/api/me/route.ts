import { NextResponse } from 'next/server';
import { supabaseAuth, getSupabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const auth = supabaseAuth();
    const { data: { user }, error: authErr } = await auth.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    const admin = getSupabaseAdmin();

    let { data: profile, error } = await admin
      .from('profiles').select('*').eq('id', user.id).single();

    // If profile is missing (trigger didn't run), create it now
    if (error || !profile) {
      const name = user.user_metadata?.name || user.email?.split('@')[0] || 'Player';
      const { data: created, error: insErr } = await admin
        .from('profiles')
        .insert({ id: user.id, name, chips: 1000 })
        .select('*').single();
      if (insErr) {
        return NextResponse.json(
          { error: 'Profile create failed: ' + insErr.message },
          { status: 500 }
        );
      }
      profile = created;
    }

    return NextResponse.json({ profile });
  } catch (e: any) {
    return NextResponse.json(
      { error: 'Server error: ' + (e?.message || 'unknown') },
      { status: 500 }
    );
  }
}
