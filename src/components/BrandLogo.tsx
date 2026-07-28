import Image from 'next/image';

export function BrandLogo({ footer = false, logoUrl }: { footer?: boolean; logoUrl?: string }) {
  return (
    <div className="flex shrink-0 items-center gap-0" aria-label="ChupaHub">
      {logoUrl ? <Image src={logoUrl} alt="" aria-hidden="true" width={60} height={80} priority={!footer} unoptimized className={footer ? 'mr-1 h-12 w-auto object-contain' : '-mr-1 h-11 w-auto object-contain sm:-mr-2 sm:h-14'} /> : <span aria-hidden="true" className={footer ? 'block h-12 w-9' : 'block h-11 w-8 sm:h-14 sm:w-10'} />}
      <span className={`translate-y-1 whitespace-nowrap font-black tracking-tight ${footer ? 'text-2xl' : 'text-xl sm:text-2xl'}`}>
        <span className="text-white">Chupa</span><span className="text-brand-ink">Hub</span>
      </span>
    </div>
  );
}
