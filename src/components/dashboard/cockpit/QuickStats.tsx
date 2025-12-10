import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";

interface QuickStat {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: "primary" | "success" | "warning" | "danger" | "muted";
  prefix?: string;
  suffix?: string;
}

interface QuickStatsProps {
  stats: QuickStat[];
}

const StatItem = ({ stat }: { stat: QuickStat }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const numericValue = typeof stat.value === 'string' 
    ? parseFloat(stat.value.replace(/[^\d.-]/g, '')) 
    : stat.value;
  const isNumeric = typeof stat.value === 'number' || !isNaN(numericValue);

  useEffect(() => {
    if (isNumeric && typeof numericValue === 'number') {
      const duration = 1000;
      const startTime = performance.now();
      
      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        setDisplayValue(numericValue * easeOutQuart);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
    }
  }, [numericValue, isNumeric]);

  const colors = {
    primary: {
      icon: "text-primary",
      bg: "bg-primary/10"
    },
    success: {
      icon: "text-success",
      bg: "bg-success/10"
    },
    warning: {
      icon: "text-warning",
      bg: "bg-warning/10"
    },
    danger: {
      icon: "text-destructive",
      bg: "bg-destructive/10"
    },
    muted: {
      icon: "text-muted-foreground",
      bg: "bg-muted"
    }
  };

  const colorConfig = colors[stat.color || "primary"];
  const Icon = stat.icon;

  const formattedValue = isNumeric 
    ? `${stat.prefix || ''}${Math.round(displayValue).toLocaleString('pt-BR')}${stat.suffix || ''}`
    : stat.value;

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-border hover:border-primary/20 transition-all duration-300 hover:shadow-sm">
      <div className={cn("p-2 rounded-lg", colorConfig.bg)}>
        <Icon className={cn("h-4 w-4", colorConfig.icon)} strokeWidth={1.5} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
        <p className="text-sm font-semibold text-foreground truncate">{formattedValue}</p>
      </div>
    </div>
  );
};

export const QuickStats = ({ stats }: QuickStatsProps) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {stats.map((stat, index) => (
        <StatItem key={`${stat.label}-${index}`} stat={stat} />
      ))}
    </div>
  );
};
