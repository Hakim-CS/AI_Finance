import { API_BASE } from "@/lib/api";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { usePreferences, CURRENCIES } from "@/context/PreferencesContext";

export function EditIncomeDialog() {
  const { user, token, updateUser } = useAuth();
  const [income, setIncome] = useState(user?.income?.toString() || "0");
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();
  const { currency } = usePreferences();
  const currencySymbol = CURRENCIES[currency]?.symbol ?? "₺";

  const handleSave = async () => {
    if (!token) return;
    setIsSaving(true);
    try {
      const response = await fetch(`${API_BASE}/auth/user`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ income: parseFloat(income) }),
      });

      if (!response.ok) throw new Error("Failed to update income");

      const updatedUser = await response.json();
      updateUser({
        ...user!,
        income: parseFloat(updatedUser.income)
      });
      
      toast({ title: t('common.success'), description: t('settings.profile.monthlyIncome') });
      setIsOpen(false);
    } catch (error: any) {
      toast({ title: t('common.error'), description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-current/60 hover:text-current hover:bg-white/10">
          <Pencil className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('settings.profile.monthlyIncome')}</DialogTitle>
          <DialogDescription>
            {t('settings.profile.monthlyIncome')}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="income">{t('settings.profile.monthlyIncome')} ({currencySymbol})</Label>
            <Input
              id="income"
              type="number"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              placeholder="e.g. 5200"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleSave} disabled={isSaving} className="gradient-primary">
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
