import {
  createContext,
  useContext,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from "react";

import { step } from "@/lib/specimens";

type ArchiveState = {
  active: number;
  setActive: Dispatch<SetStateAction<number>>;
  goTo: (index: number) => void;
  motion: RefObject<{
    angle: number;
    target: number;
    velocity: number;
    lastInput: number;
    lastMove: number;
    reduced: boolean;
    dragging: boolean;
    locked: boolean;
    lastDrag: number;
    lean: number;
    leanTarget: number;
    invalidate?: () => void;
  }>;
};

// Snap the carousel to the nearest specimen when the gesture ends.
export const snap = true;

// A drag turns `drag` radians across the viewport width, which keeps the front
// specimen roughly under the pointer. The wheel turns `wheel` per pixel and
// never coasts: trackpads already send their own inertia. Releasing a drag
// throws the target `throw` seconds along the measured velocity (capped at
// `max`, at most one slot), then the snap glides to a slot at `glide` while
// input tracks at `track`.
export const spin = {
  drag: 2,
  wheel: 0.0022,
  max: 7,
  throw: 0.2,
  min: 0.04,
  bias: 0.4,
  glide: 6,
  track: 12,
};

// The slot the carousel comes to rest on. Rounding leans `bias` of a slot toward
// the last direction of travel, so a short push still advances instead of
// springing back; on a slot it is a no-op, so the frame loop can call it freely.
export function landing(target: number, velocity: number) {
  const bias = Math.abs(velocity) > spin.min ? Math.sign(velocity) * spin.bias : 0;
  return Math.round(target / step + bias) * step;
}

// Hovering off-centre tips the platform that way, as if it were leaning to bring
// the specimen under the cursor to the front. Purely visual: it rides on top of
// the rendered angle so the snap target and the active specimen never move with
// the cursor.
export const lean = true;

// `depth` boosts the tilt over the upper half of the stage — the far side of the
// ring, where the same screen distance covers more of the turn.
export const leanTilt = { max: 0.11, depth: 0.55, damp: 4 };

export const ArchiveContext = createContext<ArchiveState | null>(null);

export function useArchive() {
  const value = useContext(ArchiveContext);
  if (!value) throw new Error("Archive provider missing");
  return value;
}
