'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Heart, MessageCircle, Search, ShoppingBag, UserCircle } from 'lucide-react';
import { DbCategory, DbProduct, effectivePrice, imageFor, money, SiteContent } from '@/lib/supabase';
import { readCart, writeCart } from '@/lib/cart';
import { BrandLogo } from '@/components/BrandLogo';
import { shopLinks } from '@/lib/seo-pages';
import { categoryCanonicalPath } from '@/lib/public-urls';
import { defaultBrandPartners } from '@/lib/brand-partners';

function animateProductToCart(source: HTMLButtonElement) {
  const image = source.parentElement?.querySelector('img'), cart = document.querySelector('[data-cart-icon]');
  if (!image || !cart || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const from = image.getBoundingClientRect(), to = cart.getBoundingClientRect(), clone = image.cloneNode(true) as HTMLImageElement;
  Object.assign(clone.style, { position: 'fixed', zIndex: '80', pointerEvents: 'none', objectFit: 'contain', left: `${from.left}px`, top: `${from.top}px`, width: `${from.width}px`, height: `${from.height}px`, transition: 'transform 600ms cubic-bezier(.2,.8,.2,1), opacity 600ms ease' });
  document.body.appendChild(clone);
  requestAnimationFrame(() => { clone.style.transform = `translate(${to.left - from.left}px, ${to.top - from.top}px) scale(.12)`; clone.style.opacity = '0.2'; });
  window.setTimeout(() => clone.remove(), 650);
}

export function Header({ content = {}, products = [] }: { content?: SiteContent; products?: DbProduct[] }) {
  const [cart, setCart] = useState<{ count: number; total: number }>({ count: 0, total: 0 }), [query, setQuery] = useState('');
  const refresh = () => { try { const items = JSON.parse(localStorage.getItem('chupahub-cart') || '[]'); setCart({ count: items.reduce((n:number,item:{quantity?:number}) => n + Number(item.quantity || 0), 0), total: items.reduce((n:number,item:{quantity?:number;price?:number}) => n + Number(item.quantity || 0) * Number(item.price || 0), 0) }); } catch { setCart({ count: 0, total: 0 }); } };
  useEffect(() => { refresh(); window.addEventListener('chupahub-cart-updated', refresh); return () => window.removeEventListener('chupahub-cart-updated', refresh); }, []);
  const suggestions = query.trim().length < 2 ? [] : products.filter((p) => `${p.name} ${p.brands?.name || ''} ${p.categories?.name || ''} ${p.description || ''} ${p.bottle_size || ''} ${(p.product_variants || []).map(v=>v.name).join(' ')}`.toLowerCase().includes(query.toLowerCase())).slice(0, 6);
  return <header className="brand-gradient sticky top-0 z-40">
    <div className="text-white"><div className="flex w-full items-center justify-between gap-2 px-3 py-2 text-xs font-bold sm:px-5"><span>{content.header_notice || 'FREE DELIVERY ON ORDERS OF KES 10,000 OR MORE'}</span><span className="hidden sm:inline">Fast delivery · Drink responsibly — 18+ only</span></div></div>
    <div className="relative grid w-full grid-cols-[auto_1fr_auto] items-center gap-2 px-3 py-3 sm:gap-4 sm:px-5">
      <a href="/" className="flex shrink-0 items-center" aria-label="Refresh ChupaHub home"><BrandLogo logoUrl={content.logo_url} /></a>
      <div className="relative min-w-0"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-orange" size={20}/><input value={query} onChange={e=>setQuery(e.target.value)} className="w-full rounded-xl border-2 border-orange-100 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-brand-orange" placeholder="Search products and brands" aria-label="Search products"/>{suggestions.length > 0 && <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-orange-100 bg-white shadow-card">{suggestions.map(p => <Link key={p.id} href={`/product/${p.slug}`} onClick={()=>setQuery('')} className="flex items-center gap-3 p-3 hover:bg-orange-50"><img src={imageFor(p)} alt={`${p.name} product`} loading="lazy" decoding="async" className="h-10 w-10 bg-white object-contain"/><span className="min-w-0 flex-1"><b className="block truncate">{p.name}</b><small>{p.bottle_size || p.product_variants?.[0]?.name || 'Bottle'} · {money(p.product_variants?.[0]?.price ?? p.price)}</small></span></Link>)}<Link href={`/search?q=${encodeURIComponent(query)}`} className="block border-t border-orange-100 p-3 text-sm font-black text-brand-orange">View all results</Link></div>}</div>
      <div className="flex items-center justify-end gap-2 text-white sm:gap-3"><a href="https://wa.me/" aria-label="Contact ChupaHub on WhatsApp" className="hidden lg:block"><MessageCircle/></a><Link href="/account" aria-label="Account" className="hidden sm:block"><UserCircle/></Link><Link href="/wishlist" className="relative hidden sm:block" aria-label="Wishlist"><Heart/><span className="absolute -right-2 -top-2 rounded-full bg-brand-ink px-1.5 text-[10px] font-black text-white">0</span></Link><Link href="/checkout" data-cart-icon className="relative flex items-center gap-1" aria-label="Cart"><ShoppingBag/><span className="absolute -right-2 -top-2 rounded-full bg-brand-ink px-1.5 text-[10px] font-black text-white">{cart.count}</span><span className="hidden text-xs font-black xl:inline">{money(cart.total)}</span></Link></div>
    </div>
  </header>;
}

