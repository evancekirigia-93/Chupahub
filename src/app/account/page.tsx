import Image from 'next/image';
import { redirect } from 'next/navigation';
import { SignOutButton } from '@/components/account/SignOutButton';
import { createServerSupabase } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const supabase = await createServerSupabase();
  if (!supabase) redirect('/login?error=Customer%20login%20is%20not%20configured.');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const name = String(user.user_metadata.full_name || user.user_metadata.name || 'Customer');
  const avatar = typeof user.user_metadata.avatar_url === 'string' ? user.user_metadata.avatar_url : typeof user.user_metadata.picture === 'string' ? user.user_metadata.picture : '';
  return <main className="mx-auto max-w-lg px-4 py-16"><section className="rounded-3xl bg-white p-7 text-center shadow-card">{avatar && <Image src={avatar} alt={`${name} profile`} width={96} height={96} unoptimized className="mx-auto h-24 w-24 rounded-full object-cover"/>}<p className="mt-5 font-bold uppercase tracking-wide text-brand-orange">Your ChupaHub account</p><h1 className="mt-2 text-3xl font-black text-brand-ink">Welcome, {name}</h1><p className="mt-2 text-neutral-600">{user.email}</p><p className="mt-5 rounded-xl bg-green-50 p-3 text-sm font-bold text-green-800">You are signed in. Your available account details will fill checkout automatically.</p><SignOutButton/></section></main>;
}
