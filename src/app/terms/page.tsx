import type { Metadata } from 'next';
import { getSiteContent } from '@/lib/supabase';

export const metadata: Metadata = { title: 'ChupaHub Terms and Conditions', description: 'Read the terms for using ChupaHub, ordering products and receiving drinks delivery in Nairobi.', alternates: { canonical: '/terms' }, openGraph: { title: 'ChupaHub Terms and Conditions', description: 'Terms for using ChupaHub and ordering drinks.', url: '/terms', type: 'website' }, twitter: { card: 'summary', title: 'ChupaHub Terms and Conditions', description: 'Terms for using ChupaHub and ordering drinks.' } };

export default async function TermsPage() {
  const content = await getSiteContent();
  return <main className="mx-auto max-w-4xl px-4 py-10"><article className="rounded-3xl bg-white p-6 shadow-card sm:p-10"><p className="font-bold uppercase tracking-wide text-brand-orange">Customer care</p><h1 className="mt-2 text-4xl font-black text-brand-ink">Terms and conditions</h1><div className="mt-5 whitespace-pre-line leading-7 text-neutral-700">{content.terms || 'ChupaHub terms and conditions are being updated. Customers must be aged 18 or over. Please drink responsibly.'}</div></article></main>;
}
