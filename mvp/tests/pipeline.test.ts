import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import { runInNewContext } from 'node:vm';
import { parseHTML } from 'linkedom';
import { act, createElement } from 'react';
import { ListingSchema, MAX_LISTINGS, avitoSource, createManualListing, latestListings, mergeListings, normalizeListing, type Listing } from '../src/domain/listing.ts';
import { defaultBrief, type Brief } from '../src/domain/brief.ts';
import { BundleSchema } from '../src/domain/transfer.ts';
import { draft } from '../src/domain/negotiation.ts';
import { eligibility, estimate } from '../src/domain/evaluation.ts';
import { demoListings } from '../src/data/demo-listings.ts';
import { WorkspaceDB } from '../src/data/workspace-db.ts';
import { extractVisibleListing } from '../src/integrations/avito/extract.ts';
import { manualListing } from '../src/application/listing-factory.ts';
import { readWorkspaceFile } from '../src/application/workspace-transfer.ts';
import { pruneSelection, toggleSelectedId } from '../src/application/workspace-selection.ts';
import { useWorkspace, type WorkspaceController } from '../src/application/useWorkspace.ts';

test('unknown or inferred critical fields cannot pass eligibility', () => {
  const unknown = manualListing('test', 42000, null, 'Недостаточно сведений');
  assert.equal(eligibility(unknown, defaultBrief).status, 'needs_clarification');
  const inferred = structuredClone(demoListings[0]!); inferred.wheel.status = 'inferred';
  assert.equal(eligibility(inferred, defaultBrief).status, 'needs_clarification');
});
test('hard wheel, height and all-in budget violations exclude a candidate', () => {
  assert.equal(eligibility(demoListings[5]!, defaultBrief).status, 'fail');
  assert.equal(eligibility(demoListings[1]!, defaultBrief).status, 'fail');
  assert.equal(eligibility(demoListings[0]!, defaultBrief).status, 'pass');
});
test('asking comparison refuses sparse sets, unknown and demo/real mixing', () => {
  const [target, ...others] = demoListings;
  assert.ok(target);
  assert.equal(estimate(target, [target, ...others.slice(0, 2)]).status, 'insufficient_data');
  assert.equal(estimate(target, demoListings).median, 57000);
  const real = demoListings.map(x => ({ ...x, sourceKind: 'manual' as const }));
  assert.equal(estimate(target, [target, ...real]).status, 'insufficient_data');
  const uncertain = structuredClone(demoListings); uncertain[1]!.frame.status = 'inferred';
  assert.equal(estimate(uncertain[0]!, uncertain).status, 'insufficient_data');
});
test('duplicate URL variants and target clones cannot inflate comparable count', () => {
  const target = { ...demoListings[0]!, sourceUrl: 'https://www.avito.ru/moskva/bike_1234' };
  const clone = { ...target, id: 'clone', sourceUrl: target.sourceUrl + '?ref=1' };
  const other = { ...demoListings[1]!, sourceUrl: 'https://www.avito.ru/moskva/bike_4567' };
  const duplicate = { ...other, id: 'dup', sourceUrl: other.sourceUrl + '?ref=2' };
  assert.equal(estimate(target, [target, clone, other, duplicate]).comparableIds.length, 1);
});
test('untrusted bundle links and oversized text fail validation', () => {
  const malicious = { ...demoListings[0]!, sourceUrl: 'javascript:alert(1)' };
  assert.equal(BundleSchema.safeParse({ schemaVersion: 1, listings: [malicious], brief: defaultBrief }).success, false);
  assert.throws(() => manualListing('test', 1, null, 'a'.repeat(18001)));
});
test('draft is conditional, editable content; no price invented or invalid offer accepted', () => {
  assert.equal(draft(demoListings[0]!, null).offer, null);
  assert.equal(draft(demoListings[0]!, 42000).questions.length, 2);
  assert.match(draft(demoListings[0]!, 42000).text, /осмотр подтвердит состояние/);
  assert.throws(() => draft(demoListings[0]!, 90000));
  assert.throws(() => draft(demoListings[0]!, NaN));
});

function realListing(itemId: number, price = 45000, capturedAt = '2026-11-06T10:00:00.000Z'): Listing {
  return { ...structuredClone(demoListings[0]!), id: 'snapshot-' + itemId, sourceKind: 'manual', sourceUrl: 'https://www.avito.ru/moskva/bike_' + itemId, askingPrice: price, capturedAt };
}
function localListing(id: string): Listing {
  return { ...structuredClone(demoListings[0]!), id, sourceKind: 'manual', sourceUrl: null };
}
const bundle = (listings: Listing[], brief = defaultBrief) => ({ schemaVersion: 1, listings, brief });

