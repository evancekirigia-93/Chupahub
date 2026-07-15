'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { supabaseAnonKey, supabaseUrl } from '@/lib/supabase';

type Row = Record<string, any>;
type Field = { name: string; label: string; type?: 'text' | 'number' | 'checkbox' };

const tables = ['products', 'categories', 'brands', 'promotions', 'homepage_banners', 'delivery_locations', 'orders', 'order_items', 'customers', 'admin_users'];
const tableFields: Record<string, Field[]> = {
  categories: [
    { name: 'name', label: 'Category name' },
    { name: 'slug', label: 'URL slug' },
    { name: 'icon', label: 'Icon / emoji' },
    { name: 'image_url', label: 'Image URL' },
    { name: 'sort_order', label: 'Sort order', type: 'number' },
    { name: 'is_active', label: 'Active', type: 'checkbox' },
  ],
  brands: [{ name: 'name', label: 'Brand name' }, { name: 'slug', label: 'URL slug' }, { name: 'country', label: 'Country' }, { name: 'logo_url', label: 'Logo URL' }, { name: 'is_active', label: 'Active', type: 'checkbox' }],
  products: [{ name: 'name', label: 'Product name' }, { name: 'slug', label: 'URL slug' }, { name: 'price', label: 'Price', type: 'number' }, { name: 'old_price', label: 'Old price', type: 'number' }, { name: 'stock', label: 'Stock', type: 'number' }, { name: 'image_url', label: 'Image URL' }, { name: 'is_active', label: 'Active', type: 'checkbox' }],
  promotions: [{ name: 'title', label: 'Promotion title' }, { name: 'code', label: 'Code' }, { name: 'discount_type', label: 'Discount type' }, { name: 'discount_value', label: 'Discount value', type: 'number' }, { name: 'is_active', label: 'Active', type: 'checkbox' }],
  homepage_banners: [{ name: 'title', label: 'Banner title' }, { name: 'subtitle', label: 'Subtitle' }, { name: 'image_url', label: 'Image URL' }, { name: 'button_label', label: 'Button label' }, { name: 'button_url', label: 'Button URL' }, { name: 'sort_order', label: 'Sort order', type: 'number' }, { name: 'is_active', label: 'Active', type: 'checkbox' }],
};
const defaultFields: Field[] = [{ name: 'name', label: 'Name/title' }, { name: 'slug', label: 'Slug/code' }, { name: 'is_active', label: 'Active', type: 'checkbox' }];

async function auth(email: string, password: string) {
  const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: supabaseAnonKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
  if (!res.ok) throw new Error('Invalid admin login');
  return res.json();
}

async function rest(table: string, token: string, init?: RequestInit) {
  const query = init?.method ? '' : '?select=*&order=created_at.desc&limit=50';
  const res = await fetch(`${supabaseUrl}/rest/v1/${table}${query}`, { ...init, headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Prefer: 'return=representation', ...(init?.headers || {}) } });
  if (!res.ok) throw new Error(await res.text());
  return res.status === 204 ? [] : res.json();
}

const initialForm = (fields: Field[]) => Object.fromEntries(fields.map((field) => [field.name, field.type === 'checkbox' ? true : '']));

