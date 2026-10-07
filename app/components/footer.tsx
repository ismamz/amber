export function Footer() {
  return (
    <footer className="absolute inset-x-[2.5%] bottom-[calc(1rem+env(safe-area-inset-bottom))] flex items-end justify-between gap-4 text-[10px] leading-tight tracking-wider text-muted sm:bottom-6">
      <div className="w-full sm:w-auto">
        <p className="hidden sm:block">Amber Genetics ® / Research division</p>
        <div className="flex items-center justify-between gap-4 sm:mt-1 sm:justify-start sm:gap-6">
          <Link href="/credits.txt">Credits</Link>
          <span className="hidden sm:inline">
            <Link href="https://www.rudyvessup.com/jurassic-world-hidden-lab-ui">
              Design inspiration
            </Link>
          </span>
          <p className="whitespace-nowrap">
            Design & code by <Link href="https://isma.uy">isma</Link>
          </p>
        </div>
      </div>
      <p className="hidden text-right sm:block">
        <span className="block text-black">Scroll / drag / ← →</span>
        <span className="mt-1 hidden sm:block">
          Vite + React Router + Tailwind CSS + React Three Fiber + GSAP +{" "}
          <Link href="https://github.com/ismamz/hyperkinetic">Hyperkinetic</Link>
        </span>
      </p>
    </footer>
  );
}

function Link({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      className="pointer-events-auto underline decoration-silver underline-offset-3 hover:text-black hover:decoration-black focus-visible:outline-2 focus-visible:outline-offset-4"
      href={href}
      target="_blank"
      rel="noreferrer"
    >
      {children} <span aria-hidden="true">↗</span>
    </a>
  );
}
