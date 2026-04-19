import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getSpentPercentage } from "@/data/budgetData";
import { useTranslation } from "react-i18next";
import { usePreferences } from "@/context/PreferencesContext";

interface BudgetCategory {
  id: string;
  name: string;
  allocated: number;
  spent: number;
  color: string;
}

interface BudgetStatusProps {
  categories: BudgetCategory[];
}

export function BudgetStatus({ categories }: BudgetStatusProps) {
  const { t } = useTranslation();
  const { formatAmount } = usePreferences();

  if (!categories || categories.length === 0) return null;

  return (
    <Card className="h-full border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-foreground">
          {t("budgetPage.budgetProgress")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 pt-3">
        {categories.map((cat) => {
          const percentage   = getSpentPercentage(cat.spent, cat.allocated);
          const isOver       = percentage >= 100;
          const isWarning    = percentage >= 80 && !isOver;
          const remaining    = cat.allocated - cat.spent;

          // Semantic status color class
          const statusClass = isOver
            ? "text-destructive"
            : isWarning
              ? "text-warning"
              : "text-success";

          // Progress fill class
          const barClass = isOver
            ? "bg-destructive"
            : isWarning
              ? "bg-warning"
              : "bg-success";

          return (
            <div key={cat.id} className="space-y-2">
              {/* Top row: name + amounts */}
              <div className="flex items-center justify-between text-sm gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="font-semibold text-foreground truncate">{cat.name}</span>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={cn("font-bold", statusClass)}>{formatAmount(cat.spent)}</span>
                  <span className="text-muted-foreground mx-1 text-xs">{t("common.of")}</span>
                  <span className="text-muted-foreground text-xs">{formatAmount(cat.allocated)}</span>
                </div>
              </div>

              {/* Progress bar — semantic color, bg-muted track */}
              <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all duration-700 ease-out", barClass)}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>

              {/* Bottom row: used % + remaining */}
              <div className="flex justify-between items-center">
                <span className={cn("text-[11px] font-bold uppercase tracking-wider", statusClass)}>
                  {isOver
                    ? t("budgetPage.overBudget")
                    : t("budgetPage.usedPercent", { percent: percentage })}
                </span>
                <span className={cn(
                  "text-[11px] font-medium",
                  remaining < 0 ? "text-destructive" : "text-muted-foreground"
                )}>
                  {remaining >= 0
                    ? `${formatAmount(remaining)} ${t("budgetPage.left")}`
                    : `${formatAmount(Math.abs(remaining))} ${t("budgetPage.overBudget").toLowerCase()}`}
                </span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
