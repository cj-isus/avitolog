import type { ComponentPropsWithRef, ReactNode } from "react";

export type AlertProps = Omit<ComponentPropsWithRef<"div">, "title"> & {
  tone?: "info" | "success" | "warning" | "error";
  title?: ReactNode;
};

export function Alert({
  tone = "info",
  title,
  children,
  className = "",
  role,
  ...props
}: AlertProps) {
  return (
    <div
      className={`ui-alert ui-alert--${tone} ${className}`}
      role={role ?? (tone === "error" ? "alert" : "status")}
      {...props}
    >
      {title && <strong className="ui-alert__title">{title}</strong>}
      <div className="ui-alert__content">{children}</div>
    </div>
  );
}
