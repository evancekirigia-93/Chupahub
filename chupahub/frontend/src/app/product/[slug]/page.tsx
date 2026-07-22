import type { Metadata } from 'next';
import { ProductRail } from '@/components/Site';
import { ProductPurchase } from '@/components/ProductPurchase';
import { ProductGallery } from '@/components/ProductGallery';
import { getProduct, getProducts, imageFor, money } from '@/lib/supabase';
import { absoluteUrl, breadcrumbSchema, JsonLd, plainText, truncate } from '@/lib/seo';
import sanitizeHtml from 'sanitize-html';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: 'Product Not Found', robots: { index: false, follow: false } };
  const category = (product.categories?.name || 'Alcohol').replace(/\b\w/g, (letter) => letter.toUpperCase());
  const title = product.seo_title || `${product.name} – ${category} Delivery Nairobi`;
  const description = truncate(product.seo_description || plainText(product.short_description || product.description) || `Order ${product.name} online from ChupaHub for fast alcohol delivery across Nairobi.`);
  const url = `/product/${product.slug}`;
  const images = [...new Set([imageFor(product), ...(product.gallery_urls || [])])];
  return {
    title, description, alternates: { canonical: url },
    keywords: [`${product.name} Nairobi`, `${category} Delivery Nairobi`, 'Alcohol Delivery Nairobi', 'Liquor Delivery Nairobi'],
    openGraph: { title: `${title} | ChupaHub`, description, url, type: 'website', images: images.map((image) => ({ url: image, alt: product.name })) },
    twitter: { card: 'summary_large_image', title: `${title} | ChupaHub`, description, images: images.slice(0, 1) },
  };
}

export default async function Product({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [product, related] = await Promise.all([getProduct(slug), getProducts()]);
  if (!product) return <main className="mx-auto max-w-none px-4 py-8"><h1 className="text-3xl font-black">Product not found</h1></main>;
  const images = [...new Set([imageFor(product), ...(product.gallery_urls || [])])].slice(0, 6);
  const textDescription = plainText(product.description || product.short_description);
  const description = sanitizeHtml(product.description || '', { allowedTags: ['p', 'br', 'strong', 'em', 'h2', 'h3', 'ul', 'ol', 'li', 'a'], allowedAttributes: { a: ['href', 'target', 'rel'] } });
  const categoryName = (product.categories?.name || 'Alcohol').replace(/\b\w/g, (letter) => letter.toUpperCase());
  const productUrl = `/product/${product.slug}`;
  const productSchema = {
    '@context': 'https://schema.org', '@type': 'Product', '@id': `${absoluteUrl(productUrl)}#product`,
    name: product.name, url: absoluteUrl(productUrl), description: textDescription, image: images,
    sku: product.sku || undefined, brand: product.brands?.name ? { '@type': 'Brand', name: product.brands.name } : undefined,
    category: categoryName,
    offers: {
      '@type': 'Offer', url: absoluteUrl(productUrl), price: Number(product.price).toFixed(2), priceCurrency: 'KES',
      availability: Number(product.stock || 0) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition', seller: { '@id': 'https://chupahub.com/#organization' },
    },
  };
  const availability = (product.product_variants || []).some((variant) => variant.stock > 0) || (!product.product_variants?.length && Number(product.stock || 0) > 0);
  return <main className="mx-auto max-w-7xl px-4 py-8">
    <JsonLd data={[productSchema, breadcrumbSchema([{ name: 'Home', url: '/' }, { name: categoryName, url: `/category/${product.categories?.slug || ''}` }, { name: product.name, url: productUrl }])]} />
    <section className="grid gap-8 rounded-3xl bg-white p-5 shadow-card md:grid-cols-2 md:p-8"><ProductGallery images={images} name={`${product.name} – ${categoryName} delivery Nairobi`} /><div><p className="font-bold uppercase tracking-wide text-brand-orange">{product.brands?.name || 'ChupaHub selection'}</p><h1 className="mt-2 text-4xl font-black text-brand-ink sm:text-5xl">{product.name}</h1><p className={`mt-3 inline-flex rounded-full px-3 py-1 text-sm font-bold ${availability ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{availability ? 'Available' : 'Out of stock'}</p><ProductPurchase product={product} /><dl className="mt-6 grid grid-cols-2 gap-3 rounded-2xl bg-brand-soft p-4 text-sm"><dt className="font-bold">ABV</dt><dd>{product.abv != null ? `${product.abv}%` : 'Not specified'}</dd><dt className="font-bold">Country</dt><dd>{product.country || 'Not specified'}</dd><dt className="font-bold">Sizes</dt><dd>{product.product_variants?.length ? 'Select a size above' : product.bottle_size || 'Not specified'}</dd><dt className="font-bold">Availability</dt><dd>{availability ? 'Available' : 'Out of stock'}</dd></dl></div></section>
    <section className="mt-8 grid gap-5 md:grid-cols-3"><article className="rounded-2xl bg-white p-6 shadow-card md:col-span-2"><h2 className="text-2xl font-black text-brand-ink">About this product</h2><div className="mt-3 leading-7 text-neutral-700" dangerouslySetInnerHTML={{ __html: description || '<p>Product details will be added soon.</p>' }} /></article><article className="rounded-2xl bg-brand-soft p-6"><h2 className="text-xl font-black text-brand-ink">Taste notes</h2><p className="mt-3 leading-7 text-neutral-700">{product.tasting_notes || 'Tasting notes will be added by the ChupaHub team.'}</p><h2 className="mt-6 text-xl font-black text-brand-ink">Pairing suggestions</h2><p className="mt-3 leading-7 text-neutral-700">{product.pairing_suggestions || 'Pairing suggestions will be added by the ChupaHub team.'}</p></article></section><ProductRail title="Customers also bought" products={related.filter((item) => item.id !== product.id).slice(0, 8)} />
  </main>;
}
