import Link from 'next/link';
import { CheckoutClient } from '@/components/CheckoutClient';
import { getCheckoutSettings, getDeliverySettings, getPartyPackages, getProducts } from '@/lib/supabase';
import { pricePartyPackage } from '@/lib/party-packages';

export default async function Checkout({ searchParams }: { searchParams: Promise<{ party?: string }> }) {
  const { party } = await searchParams;
  const [settings, bands] = await Promise.all([getCheckoutSettings(), getDeliverySettings()]);
  if (party !== undefined) {
    const [packages, products] = await Promise.all([getPartyPackages(), getProducts()]);
    const bundle = /^[1-4]$/.test(party) ? packages.find(bundle => bundle.id === Number(party)) : undefined;
    const priced = bundle ? pricePartyPackage(bundle, products) : undefined;
    if (!priced?.available) return <main className="mx-auto max-w-xl px-4 py-16"><h1 className="text-3xl font-black">This package is currently unavailable</h1><p className="mt-3">Choose an available party package to continue.</p><Link href="/party-offers" className="mt-5 inline-block font-bold text-brand-orange">See party packages →</Link></main>;
    return <CheckoutClient settings={settings} bands={bands} partyPackage={priced} />;
  }
  return <CheckoutClient settings={settings} bands={bands} />;
}
