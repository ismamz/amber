import gsap from "gsap";

function timing(entering: boolean, reduced: boolean) {
  const pace = reduced ? 0 : entering ? 1 : 0.6;
  return {
    pace,
    duration: 0.85 * pace,
    offset: 0.3 * pace,
    spread: 0.22 * pace,
    ease: entering ? "im-quart-inout" : "im-quint-inout",
  };
}

export function animateMask(
  timeline: gsap.core.Timeline,
  title: HTMLElement,
  entering: boolean,
  position: number,
  reduced: boolean,
  index = 0,
) {
  const { pace, duration, offset, spread, ease } = timing(entering, reduced);
  const block = title.querySelector("[data-title-block]");
  const chars = title.querySelectorAll(".title-char");
  const start = position + index * 0.1 * pace;
  if (entering) {
    timeline.fromTo(block, { scaleX: 0 }, { scaleX: 1, duration, ease }, start);
    timeline.fromTo(
      chars,
      { yPercent: 100 },
      { yPercent: 0, duration, ease, stagger: { amount: spread } },
      start + offset,
    );
  } else {
    timeline.to(
      chars,
      { yPercent: 100, duration, ease, stagger: { amount: spread, from: "end" } },
      start,
    );
    timeline.to(block, { scaleX: 0, duration, ease }, start + offset + spread);
  }
  return start + offset + spread + duration;
}

export function animateCaption(
  timeline: gsap.core.Timeline,
  caption: HTMLElement,
  entering: boolean,
  position: number,
  reduced: boolean,
) {
  const { duration, offset, ease } = timing(entering, reduced);
  const details = caption.querySelectorAll("[data-caption-details]");
  if (entering) timeline.set(caption, { opacity: 1, y: 0 }, position);
  if (!details.length) return;
  if (entering) {
    timeline.fromTo(details, { opacity: 0 }, { opacity: 1, duration, ease }, position + offset);
  } else {
    timeline.to(details, { opacity: 0, duration, ease }, position);
  }
}

export function cascade(
  position: number,
  index: number,
  count: number,
  entering: boolean,
  reduced: boolean,
) {
  return {
    start: reduced
      ? position
      : entering
        ? position + 0.1 + index * 0.09
        : position + (count - 1 - index) * 0.05,
    duration: reduced ? 0 : entering ? 0.65 : 0.3,
    ease: entering ? "im-quart-inout" : "im-quint-inout",
  };
}
