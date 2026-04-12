import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { getSpentPercentage, getStatusColor } from "@/data/budgetData";

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
  if (!categories || categories.length === 0) return null;

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Budget vs. Actual</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-4">
        {categories.map((cat) => {
          const percentage = getSpentPercentage(cat.spent, cat.allocated);
          const statusColor = getStatusColor(percentage);
          
          return (
            <div key={cat.id} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="font-medium text-foreground">{cat.name}</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-foreground">₺{cat.spent.toLocaleString()}</span>
                  <span className="text-muted-foreground mx-1">/</span>
                  <span className="text-muted-foreground text-xs">₺{cat.allocated.toLocaleString()}</span>
                </div>
              </div>
              <div className="relative pt-1">
                <Progress 
                  value={Math.min(percentage, 100)} 
                  className="h-2"
                />
                <div 
                  className="absolute top-0 h-2 rounded-full opacity-20 transition-all duration-500"
                  style={{ 
                    width: `${Math.min(percentage, 100)}%`, 
                    backgroundColor: statusColor 
                  }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] uppercase tracking-wider font-bold">
                <span style={{ color: statusColor }}>
                  {percentage >= 100 ? "Over Budget" : `${percentage}% Used`}
                </span>
                <span className="text-muted-foreground">
                  ₺{(cat.allocated - cat.spent).toLocaleString()} Left
                </span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
