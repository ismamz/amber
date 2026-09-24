/**
 * pivot: how far ahead of the bounding-box centre the visual mass sits, as a
 * fraction of the model's length. The detail spin turns around this point, so a
 * long tail no longer drags the body off the reticle.
 * waist: height of the body's visual centre as a fraction of the model's
 * height, where the home tooltip dot sits. Half for most; the brachiosaur's
 * neck pushes its bounding box far above the torso.
 */
export const models = [
  {
    url: "/models/triceratops.glb",
    length: 3.8,
    maxHeight: 99,
    detailScale: 1.85,
    rotation: 0,
    pivot: 0.085,
    waist: 0.5,
    surface: { roughness: 0.88, normal: 1.35, gain: 0.9, lift: 0.2 },
  },
  {
    url: "/models/velociraptor.glb",
    length: 3.8,
    maxHeight: 99,
    detailScale: 1.85,
    rotation: 0,
    pivot: 0.17,
    waist: 0.5,
    surface: { roughness: 0.62, normal: 1.1, gain: 1.05, lift: 0.03 },
  },
  {
    url: "/models/stegosaurus.glb",
    length: 4.1,
    maxHeight: 99,
    detailScale: 1.85,
    rotation: Math.PI / 2,
    pivot: 0,
    waist: 0.5,
    surface: { roughness: 0.82, normal: 1.25, gain: 0.95, lift: 0.13 },
  },
  {
    url: "/models/brachiosaurus.glb",
    length: 4.15,
    maxHeight: 3,
    detailScale: 1.35,
    rotation: 0,
    pivot: 0.157,
    waist: 0.3,
    surface: { roughness: 0.78, normal: 1.2, gain: 0.96, lift: 0.1 },
  },
  {
    url: "/models/tyrannosaurus.glb",
    length: 4.3,
    maxHeight: 99,
    detailScale: 1.85,
    rotation: 0,
    pivot: 0.12,
    waist: 0.5,
    surface: { roughness: 0.8, normal: 1.22, gain: 0.98, lift: 0.12 },
  },
] as const;

export const specimens = [
  {
    slug: "trike-001",
    bases: "ATG",
    code: "Trike.001",
    species: "Triceratops",
    model: 0,
    profile: 0,
    line: "Baseline",
    variant: "C0",
    summary: "Genomic reference line",
  },
  {
    slug: "raptor-002",
    bases: "GCT",
    code: "Raptor.002",
    species: "Velociraptor",
    model: 1,
    profile: 1,
    line: "Synapse",
    variant: "N2",
    summary: "Neural response protocol",
  },
  {
    slug: "stega-003",
    bases: "TAC",
    code: "Stega.003",
    species: "Stegosaurus",
    model: 2,
    profile: 2,
    line: "Osteon",
    variant: "P7",
    summary: "Dorsal plate expression",
  },
  {
    slug: "brachi-004",
    bases: "CGA",
    code: "Brachi.004",
    species: "Brachiosaurus",
    model: 3,
    profile: 3,
    line: "Cervical",
    variant: "L8",
    summary: "Vertical growth lattice",
  },
  {
    slug: "rex-005",
    bases: "GTC",
    code: "Rex.005",
    species: "Tyrannosaurus",
    model: 4,
    profile: 4,
    line: "Predator",
    variant: "R9",
    summary: "Apex response sequence",
  },
] as const;

export const step = (Math.PI * 2) / specimens.length;

export const indexAt = (angle: number) =>
  ((Math.round(-angle / step) % specimens.length) + specimens.length) % specimens.length;

export const findSpecimen = (slug: string) => specimens.find((specimen) => specimen.slug === slug);

export function specimenIndex(pathname: string) {
  const slug = pathname.match(/^\/specimens\/([^/]+)$/)?.[1];
  return slug ? specimens.findIndex((specimen) => specimen.slug === slug) : -1;
}
