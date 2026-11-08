import type { ComponentPropsWithRef } from "react";

export type BadgeTone = "neutral" | "positive" | "warning" | "danger" | "info";
export type BadgeProps = ComponentPropsWithRef<"span"> & { tone?: BadgeTone };

export function Badge({
  tone = "neutral",
  className = "",
  ...props
}: BadgeProps) {
  return (
    <span className={`ui-badge ui-badge--${tone} ${className}`} {...props} />
  );
}
