const LOGO_SRC = '/chupahub-official-logo.svg';

export function BrandLogo({ footer = false }: { footer?: boolean }) {
  return (
    <div className={`flex shrink-0 items-center ${footer ? 'gap-3' : 'gap-2 sm:gap-3'}`} aria-label="ChupaHub">
      <img
        src={LOGO_SRC}
        alt=""
        aria-hidden="true"
        className={`absolute left-1/2 max-w-none -translate-x-1/2 mix-blend-darken ${footer ? 'top-[36%] w-[36rem] -translate-y-[36%]' : 'top-[36%] w-[28rem] -translate-y-[36%] sm:w-[32rem]'}`}
      />
      <span className={`whitespace-nowrap font-black tracking-tight ${footer ? 'text-2xl' : 'text-xl sm:text-2xl'}`}>
        <span className="text-white">Chupa</span><span className="text-brand-ink">Hub</span>
      </span>
    </div>
  );
}
