import type { SVGProps } from "react";

export function ChromatogramIcon({
  primary,
  secondary,
  ...props
}: { primary: number[]; secondary: number[] } & SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" viewBox="0 0 1100 90" preserveAspectRatio="none" {...props}>
      {secondary.map((peak, index) => {
        const center = (index + 1) * 100;
        return (
          <path
            key={`secondary-${index}`}
            data-chromatogram
            pathLength="1"
            d={`M ${center - 58} 88 Q ${center - 24} 88 ${center} ${peak} Q ${center + 24} 88 ${center + 58} 88`}
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.38"
            strokeWidth="1"
            style={{ strokeDasharray: "1 1", strokeDashoffset: 1 }}
            vectorEffect="non-scaling-stroke"
          />
        );
      })}
      {primary.map((peak, index) => {
        const center = index * 100 + 50;
        return (
          <path
            key={`primary-${index}`}
            data-chromatogram
            pathLength="1"
            d={`M ${center - 52} 88 Q ${center - 22} 88 ${center} ${peak} Q ${center + 22} 88 ${center + 52} 88`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            style={{ strokeDasharray: "1 1", strokeDashoffset: 1 }}
            vectorEffect="non-scaling-stroke"
          />
        );
      })}
    </svg>
  );
}
