import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { usePreferences } from "@/context/PreferencesContext";

interface ChartCategoryData {
  name: string;
  value: number;
  color: string;
  icon?: string;
}

interface CategoryChartProps {
  data: ChartCategoryData[];
}

export function CategoryChart({ data }: CategoryChartProps) {
  const { t } = useTranslation();
  const { formatAmount } = usePreferences();

  if (!data || data.length === 0) {
    return (
      <Card className="flex items-center justify-center min-h-[300px]">
        <p className="text-muted-foreground">{t("dashboard.spendingByCategory")}</p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">{t("dashboard.spendingByCategory")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                paddingAngle={4} dataKey="value" animationDuration={800}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [formatAmount(value), name]}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
              />
              <Legend verticalAlign="bottom" height={36}
                formatter={(value) => <span className="text-sm text-foreground">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
