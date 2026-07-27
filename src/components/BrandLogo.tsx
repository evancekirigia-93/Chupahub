const LOGO_SRC = '/chupahub-official-logo.svg';

export function BrandLogo({ footer = false }: { footer?: boolean }) {
  return (
    <div className="flex shrink-0 items-center text-left">
      <img
        src={LOGO_SRC}
        alt="ChupaHub"
        className={footer ? 'h-24 w-40 object-contain' : 'h-16 w-28 object-contain sm:h-20 sm:w-36'}
      />
    </div>
  );
}
