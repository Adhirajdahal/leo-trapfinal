import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

export function supabaseAuth() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (n: string) => cookieStore.get(n)?.value,
        set: () => {},
        remove: () => {},
      },
    }
  );
}

export function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export const supabaseAdmin = new Proxy({} as any, {
  get(_t, prop) { return (getSupabaseAdmin() as any)[prop]; },
});

export async function requireAdmin() {
  try {
    const auth = supabaseAuth();
    const { data: { user } } = await auth.auth.getUser();
    if (!user) return null;
    const { data: profile } = await getSupabaseAdmin()
      .from('profiles').select('id,name,role,chips').eq('id', user.id).single();
    if (!profile || profile.role !== 'admin') return null;
    return { user, profile };
  } catch {
    return null;
  }
}
