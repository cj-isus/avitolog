import { useState, type FormEvent } from 'react';
import { db } from './db';
import { ListingSchema, type Listing } from './domain';

export function FactsEditor({ listing, onSave }: { listing: Listing; onSave: (listing: Listing) => void }) {
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const claim = <T,>(value: T | null) => ({ value, status: value === null ? 'unknown' as const : 'seller_claim' as const, sourceRefs: value === null ? [] : [`manual-entry:${listing.id}`] });
    const number = (key: string) => String(data.get(key)).trim() ? Number(data.get(key)) : null;
    const text = (key: string) => String(data.get(key) || '').trim() || null;
    try {
      const min = number('heightMin'), max = number('heightMax');
      if (min !== null && max !== null && min > max) throw new Error('Минимальный рост не может быть выше максимального');
      const next = ListingSchema.parse({ ...listing, capturedAt: new Date().toISOString(),
        wheel: claim(number('wheel')), frame: claim(text('frame')?.toUpperCase() || null),
        heightMin: claim(min), heightMax: claim(max), components: claim(text('components')),
        repairReserve: Number(data.get('reserve')), group: text('group') || 'unclassified',
      });
      const saved = await db.saveListing(next); onSave(saved); setError('');
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  }
  return <details className="facts-editor"><summary>Внести заявленные характеристики</summary><p className="fine-print">Перенесите сведения из объявления. Это заявление продавца, которое ещё нужно проверить. Пустое поле останется неизвестным. Группа сравнения объединяет одну модель с близким годом и комплектацией; задавайте её осмысленно.</p><form onSubmit={submit} key={listing.capturedAt}>
    <label className="field">Колёса, дюймы<select name="wheel" defaultValue={listing.wheel.value ?? ''}><option value="">Неизвестно</option><option value="29">29</option><option value="27.5">27.5</option><option value="26">26</option></select></label>
    <label className="field">Маркировка рамы<input name="frame" defaultValue={listing.frame.value ?? ''} maxLength={120} placeholder="Например XL; не гарантия посадки"/></label>
    <div className="facts-pair"><label className="field">Рост от, см<input name="heightMin" type="number" min="100" max="230" defaultValue={listing.heightMin.value ?? ''}/></label><label className="field">Рост до, см<input name="heightMax" type="number" min="100" max="230" defaultValue={listing.heightMax.value ?? ''}/></label></div>
    <label className="field">Обвес<input name="components" defaultValue={listing.components.value ?? ''} maxLength={250}/></label>
    <label className="field">Заданный вами резерв, ₽<input name="reserve" type="number" min="0" max="100000" defaultValue={listing.repairReserve} required/></label>
    <label className="field">Группа для ручного сравнения<input name="group" defaultValue={listing.group === 'unclassified' ? '' : listing.group} maxLength={100} placeholder="Модель / год / комплектация"/></label>
    {error && <p role="alert" className="error">{error}</p>}<button className="button secondary" type="submit">Сохранить сведения</button>
  </form></details>;
}
