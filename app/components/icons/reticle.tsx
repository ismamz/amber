import type { SVGProps } from "react";

export function ReticleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" viewBox="0 0 600 600" {...props}>
      {/* The svg is scaled far past its viewBox, so every stroke needs
          non-scaling-stroke to stay a hairline like the background grid. */}
      <g data-wheel>
        <circle
          cx="300"
          cy="300"
          r="225"
          fill="none"
          stroke="currentColor"
          vectorEffect="non-scaling-stroke"
        />
        <circle
          cx="300"
          cy="300"
          r="172"
          fill="none"
          stroke="currentColor"
          vectorEffect="non-scaling-stroke"
        />
        {Array.from({ length: 72 }, (_, index) => {
          const angle = (index / 72) * Math.PI * 2;
          const major = index % 6 === 0;
          const inner = major ? 238 : 249;
          const outer = major ? 285 : index % 2 === 0 ? 273 : 266;
          // Rounded: Node and the browser disagree on the last digits of
          // these sines, which hydration reports as an attribute mismatch.
          const at = (radius: number, axis: (value: number) => number) =>
            Math.round((300 + axis(angle) * radius) * 1000) / 1000;
          return (
            <line
              key={index}
              x1={at(inner, Math.cos)}
              y1={at(inner, Math.sin)}
              x2={at(outer, Math.cos)}
              y2={at(outer, Math.sin)}
              stroke="currentColor"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </g>
    </svg>
  );
}
