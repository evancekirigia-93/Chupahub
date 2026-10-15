'use client';

import { useState } from 'react';

type Category = { id: string; name: string };
type Product = { id: string; name: string; category_id?: string; is_active: boolean };

export function HomepageProductPicker({ categories, products, initialCategory = '', initialSelectedIds = [] }: {
  categories: Category[];
  products: Product[];
  initialCategory?: string;
  initialSelectedIds?: string[];
}) {
  const [category, setCategory] = useState(initialCategory);
  const [filter, setFilter] = useState(initialCategory);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(() => new Set(initialSelectedIds));
  const knownCategories = new Set(categories.map(item => item.id));
  const groups = [
    ...[...categories].sort((a, b) => a.name.localeCompare(b.name)).map(item => ({
      ...item, items: products.filter(product => product.category_id === item.id),
    })),
    { id: 'uncategorised', name: 'Uncategorised', items: products.filter(product => !product.category_id || !knownCategories.has(product.category_id)) },
  ];
  const visibleGroups = groups.filter(group => !filter || group.id === filter).map(group => ({
    ...group, items: group.items.filter(product => product.name.toLowerCase().includes(query.trim().toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name)),
  })).filter(group => group.items.length);
  function toggle(id: string) {
    setSelected(current => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  return <>
    <label className="block font-bold">Category (optional)
      <select name="category_id" value={category} onChange={event => { setCategory(event.target.value); setFilter(event.target.value); }} className="mt-1 w-full rounded-xl border bg-white p-3 font-normal">
        <option value="">All categories</option>
        {categories.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
      </select>
    </label>
    <section className="rounded-xl border bg-white p-3 sm:col-span-2" aria-label="Choose products manually">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-bold">Choose products by category</h3>
        <div className="flex items-center gap-3"><span className="text-sm text-neutral-600" aria-live="polite">{selected.size} selected</span><button type="button" onClick={() => setSelected(new Set())} className="text-sm font-bold text-brand-orange">Clear selection</button></div>
      </div>
      <p className="mt-1 text-sm text-neutral-500">Leave products unchecked to use the row category automatically. For a mixed bundle, browse all categories and tick individual products. Selections stay checked when you change filters.</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <label className="text-sm font-bold">Browse category<select value={filter} onChange={event => setFilter(event.target.value)} className="mt-1 w-full rounded-lg border p-2 font-normal"><option value="">All categories</option>{groups.filter(group => group.items.length).map(group => <option key={group.id} value={group.id}>{group.name} ({group.items.length})</option>)}</select></label>
        <label className="text-sm font-bold">Search products<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search by product name" className="mt-1 w-full rounded-lg border p-2 font-normal"/></label>
      </div>
      {[...selected].map(id => <input key={id} type="hidden" name="product_ids" value={id}/>)}
      <div className="mt-3 max-h-80 space-y-4 overflow-y-auto">
        {visibleGroups.map(group => <fieldset key={group.id} className="rounded-lg border p-3">
          <legend className="px-1 font-bold text-brand-ink">{group.name} <span className="text-xs font-normal text-neutral-500">({group.items.length})</span></legend>
          <div className="grid gap-2 sm:grid-cols-2">{group.items.map(product => <label key={product.id} className={`flex cursor-pointer items-start gap-2 rounded-lg p-2 text-sm ${selected.has(product.id) ? 'bg-orange-50' : 'hover:bg-neutral-50'}`}>
            <input type="checkbox" checked={selected.has(product.id)} onChange={() => toggle(product.id)} className="mt-0.5 h-4 w-4 shrink-0 accent-brand-orange"/>
            <span>{product.name}{!product.is_active && <small className="ml-1 text-neutral-500">(Hidden)</small>}</span>
          </label>)}</div>
        </fieldset>)}
        {!visibleGroups.length && <p className="p-3 text-sm text-neutral-500">No products match this category or search.</p>}
      </div>
    </section>
  </>;
}
