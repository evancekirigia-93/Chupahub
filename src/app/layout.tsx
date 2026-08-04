import type { Metadata } from 'next';
import './globals.css';
import { Footer, Header } from '@/components/Site';
import { CartFeedback } from '@/components/CartFeedback';
import { getProducts, getSiteContent } from '@/lib/supabase';
import { businessGraph, DEFAULT_DESCRIPTION, JsonLd, SITE_NAME, SITE_URL } from '@/lib/seo';

const baseMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Alcohol Delivery Nairobi | ChupaHub',
    template: '%s | ChupaHub',
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: ['Alcohol Delivery Nairobi', 'Wine Delivery Nairobi', 'Whisky Delivery Nairobi', 'Liquor Delivery Nairobi', 'Gin Delivery Nairobi', 'Beer Delivery Nairobi'],
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Alcohol Delivery Nairobi | ChupaHub',
    description: DEFAULT_DESCRIPTION,
    type: 'website', url: SITE_URL, siteName: SITE_NAME, locale: 'en_KE',
  },
  twitter: { card: 'summary', title: 'Alcohol Delivery Nairobi | ChupaHub', description: DEFAULT_DESCRIPTION },
  icons: { icon: '/chupahub-icon.svg', shortcut: '/chupahub-icon.svg', apple: '/chupahub-icon.svg' },
  manifest: '/site.webmanifest',
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 } },
};

export async function generateMetadata(): Promise<Metadata> {
  const content = await getSiteContent();
  return {
    ...baseMetadata,
    ...(content.logo_url ? { openGraph: { ...baseMetadata.openGraph, images: [{ url: content.logo_url, alt: 'ChupaHub' }] } } : {}),
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [content, products] = await Promise.all([getSiteContent(), getProducts()]);
  return (
    <html lang="en">
      <head />
      <body className="app-shell min-h-screen">
        <Header content={content} products={products} />
        <CartFeedback />
        <JsonLd data={businessGraph([content.instagram_url || '', content.facebook_url || '', content.tiktok_url || ''], content.logo_url)} />
        {children}
        <Footer content={content} products={products} />
      </body>
    </html>
  );
}
