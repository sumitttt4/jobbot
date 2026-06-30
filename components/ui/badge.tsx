import * as React from "react";
import { cn } from "@/lib/utils";

// Monochrome by design. "accent" is the only non-gray tone, used sparingly.
type Tone = "default" | "accent" | "outline";

const TONES: Record<Tone, string> = {
  default: "bg-subtle text-muted border border-line",
  accent: "bg-accent-weak text-accent border border-transparent",
  outline: "bg-transparent text-ink border border-line",
};

export function Badge({
  tone = "default",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        TONES[tone],
        className
      )}
      {...props}
    />
  );
}

/** Skill chip. */
export function Pill({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border border-line bg-subtle px-2.5 py-1 text-sm text-ink",
        className
      )}
      {...props}
    />
  );
}
