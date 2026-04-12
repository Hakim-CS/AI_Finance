import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings2, ChevronLeft, ChevronRight, Sparkles, Loader2 } from "lucide-react";
import { BudgetOverview } from "@/components/budget/BudgetOverview";
import { CategoryBudgetCard } from "@/components/budget/CategoryBudgetCard";
import { BudgetChart } from "@/components/budget/BudgetChart";
import { SpendingTrendChart } from "@/components/budget/SpendingTrendChart";
import { EditBudgetDialog } from "@/components/budget/EditBudgetDialog";
import { AIBudgetPredictions } from "@/components/ai/AIBudgetPredictions";
import { AIBudgetOptimizer } from "@/components/budget/AIBudgetOptimizer";
import { mockBudgetCategories, BudgetCategory } from "@/data/budgetData";
import { useAuth } from "@/context/AuthContext";
import { useExpenses } from "@/hooks/useExpenses";
import { useToast } from "@/hooks/use-toast";

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function Budget() {
  const { data: allExpenses, isLoading: expensesLoading } = useExpenses();
  const { token } = useAuth();
  const { toast } = useToast();

  const [selectedMonth, setSelectedMonth] = useState(months[new Date().getMonth()]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [categories, setCategories] = useState<BudgetCategory[]>(mockBudgetCategories);
  const [loadingBudget, setLoadingBudget] = useState(true);
  
  const [editingCategory, setEditingCategory] = useState<BudgetCategory | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // 1. Fetch real Budget Limits from Backend
  useEffect(() => {
    const fetchBudget = async () => {
      if (!token) return;
      try {
        const res = await fetch('http://localhost:5001/budget', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const limits = await res.json();
        
        setCategories(prev => prev.map(cat => {
          const match = limits.find((l: any) => l.categoryId === cat.id);
          return { 
            ...cat, 
            allocated: match ? Number(match.limitAmount) : cat.allocated 
          };
        }));
      } catch (e) {
        console.error("Failed to fetch budget limits");
      } finally {
        setLoadingBudget(false);
      }
    };
    fetchBudget();
  }, [token]);

  // 2. Synchronize "Spent" values from real Expenses
  useEffect(() => {
    if (!allExpenses) return;

    const monthIdx = months.indexOf(selectedMonth);
    const filtered = allExpenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === monthIdx && d.getFullYear() === selectedYear;
    });

    const totals: Record<string, number> = {};
    filtered.forEach(e => {
      totals[e.categoryId] = (totals[e.categoryId] || 0) + e.amount;
    });

    setCategories(prev => prev.map(cat => ({
      ...cat,
      spent: totals[cat.id] || 0
    })));
  }, [allExpenses, selectedMonth, selectedYear]);

  const totalBudget = categories.reduce((sum, cat) => sum + cat.allocated, 0);
  const totalSpent = categories.reduce((sum, cat) => sum + cat.spent, 0);

  const handleEditCategory = (category: BudgetCategory) => {
    setEditingCategory(category);
    setDialogOpen(true);
  };

  const handleSaveBudget = async (categoryId: string, newAmount: number) => {
    // Optimistic UI update
    setCategories(prev => prev.map(cat => cat.id === categoryId ? { ...cat, allocated: newAmount } : cat));
    
    // Save to DB
    try {
      await fetch('http://localhost:5001/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ budgets: [{ categoryId, limitAmount: newAmount }] })
      });
    } catch (e) {
      toast({ title: "Error", description: "Failed to save budget to server", variant: "destructive" });
    }
  };

  const applyOptimizedBudget = async (optimizedData: Record<string, number>) => {
    const newBudgets = Object.entries(optimizedData).map(([id, amount]) => ({
      categoryId: id,
      limitAmount: Math.round(amount)
    }));

    // Update UI
    setCategories(prev => prev.map(cat => {
      const suggested = optimizedData[cat.id];
      return suggested !== undefined ? { ...cat, allocated: Math.round(suggested) } : cat;
    }));

    // Persist all to DB
    try {
      await fetch('http://localhost:5001/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ budgets: newBudgets })
      });
    } catch (e) {
      toast({ title: "Error", description: "Failed to persist optimized budget" });
    }
  };

  if (expensesLoading || loadingBudget) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Budget</h1>
          <p className="text-muted-foreground mt-1">Real-time category limits and spending</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => {}}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {months.map(month => (
                  <SelectItem key={month} value={month}>{month}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {[2024, 2025, 2026, 2027].map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="icon" onClick={() => {}}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <BudgetOverview totalBudget={totalBudget} totalSpent={totalSpent} month={selectedMonth} year={selectedYear} />

      <AIBudgetOptimizer currentCategories={categories} onApply={applyOptimizedBudget} />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">Category Budgets</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2 border-primary/50 hover:bg-primary/5 text-primary" 
              onClick={() => document.getElementById('ai-optimize-trigger')?.click()}>
              <Sparkles className="h-4 w-4" /> Optimize with AI
            </Button>
            <Button variant="outline" size="sm" className="gap-2"><Settings2 className="h-4 w-4" /> Manage</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map(category => (
              <CategoryBudgetCard key={category.id} category={category} onEdit={handleEditCategory} />
            ))}
          </div>
        </CardContent>
      </Card>

      <AIBudgetPredictions />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BudgetChart categories={categories} />
        <SpendingTrendChart />
      </div>

      <EditBudgetDialog category={editingCategory} open={dialogOpen} onOpenChange={setDialogOpen} onSave={handleSaveBudget} />
    </div>
  );
}
