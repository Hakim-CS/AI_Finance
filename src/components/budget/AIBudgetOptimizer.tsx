import { API_BASE } from "@/lib/api";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, Check, Loader2, Info } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { BudgetCategory } from "@/data/budgetData";
import { useTranslation } from "react-i18next";
import { usePreferences } from "@/context/PreferencesContext";

interface AIBudgetOptimizerProps {
  currentCategories: BudgetCategory[];
  onApply: (optimizedData: Record<string, number>) => void;
}

export function AIBudgetOptimizer({ currentCategories, onApply }: AIBudgetOptimizerProps) {
  const [optimizedData, setOptimizedData] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen]   = useState(false);
  const { token } = useAuth();
  const { toast } = useToast();
  const { t }     = useTranslation();
  const { formatAmount } = usePreferences();

  const handleOptimize = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/budget/optimize`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(t("common.error"));
      const data = await response.json();
      setOptimizedData(data);
    } catch (error: any) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (optimizedData) {
      onApply(optimizedData);
      setIsOpen(false);
      setOptimizedData(null);
      toast({ title: t("ai.budgetOptimizer"), description: t("settings.toasts.preferencesSavedDesc") });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button id="ai-optimize-trigger" className="hidden" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-lg gradient-ai">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <DialogTitle className="text-xl">{t("ai.budgetOptimizer")}</DialogTitle>
          </div>
          <DialogDescription>{t("ai.budgetOptimizerDesc")}</DialogDescription>
        </DialogHeader>

        {!optimizedData && !loading && (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <div className="max-w-[300px] space-y-2">
              <p className="font-medium">{t("ai.readyToOptimize")}</p>
              <p className="text-sm text-muted-foreground">{t("ai.readyToOptimizeDesc")}</p>
            </div>
            <Button onClick={handleOptimize} className="gradient-primary px-8">
              {t("ai.runAnalysis")}
            </Button>
          </div>
        )}

        {loading && (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground animate-pulse">{t("dashboard.aiAnalyzing")}</p>
          </div>
        )}

        {optimizedData && !loading && (
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-3">
              {currentCategories.map(cat => {
                const suggested = optimizedData[cat.id.toLowerCase()];
                if (suggested === undefined) return null;
                const isSaving = suggested < cat.allocated;
                return (
                  <div key={cat.id} className="p-3 rounded-xl bg-muted/50 border border-border/50 flex justify-between items-center">
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">{t(`categories.${cat.id}`, { defaultValue: cat.name })}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs line-through opacity-50">{formatAmount(cat.allocated)}</span>
                        <ArrowRight className="w-3 h-3" />
                        <span className="text-sm font-bold">{formatAmount(suggested)}</span>
                      </div>
                    </div>
                    <div className={`text-[10px] font-bold px-2 py-1 rounded-full ${isSaving ? "bg-green-500/10 text-green-600" : "bg-primary/10 text-primary"}`}>
                      {isSaving ? t("ai.optimize") : t("ai.maintain")}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="bg-primary/5 p-3 rounded-lg flex gap-3 items-start border border-primary/10">
              <Info className="w-4 h-4 text-primary mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">{t("ai.budgetOptimizerNote")}</p>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>{t("common.cancel")}</Button>
          <Button onClick={handleApply} disabled={!optimizedData} className="gradient-primary">
            <Check className="w-4 h-4 mr-2" /> {t("ai.applySuggestions")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
