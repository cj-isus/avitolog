import { createManualListing, type Listing } from "../domain/listing.ts";

export function manualListing(
  title: string,
  askingPrice: number,
  sourceUrl: string | null,
  rawText: string,
): Listing {
  return createManualListing({
    id: crypto.randomUUID(),
    capturedAt: new Date().toISOString(),
    title,
    askingPrice,
    sourceUrl,
    rawText,
  });
}
