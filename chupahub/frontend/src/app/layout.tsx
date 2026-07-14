import type { Metadata } from 'next';
import './globals.css';
import { Footer, Header } from '@/components/Site';

export const metadata: Metadata = {
  metadataBase: new URL('https://chupahub.com'),
  title: {
    default: 'ChupaHub | Fast Liquor Delivery Kenya',
    template: '%s | ChupaHub',
  },
  description: 'Orange-and-white liquor marketplace with instant search, M-Pesa checkout, loyalty points, WhatsApp ordering and live Nairobi delivery tracking.',
  openGraph: {
    title: 'ChupaHub',
    description: 'Fast orange-and-white liquor marketplace for Nairobi delivery.',
    type: 'website',
  },
  robots: 'index, follow',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="app-shell min-h-screen">
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
