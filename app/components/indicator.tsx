import gsap from "gsap";
import { useLayoutEffect, useRef, useState } from "react";

import { specimens } from "@/lib/specimens";

// Carousel marker plus one jump button per specimen.
// Three copies of the marker, one per cycle, so the wrap never jumps.

export function Indicator({ active, goTo }: { active: number; goTo: (index: number) => void }) {
  const markers = useRef<Array<HTMLSpanElement | null>>([]);
  const position = useRef(active);
  const previous = useRef(active);
  const [initial] = useState(active);
  const pitch = 28;

  useLayoutEffect(() => {
    let delta = active - previous.current;
    if (delta > specimens.length / 2) delta -= specimens.length;
    if (delta < -specimens.length / 2) delta += specimens.length;
    previous.current = active;

    const target = position.current + delta;
    position.current = target;
    const media = gsap.matchMedia();
    // GSAP only runs the callback while some condition matches, hence `motion`.
    media.add(
      {
        reduced: "(prefers-reduced-motion: reduce)",
        motion: "(prefers-reduced-motion: no-preference)",
      },
      ({ conditions }) => {
        const timeline = gsap.timeline({
          onComplete: () => {
            position.current = active;
            markers.current.forEach((marker, index) => {
              if (marker)
                gsap.set(marker, {
                  x: (active + (index - 1) * specimens.length) * pitch,
                });
            });
          },
        });
        markers.current.forEach((marker, index) => {
          if (marker)
            timeline.to(
              marker,
              {
                x: (target + (index - 1) * specimens.length) * pitch,
                duration: conditions!.reduced ? 0 : 0.32,
                ease: "power2.inOut",
              },
              0,
            );
        });
      },
    );
    // kill, not revert: the next move starts where the marker stopped
    return () => {
      media.kill();
    };
  }, [active]);

  return (
    <div className="relative flex py-3">
      <div aria-hidden="true" className="relative flex w-33 gap-2 overflow-hidden">
        {specimens.map((item) => (
          <span key={item.slug} className="h-0.5 w-5 shrink-0 bg-silver" />
        ))}
        {[-1, 0, 1].map((cycle, index) => (
          <span
            key={cycle}
            ref={(node) => {
              markers.current[index] = node;
            }}
            className="absolute top-0 left-0 h-0.5 w-5 bg-black"
            style={{
              transform: `translateX(${(initial + cycle * specimens.length) * pitch}px)`,
            }}
          />
        ))}
      </div>
      {/* Overlaid outside the clipped track so the taller hit area survives. */}
      <div className="absolute inset-0 flex gap-2">
        {specimens.map((item, index) => (
          <button
            key={item.slug}
            type="button"
            aria-label={`Show ${item.species}, ${item.code}`}
            aria-current={index === active}
            className="pointer-events-auto h-full w-5 shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2"
            onClick={() => goTo(index)}
          />
        ))}
      </div>
    </div>
  );
}
