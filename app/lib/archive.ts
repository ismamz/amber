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

// Snap to the nearest specimen when the gesture ends.
export const snap = true;

// `drag`: radians per viewport width. Keeps the front specimen under the pointer.
// `wheel`: radians per pixel. No coasting, trackpads bring their own inertia.
// `throw`: seconds of velocity added on release, capped at `max` (one slot).
// `glide` damps the snap, `track` damps the input.
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

// Slot to rest on. `bias` leans the rounding toward the direction of travel,
// so a short push advances instead of springing back. No-op on a slot.
export function landing(target: number, velocity: number) {
  const bias = Math.abs(velocity) > spin.min ? Math.sign(velocity) * spin.bias : 0;
  return Math.round(target / step + bias) * step;
}

// Hovering off-centre tips the platform toward the cursor. Visual only: it sits
// on top of the rendered angle, the snap target and the active specimen stay put.
export const lean = true;

// `depth` boosts the tilt over the upper half of the stage. That is the far side
// of the ring, where the same screen distance covers more of the turn.
export const leanTilt = { max: 0.11, depth: 0.55, damp: 4 };

export const ArchiveContext = createContext<ArchiveState | null>(null);

export function useArchive() {
  const value = useContext(ArchiveContext);
  if (!value) throw new Error("Archive provider missing");
  return value;
}
