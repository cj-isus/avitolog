import { z } from 'zod';

const evidenceStatus = z.enum(['observed', 'seller_claim', 'inferred', 'unknown', 'missing', 'needs_inspection']);
const field = <T extends z.ZodType>(schema: T) => z.object({
  value: schema.nullable(), status: evidenceStatus, sourceRefs: z.array(z.string()).max(20),
});
export const MAX_LISTINGS = 200;
export function avitoSource(value: string): { itemId: string; url: string } | null {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || !['avito.ru', 'www.avito.ru'].includes(url.hostname) || url.username || url.password || url.port) return null;
    const match = url.pathname.match(/^\/(?:[^/]+\/)+[^/]+_(\d{1,30})\/?$/);
    const section = url.pathname.split('/')[1]?.toLowerCase();
    if (!match?.[1] || /^0+$/.test(match[1]) || /^(profile|brands|users?|messenger|account|login|help|support|web|api)$/.test(section || '')) return null;
    return { itemId: match[1].replace(/^0+(?=\d)/, ''), url: `https://www.avito.ru${url.pathname.replace(/\/$/, '')}` };
  } catch { return null; }
}
const safeUrl = z.string().max(2048).refine(value => avitoSource(value) !== null, 'Нужна HTTPS-ссылка на карточку avito.ru без логина и нестандартного порта').transform(value => avitoSource(value)!.url);

export const ListingSchema = z.object({
  id: z.string().trim().min(1).max(100), schemaVersion: z.literal(1),
  sourceUrl: safeUrl.nullable(), capturedAt: z.iso.datetime(),
  sourceKind: z.enum(['demo', 'manual', 'dom']),
  title: z.string().trim().min(1).max(240), askingPrice: z.number().int().positive().max(100000000),
  wheel: field(z.number().positive().max(40)), frame: field(z.string().trim().min(1).max(120)),
  heightMin: field(z.number().int().min(100).max(230)), heightMax: field(z.number().int().min(100).max(230)),
  condition: field(z.string().max(200)), components: field(z.string().max(250)),
  group: z.string().trim().min(1).max(100), location: z.string().max(200),
  rawText: z.string().max(18000), repairReserve: z.number().int().min(0).max(100000),
}).superRefine((listing, ctx) => {
  if (listing.heightMin.value !== null && listing.heightMax.value !== null && listing.heightMin.value > listing.heightMax.value) ctx.addIssue({ code: 'custom', path: ['heightMax', 'value'], message: 'Верхняя граница роста ниже нижней' });
  if (listing.sourceKind === 'dom' && listing.sourceUrl === null) ctx.addIssue({ code: 'custom', path: ['sourceUrl'], message: 'DOM-снимок должен содержать источник' });
});
export type Listing = z.infer<typeof ListingSchema>;
export const BriefSchema = z.object({ height: z.number().int().min(120).max(220), wheel: z.number().positive(), maxPrice: z.number().int().positive().max(1000000) });
export type Brief = z.infer<typeof BriefSchema>;
export const BundleSchema = z.object({ schemaVersion: z.literal(1), listings: z.array(ListingSchema).max(MAX_LISTINGS), brief: BriefSchema });
export type Bundle = z.infer<typeof BundleSchema>;

export function listingIdentity(listing: Listing): string {
  const source = listing.sourceUrl ? avitoSource(listing.sourceUrl) : null;
  const identity = source ? `avito:${source.itemId}` : `local:${listing.id}`;
  return listing.sourceKind === 'demo' ? `demo:${identity}` : identity;
}
export function normalizeListing(input: unknown): Listing {
  const listing = ListingSchema.parse(input);
  const source = listing.sourceUrl ? avitoSource(listing.sourceUrl) : null;
  return { ...listing, id: source && listing.sourceKind !== 'demo' ? `avito:${source.itemId}` : listing.id };
}
/** Collapse snapshots before comparing: an older known field must not revive over a newer unknown. */
export function latestListings(listings: readonly Listing[]): Listing[] {
  const latest = new Map<string, Listing>();
  for (const input of listings) {
    const listing = normalizeListing(input), key = listingIdentity(listing), previous = latest.get(key);
    if (!previous || Date.parse(listing.capturedAt) >= Date.parse(previous.capturedAt)) latest.set(key, listing);
  }
  return [...latest.values()];
}
export function mergeListings(existing: readonly Listing[], incoming: readonly Listing[]): Listing[] {
  const merged = latestListings([...existing, ...incoming]);
  if (merged.length > MAX_LISTINGS) throw new Error(`В рабочей области допускается не больше ${MAX_LISTINGS} карточек`);
  if (new Set(merged.map(listing => listing.id)).size !== merged.length) throw new Error('Конфликт локальных id разных источников');
  return merged;
}

