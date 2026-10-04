import gsap from "gsap";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(SplitText);
import { usePageTransition, type PageAnimationData } from "hyperkinetic";
import { useLayoutEffect, useRef } from "react";
import { Link } from "react-router";

import { specimens } from "@/lib/specimens";
import { useStill } from "@/lib/still";
import { useTypewriter } from "@/lib/typewriter";
import { cn } from "@/lib/utils";

import { Arrow } from "./icons/arrow";
import { BarcodeIcon } from "./icons/barcode";
import { Pager } from "./pager";
import { Reticle } from "./reticle";
import { Title } from "./title";
import { Underlay } from "./underlay";

type Specimen = (typeof specimens)[number];

function Identity({ specimen }: { specimen: Specimen }) {
  const scope = useRef<HTMLDivElement>(null);
  const blocks = () => gsap.utils.toArray<HTMLElement>("[data-identity]", scope.current!);

  useLayoutEffect(() => {
    const splits = blocks().map((block) =>
      SplitText.create(block, {
        type: "chars",
        charsClass: "identity-char",
      }),
    );
    return () => splits.forEach((split) => split.revert());
  }, [specimen.code]);

  const animate = (
    tl: gsap.core.Timeline,
    { position, reduced }: PageAnimationData,
    entering: boolean,
  ) => {
    const duration = reduced ? 0 : entering ? 0.55 : 0.3;
    const spread = reduced ? 0 : entering ? 0.16 : 0.1;
    const blockDelay = reduced ? 0 : 0.08;
    let end = position;

    blocks().forEach((block, index) => {
      const chars = block.querySelectorAll(".identity-char");
      const start = position + index * blockDelay;
      tl.to(
        chars,
        {
          yPercent: entering ? 0 : -160,
          duration,
          stagger: { amount: spread },
          ease: entering ? "im-quart-inout" : "im-quint-inout",
        },
        start,
      );
      end = Math.max(end, start + duration + spread);
    });

    if (!entering && scope.current) tl.set(scope.current, { visibility: "hidden" }, end);
  };

  usePageTransition({
    scope,
    group: "identity",
    enterAt: "identity-start",
    prepare: () => gsap.set(".identity-char", { yPercent: 140 }),
    leave: (tl, data) => animate(tl, data, false),
    enter: (tl, data) => animate(tl, data, true),
  });

  return (
    <section className="absolute inset-x-5 top-32 text-center lg:inset-x-auto lg:top-26 lg:left-[45%] lg:text-left">
      <div ref={scope}>
        <p className="font-display text-[11px] tracking-[0.32em] [text-box:trim-start_cap_alphabetic]">
          <span className="-mx-[0.04em] -my-[0.15em] block overflow-hidden px-[0.04em] py-[0.15em]">
            <span data-identity="" className="block [&_.identity-char]:align-top">
              Species
            </span>
          </span>
        </p>
        <h1 className="mt-5 font-display text-[clamp(1.75rem,2.6vw,2.75rem)] leading-[0.82] outline-hidden">
          <span className="-mx-[0.04em] -my-[0.15em] block overflow-hidden px-[0.04em] py-[0.15em]">
            <span data-identity="" className="block [&_.identity-char]:align-top">
              {specimen.code}
            </span>
          </span>
        </h1>
        <p className="mt-2 font-display text-[clamp(0.7rem,1vw,0.95rem)]">
          <span className="-mx-[0.04em] -my-[0.15em] block overflow-hidden px-[0.04em] py-[0.15em]">
            <span data-identity="" className="block [&_.identity-char]:align-top">
              DNA extraction specimen
            </span>
          </span>
        </p>
      </div>
      <Pager specimen={specimen} />
    </section>
  );
}

