import type { ComponentPropsWithRef } from "react";
import { useFieldAttributes } from "./Field";

export function Textarea({
  className = "",
  ...props
}: ComponentPropsWithRef<"textarea">) {
  const accessibility = useFieldAttributes(props);
  return (
    <textarea
      className={`ui-textarea ${className}`}
      {...props}
      {...accessibility}
    />
  );
}
