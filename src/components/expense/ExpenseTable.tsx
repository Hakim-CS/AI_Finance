import { API_BASE } from "@/lib/api";
import { useState } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Expense } from "@/hooks/useExpenses";
import { useCategories } from "@/hooks/useCategories";
import { cn } from "@/lib/utils";
import {
  Utensils, Car, Gamepad2, ShoppingBag, Zap, Heart, Plane, MoreHorizontal, Pencil, Trash2, Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { EditExpenseDialog } from "./EditExpenseDialog";
import { useTranslation } from "react-i18next";
import { usePreferences } from "@/context/PreferencesContext";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Utensils, Car, Gamepad2, ShoppingBag, Zap, Heart, Plane, MoreHorizontal,
};

interface ExpenseTableProps {
  expenses: Expense[];
}

export function ExpenseTable({ expenses }: ExpenseTableProps) {
  const { data: categories, isLoading: categoriesLoading, isError: categoriesError, error: categoriesFetchError } = useCategories();
  const { toast } = useToast();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const { t, i18n } = useTranslation();
  const { formatAmount } = usePreferences();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);

  const getCategoryInfo = (categoryId: string) => {
    if (categoriesLoading) return { name: t("common.loading"), icon: "MoreHorizontal", color: "#ccc" };
    if (categoriesError) return { name: t("common.error"), icon: "MoreHorizontal", color: "#f00" };
    return categories?.find(c => c.id === categoryId) || { name: t("expensesPage.unknownCategory"), icon: "MoreHorizontal", color: "#666" };
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(i18n.language, { month: "short", day: "numeric", year: "numeric" });

  const handleDelete = async (expenseId: string) => {
    if (!token) {
      toast({ title: t("common.error"), description: t("expensesPage.loginRequired"), variant: "destructive" });
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/expenses/${expenseId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || t("expensesPage.deleteFailed"));
      }
      toast({ title: t("expensesPage.deletedTitle"), description: t("expensesPage.deletedDesc") });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    } catch (error: any) {
      toast({ title: t("expensesPage.deleteFailed"), description: error.message, variant: "destructive" });
    }
  };

  const handleEdit = (expense: Expense) => {
    setExpenseToEdit(expense);
    setIsEditDialogOpen(true);
  };

  if (expenses.length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
          <ShoppingBag className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">{t("expensesPage.noFound")}</h3>
        <p className="text-muted-foreground">{t("expensesPage.noFoundDesc")}</p>
      </Card>
    );
  }

  if (categoriesLoading) {
    return (
      <Card className="p-4 text-center">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
        <p>{t("common.loading")}</p>
      </Card>
    );
  }

  if (categoriesError) {
    return (
      <Card className="p-4 text-center text-destructive">
        <p>{t("common.error")}: {categoriesFetchError?.message}</p>
      </Card>
    );
  }

  const DeleteDialog = ({ expenseId }: { expenseId: string }) => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive">
          <Trash2 className="w-4 h-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("expensesPage.deleteConfirmTitle")}</AlertDialogTitle>
          <AlertDialogDescription>{t("expensesPage.deleteConfirmDesc")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={() => handleDelete(expenseId)}>{t("common.confirm")}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return (
    <>
      {/* Desktop Table */}
      <Card className="hidden md:block overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>{t("expensesPage.thDate")}</TableHead>
              <TableHead>{t("expensesPage.thCategory")}</TableHead>
              <TableHead>{t("expensesPage.thDescription")}</TableHead>
              <TableHead className="text-right">{t("expensesPage.thAmount")}</TableHead>
              <TableHead className="text-right">{t("expensesPage.thActions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense, index) => {
              const category = getCategoryInfo(expense.categoryId);
              const Icon = iconMap[category.icon || "MoreHorizontal"] || MoreHorizontal;
              return (
                <TableRow key={expense.id} className="animate-fade-in hover:bg-muted/30" style={{ animationDelay: `${index * 30}ms` }}>
                  <TableCell className="font-medium text-muted-foreground">{formatDate(expense.date)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${category.color}20` }}>
                        <Icon className="w-4 h-4" style={{ color: category.color }} />
                      </div>
                      <span className="text-sm">{category.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">{expense.description}</p>
                      {expense.notes && (
                        <p className="text-sm text-muted-foreground truncate max-w-[200px]">{expense.notes}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-foreground">
                    {formatAmount(expense.amount)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(expense)} className="h-8 w-8 hover:text-primary">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <DeleteDialog expenseId={expense.id} />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {expenses.map((expense, index) => {
          const category = getCategoryInfo(expense.categoryId);
          const Icon = iconMap[category.icon || "MoreHorizontal"] || MoreHorizontal;
          return (
            <Card key={expense.id} className={cn("p-4 animate-fade-in")} style={{ animationDelay: `${index * 30}ms` }}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${category.color}20` }}>
                  <Icon className="w-5 h-5" style={{ color: category.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-foreground">{expense.description}</p>
                      <p className="text-sm text-muted-foreground">{category.name}</p>
                    </div>
                    <p className="font-semibold text-foreground whitespace-nowrap">{formatAmount(expense.amount)}</p>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-sm text-muted-foreground">{formatDate(expense.date)}</p>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(expense)} className="h-8 w-8">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <DeleteDialog expenseId={expense.id} />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {expenseToEdit && (
        <EditExpenseDialog isOpen={isEditDialogOpen} onClose={() => setIsEditDialogOpen(false)} expense={expenseToEdit} />
      )}
    </>
  );
}