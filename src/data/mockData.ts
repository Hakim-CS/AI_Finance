export interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  notes?: string;
}

export interface CategoryData {
  name: string;
  value: number;
  color: string;
  icon: string;
}

export const mockExpenses: Expense[] = [
  { id: "1", amount: 45.50, category: "food", description: "Grocery shopping", date: "2024-12-10", notes: "Weekly groceries" },
  { id: "2", amount: 12.00, category: "transport", description: "Uber ride", date: "2024-12-10" },
  { id: "3", amount: 89.99, category: "shopping", description: "New headphones", date: "2024-12-09" },
  { id: "4", amount: 15.00, category: "entertainment", description: "Movie tickets", date: "2024-12-08" },
  { id: "5", amount: 120.00, category: "utilities", description: "Electric bill", date: "2024-12-07" },
  { id: "6", amount: 35.00, category: "food", description: "Restaurant dinner", date: "2024-12-06" },
  { id: "7", amount: 50.00, category: "health", description: "Gym membership", date: "2024-12-05" },
  { id: "8", amount: 8.50, category: "transport", description: "Bus pass", date: "2024-12-04" },
  { id: "9", amount: 200.00, category: "travel", description: "Flight booking", date: "2024-12-03" },
  { id: "10", amount: 25.00, category: "entertainment", description: "Concert ticket", date: "2024-12-02" },
  { id: "11", amount: 65.00, category: "shopping", description: "Clothing", date: "2024-12-01" },
  { id: "12", amount: 18.00, category: "food", description: "Coffee & snacks", date: "2024-11-30" },
];

export const weeklySpendingData = [
  { day: "Mon", amount: 45 },
  { day: "Tue", amount: 78 },
  { day: "Wed", amount: 32 },
  { day: "Thu", amount: 95 },
  { day: "Fri", amount: 120 },
  { day: "Sat", amount: 85 },
  { day: "Sun", amount: 65 },
];

export const monthlySpendingData = [
  { month: "Jul", amount: 1200 },
  { month: "Aug", amount: 1450 },
  { month: "Sep", amount: 1320 },
  { month: "Oct", amount: 1580 },
  { month: "Nov", amount: 1390 },
  { month: "Dec", amount: 684 },
];

export const getCategoryData = (): CategoryData[] => {
  const categoryTotals = mockExpenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  return categories
    .filter(cat => categoryTotals[cat.id])
    .map(cat => ({
      name: cat.name,
      value: categoryTotals[cat.id],
      color: cat.color,
      icon: cat.icon,
    }));
};

export const summaryData = {
  totalBalance: 12450.00,
  monthlyIncome: 5200.00,
  monthlyExpenses: 684.00,
  savingsRate: 87,
};
