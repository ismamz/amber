import { memo, useSyncExternalStore } from "react";
import { Link } from "react-router";

import { GithubIcon } from "@/components/icons/github";
import { Logo } from "@/components/logo";
import { sceneReady } from "@/lib/scene";

export const Header = memo(function Header({ showLogo = false }: { showLogo?: boolean }) {
  const sceneIsReady = useSyncExternalStore(
    sceneReady.subscribe,
    () => sceneReady.settled,
    () => false,
  );
  const ready = showLogo || sceneIsReady;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-40 container flex items-center justify-between pt-6 sm:pt-8">
      <Link
        to="/"
        aria-label="Amber Genetics"
        tabIndex={ready ? undefined : -1}
        className={`logo-link pointer-events-auto block focus-visible:outline-2 focus-visible:outline-offset-4 motion-reduce:transition-none ${ready ? "opacity-100" : "pointer-events-none opacity-0"}`}
      >
        <Logo className="gap-1.5 sm:gap-2 [&>span]:text-[0.8rem] sm:[&>span]:text-base [&>svg]:h-7 sm:[&>svg]:h-9" />
      </Link>
      <div className={`flex items-center gap-4 sm:gap-6 ${sceneIsReady ? "visible" : "invisible"}`}>
        <a
          href="https://tympanus.net/codrops/"
          target="_blank"
          rel="noreferrer"
          className="pointer-events-auto max-w-32 text-right text-[0.625rem] leading-tight tracking-wider underline decoration-silver underline-offset-3 focus-visible:outline-2 focus-visible:outline-offset-4 sm:max-w-none sm:text-xs"
        >
          <span className="whitespace-nowrap sm:hidden">
            Codrops Tutorial <span aria-hidden="true">↗</span>
          </span>
          <span className="hidden sm:inline">
            Read the tutorial in Codrops <span aria-hidden="true">↗</span>
          </span>
        </a>
        <a
          href="https://github.com/ismamz/amber"
          target="_blank"
          rel="noreferrer"
          aria-label="Open GitHub in a new tab"
          className="pointer-events-auto grid size-8 place-items-center transition-opacity hover:opacity-55 focus-visible:outline-2 focus-visible:outline-offset-4 motion-reduce:transition-none sm:size-9"
        >
          <GithubIcon className="size-6 fill-current sm:size-8" />
        </a>
      </div>
    </div>
  );
});
