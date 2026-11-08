import type { Brief } from "./brief.ts";
import {
  latestListings,
  listingIdentity,
  normalizeListing,
  type Listing,
} from "./listing.ts";

export type EligibilityStatus = "pass" | "fail" | "needs_clarification";
export type EligibilityResult = {
  status: EligibilityStatus;
  reasons: string[];
  missing: string[];
};
export type AskingEstimate = {
  status: "insufficient_data" | "asking_prices_only";
  range: [number, number] | null;
  median: number | null;
  comparableIds: string[];
};

function hasSupportedValue<T>(field: {
  value: T | null;
  status: string;
}): field is { value: T; status: string } {
  return (
    field.value !== null &&
    (field.status === "observed" || field.status === "seller_claim")
  );
}

export function eligibility(listing: Listing, brief: Brief): EligibilityResult {
  const reasons: string[] = [];
  const missing: string[] = [];

  if (!hasSupportedValue(listing.wheel))
    missing.push("Подтвердить диаметр колёс");
  else if (listing.wheel.value !== brief.wheel)
    reasons.push(
      "Колёса " + listing.wheel.value + "″ вместо " + brief.wheel + "″",
    );

  if (
    !hasSupportedValue(listing.heightMin) ||
    !hasSupportedValue(listing.heightMax)
  ) {
    missing.push("Подтвердить геометрию и пригодность рамы по росту");
  } else if (
    brief.height < listing.heightMin.value ||
    brief.height > listing.heightMax.value
  ) {
    reasons.push("Заявленный диапазон роста не подходит");
  }

  if (listing.askingPrice + listing.repairReserve > brief.maxPrice)
    reasons.push("Цена с заданным резервом выше бюджета");
  const status = reasons.length
    ? "fail"
    : missing.length
      ? "needs_clarification"
      : "pass";
  return { status, reasons, missing };
}

function isComparable(candidate: Listing, target: Listing): boolean {
  if (listingIdentity(candidate) === listingIdentity(target)) return false;
  if (candidate.group === "unclassified" || candidate.group !== target.group)
    return false;
  if ((candidate.sourceKind === "demo") !== (target.sourceKind === "demo"))
    return false;
  if (!hasSupportedValue(candidate.wheel) || !hasSupportedValue(target.wheel))
    return false;
  if (!hasSupportedValue(candidate.frame) || !hasSupportedValue(target.frame))
    return false;
  return (
    candidate.wheel.value === target.wheel.value &&
    candidate.frame.value === target.frame.value
  );
}

export function estimate(target: Listing, all: Listing[]): AskingEstimate {
  const rows = latestListings([...all, target]);
  const identity = listingIdentity(target);
  const current =
    rows.find((listing) => listingIdentity(listing) === identity) ??
    normalizeListing(target);
  const comparable = rows.filter((listing) => isComparable(listing, current));
  const comparableIds = comparable.map((listing) => listing.id);

  if (comparable.length < 3)
    return {
      status: "insufficient_data",
      range: null,
      median: null,
      comparableIds,
    };

  const prices = comparable
    .map((listing) => listing.askingPrice)
    .sort((left, right) => left - right);
  const midpoint = Math.floor(prices.length / 2);
  const median =
    prices.length % 2
      ? prices[midpoint]!
      : (prices[midpoint - 1]! + prices[midpoint]!) / 2;
  return {
    status: "asking_prices_only",
    range: [prices[0]!, prices[prices.length - 1]!],
    median,
    comparableIds,
  };
}
