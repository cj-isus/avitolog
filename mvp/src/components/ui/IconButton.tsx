import { Button, type ButtonProps } from "./Button";

export type IconButtonProps = Omit<ButtonProps, "aria-label"> & {
  label: string;
};

export function IconButton({
  label,
  title = label,
  className = "",
  variant = "ghost",
  ...props
}: IconButtonProps) {
  return (
    <Button
      variant={variant}
      title={title}
      aria-label={label}
      className={`ui-icon-button ${className}`}
      {...props}
    />
  );
}
