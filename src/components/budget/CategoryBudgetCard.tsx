import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit2, Utensils, Car, ShoppingBag, Gamepad2, Zap, Heart, Plane, MoreHorizontal, CreditCard } from "lucide-react";
import { BudgetCategory, getSpentPercentage } from "@/data/budgetData";
import { useTranslation } from "react-i18next";
import { usePreferences } from "@/context/PreferencesContext";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Utensils,
  Car,
  ShoppingBag,
  Gamepad2,
  Zap,
  Heart,
  Plane,
  MoreHorizontal,
  CreditCard,
};

interface CategoryBudgetCardProps {
  category: BudgetCategory;
  onEdit?: (category: BudgetCategory) => void;
}

export function CategoryBudgetCard({ category, onEdit }: CategoryBudgetCardProps) {
  const percentage   = getSpentPercentage(category.spent, category.allocated);
  const isOverBudget = percentage >= 100;
  const isWarning    = percentage >= 80 && percentage < 100;
  const remaining    = category.allocated - category.spent;
  const { t }        = useTranslation();
  const { formatAmount } = usePreferences();

  const IconComponent = iconMap[category.icon] || CreditCard;

  // Distinct bar color: green → amber → red
  const barColor = isOverBudget
    ? "bg-red-500"
    : isWarning
    ? "bg-amber-500"
    : "bg-emerald-500";

  // Status text color to match bar
  const statusColor = isOverBudget
    ? "text-red-500"
    : isWarning
    ? "text-amber-500"
    : "text-emerald-600 dark:text-emerald-400";

  return (
    <Card className="group hover:shadow-md transition-all duration-200">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div 
              className="p-2.5 rounded-lg"
              style={{ backgroundColor: `${category.color}20` }}
            >
              <IconComponent 
                className="h-5 w-5" 
                style={{ color: category.color }}
              />
            </div>
            <div>
              <h3 className="font-medium text-foreground">{category.name}</h3>
              <p className="text-xs text-muted-foreground">
                {formatAmount(category.spent)} {t("common.of")} {formatAmount(category.allocated)}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
            onClick={() => onEdit?.(category)}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2">
          {/* Custom progress bar with clear background/foreground contrast */}
          <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted dark:bg-muted/50">
            <div
              className={cn("h-full rounded-full transition-all duration-500 ease-out", barColor)}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
          <div className="flex justify-between items-center">
            <span className={cn("text-xs font-semibold", statusColor)}>
              {percentage}%
            </span>
            <span className={cn("text-xs font-medium",
              remaining < 0 ? 'text-red-500' : 'text-muted-foreground'
            )}>
              {remaining < 0
                ? `${t("budgetPage.overBudget")} ${formatAmount(Math.abs(remaining))}`
                : `${t("budgetPage.leftBy")} ${formatAmount(remaining)}`
              }
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
