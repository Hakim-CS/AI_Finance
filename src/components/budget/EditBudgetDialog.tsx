import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BudgetCategory } from "@/data/budgetData";
import { useTranslation } from "react-i18next";
import { usePreferences, CURRENCIES } from "@/context/PreferencesContext";
import { formatNumberInput, unformatNumberInput } from "@/hooks/useFormattedNumberInput";

interface EditBudgetDialogProps {
  category: BudgetCategory | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (categoryId: string, newAmount: number) => void;
}

export function EditBudgetDialog({ category, open, onOpenChange, onSave }: EditBudgetDialogProps) {
  const [amount, setAmount] = useState(category?.allocated.toString() || "");
  const { t } = useTranslation();
  const { formatAmount, currency } = usePreferences();
  const currencySymbol = CURRENCIES[currency]?.symbol ?? "₺";

  const handleSave = () => {
    if (category && amount) {
      onSave(category.id, parseFloat(unformatNumberInput(amount)));
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{t('budgetPage.editBudget')}</DialogTitle>
        </DialogHeader>
        {category && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">{t('addExpensePage.manual.category')}</Label>
              <p className="font-medium text-foreground">{t(`categories.${category.id}`, { defaultValue: category.name })}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">{t('budgetPage.spent')}</Label>
              <p className="font-medium text-foreground">{formatAmount(category.spent)}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget-amount">{t('budgetPage.budget')} ({currencySymbol})</Label>
              <Input
                id="budget-amount"
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(formatNumberInput(e.target.value))}
                placeholder={t('budgetPage.budget')}
                className="text-lg"
              />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSave}>
            {t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
