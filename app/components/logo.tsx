import { memo } from "react";

import { cn } from "@/lib/utils";

export function AmberIcon({ className }: { className?: string }) {
  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 32 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-9 w-auto shrink-0", className)}
      aria-hidden="true"
    >
      <path d="M9 3L18 0L18 12L9 3Z" fill="#FCE7A6" />
      <path d="M18 0L28 7L18 12L18 0Z" fill="#FBDA7E" />
      <path d="M28 7L31.1769 18L18 12L28 7Z" fill="#F7C550" />
      <path d="M18 12L31.1769 18L13 22L18 12Z" fill="#E7A319" />
      <path d="M31.1769 18L17 36L13 22L31.1769 18Z" fill="#C97F16" />
      <path d="M17 36L5 26L13 22L17 36Z" fill="#A8650F" />
      <path d="M5 26L0 14L13 22L5 26Z" fill="#D89425" />
      <path d="M0 14L9 3L18 12L13 22L0 14Z" fill="#F9C954" />
    </svg>
  );
}

export const Logo = memo(function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <AmberIcon className="transition-[filter] duration-300 ease-[ease] group-hover/logo:drop-shadow-[0_0_7px_rgb(231_163_25_/_35%)] motion-safe:group-hover/logo:animate-logo-dim motion-reduce:group-hover/logo:transition-none" />
      <span className="font-display text-base leading-none tracking-wide uppercase [-webkit-text-stroke:1px_currentColor]">
        Amber
        <span className="hidden text-steel">Genetics</span>
      </span>
    </div>
  );
});
