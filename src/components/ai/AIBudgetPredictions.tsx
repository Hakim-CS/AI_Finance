import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Sparkles, Target, Zap, Shield, Wallet, Loader2, AlertCircle } from "lucide-react";
import { AIBadge } from "./AIBadge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

interface BudgetPrediction {
  category: string;
  predictedSpend: number;
  budgetLimit: number;
  confidence: number;
  riskLevel: "low" | "medium" | "high";
  suggestion: string;
}

const riskStyles = {
  low: { bg: "bg-success/10", border: "border-success/30", text: "text-success", icon: Shield },
  medium: { bg: "bg-warning/10", border: "border-warning/30", text: "text-warning", icon: Target },
  high: { bg: "bg-destructive/10", border: "border-destructive/30", text: "text-destructive", icon: Zap },
};

export function AIBudgetPredictions() {
  const [predictions, setPredictions] = useState<BudgetPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    const fetchPredictions = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const res = await fetch('http://localhost:5001/ai/budget-predictions', {
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
  }, [token]);

  if (loading) {
    return (
      <Card className="border-primary/20 gradient-ai-subtle h-[200px] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
        <p className="text-xs text-muted-foreground animate-pulse font-medium">
          Predicting your month-end financial status...
        </p>
      </Card>
    );
  }

  if (error || predictions.length === 0) {
    return (
      <Card className="border-destructive/20 h-[200px] flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-8 h-8 text-destructive mb-2" />
        <p className="text-xs text-muted-foreground">Budget forecasts currently unavailable.</p>
      </Card>
    );
  }

  const totalPredicted = predictions.reduce((sum, p) => sum + p.predictedSpend, 0);
  const totalBudget = predictions.reduce((sum, p) => sum + p.budgetLimit, 0);
  const overallStatus = totalPredicted <= totalBudget ? "on-track" : "at-risk";

  return (
    <Card className="border-primary/10 bg-[#f8fafc]/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-800">
              <div className="p-2 rounded-xl bg-primary/10">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              Budget Predictions
            </CardTitle>
            <p className="text-sm text-slate-500">
              System predicts your month-end spending based on current patterns
            </p>
          </div>
          <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full border shadow-sm transition-all duration-500",
            overallStatus === "on-track" 
              ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
              : "bg-orange-50 border-orange-200 text-orange-700 animate-pulse-subtle"
          )}>
            {overallStatus === "on-track" ? (
              <Shield className="w-4 h-4" />
            ) : (
              <TrendingUp className="w-4 h-4" />
            )}
            <span className="text-xs font-bold uppercase tracking-wider">
              {overallStatus === "on-track" ? "On Track" : "Attention Needed"}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {predictions.map((prediction, index) => {
            const risk = riskStyles[prediction.riskLevel];
            const RiskIcon = risk.icon;
            const percentOfBudget = Math.round((prediction.predictedSpend / prediction.budgetLimit) * 100);
            const isHighRisk = prediction.riskLevel === 'high' || percentOfBudget > 100;

            return (
              <div
                key={prediction.category}
                className={cn(
                  "p-5 rounded-2xl border bg-white shadow-sm transition-all duration-300 hover:shadow-md animate-fade-in group",
                  isHighRisk ? "border-red-100" : "border-slate-100"
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="space-y-1">
                    <h4 className="font-bold text-base text-slate-800">{prediction.category}</h4>
                    <div className="flex items-center gap-1.5">
                      <RiskIcon className={cn("w-3.5 h-3.5", isHighRisk ? "text-red-500" : "text-emerald-500")} />
                      <span className={cn("text-[11px] font-bold uppercase tracking-tight", isHighRisk ? "text-red-500" : "text-emerald-500")}>
                        {isHighRisk ? "High Risk" : "Stable"}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-slate-900">₺{prediction.predictedSpend.toLocaleString()}</p>
                    <p className="text-xs font-medium text-slate-400">of ₺{prediction.budgetLimit.toLocaleString()}</p>
                  </div>
                </div>

                {/* Progress Bar - Red if High Risk */}
                <div className="relative h-2.5 bg-slate-100 rounded-full overflow-hidden mb-4">
                  <div
                    className={cn("h-full rounded-full transition-all duration-1000 ease-out", 
                      isHighRisk ? "bg-red-500" : "bg-emerald-500"
                    )}
                    style={{ width: `${Math.min(percentOfBudget, 100)}%` }}
                  />
                </div>

                {/* Confidence & Suggestion */}
                <div className="flex items-center justify-between text-[11px] mb-3">
                  <span className="font-medium text-slate-400 uppercase tracking-wider">Confidence</span>
                  <span className="font-bold text-slate-600">{prediction.confidence}%</span>
                </div>

                <div className="pt-3 border-t border-slate-50">
                  <div className="flex gap-2 items-start">
                    <span className="text-sm">💡</span>
                    <p className="text-xs text-slate-500 leading-relaxed italic">
                      <span className="font-bold text-emerald-600 not-italic">Suggestion:</span> {prediction.suggestion}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Footer from Image */}
        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-50">
              <Wallet className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-800">Predicted Total Spending</p>
              <p className="text-xs font-medium text-slate-400">Based on your current patterns</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black text-slate-900">₺{totalPredicted.toLocaleString()}</p>
            <p className={cn("text-sm font-bold", totalPredicted <= totalBudget ? "text-emerald-600" : "text-orange-500")}>
              {totalPredicted <= totalBudget
                ? `₺${(totalBudget - totalPredicted).toLocaleString()} under budget`
                : `₺${(totalPredicted - totalBudget).toLocaleString()} over budget`}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
