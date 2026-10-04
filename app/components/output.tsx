import gsap from "gsap";
import { usePageTransition, type PageAnimationData } from "hyperkinetic";
import { useRef } from "react";

import { useTypewriter } from "@/lib/typewriter";
import { cn } from "@/lib/utils";

import { ChromatogramIcon } from "./icons/chromatogram";

const bases = ["A", "C", "G", "T", "A", "A", "T", "C", "G", "A", "T"];
const primary = [22, 14, 31, 17, 28, 24, 19, 11, 23, 16, 10];
const secondary = [45, 38, 50, 43, 47, 40, 51, 42, 46, 39];

export function Output({ profile }: { profile: number }) {
  const active = [4, 2, 6, 7, 8][profile];
  const scope = useRef<HTMLDivElement>(null);
  const caption = useRef<HTMLParagraphElement>(null);
  useTypewriter(caption);

  const animate = (
    tl: gsap.core.Timeline,
    { position, reduced }: PageAnimationData,
    entering: boolean,
  ) => {
    tl.to(
      scope.current,
      {
        autoAlpha: entering ? 1 : 0,
        duration: reduced ? 0 : entering ? 0.15 : 0.35,
        ease: entering ? "im-quart-inout" : "im-quint-inout",
        ...(entering ? { clearProps: "opacity,visibility" } : {}),
      },
      position,
    );
    tl.to(
      "[data-chromatogram]",
      {
        clipPath: entering ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)",
        duration: reduced ? 0 : entering ? 0.68 : 0.35,
        ease: entering ? "im-quart-inout" : "im-quint-inout",
      },
      position,
    );
  };

  usePageTransition({
    scope,
    enterAt: "entrance-start",
    prepare: () => {
      gsap.set(scope.current, { autoAlpha: 0 });
      gsap.set("[data-chromatogram]", { clipPath: "inset(0 100% 0 0)" });
    },
    leave: (tl, data) => animate(tl, data, false),
    enter: (tl, data) => {
      // The archive title crosses the graph: wait until its exit finishes.
      const position =
        !data.initial && data.current.pathname === "/" ? tl.labels["title-start"] : data.position;
      animate(tl, { ...data, position }, true);
    },
  });

  return (
    <section>
      <div className="mb-2 flex items-end justify-between text-[10px]">
        <h3 className="font-display">Sequencing output</h3>
        <p ref={caption} className="font-mono">
          Base pairs 311 — 331
        </p>
      </div>
      <div className="relative">
        <div ref={scope} className="relative h-18 overflow-hidden border">
          <span
            aria-hidden="true"
            className="absolute inset-y-0 bg-steel/25"
            style={{
              left: `${(active / bases.length) * 100}%`,
              width: `${100 / bases.length}%`,
            }}
          />
          <ChromatogramIcon
            data-chromatogram=""
            primary={primary}
            secondary={secondary}
            className="absolute inset-0 size-full"
          />
        </div>
        <div className="grid h-6 grid-cols-11">
          {bases.map((base, index) => (
            <div
              key={`${base}-${index}`}
              className={cn(
                "grid place-items-center text-[8px]",
                index === active && "bg-black text-white",
              )}
            >
              {base}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
