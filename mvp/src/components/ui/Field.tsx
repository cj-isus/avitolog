import {
  createContext,
  useContext,
  useId,
  type AriaAttributes,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";

type FieldContextValue = {
  id: string;
  hintId?: string;
  errorId?: string;
  invalid: boolean;
};
const FieldContext = createContext<FieldContextValue | null>(null);

export type FieldProps = Omit<ComponentPropsWithoutRef<"div">, "children"> & {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  /** Use the same value as the control's id when supplying an explicit id. */
  htmlFor?: string;
  children: ReactNode;
};

/** Keeps the visible label, help text and validation message attached to one native control. */
export function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
  className = "",
  ...props
}: FieldProps) {
  const generatedId = useId();
  const id = htmlFor ?? generatedId;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <FieldContext.Provider
      value={{ id, hintId, errorId, invalid: Boolean(error) }}
    >
      <div className={`ui-field ${className}`} {...props}>
        <label className="ui-field__label" htmlFor={id}>
          {label}
        </label>
        {children}
        {hint && (
          <p className="ui-field__hint" id={hintId}>
            {hint}
          </p>
        )}
        {error && (
          <p className="ui-field__error" id={errorId} role="alert">
            {error}
          </p>
        )}
      </div>
    </FieldContext.Provider>
  );
}

type ControlAttributes = Pick<
  AriaAttributes,
  "aria-describedby" | "aria-invalid"
> & { id?: string };

export function useFieldAttributes(
  props: ControlAttributes,
): ControlAttributes {
  const field = useContext(FieldContext);
  const description = [props["aria-describedby"], field?.hintId, field?.errorId]
    .filter(Boolean)
    .join(" ");
  return {
    id: props.id ?? field?.id,
    "aria-describedby": description || undefined,
    "aria-invalid": props["aria-invalid"] ?? (field?.invalid || undefined),
  };
}
