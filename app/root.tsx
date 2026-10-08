import { AnimatedOutlet, useTransitionResource } from "hyperkinetic";
import { lazy, Suspense, useState } from "react";
import { Links, Meta, Scripts, useLocation } from "react-router";

import { Archive } from "@/components/archive";
import { Header } from "@/components/header";
import { UnderlaySlot } from "@/components/underlay";
import { sceneReady } from "@/lib/scene";
import { config as transition } from "@/lib/transition";
import { useHydrated } from "@/lib/utils";

import type { Route } from "./+types/root";
import "@/lib/eases";

import "@/globals.css";

const Scene = lazy(() =>
  import("@/components/scene").then((module) => ({ default: module.Scene })),
);

// handle 404 and server errors
export { ErrorBoundary } from "@/error";

// global links to be added in the document head
export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Sometype+Mono:wght@400;500&display=swap",
  },
  {
    rel: "preload",
    href: "/fonts/pixelcaps.woff2",
    as: "font",
    type: "font/woff2",
    crossOrigin: "anonymous",
  },
  { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
];

// document's "app shell"
export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:image" content="https://amber.isma.uy/cover.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://amber.isma.uy/cover.jpg" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <Scripts />
        {/* off: jumps scroll mid-transition; transition hooks own it (lib/transition.ts) */}
        {/* <ScrollRestoration /> */}
      </body>
    </html>
  );
}

// default, it can be named `Root` if you want
export default function App() {
  const hydrated = useHydrated();
  const { search } = useLocation();
  // Keep debugging across links that omit the query; reload without it to stop.
  const [debug] = useState(() => import.meta.env.DEV && new URLSearchParams(search).has("debug"));

  // hold transitions until scene can draw
  // declared here: lazy scene mounts too late for first run
  useTransitionResource(() => (sceneReady.settled ? undefined : sceneReady.promise));

  return (
    <Archive>
      <Header />

      {/* portal target: page content under the canvas */}
      <UnderlaySlot />

      {hydrated ? (
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      ) : null}

      <AnimatedOutlet
        {...transition}
        debug={debug ? { devTools: true, retainPages: true } : undefined}
      />
    </Archive>
  );
}