export default function Admin() {
  const [session, setSession] = useState<Row | null>(null);
  const [table, setTable] = useState('products');
  const fields = useMemo(() => tableFields[table] || defaultFields, [table]);
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState<Row>(initialForm(tableFields.products));

  async function load() { if (!session) return; setRows(await rest(table, session.access_token)); }
  useEffect(() => { setForm(initialForm(fields)); load().catch((e) => setError(e.message)); }, [session, table, fields]);

  async function login(e: FormEvent<HTMLFormElement>) { e.preventDefault(); const data = new FormData(e.currentTarget); setError(''); try { setSession(await auth(String(data.get('email')), String(data.get('password')))); } catch (err: any) { setError(err.message); } }
  async function save(e: FormEvent) {
    e.preventDefault();
    if (!session) return;
    const allowed = new Set(fields.map((field) => field.name));
    const payload = Object.fromEntries(Object.entries(form).filter(([key, value]) => allowed.has(key) && value !== '' && value !== null));
    const target = form.id ? `${table}?id=eq.${form.id}` : table;
    await rest(target, session.access_token, { method: form.id ? 'PATCH' : 'POST', body: JSON.stringify(payload) });
    setForm(initialForm(fields));
    await load();
  }
  async function remove(id: string) { if (!session) return; await rest(`${table}?id=eq.${id}`, session.access_token, { method: 'DELETE' }); await load(); }

  if (!session) return <main className="mx-auto max-w-md px-4 py-12"><h1 className="text-4xl font-black">Admin login</h1><p className="mt-2 text-neutral-600">Sign in with a Supabase Auth user that exists in <code>admin_users</code>.</p><form onSubmit={login} className="mt-6 grid gap-3 rounded-3xl bg-white p-6 shadow-card"><input name="email" type="email" placeholder="admin@email.com" className="rounded-xl border p-3" required /><input name="password" type="password" placeholder="Password" className="rounded-xl border p-3" required /><button className="orange-gradient rounded-xl py-3 font-black text-white">Sign in</button>{error && <p className="text-red-600">{error}</p>}</form></main>;

  return <main className="mx-auto max-w-none px-4 py-8"><div className="rounded-3xl bg-white p-6 shadow-card"><p className="font-bold uppercase tracking-wide text-brand-orange">Supabase Admin</p><h1 className="text-4xl font-black text-brand-ink">ChupaHub Admin Dashboard</h1><p className="mt-2 text-neutral-600">CRUD changes write directly to Supabase. Category edits update the storefront category navigation and pages after the 30-second Vercel revalidation window.</p></div><div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]"><aside className="rounded-2xl bg-white p-4 shadow-card">{tables.map((t) => <button key={t} onClick={() => setTable(t)} className={`mb-2 block w-full rounded-xl px-3 py-2 text-left font-bold ${table === t ? 'bg-brand-deep text-white' : 'bg-brand-soft text-brand-ink'}`}>{t}</button>)}</aside><section className="rounded-2xl bg-white p-4 shadow-card"><h2 className="text-2xl font-black capitalize">{table}</h2><form onSubmit={save} className="my-4 grid gap-3 md:grid-cols-3 xl:grid-cols-4">{fields.map((field) => <label key={field.name} className="text-sm font-bold text-brand-ink">{field.label}{field.type === 'checkbox' ? <input type="checkbox" checked={Boolean(form[field.name])} onChange={(e) => setForm({ ...form, [field.name]: e.target.checked })} className="ml-2 h-5 w-5 rounded border" /> : <input placeholder={field.label} type={field.type || 'text'} value={form[field.name] ?? ''} onChange={(e) => setForm({ ...form, [field.name]: field.type === 'number' ? Number(e.target.value) : e.target.value })} className="mt-1 w-full rounded-xl border p-3 font-normal" />}</label>)}<button className="rounded-xl bg-brand-deep px-4 py-3 font-black text-white">{form.id ? 'Update' : 'Create'}</button></form>{error && <p className="text-red-600">{error}</p>}<div className="overflow-auto"><table className="w-full text-sm"><thead><tr className="text-left"><th className="p-2">Name</th><th className="p-2">Slug/Status</th><th className="p-2">Actions</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-t"><td className="p-2 font-bold">{row.name || row.title || row.email || row.id}</td><td className="p-2">{row.slug || row.status || row.code || String(row.is_active)}</td><td className="flex gap-2 p-2"><button onClick={() => setForm({ ...initialForm(fields), ...row })} className="rounded-lg bg-brand-orange px-3 py-1 font-bold text-white">Edit</button><button onClick={() => remove(row.id)} className="rounded-lg bg-red-600 px-3 py-1 font-bold text-white">Delete</button></td></tr>)}</tbody></table></div></section></div></main>;
}
