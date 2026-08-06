export const SITE_URL = 'https://chupahub.com';
export const SITE_NAME = 'Chupa Hub';
export const DEFAULT_DESCRIPTION = 'Order wine, whisky, gin, vodka, beer and premium alcohol online with fast alcohol delivery across Nairobi, Kenya.';

export function absoluteUrl(path = '/') {
  return new URL(path, SITE_URL).toString();
}

export function plainText(value?: string | null) {
  return (value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function truncate(value: string, length = 158) {
  return value.length <= length ? value : `${value.slice(0, length - 1).trimEnd()}…`;
}

export function JsonLd({ data }: { data: Record<string, unknown> | Array<Record<string, unknown>> }) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

export function businessGraph(socialLinks: string[] = [], logoUrl?: string) {
  const searchLogo = logoUrl || absoluteUrl('/chupahub-icon.svg');
  return {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      description: DEFAULT_DESCRIPTION,
      logo: { '@type': 'ImageObject', url: searchLogo, width: 256, height: 256 },
      image: searchLogo,
      sameAs: socialLinks.filter(Boolean),
    },
    {
      '@type': ['LocalBusiness', 'LiquorStore'],
      '@id': `${SITE_URL}/#localbusiness`,
      name: SITE_NAME,
      url: SITE_URL,
      description: 'Fast wine, whisky and alcohol delivery in Nairobi.',
      areaServed: { '@type': 'City', name: 'Nairobi' },
      currenciesAccepted: 'KES',
      paymentAccepted: 'M-Pesa, Visa, Mastercard, Cash',
      parentOrganization: { '@id': `${SITE_URL}/#organization` },
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      publisher: { '@id': `${SITE_URL}/#organization` },
      inLanguage: 'en-KE',
      potentialAction: {
        '@type': 'SearchAction',
        target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/search?q={search_term_string}` },
        'query-input': 'required name=search_term_string',
      },
    },
  ],
  };
}

export function breadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem', position: index + 1, name: item.name, item: absoluteUrl(item.url),
    })),
  };
}
