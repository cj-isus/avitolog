import { GitCompareArrows, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { Alert } from "../../components/ui/Alert";
import { Badge } from "../../components/ui/Badge";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { SectionHeading } from "../../components/ui/SectionHeading";
import type { Brief } from "../../domain/brief";
import { eligibility } from "../../domain/evaluation";
import type { Listing } from "../../domain/listing";
import {
  eligibilityLabel,
  fieldEvidenceLabel,
  isDeclared,
  money,
} from "../../lib/presentation";

export type ComparisonPageProps = { listings: Listing[]; brief: Brief };

function EvidenceValue({
  field,
  suffix = "",
}: {
  field: Listing["wheel"] | Listing["frame"];
  suffix?: string;
}) {
  if (field.value === null) return <span className="muted">Неизвестно</span>;
  return (
    <span>
      {field.value}
      {suffix}
      <small className="muted"> · {fieldEvidenceLabel(field.status)}</small>
    </span>
  );
}

function HeightRange({ listing }: { listing: Listing }) {
  if (!isDeclared(listing.heightMin) || !isDeclared(listing.heightMax))
    return <span className="muted">Уточнить геометрию</span>;
  return (
    <span>
      {listing.heightMin.value}–{listing.heightMax.value} см
      <small className="muted"> · по указанным данным</small>
    </span>
  );
}

type ComparisonRow = { label: string; render: (listing: Listing) => ReactNode };

const rows: ComparisonRow[] = [
  { label: "Цена объявления", render: (listing) => money(listing.askingPrice) },
  {
    label: "Колёса",
    render: (listing) => <EvidenceValue field={listing.wheel} suffix="″" />,
  },
  {
    label: "Рама",
    render: (listing) => <EvidenceValue field={listing.frame} />,
  },
  {
    label: "Рост по указанным данным",
    render: (listing) => <HeightRange listing={listing} />,
  },
  {
    label: "Комплектация",
    render: (listing) => <EvidenceValue field={listing.components} />,
  },
  {
    label: "Состояние",
    render: (listing) => <EvidenceValue field={listing.condition} />,
  },
  {
    label: "Заданный резерв",
    render: (listing) =>
      listing.repairReserve ? money(listing.repairReserve) : "Не задан",
  },
  {
    label: "Цена с резервом",
    render: (listing) => money(listing.askingPrice + listing.repairReserve),
  },
];

export function ComparisonPage({ listings, brief }: ComparisonPageProps) {
  return (
    <div className="page-stack">
      <SectionHeading
        eyebrow="02 / СРАВНЕНИЕ"
        title="Различия, которые имеют значение"
        description="Выбранные кандидаты рядом: размеры, заявленные сведения и ваш резерв на расходы."
        action={<Badge>До четырёх кандидатов</Badge>}
      />
      {listings.length === 0 ? (
        <Card>
          <EmptyState
            icon={<GitCompareArrows size={36} />}
            title="Сначала выберите кандидатов"
            description="Отметьте карточки в радаре, чтобы сравнить их по одним и тем же признакам."
          />
        </Card>
      ) : (
        <div
          className="table-scroll"
          role="region"
          aria-label="Сравнение выбранных кандидатов"
          tabIndex={0}
        >
          <table className="comparison-table">
            <caption>
              Сведения из сохранённых карточек. Неизвестные параметры требуют
              уточнения.
            </caption>
            <thead>
              <tr>
                <th scope="col">Что сравниваем</th>
                {listings.map((listing) => (
                  <th scope="col" key={listing.id}>
                    {listing.title}
                    <small className="muted">
                      {listing.sourceKind === "demo"
                        ? "Вымышленный пример"
                        : "Сохранённая карточка"}
                    </small>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label}>
                  <th scope="row">{row.label}</th>
                  {listings.map((listing) => (
                    <td key={listing.id}>{row.render(listing)}</td>
                  ))}
                </tr>
              ))}
              <tr>
                <th scope="row">Соответствие требованиям</th>
                {listings.map((listing) => {
                  const result = eligibility(listing, brief);
                  return (
                    <td key={listing.id}>
                      <Badge
                        tone={
                          result.status === "pass"
                            ? "positive"
                            : result.status === "fail"
                              ? "danger"
                              : "warning"
                        }
                      >
                        {eligibilityLabel(result.status)}
                      </Badge>
                      <small className="muted">
                        {result.reasons[0] ||
                          result.missing[0] ||
                          "Посадка и состояние требуют осмотра."}
                      </small>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      )}
      <Alert
        title={
          <>
            <ShieldCheck size={16} aria-hidden="true" /> Размеры —
            предварительный фильтр
          </>
        }
      >
        Маркировка XL не заменяет геометрию. Сведения продавца о состоянии нужно
        подтвердить на осмотре.
      </Alert>
    </div>
  );
}
