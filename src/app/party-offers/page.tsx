import Link from 'next/link';
import { getPartyPackages, getProducts, money } from '@/lib/supabase';
import { pricePartyPackage } from '@/lib/party-packages';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Party Offers | Four packages, 10% off & free delivery' };

export default async function PartyOffers() {
  const [packages, products] = await Promise.all([getPartyPackages(), getProducts()]);
  const published = packages.filter(bundle => bundle.is_active && bundle.items.length);
  return <main className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
    <Link href="/" className="text-sm font-bold text-brand-orange">← Back to the shop</Link>
    <section className="mt-5 overflow-hidden rounded-3xl bg-brand-ink p-7 text-white sm:p-12">
      <p className="text-xs font-bold uppercase tracking-[.2em] text-orange-300">Good company. Great value.</p>
      <h1 className="mt-3 text-4xl font-black sm:text-6xl">Your party, sorted.</h1>
      <p className="mt-4 max-w-xl text-white/80">Handpicked combinations for your next gathering. Every package comes with 10% off the combined product price, plus free delivery.</p>
      <div className="mt-6 flex flex-wrap gap-3 text-sm font-bold"><span className="rounded-full bg-white/10 px-4 py-2">10% package saving</span><span className="rounded-full bg-white/10 px-4 py-2">Free delivery in our delivery area</span></div>
    </section>
    {!published.length && <p className="mt-8 rounded-2xl bg-white p-8 text-center">Our party packages are being curated. Check back soon.</p>}
    <div className="mt-8 grid items-stretch gap-6 lg:grid-cols-2">{published.map(bundle => {
      const priced = pricePartyPackage(bundle, products);
      return <article key={bundle.id} className="flex min-w-0 flex-col overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-card">
        <header className="border-b border-orange-100 bg-orange-50/60 p-6"><p className="text-xs font-black uppercase tracking-widest text-brand-orange">Package {bundle.id} · Save 10%</p><h2 className="mt-2 text-2xl font-black">{bundle.name}</h2><p className="mt-2 text-sm text-slate-600">{bundle.description}</p></header>
        <section className="flex-1 px-4 pb-2 pt-5 sm:px-6" aria-label={`Products in ${bundle.name}`}>
          <div className="mb-4 flex items-center justify-between gap-3"><h3 className="text-sm font-black text-brand-ink">Inside your package</h3><span className="text-xs text-slate-500">{priced.items.reduce((total, item) => total + item.quantity, 0)} items included</span></div>
          <ul className="grid grid-cols-2 gap-3 sm:gap-4">{priced.items.map(item => {
            const product = products.find(product => product.id === item.productId);
            const href = `/product/${product?.slug || ''}${item.variantId ? `?variant=${encodeURIComponent(item.variantId)}` : ''}`;
            return <li key={`${item.productId}-${item.variantId || 'base'}`} className="min-w-0">
              <Link href={href} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-100 bg-white transition hover:border-orange-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-orange">
                <div className="relative flex h-36 items-center justify-center bg-[#faf9f7] p-4 sm:h-44">
                  {item.image ? <img src={item.image} alt={item.name} loading="lazy" className="h-full w-full object-contain transition-transform duration-300 motion-safe:group-hover:scale-105"/> : <span className="text-center text-xs text-slate-400">Image coming soon</span>}
                  <span className="absolute right-2 top-2 rounded-full border border-orange-100 bg-white px-2.5 py-1 text-xs font-black text-brand-ink">×{item.quantity}</span>
                </div>
                <div className="flex flex-1 flex-col p-3 sm:p-4"><h4 className="min-h-[2.75rem] break-words text-sm font-bold leading-snug text-brand-ink group-hover:text-brand-orange">{item.name}</h4><p className="mt-2 border-t border-neutral-100 pt-2 text-xs font-medium text-slate-500">{item.size || 'Standard bottle'}<span className="mx-1.5 text-slate-300">·</span>{item.quantity} included</p></div>
              </Link>
            </li>;
          })}</ul>
        </section>
        <div className="mx-4 mb-5 mt-5 rounded-2xl bg-brand-soft p-4 sm:mx-6 sm:p-5"><dl className="space-y-2 text-sm"><div className="flex justify-between gap-3"><dt>Combined product price</dt><dd>{money(priced.subtotal)}</dd></div><div className="flex justify-between gap-3 font-bold text-green-700"><dt>Party saving · 10%</dt><dd>−{money(priced.discount)}</dd></div><div className="flex justify-between gap-3"><dt>Delivery</dt><dd className="font-bold text-green-700">FREE</dd></div><div className="flex flex-wrap items-baseline justify-between gap-2 border-t border-orange-200 pt-3 text-xl font-black sm:text-2xl"><dt>Package total</dt><dd>{money(priced.total)}</dd></div></dl><p className="mt-2 text-right text-xs font-bold text-brand-orange">Plus free delivery</p></div>
        <div className="px-4 pb-5 sm:px-6 sm:pb-6">{priced.available ? <Link href={`/checkout?party=${bundle.id}`} className="orange-gradient block rounded-xl px-5 py-4 text-center font-black text-white">Choose package {bundle.id} →</Link> : <p className="rounded-xl bg-neutral-100 p-4 text-center font-bold text-neutral-600">Temporarily unavailable</p>}</div>
      </article>;
    })}</div>
    <p className="mt-8 text-center text-sm text-slate-500">For adults 18+ only. Drink responsibly. Delivery is subject to our supported delivery area.</p>
  </main>;
}
