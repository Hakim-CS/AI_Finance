import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BudgetCategory, formatCurrency } from "@/data/budgetData";

interface EditBudgetDialogProps {
  category: BudgetCategory | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (categoryId: string, newAmount: number) => void;
}

export function EditBudgetDialog({ category, open, onOpenChange, onSave }: EditBudgetDialogProps) {
  const [amount, setAmount] = useState(category?.allocated.toString() || "");

  const handleSave = () => {
    if (category && amount) {
      onSave(category.id, parseFloat(amount));
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Edit Budget</DialogTitle>
        </DialogHeader>
        {category && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Category</Label>
              <p className="font-medium text-foreground">{category.name}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Current Spending</Label>
              <p className="font-medium text-foreground">{formatCurrency(category.spent)}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget-amount">Budget Amount (₺)</Label>
              <Input
                id="budget-amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter budget amount"
                className="text-lg"
              />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
