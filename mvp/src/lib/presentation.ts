import type { EligibilityStatus } from "../domain/evaluation";
import type { Listing } from "../domain/listing";

type EvidenceStatus = Listing["wheel"]["status"];

const priceFormatter = new Intl.NumberFormat("ru-RU", {
  maximumFractionDigits: 2,
});

export function money(value: number): string {
  return `${priceFormatter.format(value)} ₽`;
}

export const evidenceLabels: Record<EvidenceStatus, string> = {
  observed: "На странице",
  seller_claim: "Заявлено",
  inferred: "Предположение",
  unknown: "Неизвестно",
  missing: "Не указано",
  needs_inspection: "Нужен осмотр",
};

export const eligibilityLabels: Record<EligibilityStatus, string> = {
  pass: "Параметры совпали",
  fail: "Есть несоответствия",
  needs_clarification: "Нужно уточнить",
};

export function fieldEvidenceLabel(status: EvidenceStatus): string {
  return evidenceLabels[status];
}

export function eligibilityLabel(status: EligibilityStatus): string {
  return eligibilityLabels[status];
}

export function isDeclared<T>(field: {
  value: T | null;
  status: EvidenceStatus;
}): field is { value: T; status: "observed" | "seller_claim" } {
  return (
    field.value !== null &&
    (field.status === "observed" || field.status === "seller_claim")
  );
}
