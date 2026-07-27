const LOGO_SRC = '/chupahub-logo.svg';

export function BrandLogo({ footer = false }: { footer?: boolean }) {
  return (
    <div className={`flex shrink-0 items-center ${footer ? 'gap-3' : 'gap-2 sm:gap-3'}`} aria-label="ChupaHub">
      <img
        src={LOGO_SRC}
        alt=""
        aria-hidden="true"
        className={footer ? 'h-16 w-10 object-contain' : 'h-12 w-8 object-contain sm:h-14 sm:w-9'}
      />
      <span className={`whitespace-nowrap font-black tracking-tight ${footer ? 'text-2xl' : 'text-xl sm:text-2xl'}`}>
        <span className="text-white">Chupa</span><span className="text-brand-ink">Hub</span>
      </span>
    </div>
  );
}
