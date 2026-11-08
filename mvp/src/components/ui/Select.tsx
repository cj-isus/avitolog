import type { ComponentPropsWithRef } from "react";
import { useFieldAttributes } from "./Field";

export function Select({
  className = "",
  ...props
}: ComponentPropsWithRef<"select">) {
  const accessibility = useFieldAttributes(props);
  return (
    <select
      className={`ui-select ${className}`}
      {...props}
      {...accessibility}
    />
  );
}
