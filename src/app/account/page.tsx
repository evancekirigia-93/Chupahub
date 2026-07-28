'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { LogIn, LogOut, UserPlus } from 'lucide-react';
import { createBrowserSupabase } from '@/lib/supabase-browser';

export default function AccountPage() {
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const [user, setUser] = useState<{ email?: string; user_metadata?: Record<string, unknown> } | null>(null);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [busy, setBusy] = useState(false), [message, setMessage] = useState(''), [error, setError] = useState('');

  useEffect(() => {
    if (!supabase) return;
    void supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user || null));
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true); setError(''); setMessage('');
    const form = new FormData(event.currentTarget), email = String(form.get('email') || '').trim(), password = String(form.get('password') || '');
    if (mode === 'signin') {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      setError(signInError?.message || '');
      if (!signInError) setMessage('Signed in. Your saved account details are ready at checkout.');
    } else {
      const fullName = String(form.get('full_name') || '').trim(), phone = String(form.get('phone') || '').trim();
      const { error: signUpError } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName, phone } } });
      setError(signUpError?.message || '');
      if (!signUpError) setMessage('Account created. Check your email if confirmation is required.');
    }
    setBusy(false);
  }

  async function googleSignIn() {
    if (!supabase) return;
    setError('');
    const { error: oauthError } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/account`, queryParams: { prompt: 'select_account' } } });
    if (oauthError) setError(oauthError.message);
  }

  if (!supabase) return <main className="mx-auto max-w-lg px-4 py-16"><div className="rounded-3xl bg-white p-7 shadow-card"><h1 className="text-3xl font-black">Customer accounts unavailable</h1><p className="mt-3 text-neutral-600">Public Supabase configuration is required before customers can sign in.</p></div></main>;
  if (user) return <main className="mx-auto max-w-lg px-4 py-16"><div className="rounded-3xl bg-white p-7 shadow-card"><p className="font-bold uppercase tracking-wide text-brand-orange">Your ChupaHub account</p><h1 className="mt-2 text-3xl font-black">Welcome, {String(user.user_metadata?.full_name || user.user_metadata?.name || 'customer')}</h1><p className="mt-2 text-neutral-600">{user.email}</p><p className="mt-5 rounded-xl bg-green-50 p-3 text-sm font-bold text-green-800">You are signed in. Your available name, email and phone will fill checkout automatically.</p><button type="button" onClick={() => void supabase.auth.signOut()} className="mt-6 inline-flex items-center gap-2 rounded-xl border border-red-200 px-5 py-3 font-black text-red-700"><LogOut size={18}/>Sign out</button></div></main>;

  return <main className="mx-auto max-w-lg px-4 py-12"><div className="rounded-3xl bg-white p-6 shadow-card sm:p-8"><p className="font-bold uppercase tracking-wide text-brand-orange">Customer account</p><h1 className="mt-2 text-3xl font-black">{mode === 'signin' ? 'Sign in' : 'Create an account'}</h1><p className="mt-2 text-neutral-600">Sign in once to use your account details instantly during checkout.</p><button type="button" onClick={() => void googleSignIn()} className="mt-6 w-full rounded-xl border-2 border-orange-200 px-4 py-3 font-black">Continue with Google</button><div className="my-5 flex items-center gap-3 text-xs text-neutral-400"><span className="h-px flex-1 bg-orange-100"/>or use email<span className="h-px flex-1 bg-orange-100"/></div><form onSubmit={submit} className="grid gap-3">{mode === 'signup' && <><label className="font-bold">Full name<input name="full_name" autoComplete="name" required className="mt-1 w-full rounded-xl border p-3 font-normal"/></label><label className="font-bold">Phone<input name="phone" autoComplete="tel" inputMode="tel" className="mt-1 w-full rounded-xl border p-3 font-normal"/></label></>}<label className="font-bold">Email<input name="email" type="email" autoComplete="email" required className="mt-1 w-full rounded-xl border p-3 font-normal"/></label><label className="font-bold">Password<input name="password" type="password" minLength={6} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} required className="mt-1 w-full rounded-xl border p-3 font-normal"/></label><button disabled={busy} className="orange-gradient mt-2 inline-flex items-center justify-center gap-2 rounded-xl p-3 font-black text-white disabled:opacity-50">{mode === 'signin' ? <LogIn size={18}/> : <UserPlus size={18}/>} {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}</button></form>{error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}{message && <p className="mt-4 rounded-xl bg-green-50 p-3 text-sm font-bold text-green-800">{message}</p>}<button type="button" onClick={() => { setMode(value => value === 'signin' ? 'signup' : 'signin'); setError(''); setMessage(''); }} className="mt-5 text-sm font-bold text-brand-orange">{mode === 'signin' ? 'New customer? Create an account' : 'Already have an account? Sign in'}</button></div></main>;
}