test('Avito identity ignores slug, www, tracking and fragments; saved URL is normalized', () => {
  const first = realListing(1234);
  const second = { ...first, id: 'new-uuid', sourceUrl: 'https://avito.ru/moskva/renamed_bike_1234/?ref=other#photos', capturedAt: '2026-11-06T11:00:00.000Z', askingPrice: 41000 };
  const [latest] = mergeListings([first], [second]);
  assert.equal(latest?.id, 'avito:1234');
  assert.equal(latest?.sourceUrl, 'https://www.avito.ru/moskva/renamed_bike_1234');
  assert.equal(latest?.askingPrice, 41000);
  assert.equal(manualListing('Bicycle', 1000, first.sourceUrl, '').id, 'avito:1234');
  assert.equal(avitoSource('https://www.avito.ru/profile/person_1234'), null);
});

test('latest snapshot wins regardless of ordering, including same-identity target and unknown fields', () => {
  const target = realListing(1000), first = realListing(1001, 45000), second = realListing(1002, 50000), third = { ...realListing(1003, 60000), sourceKind: 'dom' as const };
  const newer = { ...first, id: 'newer', sourceUrl: 'https://avito.ru/moskva/new_slug_1001', capturedAt: '2026-11-06T11:00:00.000Z', askingPrice: 47000 };
  const selfClone = { ...target, id: 'self-clone', sourceUrl: 'https://avito.ru/moskva/different_slug_1000' };
  const compared = estimate(target, [newer, first, second, third, selfClone]);
  assert.equal(compared.median, 50000);
  assert.deepEqual(compared.range, [47000, 60000]);
  assert.equal(compared.comparableIds.length, 3);
  const nowUnknown = { ...newer, frame: { ...newer.frame, status: 'unknown' as const } };
  assert.equal(estimate(target, [nowUnknown, first, second, third]).status, 'insufficient_data');
  assert.equal(latestListings([newer, first])[0]?.askingPrice, 47000);
});

test('empty classification/frame, reversed heights and unsafe source URLs are rejected', () => {
  for (const invalid of [
    { ...demoListings[0]!, group: ' ' },
    { ...demoListings[0]!, frame: { ...demoListings[0]!.frame, value: ' ' } },
    { ...demoListings[0]!, heightMin: { ...demoListings[0]!.heightMin, value: 210 } },
    ...['https://evil.example/a_1', 'https://avito.ru.evil.example/a_1', 'https://evil@avito.ru/moskva/bike_1234', 'https://avito.ru:8443/moskva/bike_1234', 'https://avito.ru/profile/person_1234'].map(sourceUrl => ({ ...demoListings[0]!, sourceUrl })),
  ]) assert.equal(ListingSchema.safeParse(invalid).success, false);
});

// Execute the serialized function in an isolated realm against real parsed HTML, not its module closure.
function extractFixture(options: { url?: string; id?: string | null; title?: string; price?: string; priceMarkup?: string; state?: string; extra?: string; omitPrice?: boolean } = {}) {
  const id = options.id === undefined ? '1234' : options.id;
  const priceMarkup = options.priceMarkup ?? options.price ?? '29 999 ₽';
  const html = '<!doctype html><html><head><title>Объявление о велосипеде</title></head><body>' +
    (options.state || '') + '<main>' + (id === null ? '' : '<div data-marker="item-view/item-id">№ ' + id + '</div>') +
    '<h1 data-marker="item-view/title-info">' + (options.title || 'Велосипед 29 XL') + '</h1>' +
    (options.omitPrice ? '' : '<div data-marker="item-view/item-price">' + priceMarkup + '</div>') +
    '<div data-marker="item-view/item-description">Описание продавца</div><div data-marker="item-view/item-params">Колёса 29</div></main>' +
    (options.extra || '') + '</body></html>';
  const { document } = parseHTML(html);
  return runInNewContext('(' + extractVisibleListing.toString() + ')()', {
    URL, document, location: new URL(options.url || 'https://avito.ru/moskva/bike_1234/?ref=search#photos'),
  }) as ReturnType<typeof extractVisibleListing>;
}

test('serialized DOM capture uses item markers, exact ID, one RUB price and canonical source', () => {
  for (const price of ['29 999 ₽', '29\u00a0999 ₽', '29\u202f999 RUB', '29999 руб.']) {
    const result = extractFixture({ price, extra: '<aside><meta itemprop="price" content="999999">Рекомендация</aside>' });
    assert.equal(result.askingPrice, 29999);
    assert.equal(result.itemId, '1234');
    assert.equal(result.sourceUrl, 'https://www.avito.ru/moskva/bike_1234');
    assert.equal(result.title, 'Велосипед 29 XL');
    assert.doesNotMatch(result.rawText, /Рекомендация/);
  }
});

