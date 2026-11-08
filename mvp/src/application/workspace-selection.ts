import type { Listing } from "../domain/listing.ts";

const MAX_SELECTED = 4;

export function pruneSelection(
  selectedIds: readonly string[],
  listings: readonly Listing[],
): string[] {
  const available = new Set(listings.map((listing) => listing.id));
  return [...new Set(selectedIds)]
    .filter((id) => available.has(id))
    .slice(0, MAX_SELECTED);
}

export function toggleSelectedId(
  selectedIds: readonly string[],
  id: string,
  listings: readonly Listing[],
): string[] {
  const selected = pruneSelection(selectedIds, listings);
  if (selected.includes(id))
    return selected.filter((selectedId) => selectedId !== id);
  if (
    selected.length === MAX_SELECTED ||
    !listings.some((listing) => listing.id === id)
  )
    return selected;
  return [...selected, id];
}
