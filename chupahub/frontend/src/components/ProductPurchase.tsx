'use client';

import { useMemo, useState } from 'react';
import { DbProduct, DbVariant, money } from '@/lib/supabase';

type CartItem = { productId: string; variantId?: string; name: string; size?: string; price: number; image?: string; quantity: number };

function readCart(): CartItem[] { try { return JSON.parse(localStorage.getItem('chupahub-cart') || '[]'); } catch { return []; } }

export function ProductPurchase({ product, initialVariantId }: { product: DbProduct; initialVariantId?: string }) {
  const variants = useMemo(() => (product.product_variants || []).filter((variant) => variant.is_active !== false), [product.product_variants]);
  const [selectedId, setSelectedId] = useState(variants.some((variant) => variant.id === initialVariantId) ? initialVariantId || '' : variants[0]?.id || '');
  const [quantity, setQuantity] = useState(1);
  const selected = variants.find((variant) => variant.id === selectedId) as DbVariant | undefined;
  const price = selected?.price ?? product.price;
  const available = selected ? selected.stock > 0 : (product.stock || 0) > 0;
  const image = selected?.image_url || product.image_url || product.gallery_urls?.[0];

  const maxQuantity = selected ? selected.stock : Number(product.stock || 0);
  function addToCart() {
    if (!available) return;
    const cart = readCart();
    const existing = cart.find((item) => item.productId === product.id && item.variantId === selected?.id);
    if (existing) existing.quantity = Math.min(existing.quantity + quantity, maxQuantity);
    else cart.push({ productId: product.id, variantId: selected?.id, name: product.name, size: selected?.name, price, image, quantity });
    localStorage.setItem('chupahub-cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('chupahub-cart-updated'));
  }

  return <div className="mt-6">
    {variants.length > 0 && <fieldset><legend className="text-sm font-black text-brand-ink">Available bottle sizes</legend><p className="mt-1 text-sm text-neutral-600">Choose a size before adding this product to your cart.</p><div className="mt-3 flex flex-wrap gap-2">{variants.map((variant) => <button key={variant.id} type="button" onClick={() => { setSelectedId(variant.id); setQuantity(1); }} disabled={variant.stock <= 0} className={`rounded-xl border-2 px-4 py-3 text-left font-black transition ${selectedId === variant.id ? 'border-brand-orange bg-orange-50 text-brand-deep' : 'border-orange-100 bg-white text-neutral-700'} disabled:cursor-not-allowed disabled:opacity-45`}><span className="block">{variant.name}</span><span className="text-sm">{money(variant.price)}</span>{variant.stock <= 0 && <span className="mt-1 block text-xs font-bold text-red-600">Out of stock</span>}</button>)}</div></fieldset>}
    <div className="mt-6 flex items-end justify-between gap-4"><div><p className="text-4xl font-black text-brand-deep">{money(price)}</p>{(selected?.old_price || product.old_price) && <p className="mt-1 text-sm text-neutral-500 line-through">{money(selected?.old_price || product.old_price || 0)}</p>}</div><p className={`text-sm font-bold ${available ? 'text-green-700' : 'text-red-600'}`}>{available ? (maxQuantity <= (selected?.low_stock_threshold || product.low_stock_threshold || 5) ? 'Low stock' : 'Available now') : 'Currently unavailable'}</p></div>
    <div className="mt-5 flex items-center gap-3"><span className="text-sm font-black text-brand-ink">Quantity</span><div className="flex items-center rounded-xl border border-orange-200 bg-white"><button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="px-4 py-3 font-black" aria-label="Decrease quantity">−</button><span className="min-w-10 text-center font-black">{quantity}</span><button type="button" onClick={() => setQuantity((value) => Math.min(maxQuantity, value + 1))} className="px-4 py-3 font-black" aria-label="Increase quantity">+</button></div></div>
    <button type="button" onClick={addToCart} disabled={!available} className="orange-gradient mt-5 w-full rounded-xl px-8 py-4 font-black text-white shadow-orange disabled:cursor-not-allowed disabled:opacity-50">{available ? `Add ${quantity} ${selected?.name || 'product'} to cart` : 'Unavailable'}</button>
  </div>;
}
