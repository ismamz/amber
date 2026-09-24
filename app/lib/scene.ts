// The scene is lazy and client-only, so it mounts a commit after the outlet has
// already collected the resources of the first run. Something mounted from the
// start has to declare its readiness: root registers this promise and the
// platform resolves it once its models are prepared and its shaders are warm.
let settle: () => void = () => {};
let settled = false;
const promise = new Promise<void>((resolve) => {
  settle = resolve;
});

export const sceneReady = {
  promise,
  get settled() {
    return settled;
  },
  // Idempotent: the platform may remount (StrictMode) after resolving. The
  // offline states resolve it too: a canvas that will never draw must not keep
  // every navigation waiting for the timeout.
  resolve: () => {
    settled = true;
    settle();
  },
};
