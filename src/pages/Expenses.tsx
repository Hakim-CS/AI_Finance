import { useState, useMemo } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { DateRange } from "react-day-picker";
import { ExpenseFilters } from "@/components/expense/ExpenseFilters";
import { ExpenseTable } from "@/components/expense/ExpenseTable";
import { Button } from "@/components/ui/button";
import { useExpenses } from "@/hooks/useExpenses";
import { Card } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { usePreferences } from "@/context/PreferencesContext";

export default function Expenses() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const { t } = useTranslation();
  const { formatAmount } = usePreferences();

  const { data: expenses, isLoading, isError, error } = useExpenses();

  const handleClearFilters = () => {
    setSearch("");
    setCategory("all");
    setSortBy("date-desc");
    setDateRange(undefined);
  };

  const filteredExpenses = useMemo(() => {
    if (isLoading || isError || !expenses) {
      return [];
    }
    let result = [...expenses];

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.description.toLowerCase().includes(searchLower) ||
          e.notes?.toLowerCase().includes(searchLower)
      );
    }

    // Category filter
    if (category !== "all") {
      result = result.filter((e) => e.categoryId === category); // Use categoryId
    }

    // Date range filter
    if (dateRange?.from) {
      result = result.filter((e) => {
        const expenseDate = new Date(e.date);
        const from = dateRange.from!;
        const to = dateRange.to || from;
        return expenseDate >= from && expenseDate <= to;
      });
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "date-asc":
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "date-desc":
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case "amount-asc":
          return a.amount - b.amount;
        case "amount-desc":
          return b.amount - a.amount;
        default:
          return 0;
      }
    });

    return result;
  }, [search, category, sortBy, dateRange, expenses, isLoading, isError]);

  const totalAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  if (isLoading) {
    return (
      <Card className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="ml-2">{t('expensesPage.loading')}</p>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="p-8 text-center text-destructive">
        <h1 className="text-xl font-bold">{t('common.error')}</h1>
        <p className="text-muted-foreground mt-1">
          {t('expensesPage.loadError')}: {error?.message}
        </p>
      </Card>
    );
  }


  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('expensesPage.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('expensesPage.subtitle')}</p>
        </div>
        <Button asChild className="gradient-primary hover:opacity-90">
          <Link to="/add-expense">
            <Plus className="w-4 h-4 mr-2" />
            {t('expensesPage.addExpense')}
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <ExpenseFilters
        search={search}
        onSearchChange={setSearch}
        category={category}
        onCategoryChange={setCategory}
        sortBy={sortBy}
        onSortChange={setSortBy}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        onClearFilters={handleClearFilters}
      />

      {/* Summary */}
      <div className="flex items-center justify-between text-sm">
        <p className="text-muted-foreground">
          {t('expensesPage.showing')} <span className="font-medium text-foreground">{filteredExpenses.length}</span> {t('expensesPage.expensesCount')}
        </p>
        <p className="text-muted-foreground">
          {t('expensesPage.totalLabel')}: <span className="font-semibold text-primary">{formatAmount(totalAmount)}</span>
        </p>
      </div>

      {/* Table */}
      <ExpenseTable expenses={filteredExpenses} />
    </div>
  );
}
