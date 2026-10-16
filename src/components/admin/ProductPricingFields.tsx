'use client';

import type { PricingDraft } from '@/lib/product-pricing';
import { money } from '@/lib/supabase';

export function ProductPricingFields({ value, onChange }: { value: PricingDraft; onChange: (change: Partial<PricingDraft>) => void }) {
  const normal = Number(value.price), sale = Number(value.sale_price);
  const percentage = normal > 0 && value.sale_price !== '' && value.sale_price != null ? Math.round((1 - sale / normal) * 10000) / 100 : '';
  return <fieldset className="col-span-full grid gap-4 rounded-2xl border border-orange-200 bg-orange-50/60 p-4 sm:grid-cols-2">
    <legend className="px-2 font-black">Price & discount</legend>
    <label className="font-bold">Normal price (KES)<input type="number" min="0" step="0.01" required value={String(value.price ?? '')} onChange={event => {
      const price = event.target.value;
      onChange({ price, ...(value.discount_enabled && percentage !== '' ? { sale_price: String(Math.round(Number(price) * (1 - Number(percentage) / 100) * 100) / 100) } : {}) });
    }} className="mt-1 w-full rounded-xl border bg-white p-3 font-normal"/></label>
    <label className="flex items-center gap-3 font-bold"><input type="checkbox" checked={Boolean(value.discount_enabled)} onChange={event => onChange({ discount_enabled: event.target.checked })} className="h-5 w-5 accent-brand-orange"/>Add a discount</label>
    {Boolean(value.discount_enabled) && <>
      <label className="font-bold">Discount (%)<input type="number" min="0.01" max="100" step="0.01" value={percentage} onChange={event => onChange({ sale_price: event.target.value === '' ? '' : String(Math.round(normal * (1 - Number(event.target.value) / 100) * 100) / 100) })} className="mt-1 w-full rounded-xl border bg-white p-3 font-normal"/></label>
      <label className="font-bold">Discounted price (KES)<input type="number" min="0" max={normal > 0 ? normal - 0.01 : 0} step="0.01" required value={String(value.sale_price ?? '')} onChange={event => onChange({ sale_price: event.target.value })} className="mt-1 w-full rounded-xl border bg-white p-3 font-normal"/></label>
      {percentage !== '' && Number(percentage) > 0 && Number(percentage) <= 100 && <p className="col-span-full rounded-xl bg-white p-3 text-sm"><s className="text-neutral-500">{money(normal)}</s><strong className="ml-3 text-lg text-brand-orange">{money(sale)}</strong><span className="ml-3 font-bold text-green-700">{percentage}% off · Save {money(Math.round((normal - sale) * 100) / 100)}</span></p>}
      <p className="col-span-full text-xs text-neutral-600">Enter a percentage or a sale price. The product card will show the discount after saving. For products with bottle sizes, set the discount on the relevant size too.</p>
    </>}
  </fieldset>;
}
