import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BudgetCategory } from "@/data/budgetData";
import { useTranslation } from "react-i18next";
import { usePreferences, CURRENCIES } from "@/context/PreferencesContext";
import { formatNumberInput, unformatNumberInput } from "@/hooks/useFormattedNumberInput";
import { Settings2 } from "lucide-react";

interface ManageBudgetsDialogProps {
  categories: BudgetCategory[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (budgets: { categoryId: string; amount: number }[]) => void;
}

export function ManageBudgetsDialog({ categories, open, onOpenChange, onSave }: ManageBudgetsDialogProps) {
  const { t } = useTranslation();
  const { formatAmount, currency } = usePreferences();
  const currencySymbol = CURRENCIES[currency]?.symbol ?? "₺";

  // Local editable state — initialized from props
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      const init: Record<string, string> = {};
      categories.forEach(c => { init[c.id] = c.allocated.toString(); });
      setValues(init);
    }
  }, [open, categories]);

  const handleChange = (catId: string, raw: string) => {
    setValues(prev => ({ ...prev, [catId]: formatNumberInput(raw) }));
  };

  const total = Object.values(values).reduce((s, v) => s + (parseFloat(unformatNumberInput(v)) || 0), 0);

  const handleSave = () => {
    const budgets = Object.entries(values).map(([categoryId, v]) => ({
      categoryId,
      amount: parseFloat(unformatNumberInput(v)) || 0,
    }));
    onSave(budgets);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-lg bg-primary/10">
              <Settings2 className="w-4 h-4 text-primary" />
            </div>
            <DialogTitle className="text-xl">{t('budgetPage.manageCategories')}</DialogTitle>
          </div>
          <DialogDescription>
            {t('budgetPage.manageCategoriesDesc', { defaultValue: 'Set budget limits for each spending category.' })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4 max-h-[400px] overflow-y-auto pr-1">
          {categories.map(cat => (
            <div key={cat.id} className="flex items-center gap-3">
              <span className="w-32 text-sm font-medium text-foreground truncate">
                {t(`categories.${cat.id}`, { defaultValue: cat.name })}
              </span>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  {currencySymbol}
                </span>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={values[cat.id] || ""}
                  onChange={(e) => handleChange(cat.id, e.target.value)}
                  className="pl-8 text-sm"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <p className="text-sm text-muted-foreground">{t('budgetPage.totalBudget', { defaultValue: 'Total Budget' })}</p>
          <p className="text-lg font-bold text-foreground">{formatAmount(total)}</p>
        </div>

        <DialogFooter className="gap-2 mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSave} className="gradient-primary">
            {t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
