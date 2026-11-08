import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import type { ReactNode, RefObject } from "react";
import { IconButton } from "./IconButton";

export type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  returnFocus?: RefObject<HTMLElement | null>;
};

/** Controlled modal: Base UI owns focus trapping, Escape, outside dismissal and focus restoration. */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className = "",
  returnFocus,
}: DialogProps) {
  return (
    <BaseDialog.Root open={open} onOpenChange={onOpenChange}>
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className="ui-dialog__backdrop" />
        <BaseDialog.Popup
          className={`ui-dialog ${className}`}
          finalFocus={() =>
            returnFocus?.current?.isConnected
              ? returnFocus.current
              : (document.querySelector<HTMLElement>("#workspace-content h1") ??
                document.getElementById("workspace-content"))
          }
        >
          <header className="ui-dialog__header">
            <BaseDialog.Title className="ui-dialog__title">
              {title}
            </BaseDialog.Title>
            <BaseDialog.Description className="ui-dialog__description">
              {description}
            </BaseDialog.Description>
            <BaseDialog.Close
              render={
                <IconButton label="Закрыть окно" className="ui-dialog__close" />
              }
            >
              <X size={20} aria-hidden="true" />
            </BaseDialog.Close>
          </header>
          <div className="ui-dialog__body">{children}</div>
          {footer && <footer className="ui-dialog__footer">{footer}</footer>}
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}
