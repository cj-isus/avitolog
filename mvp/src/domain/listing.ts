import { z } from "zod";

const evidenceStatus = z.enum([
  "observed",
  "seller_claim",
  "inferred",
  "unknown",
  "missing",
  "needs_inspection",
]);
const field = <T extends z.ZodType>(schema: T) =>
  z.object({
    value: schema.nullable(),
    status: evidenceStatus,
    sourceRefs: z.array(z.string()).max(20),
  });

export const MAX_LISTINGS = 200;

export function avitoSource(
  value: string,
): { itemId: string; url: string } | null {
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      !["avito.ru", "www.avito.ru"].includes(url.hostname)
    )
      return null;
    if (url.username || url.password || url.port) return null;

    const match = url.pathname.match(/^\/(?:[^/]+\/)+[^/]+_(\d{1,30})\/?$/);
    const section = url.pathname.split("/")[1]?.toLowerCase();
    if (!match?.[1] || /^0+$/.test(match[1])) return null;
    if (
      /^(profile|brands|users?|messenger|account|login|help|support|web|api)$/.test(
        section || "",
      )
    )
      return null;

    return {
      itemId: match[1].replace(/^0+(?=\d)/, ""),
      url: `https://www.avito.ru${url.pathname.replace(/\/$/, "")}`,
    };
  } catch {
    return null;
  }
}

const safeUrl = z
  .string()
  .max(2048)
  .refine(
    (value) => avitoSource(value) !== null,
    "Нужна HTTPS-ссылка на карточку avito.ru без логина и нестандартного порта",
  )
  .transform((value) => avitoSource(value)!.url);

export const ListingSchema = z
  .object({
    id: z.string().trim().min(1).max(100),
    schemaVersion: z.literal(1),
    sourceUrl: safeUrl.nullable(),
    capturedAt: z.iso.datetime(),
    sourceKind: z.enum(["demo", "manual", "dom"]),
    title: z.string().trim().min(1).max(240),
    askingPrice: z.number().int().positive().max(100000000),
    wheel: field(z.number().positive().max(40)),
    frame: field(z.string().trim().min(1).max(120)),
    heightMin: field(z.number().int().min(100).max(230)),
    heightMax: field(z.number().int().min(100).max(230)),
    condition: field(z.string().max(200)),
    components: field(z.string().max(250)),
    group: z.string().trim().min(1).max(100),
    location: z.string().max(200),
    rawText: z.string().max(18000),
    repairReserve: z.number().int().min(0).max(100000),
  })
  .superRefine((listing, ctx) => {
    if (
      listing.heightMin.value !== null &&
      listing.heightMax.value !== null &&
      listing.heightMin.value > listing.heightMax.value
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["heightMax", "value"],
        message: "Верхняя граница роста ниже нижней",
      });
    }
    if (listing.sourceKind === "dom" && listing.sourceUrl === null) {
      ctx.addIssue({
        code: "custom",
        path: ["sourceUrl"],
        message: "DOM-снимок должен содержать источник",
      });
    }
  });

export type Listing = z.infer<typeof ListingSchema>;

export function listingIdentity(listing: Listing): string {
  const source = listing.sourceUrl ? avitoSource(listing.sourceUrl) : null;
  const identity = source ? `avito:${source.itemId}` : `local:${listing.id}`;
  return listing.sourceKind === "demo" ? `demo:${identity}` : identity;
}
export function normalizeListing(input: unknown): Listing {
  const listing = ListingSchema.parse(input);
  const source = listing.sourceUrl ? avitoSource(listing.sourceUrl) : null;
  return {
    ...listing,
    id:
      source && listing.sourceKind !== "demo"
        ? `avito:${source.itemId}`
        : listing.id,
  };
}

/** Collapse snapshots before comparing: an older known field must not revive over a newer unknown. */
export function latestListings(listings: readonly Listing[]): Listing[] {
  const latest = new Map<string, Listing>();
  for (const input of listings) {
    const listing = normalizeListing(input);
    const key = listingIdentity(listing);
    const previous = latest.get(key);
    if (
      !previous ||
      Date.parse(listing.capturedAt) >= Date.parse(previous.capturedAt)
    )
      latest.set(key, listing);
  }
  return [...latest.values()];
}

export function mergeListings(
  existing: readonly Listing[],
  incoming: readonly Listing[],
): Listing[] {
  const merged = latestListings([...existing, ...incoming]);
  if (merged.length > MAX_LISTINGS)
    throw new Error(
      `В рабочей области допускается не больше ${MAX_LISTINGS} карточек`,
    );
  if (new Set(merged.map((listing) => listing.id)).size !== merged.length)
    throw new Error("Конфликт локальных id разных источников");
  return merged;
}

export type CreateManualListingInput = {
  id: string;
  capturedAt: string;
  title: string;
  askingPrice: number;
  sourceUrl: string | null;
  rawText: string;
  sourceKind?: "manual" | "dom";
};

export function createManualListing(input: CreateManualListingInput): Listing {
  const unknown = { value: null, status: "unknown" as const, sourceRefs: [] };
  return normalizeListing({
    ...input,
    schemaVersion: 1,
    sourceKind: input.sourceKind ?? "manual",
    wheel: unknown,
    frame: unknown,
    heightMin: unknown,
    heightMax: unknown,
    condition: unknown,
    components: unknown,
    group: "unclassified",
    location: "Не подтверждено",
    repairReserve: 0,
  });
}
