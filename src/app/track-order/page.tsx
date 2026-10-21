import OrderTrackingLookup from '@/components/OrderTrackingLookup';
import type { Metadata } from 'next';
import Link from 'next/link';
import { breadcrumbSchema, JsonLd } from '@/lib/seo';

const title = 'Track Your Chupa Hub Order';
const description = 'Track your Chupa Hub delivery instantly using your order number and see its latest order status online.';
export const metadata: Metadata = { title, description, alternates: { canonical: '/track-order' }, openGraph: { title: `${title} | Chupa Hub`, description, url: '/track-order', type: 'website' }, twitter: { card: 'summary', title: `${title} | Chupa Hub`, description } };
export default function TrackOrderPage() { return <main className="mx-auto max-w-4xl px-4 py-10"><JsonLd data={[{ '@context': 'https://schema.org', '@type': 'WebPage', name: title, description, url: 'https://chupahub.com/track-order' }, breadcrumbSchema([{ name: 'Home', url: '/' }, { name: 'Track Order', url: '/track-order' }])]}/><nav aria-label="Breadcrumb" className="mb-4 text-sm text-neutral-600"><Link href="/">Home</Link> / Track Order</nav><section className="rounded-3xl bg-white p-7 shadow-card"><p className="font-bold uppercase tracking-wide text-brand-orange">Delivery help</p><h1 className="mt-2 text-4xl font-black text-brand-ink">Track your order</h1><p className="mt-4 leading-7 text-neutral-700">Enter your Chupa Hub order number below to check your order status instantly, from confirmation through dispatch and delivery. No need to contact customer care.</p><OrderTrackingLookup/><Link href="/contact" className="mt-5 inline-block font-bold text-brand-orange">Need help? Contact customer care →</Link></section></main>; }
