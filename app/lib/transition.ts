import type { AnimatedOutletProps } from "@ismamz/hyperkinetic";
import { gsap } from "gsap";

import { specimenIndex } from "@/lib/specimens";

export const config = {
  before: () => {
    // React Router leaves history entries on "auto". Back/forward would restore
    // the offset before the first frame and fight the swap.
    history.scrollRestoration = "manual";
  },
  beforeEnter: ({ interrupted }) => {
    // A cut run drops its incoming page back in the flow, at the top.
    // The scroll has to meet it there.
    if (interrupted) window.scrollTo(0, 0);
  },
  afterEnter: () => {
    // The incoming page is still fixed, so it does not move. The outgoing one is gone.
    window.scrollTo(0, 0);
  },
  // Ordinary content. The engine picks every branch no component claimed
  // for this direction.
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
  // The scene is the only resource today. The timeout covers a browser
  // without WebGL, whose canvas never reports ready.
  resources: {
    timeout: 5000,
    onIssue: ({ reason, error }) => {
      console.warn(`Page transition resources: ${reason}`, error ?? "");
    },
  },
  choreograph: ({ tl, current, next, initial, reduced, ready, leaveEnd }) => {
    const at = (seconds: number) => (reduced ? 0 : seconds);

    // Every exit is on the timeline by now.
    const exitEnd = tl.duration();
    // Back to the archive the platform rises under the last exits.
    // Anywhere else the scene moves from the first frame.
    const returning = !initial && next.pathname === "/" && current.pathname !== "/";
    const sceneStart = returning ? Math.max(0, exitEnd - at(0.12)) : 0;
    const entranceStart = returning ? sceneStart + at(0.15) : at(initial ? 0.15 : 0.25);
    // Incoming titles wait for the outgoing ones to leave the spot.
    // On first load they follow the scene's intro instead.
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

    tl.call(ready, [], entranceStart);
  },
} satisfies AnimatedOutletProps;