test('decimal rubles, multiple amounts, ranges, foreign currency and malformed grouping fail closed', () => {
  for (const price of ['29999.99 ₽', '29 999,99 ₽', '5000 ₽ 6000 ₽', 'от 5000 ₽', '5000–6000 ₽', '5 00 ₽', '5000 USD', '5000', '0 ₽', '-500 ₽']) {
    assert.throws(() => extractFixture({ price }), /./, price);
  }
  assert.throws(() => extractFixture({ priceMarkup: '<meta itemprop="price" content="29999.99">29 999 ₽' }), /копейки/);
  assert.throws(() => extractFixture({ priceMarkup: '<meta itemprop="price" content="30000">29 999 ₽' }), /противоречивые/);
});

test('deleted/challenge pages, mismatched or absent IDs, and recommendation-only price are not cards', () => {
  for (const state of ['Доступ ограничен', 'Объявление снято с публикации', 'Объявление не найдено', 'Подтвердите, что вы не робот']) assert.throws(() => extractFixture({ state }), /недоступна/);
  assert.throws(() => extractFixture({ id: '5678' }), /ID карточки/);
  assert.throws(() => extractFixture({ id: null }), /ID карточки/);
  assert.throws(() => extractFixture({ omitPrice: true, extra: '<aside><meta itemprop="price" content="1000"></aside>' }), /цену карточки/);
  assert.throws(() => extractFixture({ url: 'https://www.avito.ru/profile/person_1234' }), /отдельная карточка/);
  assert.throws(() => extractFixture({ url: 'https://www.avito.ru/PROFILE/person_1234' }), /отдельная карточка/);
  assert.throws(() => extractFixture({ extra: '<div data-marker="item-view/item-price">40 000 ₽</div>' }), /несколько разных цен/);
});

test('all save paths share the 200-item bound; updating the existing capture still works at capacity', async t => {
  const workspace = new WorkspaceDB('capacity-' + crypto.randomUUID());
  t.after(() => workspace.delete());
  await workspace.saveListings(Array.from({ length: MAX_LISTINGS - 1 }, (_, index) => localListing('local-' + index)));
  await workspace.saveListing({ ...realListing(9000), sourceKind: 'dom' });
  assert.equal(await workspace.listings.count(), MAX_LISTINGS);
  await assert.rejects(() => workspace.saveListing(manualListing('extra manual', 1000, null, '')), /200/);
  await assert.rejects(() => workspace.saveListing({ ...realListing(9001), sourceKind: 'dom' }), /200/);
  await assert.rejects(() => workspace.saveListings(demoListings), /200/);
  const updated = await workspace.saveListing({ ...realListing(9000, 40000, '2026-11-06T11:00:00.000Z'), sourceUrl: 'https://avito.ru/moskva/new_slug_9000', sourceKind: 'dom' });
  assert.equal(updated.askingPrice, 40000);
  assert.equal(await workspace.listings.count(), MAX_LISTINGS);
  assert.equal(BundleSchema.safeParse(bundle(await workspace.listings.toArray())).success, true);
});

test('concurrent saves at the capacity boundary cannot both overfill the database', async t => {
  const workspace = new WorkspaceDB('concurrent-' + crypto.randomUUID());
  t.after(() => workspace.delete());
  await workspace.saveListings(Array.from({ length: MAX_LISTINGS - 1 }, (_, index) => localListing('local-' + index)));
  const results = await Promise.allSettled([workspace.saveListing(realListing(9100)), workspace.saveListing(realListing(9101))]);
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal(results.filter(result => result.status === 'rejected').length, 1);
  assert.equal(await workspace.listings.count(), MAX_LISTINGS);
});

test('import validates every row and duplicate IDs before mutation, and cannot exceed combined capacity', async t => {
  const workspace = new WorkspaceDB('imports-' + crypto.randomUUID());
  t.after(() => workspace.delete());
  const existing = localListing('keep');
  await workspace.saveListing(existing);
  await workspace.settings.put({ key: 'brief', value: defaultBrief });
  const changedBrief = { ...defaultBrief, height: 190 };
  await assert.rejects(() => workspace.importBundle(bundle([realListing(9200), { ...realListing(9201), sourceUrl: 'javascript:alert(1)' }], changedBrief)));
  await assert.rejects(() => workspace.importBundle(bundle([realListing(9200), { ...realListing(9201), id: 'snapshot-9200' }], changedBrief)), /Повторяющиеся id/);
  await assert.rejects(() => workspace.importBundle(bundle(Array.from({ length: MAX_LISTINGS }, (_, index) => localListing('new-' + index)), changedBrief)), /200/);
  assert.deepEqual(await workspace.listings.toArray(), [existing]);
  assert.deepEqual((await workspace.settings.get('brief'))?.value, defaultBrief);
});

