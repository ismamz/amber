import { useRef } from "react";

import type { specimens } from "@/lib/specimens";

import { Arrow } from "./icons/arrow";
import { Magic } from "./magic";
import { Metrics } from "./metrics";
import { Output } from "./output";
import { Sequence } from "./sequence";

type Specimen = (typeof specimens)[number];

export function SpecimenSequencer({ specimen }: { specimen: Specimen }) {
  const profile = specimen.profile;
  const integrity = [97, 91, 94, 89, 96][profile];
  const compatibility = [74, 88, 81, 77, 83][profile];
  const magic = useRef<HTMLDialogElement>(null);

  return (
    <aside className="relative z-30 flex min-h-[52rem] w-full flex-col px-5 py-6 sm:min-h-svh sm:px-10 sm:py-8 lg:absolute lg:inset-y-0 lg:left-0 lg:min-h-0 lg:w-[41.5%] lg:px-[2.5%] lg:pt-8 lg:pb-[3%]">
      <section className="relative flex min-h-0 flex-1 flex-col lg:mt-18">
        <div className="relative flex items-baseline justify-between pt-4 pb-4">
          <span
            data-transition-line=""
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 border-b"
          />
          <h2 className="font-display text-[clamp(0.9rem,1.2vw,1.15rem)]">Genome sequencer</h2>
          <p className="text-[9px] tracking-[0.18em] text-muted">Lab 04 / Genetics division</p>
        </div>
        <Sequence model={profile} />
      </section>

      <div className="mt-7 space-y-5">
        <Output profile={profile} />
        <Metrics
          metrics={[
            { label: "Genome integrity", value: integrity },
            { label: "Splice compatibility", value: compatibility },
          ]}
        />
        <button
          type="button"
          onClick={() => magic.current?.showModal()}
          className="group pointer-events-auto relative flex h-14 w-full cursor-pointer items-center justify-between overflow-hidden border bg-black px-5 font-display text-base text-white transition-colors duration-500 focus-visible:outline-2 focus-visible:outline-offset-4 motion-reduce:transition-none"
        >
          <span
            aria-hidden="true"
            className="absolute inset-0 origin-left scale-x-0 bg-white transition-transform duration-500 ease-[cubic-bezier(.77,0,.18,1)] group-hover:scale-x-100 group-focus-visible:scale-x-100 motion-reduce:transition-none"
          />
          <span className="relative z-10 transition-colors duration-300 group-hover:text-black group-focus-visible:text-black">
            Run sequence
          </span>
          <Arrow className="relative z-10 transition-[color,transform] duration-300 group-hover:translate-x-1 group-hover:text-black group-focus-visible:translate-x-1 group-focus-visible:text-black motion-reduce:transition-none" />
        </button>
        <Magic dialog={magic} />
      </div>
    </aside>
  );
}
