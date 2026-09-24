import { memo } from "react";
import { Link } from "react-router";

import { GithubIcon } from "@/components/icons/github";
import { Logo } from "@/components/logo";

export const Header = memo(function Header() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-40 container flex items-center justify-between pt-6 sm:pt-8">
      <Link
        to="/"
        aria-label="Amber Genetics"
        className="pointer-events-auto block transition-opacity hover:opacity-55 focus-visible:outline-2 focus-visible:outline-offset-4 active:opacity-40 motion-reduce:transition-none"
      >
        <Logo className="gap-1.5 sm:gap-2 [&>span]:text-[0.8rem] sm:[&>span]:text-base [&>svg]:h-7 sm:[&>svg]:h-9" />
      </Link>
      <a
        href="https://github.com/ismamz/react-router-gsap-transitions"
        target="_blank"
        rel="noreferrer"
        aria-label="Open GitHub in a new tab"
        className="pointer-events-auto grid size-8 place-items-center transition-opacity hover:opacity-55 focus-visible:outline-2 focus-visible:outline-offset-4 motion-reduce:transition-none sm:size-9"
      >
        <GithubIcon className="size-6 fill-current sm:size-8" />
      </a>
    </div>
  );
});
