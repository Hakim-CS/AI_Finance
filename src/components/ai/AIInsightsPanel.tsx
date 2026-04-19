import { API_BASE } from "@/lib/api";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AIBadge } from "./AIBadge";
import { AIInsightCard } from "./AIInsightCard";
import { Brain, Sparkles, Activity, BarChart3, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";

interface Insight {
  type: "prediction" | "warning" | "tip" | "achievement" | "trend" | "action";
  title: string;
  description: string;
  value?: string;
  confidence: number;
  trend?: { value: number; isPositive: boolean };
  actionLabel?: string;
}

export function AIInsightsPanel() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const { token } = useAuth();
  const { t }     = useTranslation();

  useEffect(() => {
    const fetchInsights = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/ai/insights`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to fetch AI insights");
        const data = await res.json();
        setInsights(data);
        setError(null);
      } catch (err: any) {
        console.error("AI Insights Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, [token]);

  if (loading) {
    return (
      <Card className="border-primary/20 gradient-ai-subtle h-[300px] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground animate-pulse font-medium">
          {t("dashboard.aiAnalyzing")}
        </p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/20 h-[300px] flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-10 h-10 text-destructive mb-3" />
        <h3 className="font-semibold text-foreground">{t("ai.spendingAnalysis")}</h3>
        <p className="text-xs text-muted-foreground mt-2 max-w-[300px]">
          {t("ai.allCaughtUp")}
        </p>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 gradient-ai-subtle overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle className="flex items-center gap-3 text-lg font-semibold">
            <div className="p-2.5 rounded-xl gradient-ai animate-scale-pulse">
              <Brain className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                {t("dashboard.aiInsightsTitle")}
                <AIBadge variant="inline" />
              </div>
              <p className="text-xs text-muted-foreground font-normal mt-0.5">
                {t("dashboard.aiInsightsSubtitle")}
              </p>
            </div>
          </CardTitle>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/60 border border-border/50">
              <Activity className="w-4 h-4 text-success animate-pulse" />
              <span className="text-xs font-medium text-muted-foreground">{t("ai.active")}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/60 border border-border/50">
              <BarChart3 className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">{t("ai.newInsightsCount", { count: insights.length })}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {insights.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">{t("dashboard.aiAnalyzing")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {insights.map((insight, index) => (
              <AIInsightCard
                key={index}
                {...insight}
                className="animate-fade-in"
                onAction={insight.actionLabel ? () => console.log("Action:", insight.title) : undefined}
              />
            ))}
          </div>
        )}

        {/* AI Status Footer */}
        <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" style={{ animationDelay: "150ms" }} />
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" style={{ animationDelay: "300ms" }} />
            </div>
            <span className="text-xs text-muted-foreground">{t("ai.active")}</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">{t("ai.today")}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
