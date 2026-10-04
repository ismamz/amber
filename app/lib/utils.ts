import { useSyncExternalStore } from "react";

export { cn } from "cn";

export const pad = (value: number, length = 2) => String(value).padStart(length, "0");

const subscribe = () => () => {};

// False on the server and during hydration, true after.
// Client-only UI renders without a hydration mismatch.
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
