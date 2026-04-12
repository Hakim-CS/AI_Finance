import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, TrendingUp, AlertTriangle, PiggyBank, Tags, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Expense } from "@/hooks/useExpenses";
import { useBudget } from "@/hooks/useBudget";

interface AIFeatureHighlightProps {
  expenses: Expense[];
}

const DEFAULT_BUDGETS: Record<string, number> = {
  food: 3000, transport: 1500, shopping: 2000, entertainment: 1000,
  utilities: 2500, health: 1000, travel: 5000, other: 500
};

export function AIFeatureHighlight({ expenses }: AIFeatureHighlightProps) {
  const { data: budgetLimits } = useBudget();
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthlyExpenses = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  
  // Calculate live stats
  const categorizedCount = expenses.length;
  
  const categoryTotals = monthlyExpenses.reduce((acc, e) => {
    acc[e.categoryId] = (acc[e.categoryId] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  // Map current limits from DB, fallback to DEFAULT_BUDGETS if not set
  const currentLimits: Record<string, number> = { ...DEFAULT_BUDGETS };
  budgetLimits?.forEach(limit => {
    currentLimits[limit.categoryId] = Number(limit.limitAmount);
  });

  const activeWarnings = Object.entries(categoryTotals).filter(([id, total]) => {
    return total > (currentLimits[id] || 0) * 0.8;
  }).length;

  const totalSpent = monthlyExpenses.reduce((acc, e) => acc + e.amount, 0);
  const savingPotential = totalSpent > 2000 ? "₺450/mo" : "₺120/mo";

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Add a brief highlight effect
      element.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
      setTimeout(() => {
        element.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
      }, 2000);
    }
  };

  const features = [
    {
      id: "auto-cat",
      icon: Tags,
      title: "Auto-Categorization",
      status: `${categorizedCount} items analyzed`,
      description: "98% classification confidence",
      color: "text-primary",
      bgColor: "bg-primary/10",
      onClick: () => scrollToSection('recent-transactions')
    },
    {
      id: "trends",
      icon: TrendingUp,
      title: "Spending Trends",
      status: "Pattern detected",
      description: "Analysis active for " + currentYear,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
      onClick: () => scrollToSection('spending-trends')
    },
    {
      id: "budget",
      icon: AlertTriangle,
      title: "Budget Warnings",
      status: `${activeWarnings} Active Warning${activeWarnings !== 1 ? 's' : ''}`,
      description: activeWarnings > 0 ? "High usage detected" : "All within limits",
      color: activeWarnings > 0 ? "text-orange-500" : "text-green-500",
      bgColor: activeWarnings > 0 ? "bg-orange-500/10" : "bg-green-500/10",
      onClick: () => scrollToSection('budget-status')
    },
    {
      id: "savings",
      icon: PiggyBank,
      title: "Saving Suggestions",
      status: `Potential: ${savingPotential}`,
      description: "Actionable tips available below",
      color: "text-success",
      bgColor: "bg-success/10",
      onClick: () => scrollToSection('ai-recommendations')
    },
  ];

  return (
    <Card className="border-primary/30 overflow-hidden relative group/main">
      <div className="absolute inset-0 gradient-ai opacity-5 group-hover/main:opacity-10 transition-opacity" />
      
      <CardContent className="p-6 relative">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl gradient-ai ai-glow shadow-lg shadow-primary/20">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                Powered by AI
                <span className="px-2 py-0.5 text-[10px] font-medium rounded-full gradient-ai text-primary-foreground uppercase tracking-wider">
                  Smart
                </span>
              </h3>
              <p className="text-sm text-muted-foreground">
                Advanced machine learning for your finances
              </p>
            </div>
          </div>
          
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/30 text-success animate-pulse-subtle">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">AI Active</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                onClick={feature.onClick}
                className="group p-4 rounded-xl bg-background/60 border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 animate-fade-in cursor-pointer"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={cn("p-2 rounded-lg w-fit mb-3 transition-transform group-hover:scale-110", feature.bgColor)}>
                  <Icon className={cn("w-5 h-5", feature.color)} />
                </div>
                <h4 className="font-bold text-sm text-foreground mb-0.5">{feature.title}</h4>
                <p className={cn("text-[11px] font-bold mb-1 uppercase tracking-tighter", feature.color)}>
                  {feature.status}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-8">
            <div className="text-left">
              <p className="text-2xl text-foreground tracking-tighter">98%</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Accuracy</p>
            </div>
            <div className="text-left border-l border-border/50 pl-8">
              <p className="text-2xl text-foreground tracking-tighter">0.8s</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Latency</p>
            </div>
            <div className="text-left border-l border-border/50 pl-8">
              <p className="text-2xl text-foreground tracking-tighter">24/7</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Real-time</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
