'use client';

import { useMemo, useState } from 'react';
import { createBrowserSupabase } from '@/lib/supabase-browser';

export function LoginForm({ initialError }: { initialError?: string }) {
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const [busy, setBusy] = useState(false), [error, setError] = useState(initialError || '');

  async function continueWithGoogle() {
    console.info('[Google OAuth] click');
    if (!supabase) return setError('Customer login is not configured. Check the public Supabase environment variables.');
    const redirectTo = `${window.location.origin}/auth/callback`;
    console.info('[Google OAuth] redirect URL', redirectTo);
    setBusy(true); setError('');
    const timeout = window.setTimeout(() => {
      setBusy(false);
      setError('Google login did not start within 8 seconds. Please try again or check whether Google sign-in is enabled.');
      console.error('[Google OAuth] No browser redirect started within 8 seconds.');
    }, 8000);
    try {
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          scopes: 'openid email profile',
        },
      });
      if (oauthError) {
        window.clearTimeout(timeout);
        console.error('[Google OAuth] signInWithOAuth failed', oauthError);
        setError(oauthError.message);
        setBusy(false);
        return;
      }
      console.info('[Google OAuth] signInWithOAuth returned URL', Boolean(data.url));
      if (data.url) window.location.assign(data.url);
      else {
        window.clearTimeout(timeout);
        setError('Supabase did not return a Google authorization URL. Confirm that the Google provider is enabled.');
        setBusy(false);
      }
    } catch (cause) {
      window.clearTimeout(timeout);
      console.error('[Google OAuth] signInWithOAuth threw an exception', cause);
      setError(cause instanceof Error ? cause.message : 'Google login could not be started.');
      setBusy(false);
    }
  }

  return <section className="relative rounded-3xl bg-white p-6 shadow-card sm:p-8"><p className="font-bold uppercase tracking-wide text-brand-orange">Customer account</p><h1 className="mt-2 text-3xl font-black text-brand-ink">Sign in to ChupaHub</h1><p className="mt-2 text-neutral-600">Use your Google account to reuse your customer details at checkout.</p><button type="button" onClick={() => void continueWithGoogle()} disabled={busy} className="relative z-10 mt-7 flex w-full items-center justify-center gap-3 rounded-xl border-2 border-orange-200 bg-white px-4 py-3 font-black text-brand-ink hover:bg-orange-50 disabled:cursor-wait disabled:opacity-50"><span aria-hidden="true" className="grid h-7 w-7 place-items-center rounded-full bg-white text-lg font-black text-blue-600 shadow">G</span>{busy ? 'Opening Google…' : 'Continue with Google'}</button>{error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}<p className="mt-5 text-xs leading-5 text-neutral-500">Signing in is optional. You can continue shopping and complete checkout as a guest.</p></section>;
}
