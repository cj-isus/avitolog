import { useState, type FormEvent } from "react";
import { ListingSchema, type Listing } from "../../domain/listing";
import { Alert } from "../../components/ui/Alert";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";

export type FactsEditorProps = {
  listing: Listing;
  onSave: (listing: Listing) => Promise<Listing>;
};

/** The caller keys this editor by listing id and capturedAt to isolate unsaved revisions. */
export function FactsEditor({ listing, onSave }: FactsEditorProps) {
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    const values = new FormData(event.currentTarget);
    const text = (name: string) =>
      String(values.get(name) ?? "").trim() || null;
    const number = (name: string) => {
      const value = text(name);
      return value === null ? null : Number(value);
    };
    const claim = <T,>(
      previous: {
        value: T | null;
        status: Listing["wheel"]["status"];
        sourceRefs: string[];
      },
      value: T | null,
    ) => {
      if (value === previous.value) return previous;
      return {
        value,
        status:
          value === null ? ("unknown" as const) : ("seller_claim" as const),
        sourceRefs: value === null ? [] : [`manual-entry:${listing.id}`],
      };
    };

    setSaving(true);
    setError("");
    try {
      const heightMin = number("heightMin");
      const heightMax = number("heightMax");
      if (heightMin !== null && heightMax !== null && heightMin > heightMax) {
        throw new Error("Минимальный рост не может быть выше максимального");
      }
      const next = ListingSchema.parse({
        ...listing,
        capturedAt: new Date().toISOString(),
        wheel: claim(listing.wheel, number("wheel")),
        frame: claim(listing.frame, text("frame")?.toUpperCase() ?? null),
        heightMin: claim(listing.heightMin, heightMin),
        heightMax: claim(listing.heightMax, heightMax),
        components: claim(listing.components, text("components")),
        repairReserve: number("reserve"),
        group: text("group") ?? "unclassified",
      });
      await onSave(next);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setSaving(false);
    }
  }

  return (
    <details className="facts-editor">
      <summary>Внести заявленные характеристики</summary>
      <p className="prose muted">
        Перенесите сведения из объявления. Изменённое значение станет заявлением
        продавца; пустое поле останется неизвестным. Сохранение резерва не
        подтверждает остальные характеристики.
      </p>
      <form className="page-stack" onSubmit={submit}>
        <div className="form-grid">
          <Field label="Колёса, дюймы">
            <Select name="wheel" defaultValue={listing.wheel.value ?? ""}>
              <option value="">Неизвестно</option>
              <option value="29">29</option>
              <option value="27.5">27.5</option>
              <option value="26">26</option>
              {listing.wheel.value !== null &&
                ![29, 27.5, 26].includes(listing.wheel.value) && (
                  <option value={listing.wheel.value}>
                    {listing.wheel.value}
                  </option>
                )}
            </Select>
          </Field>
          <Field
            label="Маркировка рамы"
            hint="Например XL. Буквенная маркировка сама по себе не подтверждает посадку."
          >
            <Input
              name="frame"
              defaultValue={listing.frame.value ?? ""}
              maxLength={120}
            />
          </Field>
          <Field label="Рост от, см">
            <Input
              name="heightMin"
              type="number"
              min={100}
              max={230}
              step={1}
              defaultValue={listing.heightMin.value ?? ""}
            />
          </Field>
          <Field label="Рост до, см">
            <Input
              name="heightMax"
              type="number"
              min={100}
              max={230}
              step={1}
              defaultValue={listing.heightMax.value ?? ""}
            />
          </Field>
        </div>
        <Field
          label="Обвес"
          hint="Укажите конкретные модели компонентов, если они известны."
        >
          <Input
            name="components"
            defaultValue={listing.components.value ?? ""}
            maxLength={250}
          />
        </Field>
        <Field
          label="Заданный вами резерв, ₽"
          hint="Ваша оценка дополнительных расходов. Это не стоимость установленного ремонта."
        >
          <Input
            name="reserve"
            type="number"
            min={0}
            max={100000}
            step={1}
            defaultValue={listing.repairReserve}
            required
          />
        </Field>
        <Field
          label="Группа для ручного сравнения"
          hint="Объединяйте одну модель с близким годом и комплектацией. Пустая группа исключает карточку из ценового сравнения."
        >
          <Input
            name="group"
            defaultValue={listing.group === "unclassified" ? "" : listing.group}
            maxLength={100}
            placeholder="Модель / год / комплектация"
          />
        </Field>
        {error && <Alert tone="error">{error}</Alert>}
        <div className="form-actions">
          <Button type="submit" disabled={saving}>
            {saving ? "Сохраняем…" : "Сохранить сведения"}
          </Button>
        </div>
      </form>
    </details>
  );
}
