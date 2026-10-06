import { cn } from "../lib/cn";

/** Envagai mark: a ring broken by a gold heartbeat line. */
export function EnvagaiMark({ inverted, className }: { inverted?: boolean; className?: string }) {
  return (
    <svg viewBox="40 40 944 944" fill="none" aria-hidden="true" className={className}>
      <g stroke={inverted ? "#ffffff" : "var(--color-primary-600)"} strokeWidth={54}>
        <path d="M176 455 A341 341 0 0 1 848 455" />
        <path d="M176 569 A341 341 0 0 0 848 569" />
      </g>
      <path
        d="M75 512 H415 L480 308 L555 715 L618 405 L660 512 H950"
        stroke="var(--color-accent-500)"
        strokeWidth={48}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Brand({ inverted }: { inverted?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <EnvagaiMark inverted={inverted} className="h-9 w-9" />
      <span
        className={cn(
          "text-xs font-bold uppercase tracking-wider",
          inverted ? "text-white" : "text-primary-600",
        )}
      >
        Envagai
      </span>
    </div>
  );
}
