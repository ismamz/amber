import { specimens } from "@/lib/specimens";
import { cn } from "@/lib/utils";

import { BarcodeIcon } from "./icons/barcode";
import { Mask } from "./mask";
import { Pager } from "./pager";
import { Reticle } from "./reticle";
import { Underlay } from "./underlay";

type Specimen = (typeof specimens)[number];

function Identity({ specimen }: { specimen: Specimen }) {
  return (
    <section className="absolute inset-x-5 top-32 text-center lg:inset-x-auto lg:top-26 lg:left-[45%] lg:text-left">
      <p className="font-display text-[11px] tracking-[0.32em] [text-box:trim-start_cap_alphabetic]">
        Species
      </p>
      <h1 className="mt-5 font-display text-[clamp(1.75rem,2.6vw,2.75rem)] leading-[0.82] outline-hidden">
        {specimen.code}
      </h1>
      <p className="mt-2 font-display text-[clamp(0.7rem,1vw,0.95rem)]">DNA extraction specimen</p>
      <Pager specimen={specimen} />
    </section>
  );
}

function Barcode({ specimen }: { specimen: Specimen }) {
  // from the code, not random: server and client match
  const bars = Array.from(
    { length: 32 },
    (_, index) => 2 + ((specimen.code.charCodeAt(index % specimen.code.length) * (index + 3)) % 4),
  );

  return (
    <aside
      aria-label={`Organic code ${specimen.code}`}
      className="absolute right-5 bottom-[24%] flex items-start gap-3 lg:top-26 lg:right-[2.5%] lg:bottom-auto lg:gap-5"
    >
      <p className="hidden text-right text-[9px] leading-tight text-muted [text-box:trim-start_cap_alphabetic] sm:block">
        Spliced extraction
        <br />
        Organic code
      </p>
      <div>
        <div className="mb-2 h-px w-8 bg-black lg:w-12" />
        <BarcodeIcon bars={bars} className="h-32 w-8 overflow-visible lg:h-52 lg:w-12" />
      </div>
    </aside>
  );
}

function Bases({ specimen }: { specimen: Specimen }) {
  return (
    <div
      aria-hidden="true"
      className="absolute bottom-[24%] left-5 lg:bottom-[27%] lg:left-[44.5%]"
    >
      {specimen.bases.split("").map((base, index) => (
        <span
          key={base}
          className={cn(
            "grid size-8 place-items-center font-display text-lg lg:size-12 lg:text-3xl",
            index % 2 ? "bg-steel" : "bg-silver",
          )}
        >
          {base}
        </span>
      ))}
    </div>
  );
}

function Classification({ specimen }: { specimen: Specimen }) {
  return (
    <section className="absolute inset-x-5 bottom-7 text-center lg:right-[2.5%] lg:bottom-[7%] lg:left-auto lg:text-right">
      <p className="font-display text-[clamp(0.9rem,1.5vw,1.45rem)]">Exotic DNA</p>
      <Mask
        index={0}
        total={2}
        className="mx-auto mt-2 text-[clamp(1.35rem,4vw,4rem)] lg:mr-0 lg:ml-auto"
      >
        {specimen.species}
      </Mask>
      <Mask
        index={1}
        total={2}
        className="mx-auto mt-1 text-[clamp(1.35rem,3.2vw,3.25rem)] lg:mr-0 lg:ml-auto"
      >
        {`${specimen.line} / ${specimen.variant}`}
      </Mask>
    </section>
  );
}

export function SpecimenDetail({ specimen }: { specimen: Specimen }) {
  return (
    <>
      {/* portal wraps the whole component: hooks mount with its DOM */}
      <Underlay>
        <Reticle />
      </Underlay>

      <div className="absolute inset-0 z-30">
        <Identity specimen={specimen} />
        <Barcode specimen={specimen} />
        <Bases specimen={specimen} />
        <Classification specimen={specimen} />
      </div>
    </>
  );
}
