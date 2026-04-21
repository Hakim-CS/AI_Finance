export interface BudgetCategory {
  id: string;
  name: string;
  icon: string;
  allocated: number;
  spent: number;
  color: string;
}

export interface MonthlyBudget {
  month: string;
  year: number;
  totalBudget: number;
  totalSpent: number;
  categories: BudgetCategory[];
}

export const mockBudgetCategories: BudgetCategory[] = [
  { id: "food", name: "Food & Dining", icon: "Utensils", allocated: 0, spent: 0, color: "hsl(var(--chart-1))" },
  { id: "transport", name: "Transportation", icon: "Car", allocated: 0, spent: 0, color: "hsl(var(--chart-2))" },
  { id: "shopping", name: "Shopping", icon: "ShoppingBag", allocated: 0, spent: 0, color: "hsl(var(--chart-3))" },
  { id: "entertainment", name: "Entertainment", icon: "Gamepad2", allocated: 0, spent: 0, color: "hsl(var(--chart-4))" },
  { id: "utilities", name: "Utilities", icon: "Zap", allocated: 0, spent: 0, color: "hsl(var(--chart-5))" },
  { id: "health", name: "Healthcare", icon: "Heart", allocated: 0, spent: 0, color: "hsl(var(--chart-6))" },
  { id: "other", name: "Other", icon: "MoreHorizontal", allocated: 0, spent: 0, color: "hsl(var(--chart-7))" },
  { id: "travel", name: "Travel", icon: "Plane", allocated: 0, spent: 0, color: "hsl(var(--chart-8))" },
];

export const mockMonthlyBudget: MonthlyBudget = {
  month: "December",
  year: 2024,
  totalBudget: 0,
  totalSpent: 0,
  categories: mockBudgetCategories,
};

export const monthlySpendingHistory: { month: string; budget: number; spent: number }[] = [];

export function getSpentPercentage(spent: number, allocated: number): number {
  if (allocated === 0) return 0;
  return Math.round((spent / allocated) * 100);
}

export function getStatusColor(percentage: number): string {
  if (percentage >= 100) return "hsl(var(--destructive))";
  if (percentage >= 80) return "hsl(38, 92%, 50%)";
  return "hsl(var(--primary))";
}

export function formatCurrency(amount: number): string {
  // Deprecated — use usePreferences().formatAmount() instead
  return `${amount.toLocaleString()}`;
}
