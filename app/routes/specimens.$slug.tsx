import { Notice } from "@/components/notice";
import { SpecimenDetail } from "@/components/specimen-detail";
import { SpecimenSequencer } from "@/components/specimen-sequencer";
import { findSpecimen } from "@/lib/specimens";

import type { Route } from "./+types/specimens.$slug";

export function meta({ params }: Route.MetaArgs) {
  const specimen = findSpecimen(params.slug);
  if (!specimen) return [{ title: "Specimen not found — Amber Genetics" }];

  return [
    { title: `${specimen.code} — Amber Genetics` },
    {
      name: "description",
      content: `Amber Genetics. ${specimen.species} specimen ${specimen.code}: ${specimen.summary.toLowerCase()}.`,
    },
  ];
}

export default function Detail({ params }: Route.ComponentProps) {
  const specimen = findSpecimen(params.slug);
  if (!specimen) return <Notice title="Specimen not found" />;

  return (
    <main className="relative pb-[calc(3rem+env(safe-area-inset-bottom))] sm:pb-0 lg:h-svh">
      <div className="relative h-[max(42rem,100svh)] lg:absolute lg:inset-0 lg:h-svh">
        <SpecimenDetail specimen={specimen} />
      </div>
      <SpecimenSequencer specimen={specimen} />
    </main>
  );
}
