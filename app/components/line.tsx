import gsap from "gsap";
import { usePageTransition } from "hyperkinetic";
import { useRef, type CSSProperties } from "react";

export function Line({
  className,
  style,
  index = 0,
  total = 1,
}: {
  className?: string;
  style?: CSSProperties;
  index?: number;
  total?: number;
}) {
  const scope = useRef<HTMLSpanElement>(null);

  usePageTransition({
    scope,
    enterAt: "entrance-start",
    prepare: () => gsap.set(scope.current, { scaleX: 0, transformOrigin: "left center" }),
    leave: (tl, { position, reduced }) => {
      tl.to(
        scope.current,
        {
          scaleX: 0,
          transformOrigin: "left center",
          duration: reduced ? 0 : 0.3,
          ease: "im-quint-inout",
        },
        position + (reduced ? 0 : (total - 1 - index) * 0.05),
      );
    },
    enter: (tl, { position, reduced }) => {
      tl.to(
        scope.current,
        {
          scaleX: 1,
          duration: reduced ? 0 : 0.65,
          ease: "im-quart-inout",
          clearProps: "transform,transformOrigin",
        },
        position + (reduced ? 0 : index * 0.09),
      );
    },
  });

  return <span ref={scope} aria-hidden="true" className={className} style={style} />;
}
