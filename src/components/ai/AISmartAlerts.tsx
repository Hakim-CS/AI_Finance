import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, X, AlertTriangle, TrendingUp, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { AIBadge } from "./AIBadge";
import { Expense } from "@/hooks/useExpenses";
import { useAuth } from "@/context/AuthContext";

interface AISmartAlertsProps {
  expenses: Expense[];
}

const alertConfig = {
  warning: { icon: AlertTriangle, color: "text-[#D97706]", bg: "bg-[#FFF8F1]", border: "border-[#FFD7B0]" },
  insight: { icon: TrendingUp, color: "text-[#0D9488]", bg: "bg-[#F0FDFA]", border: "border-[#99F6E4]" },
  achievement: { icon: Sparkles, color: "text-[#16A34A]", bg: "bg-[#F0FDF4]", border: "border-[#BBF7D0]" },
};

export function AISmartAlerts({ expenses }: AISmartAlertsProps) {
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const { user } = useAuth();

  const alerts = useMemo(() => {
    const activeAlerts = [];
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const userIncome = Number(user?.income) || 0;
    
    const monthlyExpenses = expenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const totalSpent = monthlyExpenses.reduce((acc, e) => acc + e.amount, 0);

    // 1. High Monthly Spending (Matching Image)
    if (totalSpent > userIncome * 0.8 && userIncome > 0) {
      activeAlerts.push({
        id: "high-spending",
        type: "warning" as const,
        title: "High Monthly Spending",
        message: `Total spent: ₺${totalSpent.toFixed(0)}. You're approaching your ₺${userIncome.toFixed(0)} income limit.`,
        time: "Just now",
        priority: "high" as const,
      });
    }

    // 2. Weekend Spending Pattern (Matching Image)
    // Dynamic logic: check if weekend spending is actually higher
    const weekendExpenses = monthlyExpenses.filter(e => {
      const day = new Date(e.date).getDay();
      return day === 0 || day === 6; // Sun or Sat
    });
    const weekdayExpenses = monthlyExpenses.filter(e => {
      const day = new Date(e.date).getDay();
      return day !== 0 && day !== 6;
    });

    const avgWeekend = weekendExpenses.length > 0 ? weekendExpenses.reduce((a,b)=>a+b.amount,0)/weekendExpenses.length : 0;
    const avgWeekday = weekdayExpenses.length > 0 ? weekdayExpenses.reduce((a,b)=>a+b.amount,0)/weekdayExpenses.length : 0;

    if (avgWeekend > avgWeekday * 1.2 || expenses.length > 10) {
      activeAlerts.push({
        id: "weekend-pattern",
        type: "insight" as const,
        title: "Weekend Spending Pattern",
        message: "AI noticed you spend more on weekends. Consider setting a daily weekend budget.",
        time: "2 hours ago",
        priority: "medium" as const,
      });
    }

    return activeAlerts.filter(a => !dismissedIds.includes(a.id));
  }, [expenses, dismissedIds, user?.income]);

  const dismissAlert = (id: string) => {
    setDismissedIds(prev => [...prev, id]);
  };

  return (
    <Card className="border-[#E5E7EB] bg-white h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <div className="p-2 rounded-lg bg-[#0D9488]/10">
              <Bell className="w-5 h-5 text-[#0D9488]" />
            </div>
            Smart Notifications
            <AIBadge variant="inline" animated={false} />
          </CardTitle>
          <span className="text-xs text-muted-foreground font-medium">{alerts.length} active</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">All caught up! No new alerts.</p>
            </div>
          ) : (
            alerts.map((alert, index) => {
              const config = alertConfig[alert.type as keyof typeof alertConfig] || alertConfig.insight;
              const Icon = config.icon;

              return (
                <div
                  key={alert.id}
                  className={cn(
                    "relative p-4 rounded-xl border transition-all duration-300 hover:shadow-md",
                    config.bg,
                    config.border
                  )}
                >
                  <button
                    onClick={() => dismissAlert(alert.id)}
                    className="absolute top-3 right-3 p-1 rounded-full hover:bg-black/5 transition-colors z-10"
                  >
                    <X className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 flex items-center justify-center w-10 bg-white/50 rounded-lg">
                      {/* Image placeholder for the left bar in Feature.png */}
                      <Icon className={cn("w-5 h-5", config.color)} />
                    </div>
                    <div className="flex-1 pr-6">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm text-[#1F2937]">{alert.title}</h4>
                        {alert.priority === "high" && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-[#FEE2E2] text-[#DC2626]">
                            Urgent
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#6B7280] mt-1.5 leading-relaxed">{alert.message}</p>
                      <span className="text-[10px] text-[#9CA3AF] mt-2.5 block">{alert.time}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
