'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { createBrowserSupabase } from '@/lib/supabase-browser';

type Row = Record<string, unknown> & { id: string };
type Option = { value: string; label: string };
type Field = {
  name: string;
  label: string;
  type?: 'text' | 'number' | 'checkbox' | 'textarea' | 'select' | 'datetime-local' | 'image';
  options?: Option[];
  bucket?: 'category-images' | 'product-images' | 'banner-images';
  required?: boolean;
};
type Section = { label: string; table: string; readOnly?: boolean };

const sections: Section[] = [
  { label: 'Products', table: 'products' },
  { label: 'Categories', table: 'categories' },
  { label: 'Brands', table: 'brands' },
  { label: 'Homepage banners', table: 'homepage_banners' },
  { label: 'Promotions', table: 'promotions' },
  { label: 'Delivery settings', table: 'delivery_settings' },
  { label: 'Orders', table: 'orders' },
  { label: 'Order items', table: 'order_items', readOnly: true },
  { label: 'Customers', table: 'customers', readOnly: true },
];

const baseFields: Record<string, Field[]> = {
  categories: [
    { name: 'name', label: 'Category name', required: true }, { name: 'slug', label: 'URL slug', required: true },
    { name: 'description', label: 'Description', type: 'textarea' }, { name: 'icon', label: 'Icon / emoji' },
    { name: 'image_url', label: 'Category image', type: 'image', bucket: 'category-images' }, { name: 'color', label: 'Color classes' },
    { name: 'sort_order', label: 'Sort order', type: 'number' }, { name: 'is_active', label: 'Active', type: 'checkbox' },
  ],
  brands: [
    { name: 'name', label: 'Brand name', required: true }, { name: 'slug', label: 'URL slug', required: true },
    { name: 'country', label: 'Country' }, { name: 'logo_url', label: 'Logo URL' }, { name: 'is_active', label: 'Active', type: 'checkbox' },
  ],
  products: [
    { name: 'name', label: 'Product name', required: true }, { name: 'slug', label: 'URL slug', required: true },
    { name: 'category_id', label: 'Category', type: 'select' }, { name: 'brand_id', label: 'Brand', type: 'select' },
    { name: 'description', label: 'Description', type: 'textarea' }, { name: 'short_description', label: 'Short description', type: 'textarea' },
    { name: 'price', label: 'Price (KES)', type: 'number', required: true }, { name: 'old_price', label: 'Old price (KES)', type: 'number' },
    { name: 'stock', label: 'Stock', type: 'number' }, { name: 'abv', label: 'ABV %', type: 'number' },
    { name: 'country', label: 'Country' }, { name: 'bottle_size', label: 'Bottle size' },
    { name: 'sku', label: 'SKU' }, { name: 'barcode', label: 'Barcode' },
    { name: 'image_url', label: 'Product image', type: 'image', bucket: 'product-images' },
    { name: 'sort_order', label: 'Sort order', type: 'number' }, { name: 'is_featured', label: 'Featured', type: 'checkbox' },
    { name: 'is_top_seller', label: 'Top seller', type: 'checkbox' }, { name: 'is_new_arrival', label: 'New arrival', type: 'checkbox' },
    { name: 'is_active', label: 'Active', type: 'checkbox' },
  ],
  homepage_banners: [
    { name: 'title', label: 'Banner title', required: true }, { name: 'subtitle', label: 'Subtitle', type: 'textarea' },
    { name: 'badge_text', label: 'Badge text' }, { name: 'image_url', label: 'Banner image', type: 'image', bucket: 'banner-images' },
    { name: 'button_label', label: 'Button label' }, { name: 'button_url', label: 'Button URL' },
    { name: 'starts_at', label: 'Starts at', type: 'datetime-local' }, { name: 'ends_at', label: 'Ends at', type: 'datetime-local' },
    { name: 'sort_order', label: 'Sort order', type: 'number' }, { name: 'is_active', label: 'Active', type: 'checkbox' },
  ],
  promotions: [
    { name: 'title', label: 'Promotion title', required: true }, { name: 'code', label: 'Code' },
    { name: 'description', label: 'Description', type: 'textarea' }, { name: 'badge_text', label: 'Badge text' },
    { name: 'discount_type', label: 'Discount type', type: 'select', required: true, options: [{ value: 'percent', label: 'Percent' }, { value: 'fixed', label: 'Fixed amount' }, { value: 'bundle', label: 'Bundle' }] },
    { name: 'discount_value', label: 'Discount value', type: 'number' },
    { name: 'image_url', label: 'Promotion image', type: 'image', bucket: 'banner-images' },
    { name: 'button_label', label: 'Button label' }, { name: 'button_url', label: 'Button URL' },
    { name: 'starts_at', label: 'Starts at', type: 'datetime-local' }, { name: 'ends_at', label: 'Ends at', type: 'datetime-local' },
    { name: 'sort_order', label: 'Sort order', type: 'number' }, { name: 'is_active', label: 'Active', type: 'checkbox' },
  ],
  delivery_settings: [
    { name: 'name', label: 'Zone name', required: true }, { name: 'min_distance_km', label: 'Minimum km', type: 'number' },
    { name: 'max_distance_km', label: 'Maximum km', type: 'number' }, { name: 'fee', label: 'Fee (KES)', type: 'number' },
    { name: 'estimated_minutes_min', label: 'Minimum minutes', type: 'number' }, { name: 'estimated_minutes_max', label: 'Maximum minutes', type: 'number' },
    { name: 'sort_order', label: 'Sort order', type: 'number' }, { name: 'is_active', label: 'Active', type: 'checkbox' },
  ],
  orders: [
    { name: 'status', label: 'Order status', type: 'select', options: ['pending','paid','packing','out_for_delivery','completed','cancelled','refunded'].map((value) => ({ value, label: value.replaceAll('_', ' ') })) },
    { name: 'payment_status', label: 'Payment status', type: 'select', options: ['pending','paid','failed','refunded'].map((value) => ({ value, label: value })) },
    { name: 'payment_reference', label: 'Payment reference' }, { name: 'admin_notes', label: 'Admin notes', type: 'textarea' },
  ],
};

