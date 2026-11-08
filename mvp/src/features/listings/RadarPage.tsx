import {
  ArrowRight,
  Plus,
  Radar,
  ScanLine,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import type { WorkspaceController } from "../../application/useWorkspace";
import { money } from "../../lib/presentation";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { SectionHeading } from "../../components/ui/SectionHeading";
import { StatCard } from "../../components/ui/StatCard";
import { EmptyState } from "../../components/ui/EmptyState";
import { ListingCard } from "./ListingCard";

type Props = {
  workspace: WorkspaceController;
  onAdd: () => void;
  onOpen: (id: string) => void;
  onCompare: () => void;
  onBrief: () => void;
  busy: boolean;
};
export function RadarPage({
  workspace: w,
  onAdd,
  onOpen,
  onCompare,
  onBrief,
  busy,
}: Props) {
  return (
    <div className="page-stack">
      <SectionHeading
        eyebrow="РЕШЕНИЕ НАЧИНАЕТСЯ С ФАКТОВ"
        title="Хорошая покупка. Ясный выбор."
        description="Соберите варианты, проверьте параметры и подготовьте своё предложение."
        action={
          <Button variant="primary" onClick={onAdd}>
            <Plus size={18} aria-hidden="true" /> Добавить объявление
          </Button>
        }
      />
      <div className="brief-strip">
        <div>
          <span className="eyebrow">ВАША ЗАДАЧА</span>
          <strong>
            Велосипед · {w.brief.wheel}″ · рост {w.brief.height} см
          </strong>
          <span className="muted">
            Москва и область · бюджет с резервом до {money(w.brief.maxPrice)}
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={onBrief}>
          <SlidersHorizontal size={16} aria-hidden="true" /> Настроить
        </Button>
      </div>
      <div className="stat-grid">
        <StatCard
          label="В рабочей области"
          value={w.summary.total}
          note="Сохранённые карточки"
          icon={<Radar size={18} />}
        />
        <StatCard
          label="Параметры совпали"
          value={w.summary.matched}
          note="Состояние ещё требует осмотра"
          tone="positive"
        />
        <StatCard
          label="Нужно уточнить"
          value={w.summary.unknown}
          note="Не хватает ключевых сведений"
          tone="warning"
        />
      </div>
      <div className="radar-toolbar">
        <Field label="Поиск в карточках">
          <div className="search-input">
            <Search size={18} aria-hidden="true" />
            <Input
              aria-label="Поиск в карточках"
              value={w.query}
              onChange={(event) => w.setQuery(event.target.value)}
              placeholder="Модель или название…"
            />
          </div>
        </Field>
        <Field label="Статус">
          <Select
            value={w.statusFilter}
            onChange={(event) =>
              w.setStatusFilter(event.target.value as typeof w.statusFilter)
            }
          >
            <option value="all">Все статусы</option>
            <option value="pass">Параметры совпали</option>
            <option value="needs_clarification">Нужно уточнить</option>
            <option value="fail">Есть несоответствия</option>
          </Select>
        </Field>
        <Button
          disabled={busy}
          onClick={() => {
            void w.loadDemo().catch(w.reportError);
          }}
        >
          Загрузить демо
        </Button>
        {w.isExtension && (
          <Button
            disabled={busy}
            onClick={() => {
              void w.capture().catch(w.reportError);
            }}
          >
            <ScanLine size={17} aria-hidden="true" /> Снимок страницы
          </Button>
        )}
      </div>
      <div className="results-heading">
        <p>
          {w.visibleListings.length} карточек{" "}
          <span className="muted">/ сравнение до 4 вариантов</span>
        </p>
        <Button variant="ghost" size="sm" onClick={onCompare}>
          Сравнить выбранные ({w.selectedIds.length}){" "}
          <ArrowRight size={16} aria-hidden="true" />
        </Button>
      </div>
      {w.isLoading ? (
        <p role="status" className="loading-state">
          Загружаем локальную рабочую область…
        </p>
      ) : w.visibleListings.length ? (
        <div className="listing-grid">
          {w.visibleListings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              brief={w.brief}
              selected={w.selectedIds.includes(listing.id)}
              selectionFull={w.selectedIds.length >= 4}
              onSelect={() => w.toggleSelection(listing.id)}
              onOpen={() => onOpen(listing.id)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Radar size={36} />}
          title={
            w.listings.length ? "Ничего не найдено" : "Ваш радар пока пуст"
          }
          description={
            w.listings.length
              ? "Измените поисковый запрос или статус."
              : "Добавьте объявление вручную или начните с шести вымышленных примеров."
          }
          action={
            !w.listings.length && (
              <Button
                variant="primary"
                onClick={() => {
                  void w.loadDemo().catch(w.reportError);
                }}
              >
                Посмотреть на примерах
              </Button>
            )
          }
        />
      )}
      <p className="fine-print">
        Демо-карточки вымышлены. Совпадение параметров не подтверждает
        техническое состояние, посадку или выгодность покупки.
      </p>
    </div>
  );
}
