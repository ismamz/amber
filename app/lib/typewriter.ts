import { usePageTransition } from "@ismamz/hyperkinetic";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { useLayoutEffect, type RefObject } from "react";

gsap.registerPlugin(SplitText);

export function useTypewriter(scope: RefObject<HTMLElement | null>, text?: string, pace = 1) {
  useLayoutEffect(() => {
    if (!scope.current) return;
    const split = SplitText.create(scope.current, {
      type: "chars",
      charsClass: "typewriter-char",
    });
    return () => split.revert();
  }, [scope, text]);

  usePageTransition({
    scope,
    enterAt: "identity-start",
    prepare: () => gsap.set(".typewriter-char", { autoAlpha: 0 }),
    leave: (tl, { position, reduced }) => {
      tl.to(
        ".typewriter-char",
        { autoAlpha: 0, duration: 0, stagger: { each: reduced ? 0 : 0.015 * pace, from: "end" } },
        position,
      );
    },
    enter: (tl, { position, reduced }) => {
      tl.to(
        ".typewriter-char",
        { autoAlpha: 1, duration: 0, stagger: reduced ? 0 : 0.025 * pace },
        position,
      );
    },
  });
}
