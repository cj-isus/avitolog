import { lazy, Suspense } from "react";
import { CircleHelp, TrendingUp } from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { SectionHeading } from "../../components/ui/SectionHeading";
import { estimate } from "../../domain/evaluation";
import { latestListings, type Listing } from "../../domain/listing";
import { money } from "../../lib/presentation";

const AskingPriceChart = lazy(() => import("./AskingPriceChart"));

export type MarketPageProps = {
  listing: Listing | undefined;
  listings: Listing[];
};

export function MarketPage({ listing, listings }: MarketPageProps) {
  if (!listing)
    return (
      <div className="page-stack">
        <SectionHeading
          eyebrow="03 / ЦЕНОВЫЕ ОРИЕНТИРЫ"
          title="Цены похожих предложений"
        />
        <Card>
          <EmptyState
            icon={<TrendingUp size={36} />}
            title="Добавьте первого кандидата"
            description="Сохранённые карточки станут основой для сравнения цен предложений."
          />
        </Card>
      </div>
    );

  const result = estimate(listing, listings);
  const comparableIds = new Set(result.comparableIds);
  const comparables = latestListings(listings).filter((candidate) =>
    comparableIds.has(candidate.id),
  );

  return (
    <div className="page-stack">
      <SectionHeading
        eyebrow="03 / ЦЕНОВЫЕ ОРИЕНТИРЫ"
        title="Цены похожих предложений"
        description={listing.title}
        action={
          <Badge tone={listing.sourceKind === "demo" ? "warning" : "info"}>
            {listing.sourceKind === "demo"
              ? "Вымышленные примеры"
              : "Сохранённые предложения"}
          </Badge>
        }
      />
      <div className="market-grid">
        <Card className="chart-card">
          <span className="eyebrow">СОПОСТАВИМЫЕ КАРТОЧКИ</span>
          {result.range && result.median !== null ? (
            <>
              <div className="metric-row">
                <strong>
                  {money(result.range[0])} — {money(result.range[1])}
                </strong>
                <Badge>{result.comparableIds.length} аналогов</Badge>
              </div>
              <p className="muted">
                Медиана предложений: {money(result.median)}. Выбранная карточка
                не входит в расчёт.
              </p>
              <Suspense
                fallback={
                  <p className="muted" role="status">
                    Загружаем график цен…
                  </p>
                }
              >
                <AskingPriceChart listings={comparables} />
              </Suspense>
              <dl
                className="detail-list"
                aria-label="Данные графика цен предложений"
              >
                {comparables.map((candidate, index) => (
                  <div key={candidate.id}>
                    <dt>
                      №{index + 1} · {candidate.title}
                    </dt>
                    <dd>{money(candidate.askingPrice)}</dd>
                  </div>
                ))}
              </dl>
            </>
          ) : (
            <EmptyState
              compact
              icon={<CircleHelp size={30} />}
              title="Недостаточно сопоставимых данных"
              description={`Найдено аналогов: ${result.comparableIds.length}. Для диапазона нужны минимум три другие карточки с совпадающими признаками.`}
            />
          )}
          <p className="muted">
            Сравниваем одну группу, диаметр колёс и маркировку рамы с указанными
            значениями. Вымышленные примеры учитываются отдельно от реальных
            карточек.
          </p>
        </Card>
        <Card className="prose">
          <span className="eyebrow">ПРЕДЕЛЫ ОЦЕНКИ</span>
          <h3>Что остаётся проверить</h3>
          <ul>
            <li>Цену состоявшейся сделки</li>
            <li>Фактический износ и расходы на ремонт</li>
            <li>Геометрию, посадку и достоверность комплектации</li>
            <li>Скрытые повреждения и историю обслуживания</li>
          </ul>
          <p>
            Диапазон отражает цены выбранных предложений. Он не определяет
            справедливую цену и не доказывает выгоду покупки.
          </p>
        </Card>
      </div>
    </div>
  );
}
