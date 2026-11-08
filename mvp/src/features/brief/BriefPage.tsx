import { useEffect, useRef, useState, type FormEvent } from "react";
import { CheckCheck, ShieldCheck } from "lucide-react";
import { Alert } from "../../components/ui/Alert";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Field } from "../../components/ui/Field";
import { Input } from "../../components/ui/Input";
import { SectionHeading } from "../../components/ui/SectionHeading";
import { Select } from "../../components/ui/Select";
import { BriefSchema, type Brief } from "../../domain/brief";

export type BriefPageProps = {
  brief: Brief;
  onSave: (brief: Brief) => Promise<void>;
};
type BriefFields = { height: string; wheel: string; maxPrice: string };

const validationLabels: Record<keyof BriefFields, string> = {
  height: "Укажите целый рост от 120 до 220 см.",
  wheel: "Укажите положительный диаметр колёс.",
  maxPrice: "Укажите целый бюджет от 1 до 1 000 000 ₽.",
};

function BriefForm({ brief, onSave }: BriefPageProps) {
  const [values, setValues] = useState<BriefFields>({
    height: String(brief.height),
    wheel: String(brief.wheel),
    maxPrice: String(brief.maxPrice),
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const submitting = useRef(false);

  useEffect(() => {
    setValues({
      height: String(brief.height),
      wheel: String(brief.wheel),
      maxPrice: String(brief.maxPrice),
    });
  }, [brief.height, brief.wheel, brief.maxPrice]);

  function update(field: keyof BriefFields, value: string) {
    setValues((previous) => ({ ...previous, [field]: value }));
    setError("");
    setSaved(false);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const parsed = BriefSchema.safeParse({
      height: Number(values.height),
      wheel: Number(values.wheel),
      maxPrice: Number(values.maxPrice),
    });
    if (!parsed.success) {
      const field = parsed.error.issues[0]?.path[0] as
        | keyof BriefFields
        | undefined;
      setError(
        field ? validationLabels[field] : "Проверьте заполненные требования.",
      );
      return;
    }
    submitting.current = true;
    setPending(true);
    setError("");
    setSaved(false);
    try {
      await onSave(parsed.data);
      setSaved(true);
    } catch {
      setError(
        "Не удалось сохранить требования. Изменения остались в форме — попробуйте ещё раз.",
      );
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  return (
    <form
      className="brief-form page-stack"
      onSubmit={submit}
      aria-busy={pending}
    >
      <div className="form-grid">
        <Field
          label="Рост, см"
          hint="Нужен для проверки заявленного диапазона роста."
        >
          <Input
            name="height"
            type="number"
            inputMode="numeric"
            min={120}
            max={220}
            step={1}
            required
            value={values.height}
            onChange={(event) => update("height", event.target.value)}
            disabled={pending}
          />
        </Field>
        <Field label="Диаметр колёс, дюймы">
          <Select
            name="wheel"
            value={values.wheel}
            onChange={(event) => update("wheel", event.target.value)}
            disabled={pending}
          >
            <option value="29">29</option>
            <option value="27.5">27.5</option>
            <option value="26">26</option>
            {![29, 27.5, 26].includes(brief.wheel) && (
              <option value={brief.wheel}>{brief.wheel}</option>
            )}
          </Select>
        </Field>
        <Field
          label="Бюджет с заданным резервом, ₽"
          hint="К цене объявления прибавляем резерв, который вы указали в карточке."
        >
          <Input
            name="maxPrice"
            type="number"
            inputMode="numeric"
            min={1}
            max={1000000}
            step={1}
            required
            value={values.maxPrice}
            onChange={(event) => update("maxPrice", event.target.value)}
            disabled={pending}
          />
        </Field>
      </div>
      {error && <Alert tone="error">{error}</Alert>}
      {saved && (
        <Alert tone="success">
          Требования сохранены. Статусы карточек пересчитаны.
        </Alert>
      )}
      <div className="form-actions">
        <Button variant="primary" type="submit" disabled={pending}>
          <CheckCheck size={17} aria-hidden="true" />
          {pending ? "Сохраняем…" : "Сохранить требования"}
        </Button>
      </div>
    </form>
  );
}

export function BriefPage({ brief, onSave }: BriefPageProps) {
  return (
    <div className="page-stack">
      <SectionHeading
        eyebrow="05 / ВАШИ УСЛОВИЯ"
        title="Задача поиска"
        description="Обязательные параметры задают первичный отбор. Неизвестные сведения остаются поводом для уточнения."
      />
      <div className="market-grid">
        <Card>
          <BriefForm brief={brief} onSave={onSave} />
        </Card>
        <Card className="prose">
          <span className="eyebrow">ПЕРЕД ВЫБОРОМ</span>
          <h3>Совпадение — первый шаг</h3>
          <p>
            Рост, колёса и цена помогают отсеять неподходящие варианты. Точная
            геометрия рамы, посадка и техническое состояние требуют отдельной
            проверки.
          </p>
          <Alert
            title={
              <>
                <ShieldCheck size={16} aria-hidden="true" /> Прозрачные
                ограничения
              </>
            }
          >
            Резерв задаёте вы. Приложение не рассчитывает стоимость ремонта по
            описанию и не подтверждает исправность велосипеда.
          </Alert>
        </Card>
      </div>
    </div>
  );
}
