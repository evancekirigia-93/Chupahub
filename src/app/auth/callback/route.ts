import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  if (!code) return NextResponse.redirect(new URL('/login?error=Google%20did%20not%20return%20an%20authorization%20code.', url.origin));
  const supabase = await createServerSupabase();
  if (!supabase) return NextResponse.redirect(new URL('/login?error=Customer%20login%20is%20not%20configured.', url.origin));
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error('[ChupaHub Auth] OAuth code exchange failed.', { name: error.name, message: error.message, status: error.status });
    const message = encodeURIComponent(`Google login failed: ${error.message}`);
    return NextResponse.redirect(new URL(`/login?error=${message}`, url.origin));
  }
  return NextResponse.redirect(new URL('/account', url.origin));
}
