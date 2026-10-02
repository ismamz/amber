import { useSyncExternalStore } from "react";

export { cn } from "cn";

export const pad = (value: number, length = 2) => String(value).padStart(length, "0");

const subscribe = () => () => {};

// False on the server and during hydration, true after: client-only UI renders
// without a hydration mismatch or a set-state-in-effect pass.
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
