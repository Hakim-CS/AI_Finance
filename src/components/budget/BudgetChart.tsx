import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from "recharts";
import { BudgetCategory } from "@/data/budgetData";
import { useTranslation } from "react-i18next";
import { usePreferences } from "@/context/PreferencesContext";

interface BudgetChartProps {
  categories: BudgetCategory[];
}

export function BudgetChart({ categories }: BudgetChartProps) {
  const { t } = useTranslation();
  const { formatAmount } = usePreferences();

  const data = categories.map(cat => ({
    name: t(`categories.${cat.id}`, { defaultValue: cat.name }).split(' ')[0],
    budget: cat.allocated,
    spent: cat.spent,
    color: cat.color,
  }));

  return (
    <Card className="border-border shadow-sm">
      <CardHeader>
        <CardTitle className="tracking-tight flex items-center gap-2 text-xl font-bold text-foreground">
          {t("budgetPage.budgetVsSpending")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }} barGap={8}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 13, fontWeight: 500 }}
                dy={15}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickFormatter={(value) => formatAmount(value, { compact: true })}
              />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  color: 'hsl(var(--popover-foreground))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  padding: '12px'
                }}
                itemStyle={{ fontSize: '12px', fontWeight: 600 }}
                formatter={(value: number) => formatAmount(value)}
              />
              <Legend
                verticalAlign="bottom"
                align="center"
                iconType="rect"
                iconSize={14}
                wrapperStyle={{ paddingTop: '30px', fontWeight: 600, fontSize: '14px', color: 'hsl(var(--muted-foreground))' }}
              />
              <Bar
                dataKey="budget"
                name={t("budgetPage.budget")}
                fill="hsl(var(--muted-foreground))"
                radius={[4, 4, 0, 0]}
                barSize={24}
              />
              <Bar
                dataKey="spent"
                name={t("budgetPage.spent")}
                radius={[4, 4, 0, 0]}
                barSize={24}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
