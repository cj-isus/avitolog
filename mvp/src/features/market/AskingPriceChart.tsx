import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Listing } from "../../domain/listing";
import { money } from "../../lib/presentation";

export type AskingPriceChartProps = { listings: Listing[] };

export default function AskingPriceChart({ listings }: AskingPriceChartProps) {
  const data = listings.map((listing, index) => ({
    name: `№${index + 1}`,
    price: listing.askingPrice,
  }));

  return (
    <div className="chart-container" aria-hidden="true">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart
          data={data}
          accessibilityLayer={false}
          margin={{ top: 12, right: 12, bottom: 0, left: 0 }}
        >
          <CartesianGrid stroke="var(--border, #263538)" vertical={false} />
          <XAxis
            dataKey="name"
            stroke="var(--muted, #9baeb1)"
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="var(--muted, #9baeb1)"
            width={78}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => money(Number(value))}
          />
          <Tooltip
            formatter={(value) => money(Number(value))}
            contentStyle={{
              background: "var(--surface, #132025)",
              border: "1px solid var(--border, #3b555b)",
              borderRadius: 12,
            }}
          />
          <Bar
            dataKey="price"
            name="Цена предложения"
            fill="var(--accent, #b6f36d)"
            radius={[6, 6, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
