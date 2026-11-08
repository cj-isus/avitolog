import { Bike } from "lucide-react";
import type { ComponentPropsWithRef } from "react";

export type BikeIllustrationProps = ComponentPropsWithRef<"div"> & {
  tone?: "lime" | "cyan" | "amber";
  label?: string;
};

/** Decorative package icon; never presented as a photograph of the listing. */
export function BikeIllustration({
  tone = "lime",
  label,
  className = "",
  ...props
}: BikeIllustrationProps) {
  return (
    <div
      className={`ui-bike-illustration ui-bike-illustration--${tone} ${className}`}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      {...props}
    >
      <span className="ui-bike-illustration__orbit" />
      <Bike
        className="ui-bike-illustration__bike"
        size={220}
        strokeWidth={0.8}
        aria-hidden="true"
      />
    </div>
  );
}
