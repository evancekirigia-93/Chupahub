'use client';

import { useEffect, useMemo, useState } from 'react';
import { createBrowserSupabase } from '@/lib/supabase-browser';
import { emptyPartyPackages, parsePartyPackages, pricePartyPackage, type PartyPackage } from '@/lib/party-packages';
import { money, type DbProduct } from '@/lib/supabase';

export function PartyPackageManager() {
  const db = useMemo(() => createBrowserSupabase(), []);
  const [packages, setPackages] = useState(emptyPartyPackages);
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [selected, setSelected] = useState(1);
  const [ready, setReady] = useState(false), [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const [query, setQuery] = useState('');
  useEffect(() => { let alive = true; void (async () => {
    if (!db) return;
    const [settings, catalogue] = await Promise.all([db.from('store_settings').select('value').eq('key', 'party_packages').maybeSingle(), db.from('products').select('*,product_variants(*)').eq('is_active', true).order('name')]);
    if (!alive) return;
    if (settings.error || catalogue.error) { setMessage(settings.error?.message || catalogue.error?.message || 'Could not load packages.'); return; }
    setPackages(parsePartyPackages(settings.data?.value)); setProducts(catalogue.data || []); setReady(true);
  })(); return () => { alive = false; }; }, [db]);
  const bundle = packages[selected - 1];
  const priced = pricePartyPackage(bundle, products);
  function update(change: Partial<PartyPackage>) { setPackages(current => current.map(item => item.id === selected ? { ...item, ...change } : item)); }
  async function save() {
    if (!db || busy) return;
    if (packages.some(item => item.is_active && (!item.name.trim() || !item.items.length))) { setMessage('Add a name and at least one product to every published package.'); return; }
    if (packages.some(item => item.items.some(line => !Number.isInteger(line.quantity) || line.quantity < 1))) { setMessage('Every quantity must be a positive whole number.'); return; }
    setBusy(true); setMessage('');
    try {
      const { error } = await db.from('store_settings').upsert({ key: 'party_packages', value: packages, is_public: true, description: 'Four party packages: 10% off combined product prices and free delivery' });
      setMessage(error ? error.message : 'All four party packages saved. Published packages appear only on Party Offers.');
    } catch { setMessage('Could not save packages. Please retry.'); } finally { setBusy(false); }
  }
  return <section><h2 className="text-3xl font-black">Party packages</h2><p className="mt-2 text-neutral-600">Curate Packages 1–4. Select products, bottle sizes and quantities. The combined price receives 10% off plus free delivery. Individual shop prices stay unchanged.</p><a href="/party-offers" target="_blank" rel="noreferrer" className="mt-3 inline-block font-bold text-brand-orange">Preview Party Offers ↗</a>
    {message && <p role="status" className="my-4 rounded-xl bg-orange-50 p-4">{message}</p>}
    {!ready ? <p className="mt-4">Loading packages…</p> : <><div className="my-5 flex flex-wrap gap-2">{packages.map(item => <button key={item.id} onClick={() => { setSelected(item.id); setQuery(''); }} className={`rounded-xl border px-4 py-3 font-bold ${selected === item.id ? 'bg-brand-ink text-white' : ''}`}>Package {item.id}</button>)}</div>
    <div className="grid gap-4 rounded-2xl bg-orange-50 p-5 sm:grid-cols-2"><label className="font-bold">Package name<input className="mt-1 w-full rounded-xl border p-3 font-normal" value={bundle.name} maxLength={100} onChange={event => update({ name: event.target.value })}/></label><label className="flex items-center gap-2 font-bold"><input type="checkbox" checked={bundle.is_active} onChange={event => update({ is_active: event.target.checked })}/>Publish this package</label><label className="font-bold sm:col-span-2">Description<textarea className="mt-1 w-full rounded-xl border p-3 font-normal" value={bundle.description} maxLength={300} onChange={event => update({ description: event.target.value })}/></label></div>
    <h3 className="mt-6 text-xl font-bold">Package contents</h3><div className="mt-3 space-y-3">{bundle.items.map((line, index) => {
      const product = products.find(product => product.id === line.productId);
      return <div key={`${line.productId}-${index}`} className="flex flex-wrap items-end gap-3 rounded-xl border p-3"><p className="min-w-40 flex-1 font-bold">{product?.name || 'Unavailable product'}</p><label className="text-sm font-bold">Size<select className="mt-1 block rounded-lg border p-2" value={line.variantId || ''} onChange={event => { const variantId = event.target.value || undefined; if (bundle.items.some((item, i) => i !== index && item.productId === line.productId && item.variantId === variantId)) { setMessage('This product and size is already in the package. Increase its quantity instead.'); return; } update({ items: bundle.items.map((item, i) => i === index ? { ...item, variantId } : item) }); }}><option value="">{product?.bottle_size || 'Default product'}</option>{product?.product_variants?.filter(variant => variant.is_active !== false).map(variant => <option key={variant.id} value={variant.id}>{variant.name} · {money(variant.price)}</option>)}</select></label><label className="text-sm font-bold">Quantity<input type="number" min={1} max={999} value={line.quantity} onChange={event => update({ items: bundle.items.map((item, i) => i === index ? { ...item, quantity: Number(event.target.value) } : item) })} className="mt-1 block w-20 rounded-lg border p-2"/></label><button onClick={() => update({ items: bundle.items.filter((_, i) => i !== index) })} className="p-2 font-bold text-red-700">Remove</button></div>;
    })}</div>
    <label className="mt-6 block font-bold">Find a product<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search product names" className="mt-2 w-full rounded-xl border p-3 font-normal"/></label><div className="mt-3 max-h-64 overflow-auto rounded-xl border">{products.filter(product => product.name.toLowerCase().includes(query.toLowerCase())).map(product => <button key={product.id} disabled={bundle.items.some(item => item.productId === product.id)} onClick={() => update({ items: [...bundle.items, { productId: product.id, variantId: product.product_variants?.find(variant => variant.is_active !== false)?.id, quantity: 1 }] })} className="flex w-full items-center justify-between gap-3 border-b p-3 text-left text-sm hover:bg-orange-50 disabled:opacity-40"><span>{product.name}</span><span className="font-bold text-brand-orange">{bundle.items.some(item => item.productId === product.id) ? 'Added' : '+ Add'}</span></button>)}</div>
    <div className="mt-5 rounded-2xl bg-brand-ink p-5 text-white"><p>Combined price: {money(priced.subtotal)}</p><p className="mt-1">10% saving: −{money(priced.discount)}</p><p className="mt-3 text-2xl font-black">Package total: {money(priced.total)}</p><p className="mt-1 text-sm text-orange-200">Plus free delivery</p>{bundle.items.length > 0 && !priced.available && <p className="mt-3 text-sm">Not currently orderable: check publication, product availability and stock.</p>}</div><button disabled={busy} onClick={() => void save()} className="orange-gradient mt-5 rounded-xl px-6 py-3 font-black text-white disabled:opacity-50">{busy ? 'Saving…' : 'Save all four packages'}</button></>}
  </section>;
}
