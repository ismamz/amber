import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useEffect, useRef, type RefObject } from "react";

const prompt = [
  "> access security",
  "access: permission denied.",
  "> access security grid",
  "access: permission denied.",
  "> access main security grid",
  "access: permission denied....and....",
];

const loop = Array.from({ length: 10 }, () => "You didn't say the magic word!");

export function Magic({ dialog }: { dialog: RefObject<HTMLDialogElement | null> }) {
  const screen = useRef<HTMLDivElement>(null);
  const typing = useRef<gsap.core.Timeline>(null);

  useGSAP(
    () => {
      // GSAP only runs the callback while some condition matches, hence `motion`.
      gsap.matchMedia().add(
        {
          reduce: "(prefers-reduced-motion: reduce)",
          motion: "(prefers-reduced-motion: no-preference)",
        },
        ({ conditions }) => {
          const lines = gsap.utils.toArray<HTMLElement>("[data-line]");
          if (conditions?.reduce) {
            gsap.set(lines, { autoAlpha: 1 });
            return;
          }
          typing.current = gsap
            .timeline({ paused: true, repeat: -1, repeatDelay: 1.2 })
            .set(lines, { autoAlpha: 0 })
            .to(lines, { autoAlpha: 1, duration: 0, stagger: 0.22 });
        },
        screen,
      );
    },
    { scope: screen },
  );

  // React's onToggle doesn't fire for <dialog>, so listen natively.
  // Pause, don't revert: the text stays on screen while the window closes.
  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    const toggle = () => (node.open ? typing.current?.restart() : typing.current?.pause());
    node.addEventListener("toggle", toggle);
    return () => node.removeEventListener("toggle", toggle);
  }, [dialog]);

  return (
    <dialog
      ref={dialog}
      aria-labelledby="magic-title"
      // Safari has no `closedby`, so a click on the backdrop closes by hand.
      onClick={(event) => event.target === event.currentTarget && event.currentTarget.close()}
      className="pointer-events-auto m-auto w-[min(34rem,calc(100vw-2rem))] scale-75 border-2 border-black bg-silver p-0 text-black opacity-0 transition-[opacity,scale,display,overlay] transition-discrete duration-250 ease-[cubic-bezier(.77,0,.18,1)] backdrop:bg-transparent open:scale-100 open:animate-error open:opacity-100 motion-reduce:animate-none motion-reduce:transition-none"
    >
      <div className="flex h-6 border-b-2 border-black bg-[#1f2dbf]">
        <h2
          id="magic-title"
          className="flex-1 self-center pl-6 text-center font-display text-xs text-white"
        >
          whte_rbt.obj
        </h2>
        <button
          type="button"
          aria-label="Close"
          autoFocus
          onClick={() => dialog.current?.close()}
          className="grid w-6 cursor-pointer place-items-center border-l-2 border-black text-white transition-colors duration-300 hover:bg-white hover:text-black focus-visible:bg-white focus-visible:text-black focus-visible:outline-none motion-reduce:transition-none"
        >
          <svg aria-hidden="true" width="8" height="8" viewBox="0 0 8 8">
            <path d="M1 1l6 6M7 1L1 7" stroke="currentColor" strokeWidth="2" />
          </svg>
        </button>
      </div>
      <div className="p-2">
        <div
          ref={screen}
          className="border-2 border-black bg-[#1f2dbf] px-3 py-2 font-mono leading-relaxed text-white sm:text-xs"
        >
          {prompt.map((line, index) => (
            <p key={index}>{line}</p>
          ))}
          {loop.map((line, index) => (
            <p key={index} data-line="" className="invisible" aria-hidden={index > 0 || undefined}>
              {line}
            </p>
          ))}
        </div>
      </div>
    </dialog>
  );
}
