import Link from 'next/link';
import { deliveryGuides } from '@/lib/delivery-guides';
import { absoluteUrl, JsonLd } from '@/lib/seo';

export function DeliveryGuide({ path }: { path: string }) {
  const guide = deliveryGuides[path];
  if (!guide) return null;
  return <section aria-label={guide.heading} className="mx-auto max-w-7xl px-4 py-8">
    <JsonLd data={{
      '@context': 'https://schema.org', '@type': 'FAQPage', '@id': `${absoluteUrl(path)}#questions`,
      mainEntity: guide.questions.map(({ question, answer }) => ({ '@type': 'Question', name: question, acceptedAnswer: { '@type': 'Answer', text: answer } })),
    }} />
    <h2 className="text-2xl font-black text-brand-ink">{guide.heading}</h2>
    <p className="mt-3 max-w-3xl leading-7 text-neutral-700">{guide.intro}</p>
    <div className="mt-5 space-y-4">{guide.questions.map(({ question, answer }) => <div key={question}>
      <h3 className="font-bold text-brand-ink">{question}</h3>
      <p className="mt-1 max-w-3xl leading-7 text-neutral-700">{answer}</p>
    </div>)}</div>
    <nav aria-label="Drinks and delivery guides" className="mt-5 flex flex-wrap gap-4 font-bold text-brand-orange">
      {([['Alcohol delivery Nairobi', '/alcohol-delivery-nairobi'], ['Whisky & whiskey', '/whisky'], ['Tequila', '/tequila'], ['Beer', '/beer'], ['Wine', '/wine'], ['Delivery questions', '/faq'], ['Contact customer care', '/contact']] as const).filter(([, href]) => href !== path).map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
    </nav>
  </section>;
}
