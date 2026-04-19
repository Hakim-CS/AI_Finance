import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, X, AlertTriangle, TrendingUp, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { AIBadge } from "./AIBadge";
import { Expense } from "@/hooks/useExpenses";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";
import { usePreferences } from "@/context/PreferencesContext";

interface AISmartAlertsProps {
  expenses: Expense[];
}

// Fully semantic — adapts automatically to light & dark mode
const alertConfig = {
  warning: {
    icon:   AlertTriangle,
    color:  "text-warning",
    bg:     "bg-warning/10",
    border: "border-warning/30",
    iconBg: "bg-warning/15",
  },
  insight: {
    icon:   TrendingUp,
    color:  "text-primary",
    bg:     "bg-primary/10",
    border: "border-primary/30",
    iconBg: "bg-primary/15",
  },
  achievement: {
    icon:   Sparkles,
    color:  "text-success",
    bg:     "bg-success/10",
    border: "border-success/30",
    iconBg: "bg-success/15",
  },
};

export function AISmartAlerts({ expenses }: AISmartAlertsProps) {
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const { user }         = useAuth();
  const { t }            = useTranslation();
  const { formatAmount } = usePreferences();

  const alerts = useMemo(() => {
    const activeAlerts = [];
    const now          = new Date();
    const currentMonth = now.getMonth();
    const currentYear  = now.getFullYear();
    const userIncome   = Number(user?.income) || 0;

    const monthlyExpenses = expenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const totalSpent = monthlyExpenses.reduce((acc, e) => acc + e.amount, 0);

    if (totalSpent > userIncome * 0.8 && userIncome > 0) {
      activeAlerts.push({
        id:       "high-spending",
        type:     "warning" as const,
        title:    t("ai.alerts.budgetTitle"),
        message:  `${t("budgetPage.totalSpent")}: ${formatAmount(totalSpent)}. ${t("ai.alerts.budgetMsg")}`,
        time:     t("ai.today"),
        priority: "high" as const,
      });
    }

    const weekendExpenses = monthlyExpenses.filter(e => {
      const day = new Date(e.date).getDay(); return day === 0 || day === 6;
    });
    const weekdayExpenses = monthlyExpenses.filter(e => {
      const day = new Date(e.date).getDay(); return day !== 0 && day !== 6;
    });

    const avgWeekend = weekendExpenses.length > 0
      ? weekendExpenses.reduce((a, b) => a + b.amount, 0) / weekendExpenses.length : 0;
    const avgWeekday = weekdayExpenses.length > 0
      ? weekdayExpenses.reduce((a, b) => a + b.amount, 0) / weekdayExpenses.length : 0;

    if (avgWeekend > avgWeekday * 1.2 || expenses.length > 10) {
      activeAlerts.push({
        id:       "weekend-pattern",
        type:     "insight" as const,
        title:    t("ai.alerts.patternTitle"),
        message:  t("ai.alerts.patternMsg"),
        time:     t("ai.alerts.hoursAgo", { count: 2 }),
        priority: "medium" as const,
      });
    }

    return activeAlerts.filter(a => !dismissedIds.includes(a.id));
  }, [expenses, dismissedIds, user?.income, t, formatAmount]);

  const dismissAlert = (id: string) => setDismissedIds(prev => [...prev, id]);

  return (
    <Card className="border-border bg-card h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <div className="p-2 rounded-lg bg-primary/10">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            {t("ai.smartNotifications")}
            <AIBadge variant="inline" animated={false} />
          </CardTitle>
          <span className="text-xs text-muted-foreground font-medium">
            {alerts.length} {t("common.active")}
          </span>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">{t("ai.allCaughtUp")}</p>
            </div>
          ) : (
            alerts.map(alert => {
              const config = alertConfig[alert.type as keyof typeof alertConfig] ?? alertConfig.insight;
              const Icon   = config.icon;
              return (
                <div
                  key={alert.id}
                  className={cn(
                    "relative p-4 rounded-xl border transition-all duration-300 hover:shadow-md",
                    config.bg, config.border
                  )}
                >
                  {/* Dismiss button */}
                  <button
                    onClick={() => dismissAlert(alert.id)}
                    className="absolute top-3 right-3 p-1 rounded-full hover:bg-foreground/10 transition-colors z-10"
                  >
                    <X className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>

                  <div className="flex gap-3">
                    {/* Icon */}
                    <div className={cn(
                      "flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg",
                      config.iconBg
                    )}>
                      <Icon className={cn("w-5 h-5", config.color)} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 pr-6">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-sm text-foreground">{alert.title}</h4>
                        {alert.priority === "high" && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-destructive/15 text-destructive">
                            {t("ai.urgent")}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{alert.message}</p>
                      <span className="text-[10px] text-muted-foreground/70 mt-2 block">{alert.time}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
