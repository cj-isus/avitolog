import Dexie, { type Table } from 'dexie';
import { BriefSchema, BundleSchema, MAX_LISTINGS, defaultBrief, listingIdentity, mergeListings, normalizeListing, type Brief, type Bundle, type Listing } from './domain.ts';

export class WorkspaceDB extends Dexie {
  listings!: Table<Listing, string>;
  settings!: Table<{ key: string; value: unknown }, string>;
  constructor(name = 'avitolog-mvp-v1') { super(name); this.version(1).stores({ listings: 'id, sourceKind, capturedAt', settings: 'key' }); }

  /** Called only in a read-write transaction, so capacity check and writes see the same state. */
  private async mergeAndWrite(incoming: Listing[]): Promise<Listing[]> {
    const merged = mergeListings(await this.listings.toArray(), incoming);
    const requested = new Set(incoming.map(listingIdentity));
    // Clear replaces legacy UUID duplicates; it rolls back with the puts on any failure.
    await this.listings.clear();
    await this.listings.bulkPut(merged);
    return merged.filter(listing => requested.has(listingIdentity(listing)));
  }
  async saveListings(input: Listing[]): Promise<Listing[]> {
    if (input.length > MAX_LISTINGS) throw new Error('В одном сохранении не больше ' + MAX_LISTINGS + ' карточек');
    const listings = input.map(normalizeListing);
    return this.transaction('rw', this.listings, () => this.mergeAndWrite(listings));
  }
  async saveListing(input: Listing): Promise<Listing> {
    const [saved] = await this.saveListings([input]);
    if (!saved) throw new Error('Карточка не сохранена');
    return saved;
  }
  async importBundle(input: unknown): Promise<Bundle> {
    const data = BundleSchema.parse(input);
    if (new Set(data.listings.map(listing => listing.id)).size !== data.listings.length) throw new Error('Повторяющиеся id в файле');
    const incoming = data.listings.map(normalizeListing);
    return this.transaction('rw', this.listings, this.settings, async () => {
      const listings = await this.mergeAndWrite(incoming);
      await this.settings.put({ key: 'brief', value: data.brief });
      return { ...data, listings };
    });
  }
}
export const db = new WorkspaceDB();
export async function loadBrief() { return BriefSchema.catch(defaultBrief).parse((await db.settings.get('brief'))?.value); }
export async function saveBrief(brief: Brief) { await db.settings.put({ key: 'brief', value: BriefSchema.parse(brief) }); }
export const saveListing = (listing: Listing) => db.saveListing(listing);
export const saveListings = (listings: Listing[]) => db.saveListings(listings);
export const importBundle = (input: unknown) => db.importBundle(input);
