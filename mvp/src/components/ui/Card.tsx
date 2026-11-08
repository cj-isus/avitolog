import type { ComponentPropsWithRef } from "react";

export function Card({
  className = "",
  ...props
}: ComponentPropsWithRef<"section">) {
  return <section className={`ui-card ${className}`} {...props} />;
}
