import { browser } from "wxt/browser";
import { createManualListing } from "../../domain/listing.ts";
import { extractVisibleListing } from "./extract.ts";

export async function captureCurrentTab() {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (tab?.id === undefined) throw new Error("Нет активной вкладки");

  const results = await browser.scripting.executeScript({
    target: { tabId: tab.id },
    func: extractVisibleListing,
  });
  const snapshot = results[0]?.result;
  if (!snapshot)
    throw new Error(
      "Нет снимка. Нажмите значок расширения на нужной вкладке и повторите.",
    );

  return createManualListing({
    id: "avito:" + snapshot.itemId,
    capturedAt: new Date().toISOString(),
    title: snapshot.title,
    askingPrice: snapshot.askingPrice,
    sourceUrl: snapshot.sourceUrl,
    rawText: snapshot.rawText,
    sourceKind: "dom",
  });
}
