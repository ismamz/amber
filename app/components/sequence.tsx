import gsap from "gsap";
import { usePageTransition, type PageAnimationData } from "hyperkinetic";
import { useRef } from "react";

import { cascade } from "@/lib/reveal";
import { cn } from "@/lib/utils";

import { Genome } from "./genome";
import { Line } from "./line";

const sequences = [
  "A C G T T A C G",
  "T G C A A G T C",
  "C A G T G C A T",
  "G T A C C T G A",
  "A C G T T A C G",
  "C G A T A C T G",
  "T A C G G T A C",
  "G C T A C A G T",
  "A T G C C G A T",
  "C T A G G A T C",
  "G A T C A C T G",
  "T C G A G T A C",
];

export function Sequence({ model }: { model: number }) {
  const scope = useRef<HTMLDivElement>(null);

  const animateRows = (
    tl: gsap.core.Timeline,
    { position, reduced }: PageAnimationData,
    entering: boolean,
  ) => {
    tl.to(
      "[data-sequence-title]",
      {
        autoAlpha: entering ? 1 : 0,
        duration: reduced ? 0 : entering ? 0.65 : 0.3,
        ease: entering ? "im-quart-inout" : "im-quint-inout",
        ...(entering ? { clearProps: "opacity,visibility" } : {}),
      },
      position,
    );
    const rows = gsap.utils.toArray<HTMLElement>("[data-sequence-row]");
    rows.forEach((row, index) => {
      const { start, ...timing } = cascade(position, index, rows.length, entering, reduced);
      tl.to(
        row,
        {
          autoAlpha: entering ? 1 : 0,
          ...timing,
          ...(entering ? { clearProps: "opacity,visibility" } : {}),
        },
        start,
      );
      tl.to(
        row.querySelectorAll("[data-sequence-line]"),
        {
          scaleX: entering ? 1 : 0,
          transformOrigin: "left center",
          ...timing,
          ...(entering ? { clearProps: "transform,transformOrigin" } : {}),
        },
        start,
      );
    });
  };

  usePageTransition({
    scope,
    enterAt: "entrance-start",
    prepare: () => {
      gsap.set("[data-sequence-title], [data-sequence-row]", { autoAlpha: 0 });
      gsap.set("[data-sequence-line]", {
        scaleX: 0,
        transformOrigin: "left center",
      });
    },
    leave: (tl, data) => animateRows(tl, data, false),
    enter: (tl, data) => animateRows(tl, data, true),
  });

  return (
    <div className="grid min-h-0 flex-1 grid-cols-[1.25fr_1fr] gap-4 pt-5 sm:gap-7">
      <Genome model={model} />
      <div ref={scope} className="flex min-h-0 min-w-0 flex-col">
        <p className="relative pb-2 font-display text-[9px]">
          <span data-sequence-title="">Nucleotide sequence</span>
          <Line index={4} total={5} className="absolute inset-x-0 bottom-0 border-b" />
        </p>
        <table className="mt-2 min-h-0 w-full flex-1 table-fixed border-collapse text-[10px] xl:text-[11px]">
          <tbody>
            {sequences.map((sequence, index) => (
              <tr
                data-sequence-row=""
                key={`${sequence}-${index}`}
                className={cn(
                  "relative",
                  index === 4 && "bg-black text-white",
                  index >= 10 && "lg:[@media(max-height:46.875rem)]:hidden",
                  index >= 8 && "lg:[@media(max-height:43.75rem)]:hidden",
                  index >= 6 && "lg:[@media(max-height:40.625rem)]:hidden",
                )}
              >
                <td className="w-[18%] px-1 text-left">
                  {311 + index}
                  <span
                    data-sequence-line=""
                    aria-hidden="true"
                    className={cn(
                      "absolute inset-x-0 bottom-0 border-b",
                      index === 4 ? "border-black" : "border-steel/40",
                    )}
                  />
                </td>
                {sequence.split(" ").map((base, baseIndex) => (
                  <td key={`${base}-${baseIndex}`} className="px-0 text-center">
                    {base}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
