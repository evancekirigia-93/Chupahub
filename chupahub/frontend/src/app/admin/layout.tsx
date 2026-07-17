import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Commerce Administration',
  description: 'Secure ChupaHub catalog, inventory, order and promotion administration.',
  alternates: { canonical: '/admin' },
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) { return children; }
