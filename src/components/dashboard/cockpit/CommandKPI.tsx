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
}

export const CommandKPI = ({
  title,
  value,
  icon: Icon,
  subtitle,
  trend,
  accentColor = "primary",
  size = "default",
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

  const accentColors = {
    primary: {
      bg: "bg-cockpit-accent/10",
      border: "border-cockpit-accent/30",
      glow: "shadow-[0_0_20px_hsl(215_70%_55%/0.15)]",
      icon: "text-cockpit-accent",
      gradient: "from-cockpit-accent/20 to-transparent"
    },
    success: {
      bg: "bg-cockpit-success/10",
      border: "border-cockpit-success/30",
      glow: "shadow-[0_0_20px_hsl(142_70%_45%/0.15)]",
      icon: "text-cockpit-success",
      gradient: "from-cockpit-success/20 to-transparent"
    },
    warning: {
      bg: "bg-cockpit-warning/10",
      border: "border-cockpit-warning/30",
      glow: "shadow-[0_0_20px_hsl(38_90%_50%/0.15)]",
      icon: "text-cockpit-warning",
      gradient: "from-cockpit-warning/20 to-transparent"
    },
    danger: {
      bg: "bg-cockpit-danger/10",
      border: "border-cockpit-danger/30",
      glow: "shadow-[0_0_20px_hsl(0_75%_55%/0.15)]",
      icon: "text-cockpit-danger",
      gradient: "from-cockpit-danger/20 to-transparent"
    }
  };

  const colors = accentColors[accentColor];

  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-xl bg-cockpit-card border transition-all duration-300",
        "hover:scale-[1.02] hover:shadow-lg group",
        colors.border,
        colors.glow
      )}
    >
      {/* Top accent gradient */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-px bg-gradient-to-r",
        colors.gradient
      )} />
      
      {/* Corner accent */}
      <div className={cn(
        "absolute top-0 right-0 w-24 h-24 bg-gradient-to-br opacity-50",
        colors.gradient
      )} />

      <div className={cn(
        "relative p-5",
        size === "large" && "p-6"
      )}>
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <p className="text-[11px] font-semibold text-cockpit-muted uppercase tracking-[0.15em]">
            {title}
          </p>
          <div className={cn(
            "p-2 rounded-lg transition-transform duration-300 group-hover:scale-110",
            colors.bg
          )}>
            <Icon className={cn("h-4 w-4", colors.icon)} strokeWidth={2} />
          </div>
        </div>

        {/* Value */}
        <div className={cn(
          "font-bold tracking-tight text-cockpit-foreground",
          size === "large" ? "text-4xl" : "text-3xl"
        )}>
          {formattedValue}
        </div>

        {/* Subtitle and Trend */}
        <div className="flex items-center justify-between mt-2">
          {subtitle && (
            <p className="text-xs text-cockpit-muted">
              {subtitle}
            </p>
          )}
          
          {trend && (
            <div className={cn(
              "flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
              trend.isPositive 
                ? "text-cockpit-success bg-cockpit-success/10" 
                : "text-cockpit-danger bg-cockpit-danger/10"
            )}>
              <span>{trend.isPositive ? "↑" : "↓"}</span>
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>

        {/* Bottom line indicator */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cockpit-border">
          <div 
            className={cn(
              "h-full w-1/3 bg-gradient-to-r rounded-r-full transition-all duration-1000",
              `${colors.gradient.replace('to-transparent', 'to-cockpit-accent/50')}`
            )}
            style={{
              background: accentColor === 'primary' 
                ? 'linear-gradient(to right, hsl(215 70% 55%), hsl(215 70% 55% / 0.3))'
                : accentColor === 'success'
                ? 'linear-gradient(to right, hsl(142 70% 45%), hsl(142 70% 45% / 0.3))'
                : accentColor === 'warning'
                ? 'linear-gradient(to right, hsl(38 90% 50%), hsl(38 90% 50% / 0.3))'
                : 'linear-gradient(to right, hsl(0 75% 55%), hsl(0 75% 55% / 0.3))'
            }}
          />
        </div>
      </div>
    </div>
  );
};
