'use client';

import Link from 'next/link';
import { Heart, Menu, Search, ShoppingBag, UserCircle } from 'lucide-react';
import { categories, money, products } from '@/lib/data';

export function Header() {
  return (
    <header className="bg-brand-deep text-white shadow-orange">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 pt-1 text-[11px] font-semibold sm:pt-3">
        <span>Delivery within Nairobi: <strong>10-50min</strong></span>
        <span className="rounded-full bg-white/15 px-2.5 py-0.5">18+</span>
      </div>

      <nav className="mx-auto max-w-6xl px-4 py-2">
        <div className="flex items-center justify-between gap-3">
          <button className="flex items-center gap-2 rounded-xl px-1 py-2 text-sm uppercase tracking-wide focus-ring" aria-label="Open menu">
            <Menu size={32} />
            <span>Menu</span>
          </button>

          <Link href="/" className="flex items-center gap-2 text-lg font-black tracking-tight" aria-label="ChupaHub home">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-white text-brand-deep shadow-card">🍾</span>
            <span>ChupaHub</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link className="focus-ring" href="/account" aria-label="Account"><UserCircle size={30} /></Link>
            <Heart className="hidden sm:block" aria-label="Wishlist" />
            <Link href="/checkout" className="relative rounded-xl border-2 border-white px-3 py-2 focus-ring" aria-label="Cart">
              <ShoppingBag />
              <span className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-white text-xs font-black text-brand-deep">0</span>
            </Link>
          </div>
        </div>

        <label className="mt-2 flex items-center gap-2 rounded-full bg-white px-4 py-2 text-brand-ink shadow-card">
          <Search className="text-brand-orange" />
          <input className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-500" placeholder="Search products..." aria-label="Search products" />
        </label>
      </nav>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-16 bg-brand-ink text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <h3 className="text-3xl font-black text-brand-orange">ChupaHub</h3>
          <p className="mt-3 max-w-md text-white/75">Orange-and-white premium liquor delivery with loyalty points, AI recommendations, WhatsApp ordering and live tracking.</p>
        </div>
        {['About', 'Privacy', 'Terms', 'Contact'].map((item) => (
          <Link className="text-white/75 hover:text-white" href={`/${item.toLowerCase()}`} key={item}>{item}</Link>
        ))}
      </div>
    </footer>
  );
}

export function CategoryGrid() {
  return (
    <section className="mx-auto grid max-w-6xl grid-cols-3 gap-2 px-3 py-4 sm:grid-cols-4 sm:gap-3 sm:px-4 lg:grid-cols-6">
      {categories.map((category) => (
        <Link href={`/category/${category.slug}`} key={category.slug} className={`group relative h-28 overflow-hidden rounded-2xl bg-gradient-to-br ${category.color} shadow-card sm:h-36`}>
          <img src={category.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-45 transition group-hover:scale-105" />
          <div className="tile-shade absolute inset-0" />
          <div className="absolute inset-x-0 bottom-0 p-3 text-center text-white">
            <div className="mx-auto mb-2 grid h-7 w-7 place-items-center rounded-full bg-white/90 text-2xl shadow-card sm:h-14 sm:w-14 sm:text-3xl">{category.icon}</div>
            <h2 className="text-lg font-bold sm:text-xl">{category.name}</h2>
          </div>
        </Link>
      ))}
    </section>
  );
}

export function ProductCard({ p }: { p: typeof products[number] }) {
  const discount = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;

  return (
    <Link href={`/product/${p.slug}`} className="block bg-transparent transition hover:-translate-y-1">
      <div className="relative flex h-36 items-end justify-center">
        <img src={p.images[0]} alt={p.name} className="h-32 w-full object-contain" />
        <button className="absolute right-0 top-3 rounded-full bg-brand-deep px-3 py-1.5 text-xs font-black text-white shadow-orange">+</button>
      </div>
      <div className="pt-2">
        <div className="flex items-center gap-2">
          <b className="rounded-md bg-brand-deep px-2 py-0.5 text-base leading-none text-white"><span className="text-[11px] text-white">KSh</span> {p.price.toLocaleString('en-KE')}</b>
          {discount > 0 && <span className="text-xs font-black text-brand-deep">{discount}% off</span>}
          {p.oldPrice && <s className="text-sm text-neutral-500">{money(p.oldPrice)}</s>}
        </div>
        <h3 className="mt-1 text-[13px] font-medium leading-tight text-brand-ink">{p.name}</h3>
        <p className="mt-0.5 text-[10px] uppercase tracking-wide text-neutral-500">{p.abv}% ABV</p>
      </div>
    </Link>
  );
}

export function ProductRail({ title }: { title: string }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-extrabold tracking-tight text-brand-ink">{title}</h2>
        <Link href="/category/whisky" className="font-bold text-brand-orange">View all</Link>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {products.map((product) => <ProductCard key={product.id} p={product} />)}
      </div>
    </section>
  );
}
