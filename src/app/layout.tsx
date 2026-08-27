import type { Metadata } from 'next';
import './globals.css';
import './storefront-fixes.css';
import { Footer, Header } from '@/components/Site';
import { CartFeedback } from '@/components/CartFeedback';
import { AgeGate } from '@/components/AgeGate';
import { getProducts, getSiteContent } from '@/lib/supabase';
import { businessGraph, DEFAULT_DESCRIPTION, JsonLd, SITE_NAME, SITE_URL } from '@/lib/seo';

const baseMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'ChupaHub | Online Wines, Spirits & Alcohol Delivery Nairobi',
    template: '%s | ChupaHub',
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    'Alcohol Delivery Nairobi',
    'Online Alcohol Delivery',
    'Drinks Delivery Kenya',
    'Liquor Delivery Nairobi',
    'Wine Delivery Nairobi',
    'Whisky Delivery Nairobi',
    'Gin Delivery Nairobi',
    'Beer Delivery Nairobi',
    'Chupa Chap alternative',
    'Oaks & Corks alternative',
    'Greenspoon alternative',
    'Quickmart alternative',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    title: 'ChupaHub | Online Wines, Spirits & Alcohol Delivery Nairobi',
    description: DEFAULT_DESCRIPTION,
    type: 'website', url: SITE_URL, siteName: SITE_NAME, locale: 'en_KE',
    images: [{ url: '/favicon.svg', alt: 'ChupaHub logo' }],
  },
  twitter: { card: 'summary', title: 'ChupaHub | Online Wines, Spirits & Alcohol Delivery Nairobi', description: DEFAULT_DESCRIPTION, images: ['/favicon.svg'] },
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml', sizes: 'any' }],
    shortcut: '/favicon.svg',
    apple: [{ url: '/favicon.svg', type: 'image/svg+xml', sizes: 'any' }],
  },
  manifest: '/site.webmanifest',
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 } },
};

export async function generateMetadata(): Promise<Metadata> {
  const content = await getSiteContent();
  return {
    ...baseMetadata,
    openGraph: { ...baseMetadata.openGraph, images: [{ url: content.logo_url || '/favicon.svg', alt: 'ChupaHub logo' }] },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [content, products] = await Promise.all([getSiteContent(), getProducts()]);
  return (
    <html lang="en">
      <head />
      <body className="app-shell min-h-screen">
        <AgeGate />
        <Header content={content} products={products} />
        <CartFeedback />
        <JsonLd data={businessGraph([content.instagram_url || '', content.facebook_url || '', content.tiktok_url || ''], content.logo_url || '/favicon.svg')} />
        {children}
        <Footer content={content} products={products} />
      </body>
    </html>
  );
}
