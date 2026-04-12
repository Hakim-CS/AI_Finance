import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PiggyBank, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { formatCurrency, getSpentPercentage } from "@/data/budgetData";

interface BudgetOverviewProps {
  totalBudget: number;
  totalSpent: number;
  month: string;
  year: number;
}

export function BudgetOverview({ totalBudget, totalSpent, month, year }: BudgetOverviewProps) {
  const remaining = totalBudget - totalSpent;
  const percentage = getSpentPercentage(totalSpent, totalBudget);
  const isOverBudget = remaining < 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Monthly Budget
          </CardTitle>
          <div className="p-2 bg-primary/10 rounded-full">
            <Wallet className="h-4 w-4 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{formatCurrency(totalBudget)}</div>
          <p className="text-xs text-muted-foreground mt-1">{month} {year}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Spent
          </CardTitle>
          <div className="p-2 bg-chart-3/10 rounded-full">
            <TrendingUp className="h-4 w-4 text-chart-3" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{formatCurrency(totalSpent)}</div>
          <p className="text-xs text-muted-foreground mt-1">{percentage}% of budget used</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Remaining
          </CardTitle>
          <div className={`p-2 rounded-full ${isOverBudget ? 'bg-destructive/10' : 'bg-chart-1/10'}`}>
            {isOverBudget ? (
              <TrendingDown className="h-4 w-4 text-destructive" />
            ) : (
              <PiggyBank className="h-4 w-4 text-chart-1" />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${isOverBudget ? 'text-destructive' : 'text-foreground'}`}>
            {isOverBudget ? '-' : ''}{formatCurrency(Math.abs(remaining))}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {isOverBudget ? 'Over budget' : 'Available to spend'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Budget Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Progress 
              value={Math.min(percentage, 100)} 
              className="h-3"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{percentage}% used</span>
              <span>{100 - Math.min(percentage, 100)}% left</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
