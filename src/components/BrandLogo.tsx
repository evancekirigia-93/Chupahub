const LOGO_SRC = '/chupahub-logo.svg';

export function BrandLogo({ footer = false }: { footer?: boolean }) {
  return (
    <div className={footer
      ? 'relative h-16 w-[180px] shrink-0 overflow-hidden'
      : 'relative h-12 w-[120px] shrink-0 overflow-hidden sm:h-16 sm:w-[180px]'}>
      <img
        src={LOGO_SRC}
        alt="ChupaHub logo"
        className="h-full w-full object-contain object-left"
      />
    </div>
  );
}
