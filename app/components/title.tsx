import gsap from "gsap";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(SplitText);
import { usePageTransition, type PageAnimationData } from "@ismamz/hyperkinetic";
import { useLayoutEffect, useRef } from "react";

import { animateMask } from "@/lib/reveal";
import { cn } from "@/lib/utils";

type Props = {
  as?: "h1" | "p";
  children: string;
  className?: string;
  textClassName?: string;
  index?: number;
  total?: number;
};

export function Title({
  as: Tag = "p",
  children,
  className,
  textClassName,
  index = 0,
  total = 1,
}: Props) {
  const scope = useRef<HTMLHeadingElement>(null);
  const text = useRef<HTMLSpanElement>(null);

  const animate = (
    tl: gsap.core.Timeline,
    { position, reduced }: PageAnimationData,
    entering: boolean,
  ) => {
    if (!scope.current) return;
    animateMask(
      tl,
      scope.current,
      entering,
      position,
      reduced,
      entering ? index : total - 1 - index,
    );
  };

  useLayoutEffect(() => {
    if (!text.current) return;
    const split = SplitText.create(text.current, {
      type: "chars",
      mask: "chars",
      charsClass: "title-char",
    });
    return () => split.revert();
  }, [children]);

  usePageTransition({
    scope,
    group: "titles",
    enterAt: "title-start",
    prepare: () => {
      gsap.set("[data-title-block]", { scaleX: 0 });
      gsap.set(".title-char", { yPercent: 100 });
    },
    leave: (tl, data) => animate(tl, data, false),
    enter: (tl, data) => animate(tl, data, true),
  });

  return (
    <Tag
      ref={scope}
      data-reveal=""
      className={cn("relative w-fit font-display text-white", className, "leading-none")}
    >
      <span
        data-title-block=""
        aria-hidden="true"
        className="absolute inset-0 origin-left bg-black"
      />
      <span className="relative block overflow-hidden">
        <span data-title-text="" className="block p-3 sm:p-4">
          <span
            key={children}
            ref={text}
            className={cn(
              "block [&_.title-char]:align-top [&_.title-char-mask]:align-top",
              textClassName,
            )}
          >
            {children}
          </span>
        </span>
      </span>
    </Tag>
  );
}
