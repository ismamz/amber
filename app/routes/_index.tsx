import { useRef } from "react";
import { Link } from "react-router";

import { Footer } from "@/components/footer";
import { Indicator } from "@/components/indicator";
import { Mask } from "@/components/mask";
import { useArchive } from "@/lib/archive";
import { animateCaption } from "@/lib/reveal";
import { specimens } from "@/lib/specimens";
import { pad } from "@/lib/utils";
import { usePageTransition, type PageAnimationData } from "@/transitions";

export function meta() {
  return [
    { title: "Amber Genetics — Specimen archive" },
    {
      name: "description",
      content: "Amber Genetics. Restricted archive of experimental dinosaur specimens.",
    },
  ];
}

export default function Home() {
  const caption = useRef<HTMLElement>(null);
  const { active, goTo } = useArchive();
  const specimen = specimens[active];

  const animate = (
    tl: gsap.core.Timeline,
    { position, reduced }: PageAnimationData,
    entering: boolean,
  ) => {
    if (!caption.current) return;
    animateCaption(tl, caption.current, entering, position, reduced);
  };

  usePageTransition({
    scope: caption,
    enterAt: "title-start",
    leave: (tl, data) => animate(tl, data, false),
    enter: (tl, data) => animate(tl, data, true),
  });

  return (
    <main className="pointer-events-none relative z-30 container h-svh min-h-130 py-6 sm:py-8">
      <nav aria-label="Specimens">
        {specimens.map((item) => (
          <Link
            key={item.slug}
            to={`/specimens/${item.slug}`}
            className="pointer-events-auto sr-only bg-foreground px-3 py-2 font-display text-xs text-background focus-visible:not-sr-only focus-visible:absolute focus-visible:top-24 focus-visible:left-1/2 focus-visible:-translate-x-1/2"
          >
            Open {item.species}, {item.code}
          </Link>
        ))}
      </nav>

      {/* scene.tsx and reveal.ts select [data-caption] and [data-caption-details]. */}
      <section
        ref={caption}
        data-caption=""
        className="absolute inset-x-4 bottom-[10%] text-center opacity-0"
        aria-label="Specimen archive"
        aria-roledescription="carousel"
        aria-live="polite"
        aria-atomic="true"
      >
        <div>
          <Mask
            as="h1"
            className="inline-block text-[clamp(2rem,5.6vw,5.5rem)]"
            textClassName="-mr-[0.0996em] -translate-y-[0.025em]"
          >
            {specimen.code}
          </Mask>
          <p
            data-caption-details=""
            className="mt-3 font-display text-[clamp(0.85rem,1.7vw,1.6rem)]"
          >
            {specimen.species} / {specimen.line}
          </p>
          <p
            data-caption-details=""
            className="mt-3 text-[9px] tracking-[0.2em] text-muted sm:text-[10px]"
          >
            Specimen {pad(active + 1)} / {pad(specimens.length)} — {specimen.summary}
          </p>
        </div>
        <div data-caption-details="" className="mt-4 flex justify-center sm:mt-5">
          <Indicator active={active} goTo={goTo} />
        </div>
      </section>

      <Footer />
    </main>
  );
}
