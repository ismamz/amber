import { usePageTransition, type PageAnimationData } from "@ismamz/hyperkinetic";
import gsap from "gsap";
import { Fragment, useRef } from "react";

import { cascade } from "@/lib/reveal";

// Claiming the scope opts each row out of the fallback's autoAlpha reveal, so
// the row (label, track, value) has to fade in/out itself, same as it would
// have gotten for free — on top of the bar/count tween, not instead of it.
// The row can't be a wrapper element for that: `display: contents` (needed
// to keep label/track/value as direct grid items) drops opacity entirely, so
// autoAlpha targets the three real elements together instead.
export function Metrics({ metrics }: { metrics: { label: string; value: number }[] }) {
  const scope = useRef<HTMLDivElement>(null);

  const animate = (
    tl: gsap.core.Timeline,
    { position, reduced }: PageAnimationData,
    entering: boolean,
  ) => {
    const fills = gsap.utils.toArray<HTMLElement>("[data-metric-fill]", scope.current!);
    const values = gsap.utils.toArray<HTMLElement>("[data-metric-value]", scope.current!);
    metrics.forEach((metric, index) => {
      const fill = fills[index];
      const row = gsap.utils.toArray<HTMLElement>(`[data-metric-row="${index}"]`, scope.current!);
      const target = metric.value;
      const { start, ...timing } = cascade(position, index, metrics.length, entering, reduced);
      tl.to(
        row,
        {
          autoAlpha: entering ? 1 : 0,
          ...timing,
          ...(entering ? { clearProps: "opacity,visibility" } : {}),
        },
        start,
      );
      tl.to(fill, { width: `${entering ? target : 0}%`, ...timing }, start);

      const counter = { value: entering ? 0 : target };
      tl.to(
        counter,
        {
          value: entering ? target : 0,
          ...timing,
          onUpdate: () => {
            values[index].textContent = `${counter.value.toFixed(1)}%`;
          },
        },
        start,
      );
    });
  };

  usePageTransition({
    scope,
    enterAt: "entrance-start",
    prepare: () => {
      // Scoped to this instance: both pages sit as DOM siblings during the
      // swap, and an unscoped selector here would reset the outgoing page's
      // bars too, desyncing its leave tween.
      gsap.set(gsap.utils.toArray<HTMLElement>("[data-metric-row]", scope.current!), {
        autoAlpha: 0,
      });
      gsap.set(gsap.utils.toArray<HTMLElement>("[data-metric-fill]", scope.current!), {
        width: "0%",
      });
      gsap.utils
        .toArray<HTMLElement>("[data-metric-value]", scope.current!)
        .forEach((el) => (el.textContent = "0.0%"));
    },
    leave: (tl, data) => animate(tl, data, false),
    enter: (tl, data) => animate(tl, data, true),
  });

  return (
    <div ref={scope} className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-3">
      {metrics.map(({ label, value }, index) => (
        <Fragment key={label}>
          <span data-metric-row={index} className="font-display text-[9px] whitespace-nowrap">
            {label}
          </span>
          <span data-metric-row={index} className="h-3 bg-silver">
            <span
              data-metric-fill=""
              className="block h-full bg-black"
              style={{ width: `${value}%` }}
            />
          </span>
          <span
            data-metric-row={index}
            data-metric-value=""
            className="text-right font-display text-[9px]"
          >
            {value}.0%
          </span>
        </Fragment>
      ))}
    </div>
  );
}
