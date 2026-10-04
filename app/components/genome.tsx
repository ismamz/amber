import gsap from "gsap";
import { usePageTransition, type PageAnimationData } from "hyperkinetic";
import { useRef } from "react";

import { cascade } from "@/lib/reveal";
import { pad } from "@/lib/utils";

import { Line } from "./line";

const locusSets = [
  ["Regulatory", "Hybrid splice", "Horn morph"],
  ["Cortex gate", "Synapse map", "Talon morph"],
  ["Osteoderm", "Plate array", "Thagomizer"],
  ["Cervical axis", "Pneumatic map", "Growth lattice"],
  ["Predator gate", "Maxilla array", "Olfactory map"],
];

function GenomeBar({ column }: { column: number }) {
  return (
    <div className="relative z-10 mx-auto grid h-full min-h-0 w-full max-w-5 grid-rows-30 gap-px bg-white/70">
      {Array.from({ length: 30 }, (_, row) => {
        const code = (row * 7 + column * 11) % 17;
        const dark = code === 0 || code === 1 || code === 9;
        const medium = code < 6 || (row + column) % 8 === 0;
        return <span key={row} className={dark ? "bg-black" : medium ? "bg-steel" : "bg-silver"} />;
      })}
    </div>
  );
}

export function Genome({ model }: { model: number }) {
  const scope = useRef<HTMLDivElement>(null);
  const loci = locusSets[model];

  const animate = (
    tl: gsap.core.Timeline,
    { position, reduced }: PageAnimationData,
    entering: boolean,
  ) => {
    const columns = gsap.utils.toArray<HTMLElement>("[data-genome-column]");
    columns.forEach((column, index) => {
      const { start, ...timing } = cascade(position, index, columns.length, entering, reduced);
      tl.to(
        column,
        {
          autoAlpha: entering ? 1 : 0,
          ...timing,
          ...(entering ? { clearProps: "opacity,visibility" } : {}),
        },
        start,
      );
    });
  };

  usePageTransition({
    scope,
    enterAt: "entrance-start",
    prepare: () => gsap.set("[data-genome-column]", { autoAlpha: 0 }),
    leave: (tl, data) => animate(tl, data, false),
    enter: (tl, data) => animate(tl, data, true),
  });

  return (
    <div className="relative flex flex-col pl-13 sm:pl-25">
      <div className="absolute top-6 bottom-0 left-0 flex w-11 flex-col justify-around sm:w-21">
        {loci.map((label, index) => (
          <div key={label}>
            <p className="font-display text-[10px]">Loc {pad(index * 122 + 1, 3)}</p>
            <p className="mt-0.5 text-[8px] leading-tight text-muted">{label}</p>
          </div>
        ))}
      </div>
      <div ref={scope} className="relative grid min-h-0 flex-1 grid-cols-4 gap-2 sm:gap-5">
        {[100 / 6, 50, 500 / 6].map((top, index) => (
          <Line
            key={top}
            index={index + 1}
            total={5}
            className="absolute right-0 left-0 z-0 border-t border-dashed border-steel/70"
            style={{ top: `${top}%` }}
          />
        ))}
        {[1, 2, 3, 4].map((column) => (
          <div key={column} data-genome-column="" className="flex min-h-0 flex-col">
            <p className="mb-2 text-center text-[9px]">{pad(column)}</p>
            <GenomeBar column={column} />
          </div>
        ))}
      </div>
    </div>
  );
}
