import { Input as BaseInput } from "@base-ui/react/input";
import type { ComponentPropsWithRef } from "react";
import { useFieldAttributes } from "./Field";

export function Input({
  className = "",
  ...props
}: ComponentPropsWithRef<"input">) {
  const accessibility = useFieldAttributes(props);
  return (
    <BaseInput
      className={`ui-input ${className}`}
      {...props}
      {...accessibility}
    />
  );
}
