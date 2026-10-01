// The scene is lazy and client-only, so it mounts a commit after the outlet has
// already collected the resources of the first run. Something mounted from the
// start has to declare its readiness: root registers this promise and the
// platform resolves it once its models are prepared and its shaders are warm.
let settle: () => void = () => {};
let settled = false;
const listeners = new Set<() => void>();
const promise = new Promise<void>((resolve) => {
  settle = resolve;
});

export const sceneReady = {
  promise,
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  get settled() {
    return settled;
  },
  // Idempotent: the platform may remount (StrictMode) after resolving. The
  // offline states resolve it too: a canvas that will never draw must not keep
  // every navigation waiting for the timeout.
  resolve: () => {
    if (settled) return;
    settled = true;
    settle();
    listeners.forEach((listener) => listener());
  },
};
