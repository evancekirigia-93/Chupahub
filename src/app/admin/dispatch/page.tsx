'use client';

import Link from 'next/link';
import { Check, Package, PackageCheck, RefreshCw, Truck } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createBrowserSupabase } from '@/lib/supabase-browser';
import { money } from '@/lib/supabase';

type ProductRelation = { image_url?: string | null } | { image_url?: string | null }[] | null;
type DispatchItem = { id: string; product_name: string; quantity: number; line_total: number; products?: ProductRelation };
type Rider = { name: string; phone: string };
type DispatchOrder = {
  id: string; order_number?: string; created_at: string; status: string; customer_name?: string;
  customer_phone?: string; delivery_address?: string; delivery_instructions?: string;
  payment_method: string; payment_status: string; total: number; rider_name?: string; rider_phone?: string; order_items: DispatchItem[];
};

const dispatchable = ['pending', 'pending_payment', 'paid', 'confirmed', 'accepted', 'processing', 'packing'];
const productImage = (item: DispatchItem) => Array.isArray(item.products) ? item.products[0]?.image_url : item.products?.image_url;

export default function DispatchPage() {
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const [orders,setOrders] = useState<DispatchOrder[]>([]), [selected,setSelected] = useState('');
  const [checked,setChecked] = useState<Set<string>>(new Set()), [riderName,setRiderName] = useState(''), [riderPhone,setRiderPhone] = useState(''), [savedRiders,setSavedRiders] = useState<Rider[]>([]);
  const [loading,setLoading] = useState(true), [busy,setBusy] = useState(false), [error,setError] = useState(''), [notice,setNotice] = useState('');

  const load = useCallback(async () => {
    if (!supabase) { setError('Supabase is not configured.'); setLoading(false); return; }
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) { setError('Sign in as an administrator to use Dispatch.'); setLoading(false); return; }
    const { data: admin } = await supabase.rpc('current_admin');
    if (!admin) { setError('Administrator access required.'); setLoading(false); return; }
    const [orderResult, riderResult] = await Promise.all([
      supabase.from('orders').select('id,order_number,created_at,status,customer_name,customer_phone,delivery_address,delivery_instructions,payment_method,payment_status,total,rider_name,rider_phone,order_items(id,product_name,quantity,line_total,products(image_url))').in('status', dispatchable).order('created_at', { ascending: true }),
      supabase.from('store_settings').select('value').eq('key', 'dispatch_riders').maybeSingle(),
    ]);
    if (orderResult.error) setError(orderResult.error.message); else { setOrders((orderResult.data || []) as unknown as DispatchOrder[]); setError(''); }
    const riderValue = riderResult.data?.value;
    setSavedRiders(Array.isArray(riderValue) ? riderValue.filter((item): item is Rider => Boolean(item && typeof item === 'object' && 'name' in item && 'phone' in item)) : []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    const order = orders.find(item => item.id === selected);
    setChecked(new Set()); setRiderName(order?.rider_name || ''); setRiderPhone(order?.rider_phone || '');
  }, [orders, selected]);

  const order = orders.find(item => item.id === selected) || orders[0];
  useEffect(() => { if (!selected && orders[0]) setSelected(orders[0].id); }, [orders, selected]);
  const allChecked = Boolean(order?.order_items.length) && order.order_items.every(item => checked.has(item.id));
  const canDispatch = allChecked && riderName.trim().length > 1 && riderPhone.trim().length >= 7 && !busy;

  function toggle(id: string) { setChecked(current => { const next = new Set(current); next.has(id) ? next.delete(id) : next.add(id); return next; }); }
  function chooseRider(phone: string) { const rider = savedRiders.find(item => item.phone === phone); if (rider) { setRiderName(rider.name); setRiderPhone(rider.phone); } }
  async function saveRider() {
    if (!supabase) return;
    const rider = { name: riderName.trim(), phone: riderPhone.trim() };
    const next = [rider, ...savedRiders.filter(item => item.phone.replace(/\s/g,'') !== rider.phone.replace(/\s/g,''))].slice(0, 50);
    const { error: riderError } = await supabase.from('store_settings').upsert({ key: 'dispatch_riders', value: next, description: 'Saved dispatch riders for quick admin selection', is_public: false });
    if (riderError) throw riderError;
    setSavedRiders(next);
  }
  async function dispatch() {
    if (!supabase || !order || !canDispatch) return;
    setBusy(true); setError(''); setNotice('');
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch(`/api/admin/orders/${order.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}` }, body: JSON.stringify({ status: 'out_for_delivery', riderName: riderName.trim(), riderPhone: riderPhone.trim(), note: 'All dispatch items physically checked by admin.' }) });
    const result = await response.json();
    if (!response.ok) setError(result.error || 'Unable to dispatch order.');
    else { try { await saveRider(); } catch (cause) { setError(cause instanceof Error ? `Order dispatched, but rider could not be saved: ${cause.message}` : 'Order dispatched, but rider could not be saved.'); } setNotice(`Order ${order.order_number || order.id.slice(0,8)} dispatched with ${order.order_items.length} checked item lines.`); setSelected(''); await load(); }
    setBusy(false);
  }

  return <main className="mx-auto max-w-7xl p-3 sm:p-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-bold uppercase text-brand-orange">Admin</p><h1 className="text-3xl font-black text-brand-ink">Dispatch</h1><p className="mt-1 text-neutral-600">Physically check every product image, add the rider, then dispatch.</p></div><div className="flex gap-2"><button onClick={()=>void load()} className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2 font-bold"><RefreshCw size={17}/>Refresh</button><Link href="/admin/orders" className="rounded-xl border bg-white px-4 py-2 font-bold">Orders</Link><Link href="/admin" className="rounded-xl border bg-white px-4 py-2 font-bold">Admin</Link></div></div>
    {notice&&<p className="mt-4 rounded-xl bg-green-50 p-3 font-bold text-green-800"><Check className="mr-2 inline" size={18}/>{notice}</p>}
    {error&&<p className="mt-4 rounded-xl bg-red-50 p-3 font-bold text-red-700">{error}</p>}
    {loading?<p className="mt-8">Loading dispatch orders…</p>:!orders.length?<div className="mt-6 rounded-2xl bg-white p-8 text-center shadow-card"><PackageCheck className="mx-auto text-brand-orange" size={42}/><h2 className="mt-3 text-xl font-black">No orders waiting for dispatch</h2><p className="text-neutral-500">New orders will appear here immediately after checkout.</p></div>:<div className="mt-5 grid gap-4 lg:grid-cols-[300px_1fr]">
      <aside className="max-h-[72vh] space-y-2 overflow-y-auto rounded-2xl bg-white p-3 shadow-card"><h2 className="px-2 py-1 font-black">Dispatch queue ({orders.length})</h2>{orders.map(item=><button key={item.id} onClick={()=>setSelected(item.id)} className={`w-full rounded-xl p-3 text-left ${order?.id===item.id?'bg-brand-deep text-white':'border hover:bg-orange-50'}`}><b>#{item.order_number||item.id.slice(0,8)}</b><small className="mt-1 block">{item.customer_name||'Guest'} · {item.order_items.length} item lines</small><small className="block">{item.payment_status === 'paid' ? 'Paid' : 'Unpaid'} · {new Date(item.created_at).toLocaleString()}</small></button>)}</aside>
      {order&&<section className="min-w-0 rounded-2xl bg-white p-4 shadow-card sm:p-6"><div className="flex flex-wrap justify-between gap-3"><div><h2 className="text-2xl font-black">Order #{order.order_number||order.id.slice(0,8)}</h2><p className={`mb-2 inline-flex rounded-full px-3 py-1 text-sm font-black ${order.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>{order.payment_status === 'paid' ? 'Paid' : 'Unpaid'} · {order.payment_method}</p><p>{order.customer_name||'Guest'} · <a className="text-brand-orange" href={`tel:${order.customer_phone||''}`}>{order.customer_phone||'No phone'}</a></p><p className="text-sm text-neutral-600">{order.delivery_address||'No delivery address'}</p>{order.delivery_instructions&&<p className="text-sm text-neutral-600">Instructions: {order.delivery_instructions}</p>}</div><b className="text-xl">{money(order.total)}</b></div>
        <div className="mt-6"><div className="flex items-center justify-between gap-3"><h3 className="text-xl font-black">Packing checklist</h3><span className={`rounded-full px-3 py-1 text-sm font-black ${allChecked?'bg-green-100 text-green-800':'bg-amber-100 text-amber-800'}`}>{checked.size}/{order.order_items.length} checked</span></div><p className="mt-1 text-sm text-neutral-500">Match the physical item to the actual product image and tick it.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">{order.order_items.map(item=>{const image=productImage(item);const done=checked.has(item.id);return <button type="button" key={item.id} onClick={()=>toggle(item.id)} aria-pressed={done} className={`flex items-center gap-3 rounded-2xl border-2 p-3 text-left transition ${done?'border-green-500 bg-green-50':'border-neutral-200 bg-white'}`}><span className="relative flex h-24 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-soft">{image?<img src={image} alt={item.product_name} className="h-full w-full object-contain p-1"/>:<Package size={28} className="text-neutral-400"/>}<span className={`absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 ${done?'border-green-600 bg-green-600 text-white':'border-neutral-400 bg-white'}`}>{done&&<Check size={15}/>}</span></span><span className="min-w-0"><b className="block">{item.quantity} × {item.product_name}</b><small>{money(item.line_total)}</small><small className={`mt-1 block font-bold ${done?'text-green-700':'text-amber-700'}`}>{done?'Physically checked':'Tap to confirm item'}</small></span></button>})}</div></div>
        <div className="mt-6 rounded-2xl bg-brand-soft p-4"><h3 className="flex items-center gap-2 text-xl font-black"><Truck size={21}/>Rider information</h3>{savedRiders.length>0&&<label className="mt-3 block font-bold">Choose saved rider<select value="" onChange={event=>chooseRider(event.target.value)} className="mt-1 w-full rounded-xl border bg-white p-3 font-normal"><option value="">Select a rider</option>{savedRiders.map(rider=><option key={rider.phone} value={rider.phone}>{rider.name} — {rider.phone}</option>)}</select></label>}<div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="font-bold">Rider name<input value={riderName} onChange={event=>setRiderName(event.target.value)} className="mt-1 w-full rounded-xl border bg-white p-3 font-normal" placeholder="Full rider name" required/></label><label className="font-bold">Rider phone<input value={riderPhone} onChange={event=>setRiderPhone(event.target.value)} className="mt-1 w-full rounded-xl border bg-white p-3 font-normal" placeholder="07..." inputMode="tel" required/></label></div><p className="mt-2 text-xs text-neutral-600">New rider details are saved automatically after dispatch.</p><button onClick={()=>void dispatch()} disabled={!canDispatch} className="orange-gradient mt-4 inline-flex items-center gap-2 rounded-xl px-6 py-3 font-black text-white disabled:cursor-not-allowed disabled:opacity-40"><PackageCheck size={19}/>{busy?'Dispatching…':'Dispatch order'}</button>{!allChecked&&<p className="mt-2 text-sm font-bold text-amber-800">Tick every product before dispatching.</p>}</div>
      </section>}
    </div>}
  </main>;
}
