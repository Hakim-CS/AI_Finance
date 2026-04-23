import { API_BASE } from "@/lib/api";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Sparkles, Target, Zap, Shield, Wallet, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";
import { usePreferences } from "@/context/PreferencesContext";

interface BudgetPrediction {
  category: string;
  predictedSpend: number;
  budgetLimit: number;
  confidence: number;
  riskLevel: "low" | "medium" | "high";
  suggestion: string;
}

const riskStyles = {
  low:    { bar: "bg-success",     icon: Shield, badge: "bg-success/15 border-success/30 text-success"   },
  medium: { bar: "bg-warning",     icon: Target, badge: "bg-warning/15 border-warning/30 text-warning"   },
  high:   { bar: "bg-destructive", icon: Zap,    badge: "bg-destructive/15 border-destructive/30 text-destructive" },
};

export function AIBudgetPredictions({ refreshKey = 0 }: { refreshKey?: number }) {
  const [predictions, setPredictions] = useState<BudgetPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();
  const { t } = useTranslation();
  const { formatAmount } = usePreferences();

  useEffect(() => {
    const fetchPredictions = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/ai/budget-predictions`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to fetch AI budget predictions");
        const data = await res.json();
        setPredictions(data);
        setError(null);
      } catch (err: any) {
        console.error("AI Budget Predictions Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPredictions();
  }, [token, refreshKey]);

  if (loading) {
    return (
      <Card className="border-primary/20 gradient-ai-subtle h-[200px] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
        <p className="text-xs text-muted-foreground animate-pulse font-medium">
          {t("ai.analyzingPatterns")}
        </p>
      </Card>
    );
  }

  if (error || predictions.length === 0) {
    return (
      <Card className="border-border h-[200px] flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-8 h-8 text-muted-foreground mb-2" />
        <p className="text-xs text-muted-foreground">{t("ai.predictionsUnavailable")}</p>
      </Card>
    );
  }

  const totalPredicted = predictions.reduce((sum, p) => sum + p.predictedSpend, 0);
  const totalBudget    = predictions.reduce((sum, p) => sum + p.budgetLimit, 0);
  const onTrack        = totalPredicted <= totalBudget;

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-foreground">
              <div className="p-2 rounded-xl bg-primary/10">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              {t("ai.budgetPredictions")}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {t("ai.budgetPredictionsSubtitle")}
            </p>
          </div>

          {/* Status pill — fully semantic, works in both themes */}
          <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full border shadow-sm transition-all duration-300",
            onTrack
              ? "bg-success/10 border-success/30 text-success"
              : "bg-warning/10 border-warning/30 text-warning animate-pulse"
          )}>
            {onTrack ? <Shield className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
            <span className="text-xs font-bold uppercase tracking-wider">
              {onTrack ? t("ai.onTrack") : t("ai.attentionNeeded")}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {predictions.map((p, index) => {
            const risk           = riskStyles[p.riskLevel] ?? riskStyles.low;
            const RiskIcon       = risk.icon;
            const percentOfBudget = Math.round((p.predictedSpend / p.budgetLimit) * 100);
            const isHighRisk      = p.riskLevel === "high" || percentOfBudget > 100;

            return (
              <div
                key={p.category}
                className={cn(
                  "p-5 rounded-2xl border bg-card transition-all duration-300 hover:shadow-md group",
                  isHighRisk ? "border-destructive/20" : "border-border"
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Header row */}
                <div className="flex items-start justify-between mb-4">
                  <div className="space-y-1">
                    <h4 className="font-bold text-base text-foreground">{p.category}</h4>
                    <div className={cn("flex items-center gap-1.5 px-2 py-0.5 rounded-full border w-fit text-[11px] font-bold uppercase tracking-tight", risk.badge)}>
                      <RiskIcon className="w-3 h-3" />
                      {isHighRisk ? t("ai.highRisk") : t("ai.stable")}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-foreground">{formatAmount(p.predictedSpend)}</p>
                    <p className="text-xs font-medium text-muted-foreground">{t("common.of")} {formatAmount(p.budgetLimit)}</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="relative h-2.5 bg-muted rounded-full overflow-hidden mb-4">
                  <div
                    className={cn("h-full rounded-full transition-all duration-1000 ease-out", risk.bar)}
                    style={{ width: `${Math.min(percentOfBudget, 100)}%` }}
                  />
                </div>

                {/* Confidence */}
                <div className="flex items-center justify-between text-[11px] mb-3">
                  <span className="font-medium text-muted-foreground uppercase tracking-wider">{t("ai.confidence")}</span>
                  <span className="font-bold text-foreground">{p.confidence}%</span>
                </div>

                {/* Suggestion */}
                <div className="pt-3 border-t border-border">
                  <div className="flex gap-2 items-start">
                    <Sparkles className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      <span className="font-bold text-primary not-italic">{t("ai.suggestion")}: </span>
                      {p.suggestion}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary footer */}
        <div className="p-5 rounded-2xl bg-muted/40 border border-border flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Wallet className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-base font-bold text-foreground">{t("ai.predictedTotalSpending")}</p>
              <p className="text-xs font-medium text-muted-foreground">{t("ai.basedOnPatterns")}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black text-foreground">{formatAmount(totalPredicted)}</p>
            <p className={cn("text-sm font-bold", onTrack ? "text-success" : "text-warning")}>
              {onTrack
                ? `${formatAmount(totalBudget - totalPredicted)} ${t("ai.underBudget")}`
                : `${formatAmount(totalPredicted - totalBudget)} ${t("ai.overBudget")}`}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
