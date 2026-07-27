const LOGO_SRC = '/chupahub-official-logo.svg';

export function BrandLogo({ footer = false }: { footer?: boolean }) {
  return (
    <div
      className={`relative shrink-0 overflow-hidden ${footer ? 'h-24 w-32' : 'h-16 w-24 sm:h-20 sm:w-28'}`}
      aria-label="ChupaHub"
    >
      <img
        src={LOGO_SRC}
        alt=""
        aria-hidden="true"
        className={`absolute left-1/2 max-w-none -translate-x-1/2 mix-blend-darken ${footer ? 'top-[36%] w-[36rem] -translate-y-[36%]' : 'top-[36%] w-[28rem] -translate-y-[36%] sm:w-[32rem]'}`}
      />
    </div>
  );
}
