import type { Metadata } from 'next';
import './globals.css';
import { Footer, Header } from '@/components/Site';
import { getProducts, getSiteContent } from '@/lib/supabase';
import { businessGraph, DEFAULT_DESCRIPTION, JsonLd, SITE_NAME, SITE_URL } from '@/lib/seo';

export const metadata: Metadata = {
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
  icons: { icon: [{ url: '/chupahub-logo.svg', type: 'image/svg+xml' }], apple: [{ url: '/chupahub-logo.svg', type: 'image/svg+xml' }], shortcut: ['/chupahub-logo.svg'] },
  manifest: '/site.webmanifest',
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 } },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [content, products] = await Promise.all([getSiteContent(), getProducts()]);
  return (
    <html lang="en">
      <body className="app-shell min-h-screen">
        <Header content={content} products={products} />
        <JsonLd data={businessGraph([content.instagram_url || '', content.facebook_url || '', content.tiktok_url || ''])} />
        {children}
        <Footer content={content} />
      </body>
    </html>
  );
}