function Barcode({ specimen }: { specimen: Specimen }) {
  const scope = useRef<HTMLElement>(null);
  const caption = useRef<HTMLParagraphElement>(null);
  const code = useRef<HTMLDivElement>(null);

  useTypewriter(caption);

  usePageTransition({
    scope,
    enterAt: "identity-start",
    prepare: () => {
      gsap.set(code.current, { clipPath: "inset(0 0 100% 0)" });
    },
    leave: (tl, { position, reduced }) => {
      tl.to(
        code.current,
        {
          clipPath: "inset(0 0 100% 0)",
          duration: reduced ? 0 : 0.35,
          ease: "im-quint-inout",
        },
        position,
      );
    },
    enter: (tl, { position, reduced }) => {
      tl.fromTo(
        code.current,
        { clipPath: "inset(0 0 100% 0)" },
        {
          clipPath: "inset(0 0 0% 0)",
          duration: reduced ? 0 : 0.65,
          ease: "im-quart-inout",
          clearProps: "clipPath",
        },
        position,
      );
    },
  });

  // from the code, not random: server and client match
  const bars = Array.from(
    { length: 32 },
    (_, index) => 2 + ((specimen.code.charCodeAt(index % specimen.code.length) * (index + 3)) % 4),
  );

  return (
    <aside
      ref={scope}
      aria-label={`Organic code ${specimen.code}`}
      className="absolute right-5 bottom-[24%] flex items-start gap-3 lg:top-26 lg:right-[2.5%] lg:bottom-auto lg:gap-5"
    >
      <p
        ref={caption}
        className="hidden text-right text-[9px] leading-tight text-muted [text-box:trim-start_cap_alphabetic] sm:block"
      >
        Spliced extraction
        <br />
        Organic code
      </p>
      <div ref={code}>
        <div className="mb-2 h-px w-8 bg-black lg:w-12" />
        <BarcodeIcon bars={bars} className="h-32 w-8 overflow-visible lg:h-52 lg:w-12" />
      </div>
    </aside>
  );
}

function Bases({ specimen }: { specimen: Specimen }) {
  const scope = useRef<HTMLDivElement>(null);
  const elements = () => gsap.utils.toArray<HTMLElement>("[data-base]", scope.current!);
  const animate = (
    tl: gsap.core.Timeline,
    { position, reduced }: PageAnimationData,
    entering: boolean,
  ) => {
    if (!scope.current) return;
    const bases = elements();
    if (!entering) {
      tl.to(
        scope.current,
        {
          clipPath: "inset(100% 0 0)",
          duration: reduced ? 0 : 0.3,
          ease: "im-quint-inout",
        },
        position,
      );
      return;
    }

    const enterPosition = position + (reduced ? 0 : 0.08);
    tl.fromTo(
      scope.current,
      { clipPath: "inset(100% 0 0)" },
      {
        clipPath: "inset(0% 0 0)",
        duration: reduced ? 0 : 0.5,
        ease: "im-quart-inout",
        clearProps: "clipPath",
      },
      enterPosition,
    );

    const alphabet = "ACGT";
    bases.forEach((element, index) => {
      const target = specimen.bases[index];
      if (reduced) {
        tl.call(
          () => {
            element.textContent = target;
          },
          [],
          enterPosition,
        );
        return;
      }

      const start = enterPosition + 0.12 + index * 0.06;
      Array.from({ length: 4 }, (_, step) => {
        const base = alphabet[(specimen.code.charCodeAt(index + step) + step) % alphabet.length];
        tl.call(
          () => {
            element.textContent = base;
          },
          [],
          start + step * 0.11,
        );
      });
      tl.call(
        () => {
          element.textContent = target;
        },
        [],
        start + 0.44,
      );
    });
  };

  usePageTransition({
    scope,
    enterAt: "title-start",
    prepare: () => {
      gsap.set(scope.current, { clipPath: "inset(100% 0 0)" });
      elements().forEach((element) => (element.textContent = "·"));
    },
    leave: (tl, data) => animate(tl, data, false),
    enter: (tl, data) => animate(tl, data, true),
  });

  return (
    <div
      ref={scope}
      aria-hidden="true"
      className="absolute bottom-[24%] left-5 lg:bottom-[27%] lg:left-[44.5%]"
    >
      {specimen.bases.split("").map((base, index) => (
        <span
          key={`${base}-${index}`}
          data-base=""
          className={cn(
            "grid size-8 place-items-center font-display text-lg lg:size-12 lg:text-3xl",
            index % 2 ? "bg-steel" : "bg-silver",
          )}
        >
          {base}
        </span>
      ))}
    </div>
  );
}

