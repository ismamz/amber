import { pad } from "@/lib/utils";

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
  const loci = locusSets[model];

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
      <div className="relative grid min-h-0 flex-1 grid-cols-4 gap-2 sm:gap-5">
        {[100 / 6, 50, 500 / 6].map((top) => (
          <span
            key={top}
            data-transition-line=""
            aria-hidden="true"
            className="absolute right-0 left-0 z-0 border-t border-dashed border-steel/70"
            style={{ top: `${top}%` }}
          />
        ))}
        {[1, 2, 3, 4].map((column) => (
          <div key={column} className="flex min-h-0 flex-col">
            <p className="mb-2 text-center text-[9px]">{pad(column)}</p>
            <GenomeBar column={column} />
          </div>
        ))}
      </div>
    </div>
  );
}
