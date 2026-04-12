import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Edit2, Utensils, Car, ShoppingBag, Gamepad2, Zap, Heart, GraduationCap, CreditCard } from "lucide-react";
import { BudgetCategory, formatCurrency, getSpentPercentage } from "@/data/budgetData";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Utensils,
  Car,
  ShoppingBag,
  Gamepad2,
  Zap,
  Heart,
  GraduationCap,
  CreditCard,
};

interface CategoryBudgetCardProps {
  category: BudgetCategory;
  onEdit?: (category: BudgetCategory) => void;
}

export function CategoryBudgetCard({ category, onEdit }: CategoryBudgetCardProps) {
  const percentage = getSpentPercentage(category.spent, category.allocated);
  const isOverBudget = percentage >= 100;
  const isWarning = percentage >= 80 && percentage < 100;
  const remaining = category.allocated - category.spent;

  const IconComponent = iconMap[category.icon] || CreditCard;

  const getProgressColor = () => {
    if (isOverBudget) return "bg-destructive";
    if (isWarning) return "bg-amber-500";
    return "";
  };

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
                {formatCurrency(category.spent)} of {formatCurrency(category.allocated)}
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
          <Progress 
            value={Math.min(percentage, 100)} 
            className={`h-2 ${getProgressColor()}`}
          />
          <div className="flex justify-between items-center">
            <span className={`text-xs font-medium ${
              isOverBudget ? 'text-destructive' : 
              isWarning ? 'text-amber-500' : 
              'text-muted-foreground'
            }`}>
              {percentage}%
            </span>
            <span className={`text-xs ${
              remaining < 0 ? 'text-destructive' : 'text-muted-foreground'
            }`}>
              {remaining < 0 ? 'Over by ' : 'Left: '}
              {formatCurrency(Math.abs(remaining))}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
