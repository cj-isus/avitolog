import { useState, type FormEvent, type RefObject } from "react";
import { manualListing } from "../../application/listing-factory";
import type { Listing } from "../../domain/listing";
import { Dialog } from "../../components/ui/Dialog";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Textarea";
import { Alert } from "../../components/ui/Alert";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (listing: Listing) => Promise<Listing>;
  returnFocus: RefObject<HTMLElement | null>;
};
export function ListingImportDialog({
  open,
  onOpenChange,
  onSave,
  returnFocus,
}: Props) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    setError("");
    setPending(true);
    try {
      await onSave(
        manualListing(
          String(values.get("title")),
          Number(values.get("price")),
          String(values.get("url") || "").trim() || null,
          String(values.get("description") || ""),
        ),
      );
      form.reset();
      onOpenChange(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setPending(false);
    }
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!pending) {
          onOpenChange(next);
          setError("");
        }
      }}
      title="Добавить объявление"
      description="Перенесите данные из открытой карточки. Характеристики можно заполнить после сохранения."
      returnFocus={returnFocus}
    >
      <form onSubmit={submit} className="page-stack">
        <Field label="Название">
          <Input
            name="title"
            required
            maxLength={240}
            placeholder="Модель и размер рамы"
          />
        </Field>
        <div className="form-grid">
          <Field label="Цена продавца, ₽">
            <Input
              name="price"
              type="number"
              min={1}
              max={100000000}
              step={1}
              required
            />
          </Field>
          <Field
            label="Ссылка на Avito"
            hint="Необязательно. Только карточка объявления."
          >
            <Input
              name="url"
              type="url"
              maxLength={2048}
              placeholder="https://www.avito.ru/…"
            />
          </Field>
        </div>
        <Field label="Описание продавца">
          <Textarea
            name="description"
            rows={4}
            maxLength={18000}
            placeholder="Комплектация, состояние, обслуживание…"
          />
        </Field>
        {error && (
          <Alert tone="error" title="Не удалось сохранить">
            {error}
          </Alert>
        )}
        <div className="form-actions">
          <Button onClick={() => onOpenChange(false)} disabled={pending}>
            Отмена
          </Button>
          <Button type="submit" variant="primary" disabled={pending}>
            {pending ? "Сохраняем…" : "Сохранить карточку"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