test('a failure after listing writes rolls back both listing changes and brief in the real Dexie transaction', async t => {
  const workspace = new WorkspaceDB('rollback-' + crypto.randomUUID());
  t.after(() => workspace.delete());
  const existing = localListing('keep');
  await workspace.saveListing(existing);
  await workspace.settings.put({ key: 'brief', value: defaultBrief });
  const fail = () => { throw new Error('fixture-settings-failure'); };
  workspace.settings.hook('updating', fail);
  try {
    await assert.rejects(() => workspace.importBundle(bundle([realListing(9300)], { ...defaultBrief, height: 190 })), /fixture-settings-failure/);
  } finally {
    workspace.settings.hook('updating').unsubscribe(fail);
  }
  assert.deepEqual(await workspace.listings.toArray(), [existing]);
  assert.deepEqual((await workspace.settings.get('brief'))?.value, defaultBrief);
});

test('import coalesces snapshots by item ID and preserves the latest record without consuming another slot', async t => {
  const workspace = new WorkspaceDB('snapshots-' + crypto.randomUUID());
  t.after(() => workspace.delete());
  await workspace.saveListing(realListing(9400, 50000));
  const current = { ...realListing(9400, 40000, '2026-11-06T11:00:00.000Z'), id: 'latest-snapshot', sourceUrl: 'https://avito.ru/moskva/new_slug_9400?ref=feed' };
  const imported = await workspace.importBundle(bundle([current]));
  assert.equal(imported.listings[0]?.id, 'avito:9400');
  assert.equal(await workspace.listings.count(), 1);
  await workspace.saveListing(realListing(9400, 99000));
  assert.equal((await workspace.listings.get('avito:9400'))?.askingPrice, 40000);
  assert.equal(normalizeListing(current).sourceUrl, 'https://www.avito.ru/moskva/new_slug_9400');
});

test('pure listing factory uses supplied identity and time while preserving nullable evidence', () => {
  const input = {
    id: 'local-supplied-id',
    capturedAt: '2026-11-06T09:00:00.000Z',
    title: 'Сведения пока неизвестны',
    askingPrice: 42000,
    sourceUrl: null,
    rawText: '',
  };
  const created = createManualListing(input);
  assert.equal(created.id, input.id);
  assert.equal(created.capturedAt, input.capturedAt);
  assert.deepEqual(created.wheel, { value: null, status: 'unknown', sourceRefs: [] });
  assert.deepEqual(created.frame, { value: null, status: 'unknown', sourceRefs: [] });
  assert.equal(eligibility(created, defaultBrief).status, 'needs_clarification');
});

test('selection reconciliation removes deleted IDs and prevents stale selections consuming the four slots', () => {
  const listings = Array.from({ length: 5 }, (_, index) => localListing('selection-' + index));
  const selected = ['removed-id', listings[0]!.id, listings[0]!.id];
  assert.deepEqual(pruneSelection(selected, listings), [listings[0]!.id]);
  assert.deepEqual(toggleSelectedId(selected, listings[1]!.id, listings), [listings[0]!.id, listings[1]!.id]);
  const full = listings.slice(0, 4).map(listing => listing.id);
  assert.deepEqual(toggleSelectedId(full, listings[4]!.id, listings), full);
  assert.deepEqual(toggleSelectedId(full, 'missing-id', listings), full);
  assert.deepEqual(toggleSelectedId(full, listings[0]!.id, listings), full.slice(1));
});

test('workspace file parsing rejects oversized input before reading and propagates invalid JSON', async () => {
  let reads = 0;
  await assert.rejects(() => readWorkspaceFile({ size: 5_000_001, text: async () => { reads += 1; return '{}'; } }), /5 МБ/);
  assert.equal(reads, 0);
  await assert.rejects(() => readWorkspaceFile({ size: 1, text: async () => '{' }), SyntaxError);
  assert.deepEqual(await readWorkspaceFile({ size: 7, text: async () => '{"a":1}' }), { a: 1 });
});

