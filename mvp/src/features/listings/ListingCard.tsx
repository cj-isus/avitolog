import { ArrowUpRight, MapPin } from "lucide-react";
import type { Listing } from "../../domain/listing";
import type { Brief } from "../../domain/brief";
import { eligibility } from "../../domain/evaluation";
import {
  eligibilityLabel,
  fieldEvidenceLabel,
  money,
} from "../../lib/presentation";
import { Badge } from "../../components/ui/Badge";
import { BikeIllustration } from "../../components/ui/BikeIllustration";
import { Button } from "../../components/ui/Button";

type Props = {
  listing: Listing;
  brief: Brief;
  selected: boolean;
  selectionFull: boolean;
  onSelect: () => void;
  onOpen: () => void;
};
export function ListingCard({
  listing,
  brief,
  selected,
  selectionFull,
  onSelect,
  onOpen,
}: Props) {
  const result = eligibility(listing, brief);
  const tone =
    result.status === "pass"
      ? "positive"
      : result.status === "fail"
        ? "danger"
        : "warning";
  return (
    <article
      className={`listing-card ${selected ? "listing-card--selected" : ""}`}
    >
      <div className="listing-card__visual">
        <BikeIllustration
          tone={
            result.status === "pass"
              ? "lime"
              : result.status === "fail"
                ? "amber"
                : "cyan"
          }
        />
        <Badge className="listing-card__source">
          {listing.sourceKind === "demo"
            ? "Вымышленный пример"
            : listing.sourceKind === "dom"
              ? "Снимок страницы"
              : "Ручной ввод"}
        </Badge>
      </div>
      <div className="listing-card__body">
        <Badge tone={tone}>{eligibilityLabel(result.status)}</Badge>
        <h3>
          <button type="button" onClick={onOpen}>
            {listing.title}
          </button>
        </h3>
        <div className="listing-card__price">
          {money(listing.askingPrice)}
          <span>цена продавца</span>
        </div>
        <div className="listing-specs">
          <span>
            {listing.wheel.value ? `${listing.wheel.value}″` : "Колёса ?"}{" "}
            <small>{fieldEvidenceLabel(listing.wheel.status)}</small>
          </span>
          <span>
            {listing.frame.value ?? "Рама ?"}{" "}
            <small>{fieldEvidenceLabel(listing.frame.status)}</small>
          </span>
        </div>
        <p className="listing-card__components">
          {listing.components.value ?? "Обвес нужно уточнить"} ·{" "}
          {fieldEvidenceLabel(listing.components.status)}
        </p>
        <p className="listing-card__location">
          <MapPin size={14} aria-hidden="true" />
          {listing.location || "Локация не указана"}
        </p>
        <div className="listing-card__actions">
          <label className="selection-control">
            <input
              type="checkbox"
              checked={selected}
              disabled={!selected && selectionFull}
              onChange={onSelect}
              aria-label={`Сравнить ${listing.title}`}
            />
            <span>Сравнить</span>
          </label>
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpen}
            aria-label={`Подробнее: ${listing.title}`}
          >
            Подробнее <ArrowUpRight size={16} aria-hidden="true" />
          </Button>
        </div>
      </div>
    </article>
  );
}
