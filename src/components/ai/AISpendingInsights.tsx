import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, ShoppingCart, Utensils, Car, Home, Gamepad2 } from "lucide-react";
import { AIBadge } from "./AIBadge";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { usePreferences } from "@/context/PreferencesContext";

interface CategoryInsight {
  categoryId: string;
  icon: React.ElementType;
  currentSpend: number;
  averageSpend: number;
  aiRecommendationKey: string;
  potentialSavings: number;
  trend: "up" | "down" | "stable";
}

const insights: CategoryInsight[] = [
  {
    categoryId: "food",
    icon: Utensils,
    currentSpend: 680,
    averageSpend: 520,
    aiRecommendationKey: "ai.recs.foodTip",
    potentialSavings: 120,
    trend: "up",
  },
  {
    categoryId: "shopping",
    icon: ShoppingCart,
    currentSpend: 340,
    averageSpend: 380,
    aiRecommendationKey: "ai.recs.shoppingTip",
    potentialSavings: 0,
    trend: "down",
  },
  {
    categoryId: "transport",
    icon: Car,
    currentSpend: 280,
    averageSpend: 250,
    aiRecommendationKey: "ai.recs.transportTip",
    potentialSavings: 45,
    trend: "up",
  },
  {
    categoryId: "entertainment",
    icon: Gamepad2,
    currentSpend: 150,
    averageSpend: 200,
    aiRecommendationKey: "ai.recs.entertainmentTip",
    potentialSavings: 0,
    trend: "down",
  },
];

export function AISpendingInsights() {
  const { t } = useTranslation();
  const { formatAmount } = usePreferences();
  const totalSavings = insights.reduce((sum, i) => sum + i.potentialSavings, 0);

  return (
    <Card className="border-primary/20 gradient-ai-subtle">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <div className="p-2 rounded-lg gradient-ai animate-float">
              <Brain className="w-5 h-5 text-primary-foreground" />
            </div>
            {t('ai.smartAnalysis')}
            <AIBadge variant="inline" />
          </CardTitle>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">{t('ai.potentialSavings')}</p>
            <p className="text-lg font-bold text-success">{formatAmount(totalSavings)}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((insight, index) => {
            const Icon = insight.icon;
            const percentChange = Math.round(((insight.currentSpend - insight.averageSpend) / insight.averageSpend) * 100);
            const isOverBudget = insight.currentSpend > insight.averageSpend;

            return (
              <div
                key={insight.categoryId}
                className={cn(
                  "p-4 rounded-xl bg-background/60 border border-border/50 transition-all duration-300 hover:shadow-md hover:border-primary/30 animate-fade-in"
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "p-2 rounded-lg",
                      isOverBudget ? "bg-warning/10 text-warning" : "bg-success/10 text-success"
                    )}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-medium text-sm text-foreground">{t(`categories.${insight.categoryId}`)}</span>
                  </div>
                  <span className={cn(
                    "text-xs font-medium px-2 py-0.5 rounded-full",
                    isOverBudget ? "bg-warning/10 text-warning" : "bg-success/10 text-success"
                  )}>
                    {isOverBudget ? "+" : ""}{percentChange}%
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{t('budgetPage.spent')}: <span className="font-medium text-foreground">{formatAmount(insight.currentSpend)}</span></span>
                    <span className="text-muted-foreground">{t('dashboard.monthlyAverage')}: <span className="font-medium text-foreground">{formatAmount(insight.averageSpend)}</span></span>
                  </div>

                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        isOverBudget ? "bg-warning" : "bg-success"
                      )}
                      style={{ width: `${Math.min((insight.currentSpend / insight.averageSpend) * 100, 100)}%` }}
                    />
                  </div>

                  <div className="pt-2 border-t border-border/30 mt-2">
                    <p className="text-xs text-muted-foreground">
                      <span className="text-primary font-medium">{t('ai.smart')}:</span> {t(insight.aiRecommendationKey)}
                    </p>
                    {insight.potentialSavings > 0 && (
                      <p className="text-xs text-success font-medium mt-1">
                        {t('ai.saveUpTo', { amount: formatAmount(insight.potentialSavings) })}
                      </p>
                    )}
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
