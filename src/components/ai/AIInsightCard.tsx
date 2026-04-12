import { LucideIcon, TrendingUp, TrendingDown, AlertTriangle, Lightbulb, Target, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { AIBadge } from "./AIBadge";

export type InsightType = "prediction" | "warning" | "tip" | "achievement" | "trend" | "action";

interface AIInsightCardProps {
  type: InsightType;
  title: string;
  description: string;
  value?: string;
  trend?: { value: number; isPositive: boolean };
  confidence?: number;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const typeConfig: Record<InsightType, { icon: LucideIcon; bgClass: string; iconClass: string }> = {
  prediction: { icon: Target, bgClass: "bg-primary/10 border-primary/30", iconClass: "text-primary" },
  warning: { icon: AlertTriangle, bgClass: "bg-warning/10 border-warning/30", iconClass: "text-warning" },
  tip: { icon: Lightbulb, bgClass: "bg-secondary/10 border-secondary/30", iconClass: "text-secondary" },
  achievement: { icon: Zap, bgClass: "bg-success/10 border-success/30", iconClass: "text-success" },
  trend: { icon: TrendingUp, bgClass: "bg-accent/10 border-accent/30", iconClass: "text-accent" },
  action: { icon: Target, bgClass: "bg-primary/10 border-primary/30", iconClass: "text-primary" },
};

export function AIInsightCard({
  type,
  title,
  description,
  value,
  trend,
  confidence,
  actionLabel,
  onAction,
  className,
}: AIInsightCardProps) {
  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "relative p-4 rounded-xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5",
        config.bgClass,
        className
      )}
    >
      {/* AI Badge */}
      <div className="absolute -top-2 -right-2">
        <AIBadge variant="small" />
      </div>

      {/* Header */}
      <div className="flex items-start gap-3">
        <div className={cn("p-2 rounded-lg bg-background/50", config.iconClass)}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-foreground text-sm">{title}</h4>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{description}</p>
        </div>
      </div>

      {/* Value & Trend */}
      {(value || trend) && (
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/50">
          {value && <span className="text-lg font-bold text-foreground">{value}</span>}
          {trend && (
            <div className={cn("flex items-center gap-1 text-xs font-medium", trend.isPositive ? "text-success" : "text-destructive")}>
              {trend.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {trend.value}%
            </div>
          )}
        </div>
      )}

      {/* Confidence */}
      {confidence !== undefined && (
        <div className="mt-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">AI Confidence</span>
            <span className="font-medium text-foreground">{confidence}%</span>
          </div>
          <div className="h-1.5 bg-background/50 rounded-full overflow-hidden">
            <div
              className="h-full gradient-ai rounded-full transition-all duration-500"
              style={{ width: `${confidence}%` }}
            />
          </div>
        </div>
      )}

      {/* Action Button */}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-3 w-full py-2 px-3 rounded-lg text-xs font-medium bg-background/80 hover:bg-background text-foreground transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
