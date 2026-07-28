import { getSiteContent } from '@/lib/supabase';

export default async function PrivacyPage() {
  const content = await getSiteContent();
  return <main className="mx-auto max-w-4xl px-4 py-10"><article className="rounded-3xl bg-white p-6 shadow-card sm:p-10"><p className="font-bold uppercase tracking-wide text-brand-orange">Customer care</p><h1 className="mt-2 text-4xl font-black text-brand-ink">Privacy policy</h1><div className="mt-5 whitespace-pre-line leading-7 text-neutral-700">{content.privacy || 'Our privacy policy is being updated. Contact ChupaHub if you have a question about your personal information.'}</div></article></main>;
}
