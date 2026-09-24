# Repository Guidelines

React Router v8 kit for parallel page transitions on one shared GSAP timeline, plus its demo: Amber Genetics, a fictional lab archive of dinosaur specimens rendered with React Three Fiber.

## Agent Notes

- work style: telegraph; noun-phrases ok; drop grammar; min tokens.
- surface assumptions; ask on ambiguity
- minimum code; no speculative abstraction
- surgical edits; match local style; leave adjacent code as it is
- define verification before implementing
- keep responses, file reads, tool output and edits focused on the request; reuse established context
- scale checks to the change: docs-only edits and trivial visual tweaks skip builds and the browser; optional visual review goes to the owner
- finish the implementation, then report what changed, what was checked and what remains to verify; claim only validation that ran

## Coding Style & Naming

- path alias `@/*` → `./app/*`
- kebab-case filenames
- prefer one-word names for files, functions, components
- prefer named exports
- TypeScript strict
- Tailwind v4, CSS-first config in `app/globals.css`
- compose classes with `cn` from `@/lib/utils`
- components: one `className`, minimal props; defaults live inside
- a GSAP plugin used by one component registers in that component's file; `eases.ts` holds app-wide registrations only
- all text is uppercase through the `body` rule in `globals.css`
- specimen data is fictional; DNA sequences use A/C/G/T only
- GLBs: `pnpx @gltf-transform/cli@4.5.0 optimize <in.glb> public/models/<name>.glb --compress meshopt --texture-compress webp --texture-size 1024 --simplify false`, then credit the model in `public/credits.txt`

## Commit & PR Guidelines

- Conventional Commits, lowercase subject: `feat:`, `fix:`, `refactor:`, `chore:`
- short subject, body optional
- PR: link issue, describe user-visible change, before/after media for visual work
- run `pnpm typecheck` before push

## Build & verify

Scripts live in `package.json`. `pnpm typecheck` runs `react-router typegen` first; `pnpm format` (oxfmt) also sorts imports and Tailwind classes. The pre-commit hook runs `oxlint --fix` and `oxfmt` on staged files.

No test runner. After a change to `app/transitions/`, `app/lib/transition.ts` or the scene bridge, validate with the `validate-transitions` skill (`.claude/skills/validate-transitions/SKILL.md`). The skill and the harnesses it runs (`tests/`) are local and untracked; skip this step when they are absent.

## Local drafts

`_draft/` holds the documentation, drafts and decision notes. Like `tests/`, it is local and untracked, and may be absent.

## Decisions

Settled with the owner. Every change follows them.

- **Parallel only.** Both pages always coexist on one timeline. Not built: sequential mode, per-page resources.
- **Frozen API.** One way per concept, with no aliases or legacy names. Every engine feature stays exercised by the demo.
- **Scene.** The R3F canvas is one more persistent participant (`usePersistentTransition` + `useTransitionResource`).
- **Smooth scroll is parked.** Document scroll only; no Lenis, no ScrollTrigger.
- **Accessibility.** The demo covers reduced motion (timeline), an inert outgoing page and visible focus on links.
- **This file belongs to the owner.** Propose any change to `AGENTS.md` as a diff and wait for approval.

## Project structure

```
app/
├── routes/        filesystem routes (@react-router/fs-routes): archive, specimen detail
├── components/    scene (R3F), archive input, specimen UI, mask, underlay, icons
├── lib/           site: transition.ts (choreography + fallback), scene.ts (scene
│                  readiness), archive.ts (carousel state), specimens.ts, eases.ts
├── transitions/   engine
└── root.tsx       app shell: canvas + <AnimatedOutlet>
```

## Transition engine

One paused `gsap.core.Timeline` per navigation. The global choreography, every component recipe and the configured fallback write tweens onto it; the engine plays it, awaits it, then unmounts the outgoing page. API and data shapes: `app/transitions/types.ts`.

Both pages render as siblings inside `[data-wrapper]` during the swap:

```html
<div data-wrapper>
  <div data-page data-page-outgoing inert>…</div>
  <div data-page data-page-incoming>…</div>
</div>
```

On first load the page carries `data-page-initial` until `prepare()` is done; the site hides it with CSS meanwhile.

The engine does not pin pages or reset scroll: the site does it in its hooks. Keep `<ScrollRestoration />` out of the app: it restores scroll while the outgoing page is still visible.

**Order of a run**

```
NAVIGATE (or first load)   both pages mounted, tagged outgoing/incoming
→ before(), beforeEnter()  sync, pre-paint
→ prepare()                recipes + fallback, pre-paint
→ await resources          both pages mounted, outgoing visible; timeout
                           (5 s default) then onIssue, never indefinite
→ prepare()                whatever registers before the timeline is built,
                           as it registers
→ exits                    fallback → persistent → recipes (groups measured)
→ choreograph()            global effects + labels
→ entrances                fallback → persistent → recipes, at their labels
→ play & await tl
→ complete(), afterEnter()
→ unmount outgoing
→ after()                  pre-paint, the old page is gone
```

First load runs the same thing with `initial: true`, no outgoing page and no exits; `<AnimatedOutlet initial={false}>` opts out. A new navigation mid-run kills the active timeline and the stale run bails; the next run gets `interrupted: true`.

Per direction (`leave` / `enter`): function animates, `false` disables, omitted inherits the fallback. Labels belong to the choreography; recipes consume them via `enterAt`, and an unknown label throws. The choreography also gets `leaveEnd(group)`, the measured end of a group's exits, and `ready()`, which releases `useEnterReady()` before the timeline ends.

**Hooks**

- `usePageTransition(recipe)` — page-local recipe, scoped selectors, reverted on unmount.
- `usePersistentTransition(recipe)` — same recipe for components navigation does not unmount; module-level registry, crosses the R3F boundary.
- `useTransitionResource(load)` — return a promise while pending; declare it from a component that is already mounted.
- `useEnterReady()` → boolean latch for intros outside the timeline.

**Site wiring**

`app/lib/transition.ts` is the choreography and the fallback. `app/lib/scene.ts` is the promise the lazy scene resolves; `root.tsx` registers it as a resource.

## Motion & layering

- GSAP owns animated values; React owns structure and discrete state. No per-frame React state.
- One controller per animated property at a time: carousel input at rest, the timeline during navigation.
- Layer order: reticle 10, canvas 20, UI 30, logo 40. The incoming page is `fixed` at z 30 so it stays in the viewport whatever the scroll; as a stacking context it is one layer while it enters. Page content that sits below the canvas renders through `<Underlay>` into the slot below it. Route wrappers and page containers take no opacity or transform.
- Scroll is the document's. `before` sets manual scroll restoration, `beforeEnter` resets scroll when `interrupted`, `afterEnter` resets it while the incoming page is still fixed.
