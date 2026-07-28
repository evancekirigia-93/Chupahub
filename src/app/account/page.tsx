import type { Metadata } from 'next';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { SignOutButton } from '@/components/account/SignOutButton';
import { createServerSupabase } from '@/lib/supabase-server';
import { breadcrumbSchema, JsonLd } from '@/lib/seo';

export const dynamic = 'force-dynamic';
const title = 'Your ChupaHub Customer Account';
const description = 'Sign in to your ChupaHub customer account to reuse your available details for Nairobi drinks delivery.';
export const metadata: Metadata = { title, description, alternates: { canonical: '/account' }, openGraph: { title: `${title} | ChupaHub`, description, url: '/account', type: 'website' }, twitter: { card: 'summary', title: `${title} | ChupaHub`, description }, robots: { index: false, follow: false } };

export default async function AccountPage() {
  const supabase = await createServerSupabase();
  if (!supabase) redirect('/login?error=Customer%20login%20is%20not%20configured.');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const name = String(user.user_metadata.full_name || user.user_metadata.name || 'Customer');
  const avatar = typeof user.user_metadata.avatar_url === 'string' ? user.user_metadata.avatar_url : typeof user.user_metadata.picture === 'string' ? user.user_metadata.picture : '';
  return <main className="mx-auto max-w-lg px-4 py-16"><JsonLd data={[{ '@context': 'https://schema.org', '@type': 'ProfilePage', name: title, description, url: 'https://chupahub.com/account' }, breadcrumbSchema([{ name: 'Home', url: '/' }, { name: 'Account', url: '/account' }])]}/><section className="rounded-3xl bg-white p-7 text-center shadow-card">{avatar && <Image src={avatar} alt={`${name} profile`} width={96} height={96} unoptimized className="mx-auto h-24 w-24 rounded-full object-cover"/>}<p className="mt-5 font-bold uppercase tracking-wide text-brand-orange">Your ChupaHub account</p><h1 className="mt-2 text-3xl font-black text-brand-ink">Welcome, {name}</h1><p className="mt-2 text-neutral-600">{user.email}</p><p className="mt-5 rounded-xl bg-green-50 p-3 text-sm font-bold text-green-800">You are signed in. Your available account details will fill checkout automatically.</p><SignOutButton/></section></main>;
}