export const defaultBrief: Brief = { height: 196, wheel: 29, maxPrice: 60000 };
export function eligibility(listing: Listing, brief: Brief) {
  const reasons: string[] = [], missing: string[] = [];
  if (listing.wheel.value === null || !['observed', 'seller_claim'].includes(listing.wheel.status)) missing.push('Подтвердить диаметр колёс');
  else if (listing.wheel.value !== brief.wheel) reasons.push(`Колёса ${listing.wheel.value}″ вместо ${brief.wheel}″`);
  if (listing.heightMin.value === null || listing.heightMax.value === null || !['observed', 'seller_claim'].includes(listing.heightMin.status) || !['observed', 'seller_claim'].includes(listing.heightMax.status)) missing.push('Подтвердить геометрию и пригодность рамы по росту');
  else if (brief.height < listing.heightMin.value || brief.height > listing.heightMax.value) reasons.push('Заявленный диапазон роста не подходит');
  if (listing.askingPrice + listing.repairReserve > brief.maxPrice) reasons.push('Цена с заданным резервом выше бюджета');
  return { status: reasons.length ? 'fail' : missing.length ? 'needs_clarification' : 'pass', reasons, missing } as const;
}
export function estimate(target: Listing, all: Listing[]): { status: 'insufficient_data' | 'asking_prices_only'; range: [number, number] | null; median: number | null; comparableIds: string[] } {
  const known = (status: string) => ['observed', 'seller_claim'].includes(status);
  const rows = latestListings([...all, target]), identity = listingIdentity(target);
  const current = rows.find(listing => listingIdentity(listing) === identity)!;
  const comparable = rows.filter(listing => listingIdentity(listing) !== identity && listing.group !== 'unclassified' && listing.group === current.group && (listing.sourceKind === 'demo') === (current.sourceKind === 'demo') && listing.wheel.value !== null && listing.wheel.value === current.wheel.value && listing.frame.value !== null && listing.frame.value === current.frame.value && known(listing.wheel.status) && known(current.wheel.status) && known(listing.frame.status) && known(current.frame.status));
  if (comparable.length < 3) return { status: 'insufficient_data', range: null, median: null, comparableIds: comparable.map(x => x.id) };
  const prices = comparable.map(x => x.askingPrice).sort((a, b) => a - b);
  const median = prices.length % 2 ? prices[(prices.length - 1) / 2]! : (prices[prices.length / 2 - 1]! + prices[prices.length / 2]!) / 2;
  return { status: 'asking_prices_only', range: [prices[0]!, prices[prices.length - 1]!], median, comparableIds: comparable.map(x => x.id) };
}
export function draft(listing: Listing, offer: number | null) {
  if (offer !== null && (!Number.isInteger(offer) || offer < 1 || offer > listing.askingPrice)) throw new Error('Предложение должно быть целым числом от 1 до цены объявления');
  const questions = ['Какой точный размер рамы и можно ли получить фото маркировки или ссылку на геометрию модели?', 'Когда обслуживали вилку и трансмиссию, есть ли люфты, трещины или детали, требующие замены?'];
  const price = offer === null ? '' : ` Если размер подойдёт и осмотр подтвердит состояние, готов обсудить покупку за ${offer.toLocaleString('ru-RU')} ₽.`;
  return { listingId: listing.id, questions, offer, status: 'draft', text: `Здравствуйте! Рассматриваю ваш «${listing.title}». ${questions.join(' ')}${price}` };
}
export function manualListing(title: string, askingPrice: number, sourceUrl: string | null, rawText: string): Listing {
  const unknown = { value: null, status: 'unknown' as const, sourceRefs: [] };
  return normalizeListing({ id: crypto.randomUUID(), schemaVersion: 1, title, askingPrice, sourceUrl, capturedAt: new Date().toISOString(), sourceKind: 'manual', wheel: unknown, frame: unknown, heightMin: unknown, heightMax: unknown, condition: unknown, components: unknown, group: 'unclassified', location: 'Не подтверждено', rawText, repairReserve: 0 });
}
