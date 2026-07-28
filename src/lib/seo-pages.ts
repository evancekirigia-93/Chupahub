import type { Metadata } from 'next';
import { absoluteUrl } from '@/lib/seo';

export type SeoPage = { title: string; heading: string; description: string; path: string; categorySlug?: string; offers?: boolean };

export const shopLinks = [
  ['Shop', '/shop'], ['Beer', '/beer'], ['Wine', '/wine'], ['Whisky', '/whisky'], ['Gin', '/gin'], ['Vodka', '/vodka'], ['Champagne', '/champagne'], ['Spirits', '/spirits'], ['Mixers', '/mixers'], ['Offers', '/offers'],
] as const;

export const seoPages: Record<string, SeoPage> = {
  shop: { title: 'Shop Alcohol Online in Nairobi', heading: 'Shop ChupaHub', description: 'Shop wine, whisky, beer, gin, vodka, champagne, spirits and mixers online with fast delivery across Nairobi.', path: '/shop' },
  beer: { title: 'Beer Delivery Nairobi – Shop Beer Online', heading: 'Beer Delivery Nairobi', description: 'Shop local and imported beer online from ChupaHub with convenient delivery across Nairobi.', path: '/beer', categorySlug: 'beer' },
  wine: { title: 'Wine Delivery Nairobi – Shop Wine Online', heading: 'Wine Delivery Nairobi', description: 'Browse red, white, rosé and sparkling wine online for fast, responsible delivery across Nairobi.', path: '/wine', categorySlug: 'wine' },
  whisky: { title: 'Whisky Delivery Nairobi – Shop Whisky Online', heading: 'Whisky Delivery Nairobi', description: 'Shop Scotch, bourbon and world whisky online from ChupaHub with delivery across Nairobi.', path: '/whisky', categorySlug: 'whisky' },
  gin: { title: 'Gin Delivery Nairobi – Shop Gin Online', heading: 'Gin Delivery Nairobi', description: 'Discover classic and premium gin online with mixers and convenient delivery across Nairobi.', path: '/gin', categorySlug: 'gin' },
  vodka: { title: 'Vodka Delivery Nairobi – Shop Vodka Online', heading: 'Vodka Delivery Nairobi', description: 'Shop popular and premium vodka online from ChupaHub with fast Nairobi delivery.', path: '/vodka', categorySlug: 'vodka' },
  champagne: { title: 'Champagne Delivery Nairobi – Shop Online', heading: 'Champagne Delivery Nairobi', description: 'Browse champagne and sparkling wine for celebrations, gifts and delivery across Nairobi.', path: '/champagne', categorySlug: 'sparkling' },
  spirits: { title: 'Spirits Delivery Nairobi – Shop Spirits Online', heading: 'Spirits Delivery Nairobi', description: 'Explore brandy, cognac, tequila, rum, liqueurs and premium spirits delivered across Nairobi.', path: '/spirits', categorySlug: 'spirits' },
  mixers: { title: 'Mixers Delivery Nairobi – Soft Drinks & Mixers', heading: 'Mixers Delivery Nairobi', description: 'Shop tonic, soda, juice, water and cocktail mixers online for delivery across Nairobi.', path: '/mixers', categorySlug: 'mixers' },
  offers: { title: 'Alcohol Offers Nairobi – Discounted Drinks', heading: 'ChupaHub Offers', description: 'Browse currently discounted wine, beer, whisky, spirits and mixers available from ChupaHub.', path: '/offers', offers: true },
};

export function pageMetadata(page: SeoPage): Metadata {
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: page.path },
    openGraph: { title: `${page.title} | ChupaHub`, description: page.description, url: page.path, type: 'website' },
    twitter: { card: 'summary', title: `${page.title} | ChupaHub`, description: page.description },
  };
}

export function collectionSchema(page: SeoPage, itemCount: number) {
  return { '@context': 'https://schema.org', '@type': 'CollectionPage', name: page.heading, description: page.description, url: absoluteUrl(page.path), numberOfItems: itemCount, isPartOf: { '@id': `${absoluteUrl('/')}#website` } };
}
