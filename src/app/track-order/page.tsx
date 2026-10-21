import OrderTrackingLookup from '@/components/OrderTrackingLookup';
import type { Metadata } from 'next';
import Link from 'next/link';
import { breadcrumbSchema, JsonLd } from '@/lib/seo';

const title = 'Track Your Chupa Hub Order';
const description = 'Find out how to check the status of your Chupa Hub drinks delivery order in Nairobi and contact customer care for assistance.';
export const metadata: Metadata = { title, description, alternates: { canonical: '/track-order' }, openGraph: { title: `${title} | Chupa Hub`, description, url: '/track-order', type: 'website' }, twitter: { card: 'summary', title: `${title} | Chupa Hub`, description } };
export default function TrackOrderPage() { return <main className="mx-auto max-w-4xl px-4 py-10"><JsonLd data={[{ '@context': 'https://schema.org', '@type': 'WebPage', name: title, description, url: 'https://chupahub.com/track-order' }, breadcrumbSchema([{ name: 'Home', url: '/' }, { name: 'Track Order', url: '/track-order' }])]}/><nav aria-label="Breadcrumb" className="mb-4 text-sm text-neutral-600"><Link href="/">Home</Link> / Track Order</nav><section className="rounded-3xl bg-white p-7 shadow-card"><p className="font-bold uppercase tracking-wide text-brand-orange">Delivery help</p><h1 className="mt-2 text-4xl font-black text-brand-ink">Track your order</h1><p className="mt-4 leading-7 text-neutral-700">Enter the order number from your Chupa Hub confirmation to see its current status instantly. Track your order from received through processing, dispatch and delivery.</p><OrderTrackingLookup/><Link href="/contact" className="mt-5 inline-block font-bold text-brand-orange">Need help? Contact customer care →</Link></section></main>; }