test('workspace export preserves version-one JSON and reads the persisted brief with its listings', async t => {
  const workspace = new WorkspaceDB('export-' + crypto.randomUUID());
  t.after(() => workspace.delete());
  const brief = { ...defaultBrief, height: 190 };
  await workspace.importBundle(bundle([realListing(9500)], brief));
  const exported = await workspace.exportBundle();
  assert.deepEqual(Object.keys(exported).sort(), ['brief', 'listings', 'schemaVersion']);
  assert.equal(exported.schemaVersion, 1);
  assert.deepEqual(exported.brief, brief);
  assert.equal(exported.listings[0]?.id, 'avito:9500');
  assert.equal(BundleSchema.safeParse(JSON.parse(JSON.stringify(exported))).success, true);
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((accept, fail) => { resolve = accept; reject = fail; });
  return { promise, resolve, reject };
}

class DelayedBriefDB extends WorkspaceDB {
  readonly initialBrief = deferred<Brief>();
  override loadBrief(): Promise<Brief> { return this.initialBrief.promise; }
}

async function mountWorkspace(workspace: WorkspaceDB) {
  const { document, window } = parseHTML('<!doctype html><html><body><div id="root"></div></body></html>');
  const globals = { document, window, HTMLElement: window.HTMLElement, Node: window.Node, IS_REACT_ACT_ENVIRONMENT: true };
  const previous = new Map(Object.keys(globals).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  for (const [key, value] of Object.entries(globals)) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  const { createRoot } = await import('react-dom/client');
  const root = createRoot(document.getElementById('root')!);
  let controller!: WorkspaceController;
  function Harness() { controller = useWorkspace(workspace); return null; }
  await act(async () => { root.render(createElement(Harness)); });
  return {
    get current() { return controller; },
    async settle(predicate: () => boolean) {
      const deadline = Date.now() + 2000;
      while (!predicate() && Date.now() < deadline) await act(async () => { await new Promise(resolve => setTimeout(resolve, 5)); });
      assert.ok(predicate(), 'Workspace state did not settle');
    },
    async unmount() {
      await act(async () => { root.unmount(); });
      for (const [key, descriptor] of previous) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else Reflect.deleteProperty(globalThis, key);
      }
    },
  };
}

test('late initial brief values or failures cannot replace a successful user save', async () => {
  for (const outcome of ['value', 'failure']) {
    const workspace = new DelayedBriefDB('brief-race-' + crypto.randomUUID());
    const hook = await mountWorkspace(workspace);
    try {
      const updated = { ...defaultBrief, height: 190, maxPrice: 55000 };
      await act(async () => { await hook.current.saveBrief(updated); });
      await act(async () => {
        if (outcome === 'value') workspace.initialBrief.resolve(defaultBrief);
        else workspace.initialBrief.reject(new Error('stale-initial-read-failure'));
      });
      await hook.settle(() => !hook.current.isLoading);
      assert.deepEqual(hook.current.brief, updated);
      assert.deepEqual((await workspace.settings.get('brief'))?.value, updated);
      assert.equal(hook.current.error, '');
      assert.match(hook.current.notice, /Требования сохранены/);
    } finally {
      await hook.unmount();
      await workspace.delete();
    }
  }
});

test('late initial brief reads cannot overwrite import, while failed import leaves the current workspace intact', async () => {
  const workspace = new DelayedBriefDB('import-race-' + crypto.randomUUID());
  const hook = await mountWorkspace(workspace);
  try {
    const importedBrief = { ...defaultBrief, height: 192 };
    await act(async () => { await hook.current.importData(bundle([realListing(9600)], importedBrief)); });
    await act(async () => { workspace.initialBrief.resolve(defaultBrief); });
    await hook.settle(() => !hook.current.isLoading && hook.current.listings.length === 1);
    assert.deepEqual(hook.current.brief, importedBrief);
    assert.equal(hook.current.focusedListing?.id, 'avito:9600');
    await act(async () => { hook.current.toggleSelection('avito:9600'); });
    await assert.rejects(() => hook.current.importData(bundle([{ ...realListing(9601), askingPrice: -1 }])));
    assert.deepEqual(hook.current.brief, importedBrief);
    assert.deepEqual(hook.current.selectedIds, ['avito:9600']);
    assert.equal(await workspace.listings.count(), 1);
    await assert.rejects(() => hook.current.capture(), /установленном расширении/);
    assert.equal(await workspace.listings.count(), 1);
    await act(async () => { await hook.current.deleteListing('avito:9600'); });
    await hook.settle(() => hook.current.listings.length === 0);
    assert.deepEqual(hook.current.selectedIds, []);
    assert.equal(hook.current.focusedListing, undefined);
  } finally {
    await hook.unmount();
    await workspace.delete();
  }
});
