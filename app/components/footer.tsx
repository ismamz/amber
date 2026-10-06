export function Footer() {
  return (
    <footer className="absolute inset-x-[2.5%] bottom-5 flex items-end justify-between gap-4 text-[8px] leading-tight tracking-wider text-muted sm:bottom-6 sm:text-[10px]">
      <div>
        <p>Amber Genetics ® / Research division</p>
        <div className="mt-1 flex gap-6">
          <Link href="/credits.txt">Credits</Link>
          <Link href="https://www.rudyvessup.com/jurassic-world-hidden-lab-ui">
            Design inspiration
          </Link>
          <p>
            Design & code by <Link href="https://isma.uy">isma</Link>
          </p>
        </div>
      </div>
      <p className="text-right">
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
