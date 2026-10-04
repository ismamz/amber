import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { usePageTransition } from "hyperkinetic";
import { useRef } from "react";

import { specimenIndex } from "@/lib/specimens";

import { ReticleIcon } from "./icons/reticle";

const turn = 70;
const isDetail = (pathname: string) => specimenIndex(pathname) >= 0;

// specimen → specimen: both pages draw it at same angle, swap invisible
// only the archive fades it
export function Reticle() {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.matchMedia().add(
        "(prefers-reduced-motion: no-preference)",
        () => {
          // phase from clock, not mount: both reticles line up
          const phase = (((performance.now() / 1000) % turn) / turn) * 360;
          gsap.fromTo(
            "[data-wheel]",
            { rotation: phase, transformOrigin: "50% 50%" },
            { rotation: "+=360", duration: turn, ease: "none", repeat: -1 },
          );
        },
        scope,
      );
    },
    { scope },
  );

  usePageTransition({
    scope,
    enterAt: "entrance-start",
    prepare: () => {
      gsap.set(scope.current, { autoAlpha: 0 });
    },
    leave: (tl, { next, position, reduced }) => {
      if (isDetail(next.pathname)) {
        tl.set(scope.current, { autoAlpha: 0, immediateRender: false }, 0);
        return;
      }
      tl.to(
        scope.current,
        { autoAlpha: 0, duration: reduced ? 0 : 0.35, ease: "im-quint-inout" },
        position,
      );
    },
    enter: (tl, { current, initial, position, reduced }) => {
      if (!initial && isDetail(current.pathname)) {
        tl.set(scope.current, { clearProps: "opacity,visibility", immediateRender: false }, 0);
        return;
      }
      tl.to(
        scope.current,
        {
          autoAlpha: 1,
          duration: reduced ? 0 : 0.7,
          ease: "im-quart-inout",
          clearProps: "opacity,visibility",
        },
        position,
      );
    },
  });

  return (
    <div ref={scope} className="absolute inset-0">
      {/* fades busy canvas from centre: marks stay readable */}
      <div
        className="absolute inset-x-[-5%] top-[24%] h-[52%] text-steel/25 lg:top-[13%] lg:right-[3%] lg:left-auto lg:h-[68%] lg:w-[58%]"
        style={{ background: "radial-gradient(circle, #f3f5f6 30%, #f3f5f600 70%)" }}
      >
        <ReticleIcon className="h-full w-full" />
      </div>
    </div>
  );
}