export function Footer({ content = {} }: { content?: SiteContent }) {
  const socialLinks = [['Instagram', content.instagram_url], ['Facebook', content.facebook_url], ['TikTok', content.tiktok_url], ['WhatsApp', content.whatsapp_url]].filter(([, url]) => Boolean(url));
  const partners = content.brand_partners?.filter(partner => partner.name.trim() && partner.image_url.trim()) || defaultBrandPartners;
  const partnerLogos = partners.map(partner => <span key={partner.id} className="inline-flex h-8 w-24 shrink-0 items-center justify-center rounded bg-white px-2"><img src={partner.image_url} alt={partner.name} loading="lazy" className="max-h-6 max-w-full object-contain"/></span>);
  return <footer className="brand-gradient mt-16 text-left text-white"><div className="w-full px-3 py-8 sm:px-5"><section><BrandLogo footer logoUrl={content.logo_url} /><p className="mt-4 max-w-sm text-sm leading-6 text-white/75">{content.footer_text || 'Premium drinks delivered responsibly across Nairobi.'}</p>{socialLinks.length > 0 && <div className="mt-5 flex flex-wrap gap-3">{socialLinks.map(([name,url]) => <a key={name} href={url} target="_blank" rel="noreferrer" className="rounded-full border border-white/20 px-3 py-1.5 text-sm font-bold hover:border-brand-ink hover:text-brand-ink">{name}</a>)}</div>}</section><div className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-3"><nav aria-label="Shop"><h2 className="font-black text-brand-ink">{content.footer_shop_title || 'Shop'}</h2><div className="mt-4 grid grid-cols-2 gap-3 text-sm text-white/75">{shopLinks.map(([label,href])=><Link key={href} href={href}>{label}</Link>)}</div></nav><nav aria-label="Customer help"><h2 className="font-black text-brand-ink">{content.footer_help_title || 'Customer care'}</h2><div className="mt-4 grid gap-3 text-sm text-white/75"><Link href="/about">About ChupaHub</Link><Link href="/contact">Contact</Link><Link href="/faq">FAQ</Link><Link href="/track-order">Track order</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div></nav><section><h2 className="font-black text-brand-ink">{content.footer_contact_title || 'Contact us'}</h2><div className="mt-4 space-y-3 text-sm text-white/75">{content.contact_phone && <a className="block" href={`tel:${content.contact_phone}`}>{content.contact_phone}</a>}{content.contact_email && <a className="block break-all" href={`mailto:${content.contact_email}`}>{content.contact_email}</a>}<p>Fast, responsible delivery · 18+ only</p></div></section></div></div><div className="border-t border-white/10 px-3 py-5 text-left text-xs text-white/55">{content.copyright_text || `© ${new Date().getFullYear()} ChupaHub. Drink responsibly.`}</div><section aria-label="ChupaHub brand partners" className="overflow-hidden border-t border-white/10 py-1"><h2 className="sr-only">ChupaHub Brand Partners</h2><div className="brand-partnership-ticker flex w-max items-center gap-3">{partnerLogos}{partners.map(partner => <span key={`${partner.id}-repeat`} className="inline-flex h-8 w-24 shrink-0 items-center justify-center rounded bg-white px-2"><img src={partner.image_url} alt="" aria-hidden="true" loading="lazy" className="max-h-6 max-w-full object-contain"/></span>)}</div></section></footer>;
}

