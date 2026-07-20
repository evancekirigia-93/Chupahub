'use client';

import { useMemo, useState } from 'react';
import { DbProduct, DbVariant, money } from '@/lib/supabase';

type CartItem = { productId: string; variantId?: string; name: string; size?: string; price: number; image?: string; quantity: number };

function readCart(): CartItem[] { try { return JSON.parse(localStorage.getItem('chupahub-cart') || '[]'); } catch { return []; } }

export function ProductPurchase({ product }: { product: DbProduct }) {
  const variants = useMemo(() => (product.product_variants || []).filter((variant) => variant.is_active !== false), [product.product_variants]);
  const [selectedId, setSelectedId] = useState(variants[0]?.id || '');
  const selected = variants.find((variant) => variant.id === selectedId) as DbVariant | undefined;
  const price = selected?.price ?? product.price;
  const available = selected ? selected.stock > 0 : (product.stock || 0) > 0;
  const image = selected?.image_url || product.image_url || product.gallery_urls?.[0];

  function addToCart() {
    if (!available) return;
    const cart = readCart();
    const existing = cart.find((item) => item.productId === product.id && item.variantId === selected?.id);
    if (existing) existing.quantity += 1;
    else cart.push({ productId: product.id, variantId: selected?.id, name: product.name, size: selected?.name, price, image, quantity: 1 });
    localStorage.setItem('chupahub-cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('chupahub-cart-updated'));
  }

  return <div className="mt-6">
    {variants.length > 0 && <fieldset><legend className="text-sm font-black text-brand-ink">Choose size</legend><div className="mt-3 flex flex-wrap gap-2">{variants.map((variant) => <button key={variant.id} type="button" onClick={() => setSelectedId(variant.id)} disabled={variant.stock <= 0} className={`rounded-xl border-2 px-4 py-3 text-left font-black transition ${selectedId === variant.id ? 'border-brand-orange bg-orange-50 text-brand-deep' : 'border-orange-100 bg-white text-neutral-700'} disabled:cursor-not-allowed disabled:opacity-45`}><span className="block">{variant.name}</span><span className="text-sm">{money(variant.price)}</span></button>)}</div></fieldset>}
    <div className="mt-6 flex items-end justify-between gap-4"><div><p className="text-4xl font-black text-brand-deep">{money(price)}</p>{selected?.old_price && <p className="mt-1 text-sm text-neutral-500 line-through">{money(selected.old_price)}</p>}</div><p className={`text-sm font-bold ${available ? 'text-green-700' : 'text-red-600'}`}>{available ? 'Available now' : 'Currently unavailable'}</p></div>
    <button type="button" onClick={addToCart} disabled={!available} className="orange-gradient mt-5 w-full rounded-xl px-8 py-4 font-black text-white shadow-orange disabled:cursor-not-allowed disabled:opacity-50">{available ? `Add ${selected?.name || 'product'} to cart` : 'Unavailable'}</button>
  </div>;
}
