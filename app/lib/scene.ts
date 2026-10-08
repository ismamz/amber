// The scene is lazy and mounts after the first run collected its resources.
// Root registers this promise instead. The platform resolves it once its models
// are prepared and its shaders are warm.
let settle: () => void = () => {};
let settled = false;
const listeners = new Set<() => void>();
const promise = new Promise<void>((resolve) => {
  settle = resolve;
});

export const sceneReady = {
  promise,
  // The current page run may stop waiting before the lazy platform mounts.
  waiting: true,
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  get settled() {
    return settled;
  },
  // Idempotent: the platform may remount (StrictMode) after resolving.
  // The offline states resolve it too, or every navigation waits for the timeout.
  resolve: () => {
    if (settled) return;
    settled = true;
    settle();
    listeners.forEach((listener) => listener());
  },
};
