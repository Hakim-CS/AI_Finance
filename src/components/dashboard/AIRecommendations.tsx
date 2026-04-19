import { Sparkles, TrendingUp, Brain, Zap, AlertTriangle, Tags } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AIBadge } from "@/components/ai/AIBadge";
import { cn } from "@/lib/utils";
import { Expense } from "@/hooks/useExpenses";
import { useBudget } from "@/hooks/useBudget";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { usePreferences } from "@/context/PreferencesContext";

interface AIRecommendationsProps {
  expenses: Expense[];
}

// All background/border/text classes are semantic — no hardcoded hex colors
const typeStyles = {
  warning:  {
    bg:     "bg-warning/10",
    border: "border-warning/30",
    text:   "text-warning",
    iconBg: "bg-warning/15",
  },
  success:  {
    bg:     "bg-success/10",
    border: "border-success/30",
    text:   "text-success",
    iconBg: "bg-success/15",
  },
  trend: {
    bg:     "bg-primary/10",
    border: "border-primary/30",
    text:   "text-primary",
    iconBg: "bg-primary/15",
  },
  reminder: {
    bg:     "bg-primary/10",
    border: "border-primary/30",
    text:   "text-primary",
    iconBg: "bg-primary/15",
  },
};

const DEFAULT_BUDGETS: Record<string, number> = {
  food: 3000, transport: 1500, shopping: 2000, entertainment: 1000,
  utilities: 2500, health: 1000, travel: 5000, other: 500,
};

export function AIRecommendations({ expenses }: AIRecommendationsProps) {
  const { data: budgetLimits } = useBudget();
  const { t } = useTranslation();
  const { formatAmount } = usePreferences();

  const generateRecommendations = () => {
    const recs = [];
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear  = now.getFullYear();

    const currentLimits: Record<string, number> = { ...DEFAULT_BUDGETS };
    budgetLimits?.forEach(limit => { currentLimits[limit.categoryId] = Number(limit.limitAmount); });

    const monthlyExpenses = expenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const categoryTotals = monthlyExpenses.reduce((acc, e) => {
      acc[e.categoryId] = (acc[e.categoryId] || 0) + e.amount;
      return acc;
    }, {} as Record<string, number>);

    // Budget warnings
    for (const [catId, total] of Object.entries(categoryTotals)) {
      const budget = currentLimits[catId];
      if (budget && total > budget * 0.8) {
        const percent = Math.round((total / budget) * 100);
        recs.push({
          id:         `budget-${catId}`,
          icon:       AlertTriangle,
          title:      t("ai.alerts.budgetTitle"),
          text:       `${formatAmount(total)} (${percent}%) — ${catId}`,
          type:       "warning",
          confidence: 98,
          action:     t("common.manage"),
          path:       "/budget",
        });
      }
    }

    // AI analysis
    if (monthlyExpenses.length > 0) {
      recs.push({
        id:         "categorized",
        icon:       Tags,
        title:      t("ai.spendingAnalysis"),
        text:       `${monthlyExpenses.length} ${t("ai.recs.spendingAction")} — ${t("ai.confidence")} 100%`,
        type:       "success",
        confidence: 100,
        action:     t("common.viewAll"),
        path:       "/expenses",
      });
    }

    // Pattern insight
    if (expenses.length > 5) {
      recs.push({
        id:         "trend-pattern",
        icon:       TrendingUp,
        title:      t("ai.alerts.patternTitle"),
        text:       t("ai.alerts.patternMsg"),
        type:       "trend",
        confidence: 90,
        action:     t("common.viewAll"),
        path:       "/expenses",
      });
    }

    // Fallback empty state
    if (recs.length === 0) {
      recs.push({
        id:         "empty-tip",
        icon:       Brain,
        title:      t("ai.active"),
        text:       t("dashboard.aiAnalyzing"),
        type:       "success",
        confidence: 100,
        action:     t("nav.addExpense"),
        path:       "/add-expense",
      });
    }

    return recs.slice(0, 3);
  };

  const recommendations = generateRecommendations();

  return (
    <Card className="border-border bg-card overflow-hidden h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <CardTitle className="flex items-center gap-3 text-lg font-semibold">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                {t("dashboard.aiInsightsTitle")}
                <AIBadge variant="inline" animated={false} />
              </div>
              <p className="text-xs text-muted-foreground font-normal mt-0.5">
                {t("dashboard.aiInsightsSubtitle")}
              </p>
            </div>
          </CardTitle>
          {/* Insight count badge — semantic */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/60 border border-border">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">
              {t("dashboard.newInsights", { count: recommendations.length })}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          {recommendations.map((rec, index) => {
            const styles = typeStyles[rec.type as keyof typeof typeStyles] ?? typeStyles.success;
            const Icon   = rec.icon;
            return (
              <div
                key={rec.id}
                className={cn(
                  "group relative p-4 rounded-xl border transition-all duration-300 hover:shadow-md",
                  styles.bg, styles.border,
                  index === 2 ? "sm:col-span-2 lg:col-span-1" : ""
                )}
              >
                {/* Confidence badge */}
                <div className="absolute top-2.5 right-3 flex items-center gap-1 opacity-50">
                  <Sparkles className={cn("w-3.5 h-3.5", styles.text)} />
                  <span className={cn("text-[10px] font-bold", styles.text)}>{rec.confidence}%</span>
                </div>

                <div className="flex items-start gap-3">
                  <div className={cn("p-2 rounded-lg flex-shrink-0", styles.iconBg)}>
                    <Icon className={cn("w-4 h-4", styles.text)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm text-foreground">{rec.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{rec.text}</p>
                    <Link
                      to={rec.path}
                      className={cn("mt-2 text-xs font-semibold flex items-center gap-1 transition-colors w-fit hover:underline", styles.text)}
                    >
                      {rec.action} →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
