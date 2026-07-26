'use client';

import { useEffect, useState } from 'react';

const FALLBACK_LOGO = '/chupahub-logo.svg';

function SafeLogoImage({ src, siteName }: { src?: string; siteName: string }) {
  const [resolvedSrc, setResolvedSrc] = useState(src || FALLBACK_LOGO);

  useEffect(() => setResolvedSrc(src || FALLBACK_LOGO), [src]);

  return <img
    src={resolvedSrc}
    alt={`${siteName} logo`}
    onError={() => setResolvedSrc(FALLBACK_LOGO)}
    className="h-full w-full object-contain object-left"
  />;
}

export function BrandLogo({ logoUrl, mobileLogoUrl, siteName, footer = false }: {
  logoUrl?: string;
  mobileLogoUrl?: string;
  siteName: string;
  footer?: boolean;
}) {
  if (footer) return <div className="relative h-16 w-[180px] shrink-0 overflow-hidden">
    <SafeLogoImage src={logoUrl} siteName={siteName} />
  </div>;

  return <>
    <div className="relative hidden h-16 w-[180px] shrink-0 overflow-hidden sm:block">
      <SafeLogoImage src={logoUrl} siteName={siteName} />
    </div>
    <div className="relative h-12 w-[120px] shrink-0 overflow-hidden sm:hidden">
      <SafeLogoImage src={mobileLogoUrl || logoUrl} siteName={siteName} />
    </div>
  </>;
}
