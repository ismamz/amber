import type { ReactNode } from "react";
import { Link } from "react-router";

export function Notice({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <main className="relative z-30 container grid h-svh place-content-center text-center">
      <p className="font-display text-2xl">{title}</p>
      <Link
        className="pointer-events-auto mt-5 underline underline-offset-4 transition-opacity hover:opacity-55 focus-visible:outline-2 focus-visible:outline-offset-4 active:opacity-40 motion-reduce:transition-none"
        to="/"
      >
        Return to archive
      </Link>
      {children}
    </main>
  );
}