export function Journal({ content = {} }: { content?: SiteContent }) {
  const title = content.journal_title || 'ChupaHub Journal';
  const intro = content.journal_intro || 'Discover practical guides to choosing wine, whisky, beer and party drinks for every Nairobi occasion. Explore responsibly, compare styles and find the right bottle for your celebration.';
  return <section className="mx-auto max-w-5xl px-4 py-10"><div className="rounded-3xl border border-orange-100 bg-white p-6 shadow-card sm:p-8"><p className="font-bold uppercase tracking-[0.18em] text-brand-orange">Drink guides & ideas</p><h2 className="mt-2 text-3xl font-black text-brand-ink">{title}</h2><p className="mt-3 max-w-3xl leading-7 text-slate-700">{intro}</p><p className="mt-4 text-sm leading-6 text-slate-600">ChupaHub helps Nairobi customers shop wine, whisky, gin, vodka, beer, mixers and snacks with clear product details and responsible delivery information.</p></div></section>;
}

export function SeoArticle({ content = {} }: { content?: SiteContent }) {
  const title = content.article_title || "ChupaHub Deliveries – Kenya's Online Alcohol & Drinks Delivery Platform";
  const summary = content.article_summary || 'Discover wines, spirits, beers, champagne and mixers online with convenient ChupaHub delivery.';
  const body = content.article_body || `ChupaHub Deliveries is a fast, convenient online platform for ordering wines, spirits, beers, champagne, whisky, gin, vodka, tequila, rum, ciders, mixers, and other beverages for delivery across Kenya. Whether you're planning a celebration, stocking your home bar, or simply need a quick delivery, ChupaHub makes ordering drinks online simple and reliable.

If you're familiar with stores such as Chupa Chap, Oaks & Corks, The Bar KE, or other well-known liquor retailers in Kenya, ChupaHub offers a convenient online marketplace where you can discover a wide selection of drinks and have them delivered to your location.

Customers searching for terms such as:

• Chupa Chap
• Oaks & Corks
• The Bar KE
• online alcohol delivery Kenya
• liquor delivery near me
• wine delivery Nairobi
• whisky delivery Kenya
• beer delivery
• champagne delivery
• gin delivery
• vodka delivery
• tequila delivery
• same-day alcohol delivery
• drinks delivery
• buy alcohol online
• buy wine online Kenya
• premium liquor store
• online liquor shop
• alcohol delivery service
• drinks delivered to your door

can use ChupaHub to browse products, compare options, and order quickly from one easy-to-use platform.

Our goal is to make finding and ordering your favorite drinks as easy as ordering food online. Whether you're looking for premium whisky, fine wine, craft beer, champagne, spirits, or mixers, ChupaHub provides a secure and convenient shopping experience with fast delivery and excellent customer service.

ChupaHub Deliveries is designed for customers who want a trusted alternative when searching online for alcohol delivery services in Kenya. If you're searching for online liquor stores, wine delivery, beer delivery, or drink delivery services similar to Chupa Chap, Oaks & Corks, or The Bar KE, ChupaHub is ready to help you find what you need.

Please note that ChupaHub is an independent platform and is not affiliated with, endorsed by, or operated by Chupa Chap, Oaks & Corks, The Bar KE, or other third-party brands that may be referenced for comparison. All trademarks remain the property of their respective owners.

ChupaHub Deliveries promotes responsible drinking and only serves customers who are of legal drinking age.`;
  const articles = content.articles?.filter(article => article.is_active !== false && article.title.trim() && article.body.trim()) || [];
  const visibleArticles = articles.length ? articles : [{ id: 'default', title, summary, body, is_active: true }];
  return <section className="mx-auto max-w-4xl space-y-3 px-4 pb-10">{visibleArticles.map(article => <details key={article.id} className="group rounded-2xl border border-orange-100 bg-white px-5 py-4 text-sm shadow-sm"><summary className="cursor-pointer list-none font-black text-brand-ink"><span className="text-brand-orange">Journal</span> · {article.title}<span className="float-right text-brand-orange group-open:hidden">Read article</span><span className="float-right hidden text-brand-orange group-open:inline">Close</span></summary>{article.summary && <p className="mt-2 text-neutral-500">{article.summary}</p>}<article className="mt-4 border-t border-orange-100 pt-4 leading-7 text-neutral-700"><h2 className="text-xl font-black text-brand-ink">{article.title}</h2><p className="mt-3 whitespace-pre-line">{article.body}</p></article></details>)}</section>;
}

