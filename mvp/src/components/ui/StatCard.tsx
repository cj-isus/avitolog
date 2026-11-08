import type { ComponentPropsWithRef, ReactNode } from "react";

export type StatCardProps = ComponentPropsWithRef<"article"> & {
  label: string;
  value: ReactNode;
  note?: string;
  tone?: "neutral" | "positive" | "warning" | "info";
  icon?: ReactNode;
};

export function StatCard({
  label,
  value,
  note,
  tone = "neutral",
  icon,
  className = "",
  ...props
}: StatCardProps) {
  return (
    <article
      className={`ui-stat-card ui-stat-card--${tone} ${className}`}
      {...props}
    >
      <div className="ui-stat-card__label">
        <span>{label}</span>
        {icon && <span aria-hidden="true">{icon}</span>}
      </div>
      <strong className="ui-stat-card__value">{value}</strong>
      {note && <small className="ui-stat-card__note">{note}</small>}
    </article>
  );
}
