import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIBadgeProps {
  variant?: "default" | "small" | "inline";
  animated?: boolean;
  className?: string;
}

export function AIBadge({ variant = "default", animated = true, className }: AIBadgeProps) {
  const baseStyles = "inline-flex items-center gap-1 rounded-full font-medium";
  
  const variants = {
    default: "px-3 py-1 text-xs gradient-ai text-primary-foreground",
    small: "px-2 py-0.5 text-[10px] gradient-ai text-primary-foreground",
    inline: "px-1.5 py-0.5 text-[10px] bg-primary/10 text-primary border border-primary/20",
  };

  const iconSizes = {
    default: "w-3 h-3",
    small: "w-2.5 h-2.5",
    inline: "w-2.5 h-2.5",
  };

  return (
    <span className={cn(baseStyles, variants[variant], animated && "ai-pulse", className)}>
      <Sparkles className={cn(iconSizes[variant], animated && "animate-spin-slow")} />
      AI
    </span>
  );
}
