import { Utensils, Car, Gamepad2, ShoppingBag, Zap, Heart, Plane, MoreHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useCategories } from "@/hooks/useCategories";
import { Loader2 } from "lucide-react";
import { Expense } from "@/hooks/useExpenses";
import { useTranslation } from "react-i18next";
import { usePreferences } from "@/context/PreferencesContext";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Utensils, Car, Gamepad2, ShoppingBag, Zap, Heart, Plane, MoreHorizontal,
};

interface RecentTransactionsProps {
  expenses: Expense[];
}

export function RecentTransactions({ expenses }: RecentTransactionsProps) {
  const { data: categories, isLoading, isError, error } = useCategories();
  const { t, i18n } = useTranslation();
  const { formatAmount } = usePreferences();
  const recentExpenses = expenses.slice(0, 5);

  const getCategoryInfo = (categoryId: string) =>
    categories?.find(c => c.id === categoryId) || { name: t("expensesPage.categoryPlaceholder"), icon: "MoreHorizontal", color: "#666" };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return t("common.today");
    if (diffDays === 1) return t("common.yesterday");
    return date.toLocaleDateString(i18n.language, { month: "short", day: "numeric" });
  };

  if (isLoading) {
    return (
      <Card className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="ml-2">{t("common.loading")}</p>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="p-4 text-center text-destructive">
        <p>{t("common.error")}: {error?.message}</p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{t("dashboard.recentTransactions")}</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/expenses" className="text-primary hover:text-primary/80">
              {t("common.viewAll")}
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {recentExpenses.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {t("expensesPage.noFound")}
            </div>
          ) : (
            recentExpenses.map((expense, index) => {
              const category = getCategoryInfo(expense.categoryId);
              const Icon = iconMap[category.icon || "MoreHorizontal"] || MoreHorizontal;
              return (
                <div
                  key={expense.id}
                  className={cn("flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors", "animate-fade-in")}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${category.color}20` }}>
                    <Icon className="w-5 h-5" style={{ color: category.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{expense.description || t("expensesPage.noFound")}</p>
                    <p className="text-sm text-muted-foreground">{category.name}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-foreground">-{formatAmount(expense.amount)}</p>
                    <p className="text-sm text-muted-foreground">{formatDate(expense.date)}</p>
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
