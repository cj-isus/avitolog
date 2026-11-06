import { browser } from 'wxt/browser';
import { extractVisibleListing } from './extract';
import { manualListing, normalizeListing } from './domain';

export async function captureCurrentTab() {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (tab?.id === undefined) throw new Error('Нет активной вкладки');
  const result = await browser.scripting.executeScript({ target: { tabId: tab.id }, func: extractVisibleListing });
  if (!result[0]?.result) throw new Error('Нет снимка. Нажмите значок расширения на нужной вкладке и повторите.');
  const raw = result[0].result;
  return normalizeListing({ ...manualListing(raw.title, raw.askingPrice, raw.sourceUrl, raw.rawText), sourceKind: 'dom' });
}
