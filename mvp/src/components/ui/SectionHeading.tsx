import type { ComponentPropsWithRef, ReactNode } from "react";

export type SectionHeadingProps = Omit<
  ComponentPropsWithRef<"div">,
  "title"
> & {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  level?: 1 | 2;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  className = "",
  level = 1,
  ...props
}: SectionHeadingProps) {
  const Heading = level === 1 ? "h1" : "h2";
  return (
    <div className={`ui-section-heading ${className}`} {...props}>
      <div>
        {eyebrow && (
          <span className="ui-section-heading__eyebrow">{eyebrow}</span>
        )}
        <Heading tabIndex={-1}>{title}</Heading>
        {description && (
          <p className="ui-section-heading__description">{description}</p>
        )}
      </div>
      {action && <div className="ui-section-heading__action">{action}</div>}
    </div>
  );
}
