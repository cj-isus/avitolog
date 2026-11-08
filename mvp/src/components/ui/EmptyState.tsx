import type { ComponentPropsWithRef, ReactNode } from "react";

export type EmptyStateProps = Omit<ComponentPropsWithRef<"div">, "title"> & {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  compact = false,
  className = "",
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={`ui-empty-state ${compact ? "ui-empty-state--compact" : ""} ${className}`}
      {...props}
    >
      {icon && (
        <span className="ui-empty-state__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action && <div className="ui-empty-state__action">{action}</div>}
    </div>
  );
}
