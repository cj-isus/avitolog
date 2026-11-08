import { useState, type FormEvent } from "react";
import { Copy, MessageSquareText, Sparkles } from "lucide-react";
import type { Brief } from "../../domain/brief";
import type { Listing } from "../../domain/listing";
import { draft } from "../../domain/negotiation";
import { money } from "../../lib/presentation";
import { Alert } from "../../components/ui/Alert";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { Field } from "../../components/ui/Field";
import { Input } from "../../components/ui/Input";
import { SectionHeading } from "../../components/ui/SectionHeading";
import { Textarea } from "../../components/ui/Textarea";

export type NegotiationPageProps = {
  listing: Listing | undefined;
  brief: Brief;
};

/** A different listing or saved snapshot gets its own editing session. */
export function NegotiationPage({ listing, brief }: NegotiationPageProps) {
  if (!listing)
    return (
      <EmptyState
        icon={<MessageSquareText size={36} />}
        title="Сначала выберите велосипед"
        description="Добавьте карточку или загрузите демо на радаре. Здесь подготовим вопросы и предложение для выбранного варианта."
      />
    );
  return (
    <NegotiationSession
      key={`${listing.id}:${listing.capturedAt}`}
      listing={listing}
      brief={brief}
    />
  );
}

function NegotiationSession({
  listing,
  brief,
}: {
  listing: Listing;
  brief: Brief;
}) {
  const [offer, setOffer] = useState("");
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [copying, setCopying] = useState(false);
  const maximumOffer = Math.max(
    0,
    Math.min(listing.askingPrice, brief.maxPrice - listing.repairReserve),
  );
  const questions = draft(listing, null).questions;

  function createDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    try {
      const amount = offer.trim() ? Number(offer) : null;
      if (amount !== null && amount + listing.repairReserve > brief.maxPrice) {
        throw new Error("Предложение с заданным резервом выше вашего бюджета");
      }
      setText(draft(listing, amount).text);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  }

  async function copyDraft() {
    if (!text.trim() || copying) return;
    setError("");
    setNotice("");
    setCopying(true);
    try {
      if (!navigator.clipboard?.writeText)
        throw new Error(
          "Буфер обмена недоступен. Выделите и скопируйте текст вручную.",
        );
      await navigator.clipboard.writeText(text);
      setNotice("Текст скопирован. Перед отправкой проверьте сумму и вопросы.");
    } catch {
      setError(
        "Не удалось скопировать текст: браузер не дал доступ к буферу обмена. Выделите и скопируйте его вручную.",
      );
    } finally {
      setCopying(false);
    }
  }

  return (
    <div className="page-stack">
      <SectionHeading
        eyebrow="04 / ДИАЛОГ"
        title="Сначала вопросы. Затем предложение."
        description="Уточните размер и состояние. Цена в черновике зависит от вашего решения и результатов осмотра."
      />
      <div className="negotiation-grid">
        <Card className="page-stack">
          <div>
            <Badge tone={listing.sourceKind === "demo" ? "warning" : "info"}>
              {listing.sourceKind === "demo"
                ? "Вымышленный пример"
                : "Сохранённая карточка"}
            </Badge>
            <h3>{listing.title}</h3>
            <p className="prose muted">
              Цена в карточке — {money(listing.askingPrice)}. Ваш бюджет —{" "}
              {money(brief.maxPrice)}, заданный резерв —{" "}
              {money(listing.repairReserve)}.
            </p>
          </div>
          <form className="page-stack" onSubmit={createDraft}>
            <Field
              label="Ваше предложение, ₽"
              hint={
                maximumOffer > 0
                  ? `Не выше ${money(maximumOffer)} с учётом бюджета и резерва. Оставьте пустым, чтобы подготовить только вопросы.`
                  : "Резерв исчерпывает бюджет. Можно подготовить вопросы без предложения цены."
              }
            >
              <Input
                name="offer"
                type="number"
                inputMode="numeric"
                min={1}
                max={maximumOffer || 0}
                step={1}
                value={offer}
                onChange={(event) => setOffer(event.target.value)}
                placeholder="Сумма после вашей оценки"
              />
            </Field>
            <div className="form-actions">
              <Button variant="primary" type="submit">
                <Sparkles size={17} aria-hidden="true" />
                Подготовить черновик
              </Button>
            </div>
          </form>
          <div>
            <h3>Что стоит уточнить</h3>
            <ol className="prose">
              {questions.map((question) => (
                <li key={question}>{question}</li>
              ))}
            </ol>
          </div>
        </Card>
        <Card className="page-stack">
          <div>
            <Badge>Локальный черновик</Badge>
            <h3>Ваше сообщение</h3>
            <p className="prose muted">
              Отредактируйте формулировку перед использованием. Текст доступен
              на этом экране до смены карточки или раздела.
            </p>
          </div>
          <Field label="Текст для продавца">
            <Textarea
              className="draft-text"
              name="draft"
              value={text}
              onChange={(event) => {
                setText(event.target.value);
                setNotice("");
              }}
              placeholder="Подготовьте черновик, затем при необходимости измените текст."
              rows={12}
            />
          </Field>
          <div className="form-actions">
            <Button onClick={copyDraft} disabled={!text.trim() || copying}>
              <Copy size={17} aria-hidden="true" />
              {copying ? "Копируем…" : "Скопировать текст"}
            </Button>
          </div>
          <p className="prose muted">
            Черновик составлен по шаблону. ИИ и переписка с продавцом пока не
            подключены.
          </p>
        </Card>
      </div>
      {error && <Alert tone="error">{error}</Alert>}
      {notice && <Alert tone="success">{notice}</Alert>}
    </div>
  );
}
