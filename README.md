# react-router-gsap-transitions

> Parallel page transitions for React Router v8 on a shared GSAP timeline.

[![cover](public/cover.webp)](https://amber.isma.uy/)

[Live demo ↗](https://amber.isma.uy/)

_The demo is **Amber Genetics**, a fictional lab archive with a React Three Fiber scene._

## Stack

- React Router v8 (SPA + prerender)
- GSAP
- React Three Fiber
- Tailwind v4
- TypeScript
- Vite

## Getting started

```bash
pnpm install
pnpm dev
```

Other scripts: `pnpm build`, `pnpm start`, `pnpm typecheck`, `pnpm lint`, `pnpm format`.

## How the demo is wired

Every navigation builds one paused GSAP timeline. Both pages stay mounted as siblings while it plays: the outgoing one is `inert`, the incoming one is `fixed` above the canvas. The engine is [`@ismamz/hyperkinetic`](https://github.com/ismamz/hyperkinetic), pinned to a commit in `package.json`; its README documents the API, the order of a run and its limits. `pnpm install` builds it from GitHub through its `prepare` script, which the allowlist in `pnpm-workspace.yaml` permits.

Amber's integration is in a few files:

- `app/root.tsx`: app shell, the persistent canvas and `<AnimatedOutlet>`; registers the scene as a transition resource.
- `app/lib/transition.ts`: the global choreography (labels, shared effects) and the fallback that moves anything a component does not animate itself.
- `app/lib/scene.ts`: the promise the lazy scene resolves once it is ready to be shown.
- `app/components/scene.tsx`: the R3F scene, a persistent participant on the same timeline.
- `app/routes/`: archive and specimen detail. Components declare their own recipes with `usePageTransition`.

Details worth knowing:

- GSAP owns animated values; React owns structure and discrete state.
- Scroll is the document's. The site resets it in the transition hooks; `<ScrollRestoration />` stays out of the app on purpose.
- Layer order: reticle 10, canvas 20, UI 30, logo 40. Page content below the canvas renders through `<Underlay>`.
- Reduced motion is honoured on the timeline, the outgoing page is `inert` and links keep a visible focus ring.

## Contributing

Conventional Commits with a lowercase subject. Run `pnpm typecheck` before pushing; the pre-commit hook lints and formats staged files. Specimen data is fictional. Model and font credits live in [public/credits.txt](public/credits.txt).

---

<small>by [isma](https://isma.uy).</small>
