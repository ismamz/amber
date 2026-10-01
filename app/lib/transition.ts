import { gsap } from "gsap";

import { specimenIndex } from "@/lib/specimens";
import type { AnimatedOutletProps } from "@/transitions";

export const config = {
  before: () => {
    // Scroll restoration is recorded per history entry, and React Router's
    // entries stay on "auto": left alone, back/forward would restore an offset
    // before the first frame and fight the swap.
    history.scrollRestoration = "manual";
  },
  beforeEnter: ({ next, interrupted }) => {
    // A cut run leaves its fixed incoming page back in the flow, at the top of
    // the document: the scroll has to meet it there.
    if (interrupted) window.scrollTo(0, 0);
    // Home has no rules to draw: GSAP warns about an empty NodeList target.
    const lines = next.container.querySelectorAll("[data-transition-line]");
    if (lines.length) {
      gsap.set(lines, { scaleX: 0, transformOrigin: "left center" });
    }
  },
  afterEnter: () => {
    // Still fixed, the incoming page does not move; the outgoing one has left.
    window.scrollTo(0, 0);
  },
  // Ordinary content: no attribute, no prop. The engine picks every branch of
  // the page that no component claimed for this direction.
  fallback: {
    enterAt: "entrance-start",
    prepare: ({ targets }) => {
      gsap.set(targets, { autoAlpha: 0 });
    },
    leave: (tl, { targets, position, reduced }) => {
      tl.to(
        targets,
        {
          autoAlpha: 0,
          duration: reduced ? 0 : 0.35,
          stagger: reduced ? 0 : 0.035,
          ease: "im-quint-inout",
        },
        position,
      );
    },
    enter: (tl, { targets, position, reduced }) => {
      tl.to(
        targets,
        {
          autoAlpha: 1,
          duration: reduced ? 0 : 0.7,
          stagger: reduced ? 0 : 0.07,
          ease: "im-quart-inout",
          clearProps: "opacity,visibility",
        },
        position,
      );
    },
  },
  // Registered readiness. The scene's models and shader warm-up are the only
  // resource today; the timeout keeps a browser without WebGL from waiting on a
  // canvas that will never report ready.
  resources: {
    timeout: 5000,
    onIssue: ({ reason, error }) => {
      console.warn(`Page transition resources: ${reason}`, error ?? "");
    },
  },
  choreograph: ({ tl, current, next, initial, reduced, ready, leaveEnd }) => {
    const at = (seconds: number) => (reduced ? 0 : seconds);

    // Standalone rules keep their own scaleX choreography: they read as
    // drawn lines, not as content that fades.
    const lines = "[data-transition-line]";
    const outgoingLines = initial ? [] : current.container.querySelectorAll(lines);
    const incomingLines = next.container.querySelectorAll(lines);
    if (outgoingLines.length) {
      tl.to(
        outgoingLines,
        {
          scaleX: 0,
          transformOrigin: "left center",
          duration: at(0.3),
          stagger: { each: at(0.05), from: "end" },
          ease: "im-quint-inout",
        },
        0,
      );
    }

    // Every exit is on the timeline by now, so its real end can be read.
    const exitEnd = tl.duration();
    // Back to the archive, the platform rises under the detail's last exits.
    // Anywhere else the scene moves from the first frame.
    const returning = !initial && next.pathname === "/" && current.pathname !== "/";
    const sceneStart = returning ? Math.max(0, exitEnd - at(0.12)) : 0;
    const entranceStart = returning ? sceneStart + at(0.15) : at(initial ? 0.15 : 0.25);
    // Incoming titles take the spot the outgoing ones leave, so they wait for
    // them. The first load has none: its titles follow the scene's intro.
    const titleStart = Math.max(
      entranceStart,
      leaveEnd("titles"),
      initial ? at(next.pathname === "/" ? 0.45 : 0.3) : 0,
    );
    const betweenDetails =
      specimenIndex(current.pathname) >= 0 && specimenIndex(next.pathname) >= 0;
    const identityStart = betweenDetails
      ? Math.max(entranceStart, leaveEnd("identity") - at(0.25))
      : entranceStart + at(0.2);
    tl.addLabel("exit-end", exitEnd);
    tl.addLabel("scene-start", sceneStart);
    tl.addLabel("entrance-start", entranceStart);
    tl.addLabel("title-start", titleStart);
    tl.addLabel("identity-start", identityStart);

    if (incomingLines.length) {
      tl.to(
        incomingLines,
        {
          scaleX: 1,
          duration: at(0.65),
          stagger: at(0.09),
          ease: "im-quart-inout",
          clearProps: "transform,transformOrigin",
        },
        entranceStart,
      );
    }

    tl.call(ready, [], entranceStart);
  },
} satisfies AnimatedOutletProps;