export function CategoryGrid({ categories }: { categories: DbCategory[] }) {
  return <section className="mx-auto grid max-w-none grid-cols-3 gap-2 px-3 py-4 sm:grid-cols-4 sm:gap-3 sm:px-4 md:grid-cols-6 xl:grid-cols-8">{categories.map((category) => <Link href={categoryCanonicalPath(category.slug)} key={category.id} className="group relative h-28 overflow-hidden rounded-2xl bg-gradient-to-br from-orange-300 to-red-800 shadow-card sm:h-36"><img src={category.image_url || 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=700&q=80'} alt={`${category.name} delivery Nairobi`} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover opacity-45 transition group-hover:scale-105" /><div className="tile-shade absolute inset-0" /><div className="absolute inset-x-0 bottom-0 p-3 text-center text-white"><div className="mx-auto mb-2 grid h-7 w-7 place-items-center rounded-full bg-white/90 text-2xl shadow-card sm:h-14 sm:w-14 sm:text-3xl">{category.icon || '🍾'}</div><h2 className="text-lg font-bold sm:text-xl">{category.name}</h2></div></Link>)}</section>;
}

export function ProductCard({ p }: { p: DbProduct }) {
  const [adding, setAdding] = useState(false);
  const variants = (p.product_variants || []).filter((variant) => variant.is_active !== false);
  const firstVariant = variants[0], pricing = effectivePrice(firstVariant || p), price = pricing.price, oldPrice = pricing.oldPrice;
  const discount = oldPrice ? Math.round((1 - price / oldPrice) * 100) : 0;
  const available = variants.length ? variants.some((variant) => Number(variant.stock) > 0) : Number(p.stock || 0) > 0;
  function add(event: React.MouseEvent<HTMLButtonElement>) { event.preventDefault(); event.stopPropagation(); if (!available || adding) return; setAdding(true); const cart = readCart(), variant = firstVariant, stock = variant?.stock ?? p.stock ?? 1; const current = cart.find((item) => item.productId === p.id && item.variantId === variant?.id), previousQuantity = current?.quantity ?? 0, nextQuantity = Math.min(previousQuantity + 1, stock); if (nextQuantity <= previousQuantity) { setAdding(false); return; } if (current) current.quantity = nextQuantity; else cart.push({ productId: p.id, variantId: variant?.id, name: p.name, size: variant?.name || p.bottle_size, price, image: imageFor(p), quantity: nextQuantity, stock }); const item = cart.find((entry) => entry.productId === p.id && entry.variantId === variant?.id)!; writeCart(cart, { item: { ...item }, quantityAdded: nextQuantity - previousQuantity }); animateProductToCart(event.currentTarget); window.setTimeout(() => setAdding(false), 600); }
  return <Link href={`/product/${p.slug}`} className="block min-w-0 rounded-2xl bg-white p-2 transition hover:-translate-y-1 hover:shadow-card"><div className="relative flex h-[clamp(10rem,18vw,17.5rem)] items-center justify-center overflow-hidden rounded-xl bg-white p-3"><img src={imageFor(p)} alt={`${p.name} product image`} loading="lazy" decoding="async" className="h-[90%] w-[90%] object-contain object-center" /><button type="button" aria-label={`Add ${p.name} to cart`} onClick={add} className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-brand-orange text-lg font-black text-white shadow-orange transition hover:scale-105 disabled:bg-neutral-300" disabled={!available || adding}>{adding ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent"/> : available ? '+' : '×'}</button>{variants.length > 1 && <span className="absolute bottom-2 left-2 rounded-full bg-white/95 px-2 py-1 text-[10px] font-black text-brand-deep shadow-sm">{variants.length} sizes</span>}</div><div className="pt-3"><div className="flex flex-wrap items-center gap-2"><b className="rounded-md bg-brand-orange px-2 py-1 text-base leading-none text-white"><span className="text-[11px] text-white">KSh</span> {Number(price).toLocaleString('en-KE')}</b>{discount > 0 && <span className="text-xs font-black text-brand-deep">{discount}% off</span>}{oldPrice && <s className="text-sm text-neutral-500">{money(oldPrice)}</s>}</div><h3 className="mt-2 min-h-9 text-[13px] font-medium leading-tight text-brand-ink">{p.name}</h3><p className={`mt-0.5 text-[10px] uppercase tracking-wide ${available ? 'text-green-700' : 'text-red-600'}`}>{p.abv != null ? `${p.abv}% ABV` : 'ABV not specified'} · {available ? 'Available' : 'Out of stock'}</p></div></Link>;
}

/** A sellable bottle size is shown as its own catalog card while retaining the
 * parent product record for shared editorial information and inventory links. */
export function ProductVariantCard({ product, variant }: { product: DbProduct; variant: NonNullable<DbProduct['product_variants']>[number] }) {
  const [adding, setAdding] = useState(false);
  const pricing = effectivePrice(variant), oldPrice = pricing.oldPrice;
  const discount = oldPrice ? Math.round((1 - pricing.price / oldPrice) * 100) : 0;
  const available = Number(variant.stock) > 0;
  function add(event: React.MouseEvent<HTMLButtonElement>) { event.preventDefault(); event.stopPropagation(); if (!available || adding) return; setAdding(true); const cart = readCart(), current = cart.find(item => item.productId === product.id && item.variantId === variant.id), previousQuantity = current?.quantity ?? 0, nextQuantity = Math.min(previousQuantity + 1, variant.stock); if (nextQuantity <= previousQuantity) { setAdding(false); return; } if (current) current.quantity = nextQuantity; else cart.push({ productId: product.id, variantId: variant.id, name: product.name, size: variant.name, price: pricing.price, image: variant.image_url || imageFor(product), quantity: nextQuantity, stock: variant.stock }); const item = cart.find(entry => entry.productId === product.id && entry.variantId === variant.id)!; writeCart(cart, { item: { ...item }, quantityAdded: nextQuantity - previousQuantity }); animateProductToCart(event.currentTarget); window.setTimeout(() => setAdding(false), 600); }
  return <Link href={`/product/${product.slug}?variant=${encodeURIComponent(variant.id)}`} className="block min-w-0 rounded-2xl bg-white p-2 transition hover:-translate-y-1 hover:shadow-card"><div className="relative flex h-[clamp(10rem,18vw,17.5rem)] items-center justify-center overflow-hidden rounded-xl bg-white p-3"><img src={variant.image_url || imageFor(product)} alt={`${product.name} ${variant.name} product image`} loading="lazy" decoding="async" className="h-[90%] w-[90%] object-contain object-center" /><button type="button" aria-label={`Add ${product.name} ${variant.name} to cart`} onClick={add} disabled={!available || adding} className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-brand-orange text-lg font-black text-white shadow-orange transition hover:scale-105 disabled:bg-neutral-300">{adding ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent"/> : available ? '+' : '×'}</button></div><div className="pt-3"><div className="flex flex-wrap items-center gap-2"><b className="rounded-md bg-brand-orange px-2 py-1 text-base leading-none text-white"><span className="text-[11px] text-white">KSh</span> {Number(pricing.price).toLocaleString('en-KE')}</b>{discount > 0 && <span className="text-xs font-black text-brand-deep">{discount}% off</span>}{oldPrice && <s className="text-sm text-neutral-500">{money(oldPrice)}</s>}</div><h3 className="mt-2 min-h-9 text-[13px] font-medium leading-tight text-brand-ink">{product.name}</h3><p className={`mt-0.5 text-[10px] uppercase tracking-wide ${available ? 'text-green-700' : 'text-red-600'}`}>{product.abv != null ? `${product.abv}% ABV` : 'ABV not specified'} · {available ? 'Available' : 'Out of stock'}</p></div></Link>;
}

function CatalogCards({ products, limit }: { products: DbProduct[]; limit?: number }) {
  return <>{products.flatMap((product) => {
    const activeVariants = (product.product_variants || []).filter((variant) => variant.is_active !== false);
    // Keep the parent card for the first/default offering, and surface every
    // additional bottle size as a separately clickable catalog product.
    return [<ProductCard key={product.id} p={product} />, ...activeVariants.slice(1).map((variant) => <ProductVariantCard key={variant.id} product={product} variant={variant} />)];
  }).slice(0, limit)}</>;
}

export function ProductRail({ title, products, href, limit = 8 }: { title: string; products: DbProduct[]; href: string; limit?: number }) {
  return <section className="mx-auto max-w-none overflow-hidden px-6 py-8"><div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-extrabold tracking-tight text-brand-ink">{title}</h2><Link href={href} className="font-bold text-brand-orange">View all {title}</Link></div><div className="product-rail-grid"><CatalogCards products={products} limit={limit} /></div></section>;
}
