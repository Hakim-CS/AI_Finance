import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SummaryCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "primary" | "success" | "warning";
  action?: React.ReactNode;
}

const variantStyles = {
  default: "bg-card",
  primary: "gradient-primary text-primary-foreground",
  success: "bg-success text-success-foreground",
  warning: "bg-warning text-warning-foreground",
};

export function SummaryCard({ title, value, icon: Icon, trend, variant = "default", action }: SummaryCardProps) {
  const isPrimary = variant !== "default";

  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
      variantStyles[variant]
    )}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <p className={cn(
                "text-sm font-medium",
                isPrimary ? "text-current/80" : "text-muted-foreground"
              )}>
                {title}
              </p>
              {action && action}
            </div>
            <p className="text-2xl lg:text-3xl font-bold tracking-tight">{value}</p>
            {trend && (
              <p className={cn(
                "text-sm font-medium flex items-center gap-1",
                isPrimary
                  ? "text-current/80"
                  : trend.isPositive ? "text-success" : "text-destructive"
              )}>
                {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
                <span className={isPrimary ? "text-current/60" : "text-muted-foreground"}>vs last month</span>
              </p>
            )}
          </div>
          <div className={cn(
            "p-3 rounded-xl",
            isPrimary ? "bg-white/20" : "bg-primary/10"
          )}>
            <Icon className={cn(
              "w-6 h-6",
              isPrimary ? "text-current" : "text-primary"
            )} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
