import { useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router";

const subscribe = () => () => {};
const slot = () => document.querySelector<HTMLElement>("[data-underlay]");

// portal: renders UI-layer content below the scene canvas (see root.tsx)
// layering via the slot's z-index, under the canvas
// stays in page's React tree: recipes run, unmounts with it

export function Underlay({ children }: { children: ReactNode }) {
  const target = useSyncExternalStore(subscribe, slot, () => null);
  return target ? createPortal(children, target) : null;
}

export function UnderlaySlot() {
  const { pathname } = useLocation();

  return (
    <div
      data-underlay=""
      className={
        pathname === "/"
          ? "pointer-events-none fixed inset-0 z-10"
          : "pointer-events-none absolute inset-x-0 top-0 z-10 h-[max(42rem,100svh)] lg:fixed lg:inset-0 lg:h-auto"
      }
    />
  );
}
