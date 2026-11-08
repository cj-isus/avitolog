import { useState, type RefObject } from "react";
import { ArrowUpRight, MessageSquareText, Trash2 } from "lucide-react";
import type { Listing } from "../../domain/listing";
import type { Brief } from "../../domain/brief";
import { eligibility } from "../../domain/evaluation";
import {
  eligibilityLabel,
  fieldEvidenceLabel,
  money,
} from "../../lib/presentation";
import { Dialog } from "../../components/ui/Dialog";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Alert } from "../../components/ui/Alert";
import { FactsEditor } from "./FactsEditor";

type Props = {
  listing: Listing;
  brief: Brief;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnFocus: RefObject<HTMLElement | null>;
  onSave: (listing: Listing) => Promise<Listing>;
  onDelete: (id: string) => Promise<void>;
  onNegotiate: () => void;
};
export function ListingDetailDialog({
  listing,
  brief,
  open,
  onOpenChange,
  returnFocus,
  onSave,
  onDelete,
  onNegotiate,
}: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const result = eligibility(listing, brief);
  function changeOpen(next: boolean) {
    if (!next) {
      setConfirmDelete(false);
      setError("");
    }
    onOpenChange(next);
  }
  async function remove() {
    setPending(true);
    try {
      await onDelete(listing.id);
      changeOpen(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setPending(false);
    }
  }
  return (
    <Dialog
      open={open}
      onOpenChange={changeOpen}
      title={listing.title}
      description={
        listing.sourceKind === "demo"
          ? "Вымышленный пример для проверки интерфейса."
          : "Сведения из объявления. Техническое состояние не проверено."
      }
      returnFocus={returnFocus}
      className="listing-dialog"
    >
      <div className="page-stack">
        <div className="detail-price">
          <strong>{money(listing.askingPrice)}</strong>
          <Badge
            tone={
              result.status === "pass"
                ? "positive"
                : result.status === "fail"
                  ? "danger"
                  : "warning"
            }
          >
            {eligibilityLabel(result.status)}
          </Badge>
        </div>
        <dl className="detail-list">
          <div>
            <dt>Колёса</dt>
            <dd>
              {listing.wheel.value ?? "?"}″ ·{" "}
              {fieldEvidenceLabel(listing.wheel.status)}
            </dd>
          </div>
          <div>
            <dt>Рама</dt>
            <dd>
              {listing.frame.value ?? "Неизвестно"} ·{" "}
              {fieldEvidenceLabel(listing.frame.status)}
            </dd>
          </div>
          <div>
            <dt>Диапазон роста</dt>
            <dd>
              {listing.heightMin.value ?? "?"}–{listing.heightMax.value ?? "?"}{" "}
              см · {fieldEvidenceLabel(listing.heightMin.status)} /{" "}
              {fieldEvidenceLabel(listing.heightMax.status)}
            </dd>
          </div>
          <div>
            <dt>Обвес</dt>
            <dd>
              {listing.components.value ?? "Неизвестно"} ·{" "}
              {fieldEvidenceLabel(listing.components.status)}
            </dd>
          </div>
          <div>
            <dt>Ваш резерв</dt>
            <dd>{money(listing.repairReserve)} · не диагностика</dd>
          </div>
          <div>
            <dt>Цена с резервом</dt>
            <dd>{money(listing.askingPrice + listing.repairReserve)}</dd>
          </div>
        </dl>
        {(result.reasons.length > 0 || result.missing.length > 0) && (
          <Alert tone="warning" title="Перед решением">
            {[...result.reasons, ...result.missing].join(". ")}.
          </Alert>
        )}
        <details className="raw-text">
          <summary>Исходное описание</summary>
          <p className="prose">{listing.rawText || "Описание не сохранено."}</p>
        </details>
        <FactsEditor
          key={`${listing.id}:${listing.capturedAt}`}
          listing={listing}
          onSave={onSave}
        />
        {error && <Alert tone="error">{error}</Alert>}
        <div className="form-actions detail-actions">
          {listing.sourceUrl && (
            <a
              className="ui-button ui-button--secondary ui-button--md"
              href={listing.sourceUrl}
              target="_blank"
              rel="noreferrer"
            >
              Источник <ArrowUpRight size={16} aria-hidden="true" />
            </a>
          )}
          <Button
            variant="primary"
            onClick={() => {
              changeOpen(false);
              onNegotiate();
            }}
          >
            <MessageSquareText size={16} aria-hidden="true" /> Подготовить
            вопросы
          </Button>
          <Button
            variant="danger"
            onClick={() =>
              confirmDelete ? void remove() : setConfirmDelete(true)
            }
            disabled={pending}
          >
            <Trash2 size={16} aria-hidden="true" />
            {confirmDelete ? "Подтвердить удаление" : "Удалить карточку"}
          </Button>
          {confirmDelete && (
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
              Отменить удаление
            </Button>
          )}
        </div>
      </div>
    </Dialog>
  );
}
