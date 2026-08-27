import Link from 'next/link';
import type { Metadata } from 'next';
import { CategoryGrid, Journal, ProductRail, SeoArticle } from '@/components/Site';
import { HeroCarousel } from '@/components/HeroCarousel';
import { getBanners, getCategories, getHomepageSections, getProducts, getPromotions, getSiteContent, money } from '@/lib/supabase';
import { stableCollectionSlug } from '@/lib/public-urls';
import { DEFAULT_DESCRIPTION } from '@/lib/seo';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const metadata: Metadata = {
  title: { absolute: 'ChupaHub | Online Wines, Spirits & Alcohol Delivery Nairobi' },
  description: DEFAULT_DESCRIPTION,
  alternates: { canonical: 'https://chupahub.com/' },
  openGraph: { title: 'ChupaHub | Online Wines, Spirits & Alcohol Delivery Nairobi', description: DEFAULT_DESCRIPTION, url: 'https://chupahub.com/', siteName: 'ChupaHub', type: 'website', images: [{ url: '/chupahub-logo.svg', alt: 'ChupaHub logo' }] },
  twitter: { card: 'summary', title: 'ChupaHub | Online Wines, Spirits & Alcohol Delivery Nairobi', description: DEFAULT_DESCRIPTION, images: ['/chupahub-logo.svg'] },
};

export default async function Home() {
  const [categories, banners, products, promotions, content, configuredSections] = await Promise.all([
    getCategories(), getBanners(), getProducts(), getPromotions(), getSiteContent(), getHomepageSections(),
  ]);
  const topSellers = products.filter((product) => product.is_top_seller);
  const arrivals = products.filter((product) => product.is_new_arrival).sort((a, b) => Date.parse(b.updated_at || '') - Date.parse(a.updated_at || ''));
  const featured = products.filter((product) => product.is_featured);
  const sections = (configuredSections.length ? configuredSections.map(section => {
    const heading = section.heading.toLowerCase();
    const selected = section.product_ids?.length
      ? section.product_ids.map(id => products.find(product => product.id === id)).filter((product): product is typeof products[number] => Boolean(product))
      : heading.includes('new arrival') ? arrivals
      : heading.includes('deal') || heading.includes('featured') || heading.includes('offer') ? featured
      : section.use_best_sellers || heading.includes('top seller') || heading.includes('best seller') ? topSellers
      : section.category_id ? products.filter(product => product.categories?.slug === section.categories?.slug)
      : products;
    return { title: section.heading, products: selected, href: `/collections/${stableCollectionSlug(section) || 'featured'}`, limit: section.item_limit };
  }) : [{ title: 'Top Deals', products: featured, href: '/collections/featured', limit: 8 }, { title: 'Top Sellers', products: topSellers, href: '/collections/top-sellers', limit: 8 }, { title: 'New Arrivals', products: arrivals, href: '/collections/new-arrivals', limit: 8 }]).sort((a, b) => sectionPriority(a.title) - sectionPriority(b.title));
  const promotionHref = (promotion: typeof promotions[number]) => promotion.button_url || '/offers';

  const rootCategories = categories.filter((category) => !category.parent_id && category.slug.toLowerCase() !== 'snacks');
  const partyOffer = promotions.find((promotion) => {
    const text = `${promotion.title || ''} ${promotion.description || ''} ${promotion.badge_text || ''}`.toLowerCase();
    return text.includes('party');
  }) || promotions[0];
  const remainingPromotions = partyOffer ? promotions.filter((promotion) => promotion.id !== partyOffer.id) : promotions;

  return <main className="storefront-home">
    <section className={`hero-shopping-layout mx-auto${partyOffer ? ' has-party-offer' : ''}`}>
      <CategoryGrid categories={rootCategories} />
      <HeroCarousel banners={banners} />
      {partyOffer && <Link href={promotionHref(partyOffer)} className="party-offer-panel orange-gradient text-white shadow-orange">
        <div className="party-offer-copy">
          <p className="party-offer-badge">{partyOffer.badge_text || partyOffer.code || 'Party Offer'}</p>
          <h2>{partyOffer.title}</h2>
          {partyOffer.description && <p className="party-offer-description">{partyOffer.description}</p>}
        </div>
        <div className="party-offer-value">{partyOffer.discount_type === 'percent' ? `${partyOffer.discount_value}%` : money(partyOffer.discount_value)}</div>
        <span className="party-offer-cta">View offer</span>
      </Link>}
    </section>
    {remainingPromotions.length > 0 && <section className="promotion-grid mx-auto grid gap-3 px-3 pt-5 sm:px-5 md:grid-cols-2">
      {remainingPromotions.map((promotion) => <Link key={promotion.id} href={promotionHref(promotion)} className="orange-gradient flex items-center justify-between rounded-2xl p-5 text-white shadow-orange">
        <div><p className="text-xs font-black uppercase tracking-widest">{promotion.badge_text || promotion.code || 'Promotion'}</p><h2 className="text-2xl font-black">{promotion.title}</h2><p className="mt-1 text-sm text-white/85">{promotion.description}</p></div>
        <div className="ml-4 shrink-0 rounded-full bg-white px-4 py-3 text-center font-black text-brand-deep">{promotion.discount_type === 'percent' ? `${promotion.discount_value}%` : money(promotion.discount_value)}</div>
      </Link>)}
    </section>}
    {sections.map((section, index) => <ProductRail key={`${section.title}-${index}`} {...section} />)}
    <Journal content={content} />
    <SeoArticle content={content} />
  </main>;
}

function sectionPriority(title: string) {
  const normalized = title.toLowerCase();
  if (normalized.includes('new arrival')) return 100;
  if (normalized.includes('top deal') || normalized.includes('featured') || normalized.includes('offer')) return 0;
  if (normalized.includes('top seller') || normalized.includes('best seller')) return 10;
  return 50;
}
