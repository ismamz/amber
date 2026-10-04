import gsap from "gsap";
import { usePageTransition } from "hyperkinetic";
import type { RefObject } from "react";

import { config } from "@/lib/transition";

export function useStill(scope: RefObject<HTMLElement | null>) {
  usePageTransition({
    scope,
    enterAt: config.fallback.enterAt,
    prepare: (data) => {
      gsap.set(scope.current, { autoAlpha: data.initial || data.current.pathname === "/" ? 0 : 1 });
    },
    leave: (tl, data) => {
      if (data.next.pathname === "/") {
        config.fallback.leave(tl, { ...data, targets: [scope.current!] });
      } else {
        tl.set(scope.current, { autoAlpha: 0 }, data.position);
      }
    },
    enter: (tl, data) => {
      if (data.initial || data.current.pathname === "/") {
        config.fallback.enter(tl, { ...data, targets: [scope.current!] });
      }
    },
  });
}
