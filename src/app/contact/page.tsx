import { getSiteContent } from '@/lib/supabase';

export default async function ContactPage() {
  const content = await getSiteContent();
  return <main className="mx-auto max-w-4xl px-4 py-10"><article className="rounded-3xl bg-white p-6 shadow-card sm:p-10"><p className="font-bold uppercase tracking-wide text-brand-orange">Customer care</p><h1 className="mt-2 text-4xl font-black text-brand-ink">Contact ChupaHub</h1><div className="mt-6 grid gap-4 sm:grid-cols-2">{content.contact_phone && <a href={`tel:${content.contact_phone}`} className="rounded-2xl border border-orange-100 p-5"><span className="block text-sm font-bold text-neutral-500">Phone</span><strong className="text-brand-ink">{content.contact_phone}</strong></a>}{content.contact_email && <a href={`mailto:${content.contact_email}`} className="rounded-2xl border border-orange-100 p-5"><span className="block text-sm font-bold text-neutral-500">Email</span><strong className="break-all text-brand-ink">{content.contact_email}</strong></a>}</div>{!content.contact_phone && !content.contact_email && <p className="mt-5 text-neutral-700">Contact details will be published here by the ChupaHub team.</p>}</article></main>;
}