function emptyForm(fields: Field[]): Record<string, unknown> {
  return Object.fromEntries(fields.map((field) => [field.name, field.type === 'checkbox' ? field.name === 'is_active' : '']));
}

function displayValue(row: Row, table: string) {
  if (table === 'orders') return `${String(row.status || 'pending')} · ${String(row.payment_status || 'pending')}`;
  return String(row.name || row.title || row.email || row.product_name || row.full_name || row.id);
}

export default function AdminPage() {
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const [user, setUser] = useState<User | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [section, setSection] = useState<Section>(sections[0]);
  const [rows, setRows] = useState<Row[]>([]);
  const [references, setReferences] = useState<{ categories: Option[]; brands: Option[] }>({ categories: [], brands: [] });
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fields = useMemo(() => (baseFields[section.table] || []).map((field) => {
    if (field.name === 'category_id') return { ...field, options: references.categories };
    if (field.name === 'brand_id') return { ...field, options: references.brands };
    return field;
  }), [section.table, references]);

  const verifyAdmin = useCallback(async (client: SupabaseClient, nextUser: User | null) => {
    setUser(nextUser);
    if (!nextUser) { setAuthorized(false); setAuthReady(true); return; }
    const { data, error: adminError } = await client.from('admin_users').select('id').eq('user_id', nextUser.id).eq('is_active', true).maybeSingle();
    setAuthorized(Boolean(data) && !adminError);
    setAuthReady(true);
  }, []);

  useEffect(() => {
    if (!supabase) { setAuthReady(true); return; }
    supabase.auth.getUser().then(({ data }) => verifyAdmin(supabase, data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => { void verifyAdmin(supabase, session?.user || null); });
    return () => listener.subscription.unsubscribe();
  }, [supabase, verifyAdmin]);

  const loadRows = useCallback(async () => {
    if (!supabase || !authorized) return;
    setBusy(true); setError('');
    const { data, error: loadError } = await supabase.from(section.table).select('*').order('created_at', { ascending: false }).limit(100);
    if (loadError) setError(loadError.message); else setRows((data || []) as Row[]);
    setBusy(false);
  }, [supabase, authorized, section.table]);

  useEffect(() => { setForm(emptyForm(fields)); void loadRows(); }, [fields, loadRows]);

  useEffect(() => {
    if (!supabase || !authorized) return;
    Promise.all([
      supabase.from('categories').select('id,name').order('name'),
      supabase.from('brands').select('id,name').order('name'),
    ]).then(([categoryResult, brandResult]) => setReferences({
      categories: (categoryResult.data || []).map((row) => ({ value: row.id, label: row.name })),
      brands: (brandResult.data || []).map((row) => ({ value: row.id, label: row.name })),
    }));
  }, [supabase, authorized]);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!supabase) return;
    setBusy(true); setError('');
    const data = new FormData(event.currentTarget);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: String(data.get('email')), password: String(data.get('password')) });
    if (signInError) setError(signInError.message);
    setBusy(false);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!supabase || section.readOnly) return;
    setBusy(true); setError(''); setMessage('');
    const id = typeof form.id === 'string' ? form.id : undefined;
    const payload = Object.fromEntries(fields.map((field) => [field.name, form[field.name] === '' ? null : form[field.name]]));
    const query = id ? supabase.from(section.table).update(payload).eq('id', id) : supabase.from(section.table).insert(payload);
    const { error: saveError } = await query;
    if (saveError) setError(saveError.message);
    else { setMessage(id ? 'Changes saved.' : 'Record created.'); setForm(emptyForm(fields)); await loadRows(); }
    setBusy(false);
  }

  async function remove(row: Row) {
    if (!supabase || section.readOnly || !window.confirm(`Delete ${displayValue(row, section.table)}?`)) return;
    setBusy(true); setError('');
    const { error: deleteError } = await supabase.from(section.table).delete().eq('id', row.id);
    if (deleteError) setError(deleteError.message); else { setMessage('Record deleted.'); await loadRows(); }
    setBusy(false);
  }

  async function upload(field: Field, file: File) {
    if (!supabase || !field.bucket) return;
    setBusy(true); setError('');
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${section.table}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from(field.bucket).upload(path, file, { cacheControl: '3600', upsert: false });
    if (uploadError) setError(uploadError.message);
    else {
      const { data } = supabase.storage.from(field.bucket).getPublicUrl(path);
      setForm((current) => ({ ...current, [field.name]: data.publicUrl }));
      setMessage('Image uploaded. Save the record to use it.');
    }
    setBusy(false);
  }

  if (!supabase) return <main className="mx-auto max-w-xl px-4 py-12"><div className="rounded-3xl bg-white p-6 shadow-card"><h1 className="text-3xl font-black">Supabase configuration required</h1><p className="mt-3">Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and either the anon or publishable key in Vercel.</p></div></main>;
  if (!authReady) return <main className="p-12 text-center font-bold">Checking admin session…</main>;
  if (!user) return <main className="mx-auto max-w-md px-4 py-12"><h1 className="text-4xl font-black">Admin login</h1><p className="mt-2 text-neutral-600">Use a Supabase Auth account registered in <code>public.admin_users</code>.</p><form onSubmit={login} className="mt-6 grid gap-3 rounded-3xl bg-white p-6 shadow-card"><input name="email" type="email" placeholder="admin@email.com" className="rounded-xl border p-3" required /><input name="password" type="password" placeholder="Password" className="rounded-xl border p-3" required /><button disabled={busy} className="orange-gradient rounded-xl py-3 font-black text-white disabled:opacity-50">{busy ? 'Signing in…' : 'Sign in'}</button>{error && <p className="text-red-600">{error}</p>}</form></main>;
  if (!authorized) return <main className="mx-auto max-w-xl px-4 py-12"><div className="rounded-3xl bg-white p-6 shadow-card"><h1 className="text-3xl font-black text-red-700">Access denied</h1><p className="mt-2">Your account is authenticated but is not an active ChupaHub administrator.</p><button onClick={() => supabase.auth.signOut()} className="mt-5 rounded-xl bg-brand-deep px-5 py-3 font-bold text-white">Sign out</button></div></main>;

  return <main className="mx-auto max-w-none px-4 py-8">
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-white p-6 shadow-card"><div><p className="font-bold uppercase tracking-wide text-brand-orange">Authenticated Supabase admin</p><h1 className="text-4xl font-black text-brand-ink">ChupaHub Dashboard</h1><p className="mt-2 text-neutral-600">Signed in as {user.email}. Every action is enforced by Supabase RLS.</p></div><button onClick={() => supabase.auth.signOut()} className="rounded-xl border-2 border-brand-deep px-4 py-2 font-bold text-brand-deep">Sign out</button></div>
    <div className="mt-6 grid gap-6 lg:grid-cols-[250px_1fr]">
      <aside className="h-fit rounded-2xl bg-white p-4 shadow-card">{sections.map((item) => <button key={item.table} onClick={() => { setSection(item); setMessage(''); setError(''); }} className={`mb-2 block w-full rounded-xl px-3 py-2 text-left font-bold ${section.table === item.table ? 'bg-brand-deep text-white' : 'bg-brand-soft text-brand-ink'}`}>{item.label}</button>)}</aside>
      <section className="min-w-0 rounded-2xl bg-white p-4 shadow-card">
        <div className="flex items-center justify-between"><h2 className="text-2xl font-black">{section.label}</h2><button onClick={() => loadRows()} disabled={busy} className="rounded-lg bg-brand-soft px-3 py-2 font-bold text-brand-deep">Refresh</button></div>
        {!section.readOnly && <form onSubmit={save} className="my-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{fields.map((field) => <label key={field.name} className={`${field.type === 'textarea' ? 'md:col-span-2' : ''} text-sm font-bold text-brand-ink`}>{field.label}
          {field.type === 'checkbox' ? <input type="checkbox" checked={Boolean(form[field.name])} onChange={(event) => setForm({ ...form, [field.name]: event.target.checked })} className="ml-3 h-5 w-5 rounded border" />
            : field.type === 'textarea' ? <textarea value={String(form[field.name] ?? '')} onChange={(event) => setForm({ ...form, [field.name]: event.target.value })} className="mt-1 min-h-24 w-full rounded-xl border p-3 font-normal" />
            : field.type === 'select' ? <select value={String(form[field.name] ?? '')} required={field.required} onChange={(event) => setForm({ ...form, [field.name]: event.target.value })} className="mt-1 w-full rounded-xl border bg-white p-3 font-normal"><option value="">Select…</option>{field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
            : field.type === 'image' ? <span className="mt-1 block space-y-2"><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(field, file); }} className="w-full rounded-xl border p-2 font-normal" /><span className="flex items-center gap-2">{Boolean(form[field.name]) && <img src={String(form[field.name])} alt="Uploaded preview" className="h-16 w-16 rounded-lg object-cover" />}<input placeholder="Or paste an existing public image URL" value={String(form[field.name] ?? '')} onChange={(event) => setForm({ ...form, [field.name]: event.target.value })} className="min-w-0 flex-1 rounded-lg border p-2 font-normal" /></span></span>
            : <input type={field.type || 'text'} step={field.type === 'number' ? 'any' : undefined} required={field.required} value={String(form[field.name] ?? '')} onChange={(event) => setForm({ ...form, [field.name]: field.type === 'number' && event.target.value !== '' ? Number(event.target.value) : event.target.value })} className="mt-1 w-full rounded-xl border p-3 font-normal" />}
        </label>)}<div className="flex items-end gap-2"><button disabled={busy} className="rounded-xl bg-brand-deep px-5 py-3 font-black text-white disabled:opacity-50">{form.id ? 'Save changes' : 'Create'}</button>{Boolean(form.id) && <button type="button" onClick={() => setForm(emptyForm(fields))} className="rounded-xl border px-5 py-3 font-bold">Cancel</button>}</div></form>}
        {message && <p className="my-3 rounded-xl bg-green-50 p-3 font-semibold text-green-800">{message}</p>}{error && <p className="my-3 rounded-xl bg-red-50 p-3 font-semibold text-red-700">{error}</p>}
        <div className="overflow-auto"><table className="w-full min-w-[650px] text-sm"><thead><tr className="text-left"><th className="p-2">Record</th><th className="p-2">Status / details</th><th className="p-2">Created</th>{!section.readOnly && <th className="p-2">Actions</th>}</tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-t"><td className="p-2 font-bold">{displayValue(row, section.table)}</td><td className="p-2">{String(row.slug || row.code || row.payment_method || row.order_id || row.email || (row.is_active ?? ''))}</td><td className="p-2">{row.created_at ? new Date(String(row.created_at)).toLocaleString() : '—'}</td>{!section.readOnly && <td className="flex gap-2 p-2"><button onClick={() => setForm({ ...emptyForm(fields), ...row })} className="rounded-lg bg-brand-orange px-3 py-1 font-bold text-white">Edit</button><button onClick={() => void remove(row)} className="rounded-lg bg-red-600 px-3 py-1 font-bold text-white">Delete</button></td>}</tr>)}</tbody></table>{!busy && rows.length === 0 && <p className="p-6 text-center text-neutral-500">No records found.</p>}</div>
      </section>
    </div>
  </main>;
}
