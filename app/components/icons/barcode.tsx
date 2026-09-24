import type { SVGProps } from "react";

export function BarcodeIcon({ bars, ...props }: { bars: number[] } & SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" viewBox="0 0 60 240" preserveAspectRatio="none" {...props}>
      {bars.map((height, index) => (
        <rect
          key={`${height}-${index}`}
          x="0"
          y={index * 7.35}
          width="60"
          height={height}
          fill="currentColor"
        />
      ))}
    </svg>
  );
}
