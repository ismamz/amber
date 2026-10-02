import { useGSAP } from "@gsap/react";
import { useEnterReady } from "@ismamz/hyperkinetic";
import gsap from "gsap";
import { useRef } from "react";

import { cn } from "@/lib/utils";

import { ChromatogramIcon } from "./icons/chromatogram";

const bases = ["A", "C", "G", "T", "A", "A", "T", "C", "G", "A", "T"];
const active = 5;
const primary = [22, 14, 31, 17, 28, 24, 19, 11, 23, 16, 10];
const secondary = [45, 38, 50, 43, 47, 40, 51, 42, 46, 39];

export function Output() {
  const ref = useRef<HTMLElement>(null);
  const animated = useRef(false);
  const ready = useEnterReady();

  useGSAP(
    () => {
      if (!ready || animated.current) return;
      animated.current = true;
      gsap
        .matchMedia(ref.current!)
        // GSAP only runs the callback while some condition matches, hence `motion`.
        .add(
          {
            reduced: "(prefers-reduced-motion: reduce)",
            motion: "(prefers-reduced-motion: no-preference)",
          },
          ({ conditions }) => {
            const reduced = conditions!.reduced;
            gsap.to("[data-chromatogram]", {
              strokeDashoffset: 0,
              duration: reduced ? 0 : 1.25,
              stagger: reduced ? 0 : 0.025,
              ease: "power2.inOut",
            });
          },
        );
    },
    { scope: ref, dependencies: [ready] },
  );

  return (
    <section ref={ref}>
      <div className="mb-2 flex items-end justify-between text-[10px]">
        <h3 className="font-display">Sequencing output</h3>
        <p className="font-mono">Base pairs 311 — 331</p>
      </div>
      <div className="relative">
        <div className="relative h-18 overflow-hidden border">
          <span
            aria-hidden="true"
            className="absolute inset-y-0 bg-steel/25"
            style={{
              left: `${(active / bases.length) * 100}%`,
              width: `${100 / bases.length}%`,
            }}
          />
          <ChromatogramIcon
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
