import { API_BASE } from "@/lib/api";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";
import { usePreferences } from "@/context/PreferencesContext";

interface TrendData {
  month: string;
  spent: number;
  budget: number;
}

export function SpendingTrendChart() {
  const [data, setData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  const { t } = useTranslation();
  const { formatAmount } = usePreferences();

  useEffect(() => {
    const fetchTrend = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE}/expenses/history`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const history = await res.json();
        setData(history);
      } catch (e) {
        console.error("Failed to fetch spending trend", e);
      } finally {
        setLoading(false);
      }
    };
    fetchTrend();
  }, [token]);

  if (loading) {
    return (
      <Card className="h-full flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </Card>
    );
  }

  return (
    <Card className="border-border shadow-sm">
      <CardHeader>
        <CardTitle className="tracking-tight flex items-center gap-2 text-xl font-bold text-foreground">{t("dashboard.spendingTrends")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
              <defs>
                <linearGradient id="colorBudget" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis
                dataKey="month"
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
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-popover border border-border p-4 rounded-xl shadow-xl">
                        <p className="font-bold text-foreground mb-2">{label}</p>
                        <div className="space-y-1">
                          <p className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            {t('budgetPage.budget')}: {formatAmount(Number(payload[0].value ?? 0))}
                          </p>
                          <p className="text-violet-600 dark:text-violet-400 font-bold flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-violet-500" />
                            {t('budgetPage.spent')}: {formatAmount(Number(payload[1].value ?? 0))}
                          </p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="bottom"
                align="center"
                iconType="circle"
                wrapperStyle={{ paddingTop: '30px', fontWeight: 600, fontSize: '14px' }}
              />
              <Area
                type="monotone"
                dataKey="budget"
                name={t("budgetPage.totalBudget")}
                stroke="#10b981"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorBudget)"
                dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
              <Area
                type="monotone"
                dataKey="spent"
                name={t("budgetPage.totalSpent")}
                stroke="#8b5cf6"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorSpent)"
                dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
