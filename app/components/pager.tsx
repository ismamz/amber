import { useRef } from "react";
import { Link } from "react-router";

import { specimens } from "@/lib/specimens";
import { useStill } from "@/lib/still";
import { pad } from "@/lib/utils";

import { Arrow } from "./icons/arrow";

type Specimen = (typeof specimens)[number];

export function Pager({ specimen }: { specimen: Specimen }) {
  const scope = useRef<HTMLElement>(null);
  const index = specimens.indexOf(specimen);
  const at = (offset: number) => specimens[(index + offset + specimens.length) % specimens.length];

  useStill(scope);

  return (
    <nav
      ref={scope}
      aria-label="Specimens"
      className="mt-5 flex items-center justify-center gap-3 font-display text-sm lg:justify-start"
    >
      <Step specimen={at(-1)} label="Previous">
        <Arrow className="h-3 w-3 rotate-180" />
      </Step>
      <span>
        {pad(index + 1)} / {pad(specimens.length)}
      </span>
      <Step specimen={at(1)} label="Next">
        <Arrow className="h-3 w-3" />
      </Step>
    </nav>
  );
}

function Step({
  specimen,
  label,
  children,
}: {
  specimen: Specimen;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={`/specimens/${specimen.slug}`}
      aria-label={`${label}, ${specimen.code}`}
      className="pointer-events-auto grid size-9 place-items-center transition-transform hover:animate-nav-blink focus-visible:animate-nav-blink focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-90"
    >
      {children}
    </Link>
  );
}
