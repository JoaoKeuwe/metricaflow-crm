import { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface CommandKPIProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  accentColor?: "primary" | "success" | "warning" | "danger";
  size?: "default" | "large";
  alert?: boolean;
}

export const CommandKPI = ({
  title,
  value,
  icon: Icon,
  subtitle,
  trend,
  accentColor = "primary",
  size = "default",
  alert = false,
}: CommandKPIProps) => {
  const [displayValue, setDisplayValue] = useState(0);
  const numericValue = typeof value === 'string' ? parseFloat(value.replace(/[^\d.-]/g, '')) : value;
  const isNumeric = !isNaN(numericValue);

  useEffect(() => {
    if (isNumeric) {
      let start = 0;
      const end = numericValue;
      const duration = 1200;
      const startTime = performance.now();
      
      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const current = start + (end - start) * easeOutQuart;
        
        setDisplayValue(current);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
    }
  }, [numericValue, isNumeric]);

  const formattedValue = isNumeric 
    ? typeof value === 'string' && value.includes('%')
      ? `${displayValue.toFixed(1)}%`
      : typeof value === 'string' && value.includes('R$')
      ? `R$ ${Math.round(displayValue).toLocaleString('pt-BR')}`
      : Math.round(displayValue).toLocaleString('pt-BR')
    : value;

  // Brand-aligned colors with magenta (#FF3B99) as primary
  const accentColors = {
    primary: {
      bg: "bg-[hsl(330_100%_62%/0.08)]",
      border: "border-[hsl(330_100%_62%/0.2)]",
      glow: "shadow-[0_4px_20px_hsl(330_100%_62%/0.1)]",
      icon: "text-[hsl(330_100%_62%)]",
      gradient: "from-[hsl(330_100%_62%/0.15)] to-transparent",
      line: "bg-gradient-to-r from-[hsl(330_100%_62%)] to-[hsl(330_100%_62%/0.3)]"
    },
    success: {
      bg: "bg-[hsl(142_70%_45%/0.08)]",
      border: "border-[hsl(142_70%_45%/0.2)]",
      glow: "shadow-[0_4px_20px_hsl(142_70%_45%/0.1)]",
      icon: "text-[hsl(142_70%_45%)]",
      gradient: "from-[hsl(142_70%_45%/0.15)] to-transparent",
      line: "bg-gradient-to-r from-[hsl(142_70%_45%)] to-[hsl(142_70%_45%/0.3)]"
    },
    warning: {
      bg: "bg-[hsl(38_90%_50%/0.08)]",
      border: "border-[hsl(38_90%_50%/0.2)]",
      glow: "shadow-[0_4px_20px_hsl(38_90%_50%/0.1)]",
      icon: "text-[hsl(38_90%_50%)]",
      gradient: "from-[hsl(38_90%_50%/0.15)] to-transparent",
      line: "bg-gradient-to-r from-[hsl(38_90%_50%)] to-[hsl(38_90%_50%/0.3)]"
    },
    danger: {
      bg: "bg-[hsl(0_75%_55%/0.08)]",
      border: "border-[hsl(0_75%_55%/0.2)]",
      glow: "shadow-[0_4px_20px_hsl(0_75%_55%/0.1)]",
      icon: "text-[hsl(0_75%_55%)]",
      gradient: "from-[hsl(0_75%_55%/0.15)] to-transparent",
      line: "bg-gradient-to-r from-[hsl(0_75%_55%)] to-[hsl(0_75%_55%/0.3)]"
    }
  };

  const colors = accentColors[accentColor];

  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-xl bg-white dark:bg-[hsl(0_0%_8%)] border transition-all duration-300",
        "hover:translate-y-[-2px] hover:shadow-lg group",
        colors.border,
        colors.glow,
        alert && "ring-2 ring-[hsl(330_100%_62%/0.3)] animate-pulse"
      )}
    >
      {/* Top accent line */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-[2px]",
        colors.line
      )} />
      
      {/* Corner gradient */}
      <div className={cn(
        "absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-40 pointer-events-none",
        colors.gradient
      )} />

      <div className={cn(
        "relative p-5",
        size === "large" && "p-6"
      )}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <p className="text-[11px] font-semibold text-[hsl(0_0%_45%)] dark:text-[hsl(0_0%_55%)] uppercase tracking-[0.12em]">
            {title}
          </p>
          <div className={cn(
            "p-2.5 rounded-lg transition-all duration-300 group-hover:scale-110",
            colors.bg
          )}>
            <Icon className={cn("h-4 w-4", colors.icon)} strokeWidth={1.5} />
          </div>
        </div>

        {/* Value */}
        <div className={cn(
          "font-bold tracking-tight text-[hsl(0_0%_8%)] dark:text-[hsl(0_0%_95%)]",
          size === "large" ? "text-4xl" : "text-3xl"
        )}>
          {formattedValue}
        </div>

        {/* Subtitle and Trend */}
        <div className="flex items-center justify-between mt-3">
          {subtitle && (
            <p className="text-xs text-[hsl(0_0%_50%)] dark:text-[hsl(0_0%_55%)]">
              {subtitle}
            </p>
          )}
          
          {trend && (
            <div className={cn(
              "flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full",
              trend.isPositive 
                ? "text-[hsl(142_70%_35%)] bg-[hsl(142_70%_45%/0.1)]" 
                : "text-[hsl(0_75%_45%)] bg-[hsl(0_75%_55%/0.1)]"
            )}>
              <span>{trend.isPositive ? "↑" : "↓"}</span>
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};