import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Expense } from "@/hooks/useExpenses";
import { useTranslation } from "react-i18next";
import { usePreferences } from "@/context/PreferencesContext";

type ViewType = "weekly" | "monthly";
type ChartType = "bar" | "line";

interface SpendingTrendsProps {
  expenses: Expense[];
}

// Full English month names for key lookup; abbreviated for chart labels
const EN_MONTHS_FULL = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function SpendingTrends({ expenses }: SpendingTrendsProps) {
  const [view, setView] = useState<ViewType>("weekly");
  const [chartType, setChartType] = useState<ChartType>("bar");
  const { t, i18n } = useTranslation();
  const { formatAmount } = usePreferences();

  // Weekday keys for chart x-axis — translated from weekdays namespace
  const WEEKDAY_KEYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const chartData = useMemo(() => {
    if (view === "weekly") {
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return {
          compDate: d.toLocaleDateString("en-CA"),
          dayKey: WEEKDAY_KEYS[d.getDay()],
          amount: 0,
        };
      });

      expenses.forEach(e => {
        const compDate = new Date(e.date).toLocaleDateString("en-CA");
        const match = last7Days.find(d => d.compDate === compDate);
        if (match) match.amount += e.amount;
      });

      return last7Days.map(d => ({ label: t(`weekdays.${d.dayKey}`), amount: d.amount }));
    } else {
      const last6Months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (5 - i));
        return { month: d.getMonth(), year: d.getFullYear(), amount: 0 };
      });

      expenses.forEach(e => {
        const d = new Date(e.date);
        const match = last6Months.find(lm => lm.month === d.getMonth() && lm.year === d.getFullYear());
        if (match) match.amount += e.amount;
      });

      return last6Months.map(m => ({
        label: t(`months.${EN_MONTHS_FULL[m.month]}`),
        amount: m.amount,
      }));
    }
  }, [expenses, view, i18n.language]);

  const tooltipFormatter = (value: number): [string, string] =>
    [formatAmount(value), t("dashboard.spent")];

  const tickFormatter = (value: number) => formatAmount(value, { compact: true });

  return (
    <Card className="overflow-hidden h-full">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="text-lg font-semibold">{t("dashboard.spendingTrends")}</CardTitle>
          <div className="flex gap-2">
            <div className="flex bg-muted rounded-lg p-1">
              {(["weekly", "monthly"] as const).map(v => (
                <Button key={v} size="sm" variant="ghost"
                  onClick={() => setView(v)}
                  className={cn("h-7 px-3 text-xs", view === v && "bg-background shadow-sm")}
                >
                  {t(`dashboard.${v}`)}
                </Button>
              ))}
            </div>
            <div className="flex bg-muted rounded-lg p-1">
              {(["bar", "line"] as const).map(ct => (
                <Button key={ct} size="sm" variant="ghost"
                  onClick={() => setChartType(ct)}
                  className={cn("h-7 px-3 text-xs", chartType === ct && "bg-background shadow-sm")}
                >
                  {t(`dashboard.${ct}`)}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "bar" ? (
              <BarChart data={chartData}>
                <XAxis dataKey="label" axisLine={false} tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  tickFormatter={tickFormatter} />
                <Tooltip formatter={tooltipFormatter}
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} animationDuration={800} />
              </BarChart>
            ) : (
              <LineChart data={chartData}>
                <XAxis dataKey="label" axisLine={false} tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  tickFormatter={tickFormatter} />
                <Tooltip formatter={tooltipFormatter}
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                <Line type="monotone" dataKey="amount" stroke="hsl(var(--primary))" strokeWidth={3}
                  dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 4 }}
                  activeDot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 6 }}
                  animationDuration={800} />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
