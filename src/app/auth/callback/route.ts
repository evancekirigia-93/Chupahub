import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const requestedNext = requestUrl.searchParams.get('next') || '/account';
  const next = requestedNext.startsWith('/') && !requestedNext.startsWith('//') ? requestedNext : '/account';

  if (!code) return NextResponse.redirect(new URL('/login?error=Missing+OAuth+authorization+code', requestUrl.origin));

  const supabase = await createServerSupabase();
  if (!supabase) return NextResponse.redirect(new URL('/login?error=Customer+login+is+not+configured', requestUrl.origin));

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error('[Google OAuth callback] exchange failed', {
      name: error.name,
      message: error.message,
      status: error.status,
    });
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, requestUrl.origin));
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
