import gsap from "gsap";
import { Observer } from "gsap/Observer";
import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { useLocation, useNavigate } from "react-router";

import { ArchiveContext, landing, lean, leanTilt, snap, spin } from "@/lib/archive";
import { indexAt, specimenIndex, specimens, step } from "@/lib/specimens";
import { cn } from "@/lib/utils";

gsap.registerPlugin(Observer);

function typing(event: KeyboardEvent) {
  return (
    event.target instanceof Element && event.target.closest("a, button, input, textarea, select")
  );
}

// lives here, not in the page: both pages are mounted mid-transition
// a listener per page would navigate twice
function useBrowse() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const detail = specimenIndex(pathname);
    if (detail < 0) return;
    function browse(event: KeyboardEvent) {
      if (typing(event)) return;
      if (event.key === "Backspace") {
        event.preventDefault();
        navigate("/");
        return;
      }
      const offset = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
      if (!offset) return;
      event.preventDefault();
      const next = (detail + offset + specimens.length) % specimens.length;
      navigate(`/specimens/${specimens[next].slug}`);
    }
    window.addEventListener("keydown", browse);
    return () => window.removeEventListener("keydown", browse);
  }, [navigate, pathname]);
}

function useController(root: RefObject<HTMLDivElement | null>) {
  const [active, setActive] = useState(0);
  const motion = useRef<{
    angle: number;
    target: number;
    velocity: number;
    lastInput: number;
    lastMove: number;
    reduced: boolean;
    dragging: boolean;
    locked: boolean;
    lastDrag: number;
    lean: number;
    leanTarget: number;
    invalidate?: () => void;
  }>({
    angle: 0,
    target: 0,
    velocity: 0,
    lastInput: 0,
    lastMove: 0,
    reduced: false,
    dragging: false,
    locked: false,
    lastDrag: 0,
    lean: 0,
    leanTarget: 0,
  });
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const goTo = useCallback((index: number) => {
    const state = motion.current;
    if (state.locked) return;
    // slots run against the angle: slot -index brings the specimen to the front
    // take the shortest way round from the current slot
    const current = Math.round(state.target / step);
    let delta = (((-index - current) % specimens.length) + specimens.length) % specimens.length;
    if (delta > specimens.length / 2) delta -= specimens.length;
    state.target = (current + delta) * step;
    state.velocity = 0;
    state.lastInput = 0;
    state.invalidate?.();
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const preference = () => {
      motion.current.reduced = media.matches;
    };
    preference();
    media.addEventListener("change", preference);
    return () => media.removeEventListener("change", preference);
  }, []);

  useEffect(() => {
    if (pathname !== "/") return;

    function move(delta: number) {
      const state = motion.current;
      const now = performance.now();
      // wheel/pointer events have no fixed rate: velocity = delta / time since last event
      // blended with the previous value so one spike can't fling the carousel
      const elapsed = Math.min(0.1, Math.max(0.008, (now - state.lastMove) / 1000));
      const sample = Math.max(-spin.max, Math.min(spin.max, -delta / elapsed));
      state.target -= delta;
      state.velocity = state.velocity * 0.6 + sample * 0.4;
      state.lastMove = now;
      state.lastInput = now;
      state.invalidate?.();
    }
    function wheel(event: WheelEvent) {
      if (event.ctrlKey || (event.target instanceof Element && event.target.closest("a, button")))
        return;
      event.preventDefault();
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1;
      const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
      move(Math.max(-240, Math.min(240, delta * unit)) * spin.wheel);
    }
    function key(event: KeyboardEvent) {
      if (typing(event)) return;
      if (event.key === "Enter") {
        event.preventDefault();
        const specimen = specimens[indexAt(motion.current.angle)];
        navigate(`/specimens/${specimen.slug}`);
        return;
      }
      const direction = ["ArrowRight", "ArrowDown"].includes(event.key)
        ? 1
        : ["ArrowLeft", "ArrowUp"].includes(event.key)
          ? -1
          : 0;
      if (!direction) return;
      event.preventDefault();
      motion.current.target = (Math.round(motion.current.target / step) - direction) * step;
      motion.current.velocity = 0;
      motion.current.lastInput = 0;
      motion.current.invalidate?.();
    }
    const surface = root.current;
    if (!surface) return;
    const fling = () => {
      if (!snap) return;
      // on release: pick the slot and glide straight to it
      // coasting first and snapping after reads as two motions
      const state = motion.current;
      const reach = Math.max(-step, Math.min(step, state.velocity * spin.throw));
      state.target = landing(state.target + reach, state.velocity);
      state.lastInput = 0;
    };
    const release = () => {
      motion.current.dragging = false;
      motion.current.leanTarget = 0;
      motion.current.invalidate?.();
      delete surface.dataset.dragging;
    };
    const observer = Observer.create({
      target: surface,
      type: "pointer,touch",
      dragMinimum: 3,
      debounce: false,
      // presses only: a drag released over a link still has to end
      ignoreCheck: (event) =>
        /down|start/.test(event.type) &&
        event.target instanceof Element &&
        !!event.target.closest("a, button"),
      onPress: () => {
        const state = motion.current;
        state.target = state.angle;
        state.velocity = 0;
        state.lastMove = performance.now();
        state.dragging = true;
      },
      onDragStart: () => {
        surface.dataset.dragging = "true";
      },
      onDrag: ({ deltaX, deltaY }) => {
        const delta = Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY;
        move((-delta * spin.drag) / window.innerWidth);
        motion.current.lastDrag = performance.now();
      },
      onDragEnd: fling,
      onRelease: release,
      onMove: ({ event }) => {
        const state = motion.current;
        if (!lean || state.reduced) return;
        // a drag already turns the platform toward the cursor
        // leaning too would double the response
        if (state.dragging) {
          state.leanTarget = 0;
          return;
        }
        const { clientX, clientY } = event as PointerEvent;
        const box = surface.getBoundingClientRect();
        const x = ((clientX - box.left) / box.width) * 2 - 1;
        const y = ((clientY - box.top) / box.height) * 2 - 1;
        // slots run against the angle: pulling the right side forward = negative offset
        state.leanTarget = -x * leanTilt.max * (1 + Math.max(0, -y) * leanTilt.depth);
        state.invalidate?.();
      },
      onHoverEnd: () => {
        motion.current.leanTarget = 0;
        motion.current.invalidate?.();
      },
    });
    // switching windows mid-drag never sends the pointerup
    // disable/enable drops the observer's press
    function blur() {
      if (observer.isDragging) fling();
      observer.disable();
      observer.enable();
      release();
    }
    window.addEventListener("wheel", wheel, { passive: false });
    window.addEventListener("keydown", key);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("wheel", wheel);
      window.removeEventListener("keydown", key);
      window.removeEventListener("blur", blur);
      observer.kill();
      release();
    };
  }, [navigate, pathname, root]);

  return { active, setActive, motion, goTo, pathname };
}

export function Archive({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const { pathname, ...controller } = useController(root);
  useBrowse();

  return (
    <ArchiveContext.Provider value={controller}>
      <div
        ref={root}
        data-archive
        className={cn(
          "relative isolate min-h-svh touch-pinch-zoom bg-pattern select-none",
          pathname === "/" ? "overflow-hidden" : "overflow-x-clip",
          // the carousel only listens for drags on the home route
          pathname === "/" && "cursor-grab data-[dragging=true]:cursor-grabbing",
        )}
      >
        {children}
      </div>
    </ArchiveContext.Provider>
  );
}