function Classification({ specimen }: { specimen: Specimen }) {
  const scope = useRef<HTMLParagraphElement>(null);

  useLayoutEffect(() => {
    if (!scope.current) return;
    const split = SplitText.create(scope.current.querySelector("[data-classification]")!, {
      type: "chars",
      charsClass: "classification-char",
    });
    return () => split.revert();
  }, []);

  const animate = (
    tl: gsap.core.Timeline,
    { position, reduced }: PageAnimationData,
    entering: boolean,
  ) => {
    tl.to(
      ".classification-char",
      {
        yPercent: entering ? 0 : -160,
        duration: reduced ? 0 : entering ? 0.55 : 0.3,
        stagger: { amount: reduced ? 0 : entering ? 0.16 : 0.1 },
        ease: entering ? "im-quart-inout" : "im-quint-inout",
      },
      position,
    );
  };

  usePageTransition({
    scope,
    group: "titles",
    enterAt: "title-start",
    prepare: () => gsap.set(".classification-char", { yPercent: 140 }),
    leave: (tl, data) => animate(tl, data, false),
    enter: (tl, data) => animate(tl, data, true),
  });

  return (
    <section className="absolute inset-x-5 bottom-7 text-center lg:right-[2.5%] lg:bottom-[7%] lg:left-[52%] lg:text-right">
      <p ref={scope} className="font-display text-[clamp(0.9rem,1.5vw,1.45rem)]">
        <span className="mx-[-0.04em] my-[-0.15em] block overflow-hidden px-[0.04em] py-[0.15em]">
          <span data-classification="" className="block [&_.classification-char]:align-top">
            Exotic DNA
          </span>
        </span>
      </p>
      <Title
        index={0}
        total={2}
        className="mx-auto mt-2 text-[clamp(1rem,5vw,4rem)] lg:mr-0 lg:ml-auto lg:text-[clamp(1rem,3vw,4rem)]"
      >
        {specimen.species}
      </Title>
      <Title
        index={1}
        total={2}
        className="mx-auto mt-1 text-[clamp(1rem,5vw,3.25rem)] lg:mr-0 lg:ml-auto lg:text-[clamp(1rem,2.5vw,3.25rem)]"
      >
        {`${specimen.line} / ${specimen.variant}`}
      </Title>
    </section>
  );
}

export function SpecimenDetail({ specimen }: { specimen: Specimen }) {
  const back = useRef<HTMLAnchorElement>(null);

  useStill(back);

  return (
    <>
      {/* portal wraps the whole component: hooks mount with its DOM */}
      <Underlay>
        <Reticle />
      </Underlay>

      <div className="absolute inset-0 z-30">
        <Link
          ref={back}
          to="/"
          className="pointer-events-auto absolute top-20 left-5 inline-flex h-7 items-center gap-2 font-display text-[11px] leading-none hover:opacity-55 focus-visible:outline-2 focus-visible:outline-offset-4 active:opacity-40 lg:top-8 lg:left-[45%] lg:h-9"
        >
          <span
            aria-hidden="true"
            className="grid size-[2.1em] shrink-0 place-items-center rounded-full bg-black text-white"
          >
            <Arrow className="h-[0.87em] w-[0.765em] -translate-x-[0.12em] rotate-180" />
          </span>
          <span className="tracking-[0.32em] [text-box:trim-both_cap_alphabetic]">
            All specimens
          </span>
        </Link>
        <Identity specimen={specimen} />
        <Barcode specimen={specimen} />
        <Bases specimen={specimen} />
        <Classification specimen={specimen} />
      </div>
    </>
  );
}
