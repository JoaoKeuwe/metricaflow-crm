import { TrendingUp, TrendingDown, Minus, DollarSign, Users, Percent, Timer } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComparisonMetric {
  label: string;
  current: number;
  previous: number;
  format?: 'currency' | 'percent' | 'number' | 'days';
  icon: React.ElementType;
}

interface MonthlyComparisonCardProps {
  metrics: ComparisonMetric[];
  currentPeriod: string;
  previousPeriod: string;
}

export const MonthlyComparisonCard = ({
  metrics,
  currentPeriod,
  previousPeriod,
}: MonthlyComparisonCardProps) => {
  const formatValue = (value: number, format?: string) => {
    switch (format) {
      case 'currency':
        return `R$ ${value.toLocaleString('pt-BR')}`;
      case 'percent':
        return `${value.toFixed(1)}%`;
      case 'days':
        return `${value} dias`;
      default:
        return value.toLocaleString('pt-BR');
    }
  };

  const getChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const getTrendIcon = (change: number, isNegativeGood?: boolean) => {
    if (Math.abs(change) < 1) return Minus;
    if (isNegativeGood) {
      return change < 0 ? TrendingUp : TrendingDown;
    }
    return change > 0 ? TrendingUp : TrendingDown;
  };

  const getTrendColor = (change: number, isNegativeGood?: boolean) => {
    if (Math.abs(change) < 1) return "text-muted-foreground";
    if (isNegativeGood) {
      return change < 0 ? "text-success" : "text-destructive";
    }
    return change > 0 ? "text-success" : "text-destructive";
  };

  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">
            Comparativo Mensal
          </h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="px-2 py-1 rounded bg-primary/10 text-primary font-medium">
              {currentPeriod}
            </span>
            <span>vs</span>
            <span className="px-2 py-1 rounded bg-muted text-muted-foreground">
              {previousPeriod}
            </span>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="p-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric, index) => {
            const change = getChange(metric.current, metric.previous);
            const isNegativeGood = metric.format === 'days'; // Lower cycle time is better
            const TrendIcon = getTrendIcon(change, isNegativeGood);
            const trendColor = getTrendColor(change, isNegativeGood);
            const Icon = metric.icon;

            return (
              <div 
                key={index}
                className="p-4 rounded-lg bg-muted/30 border border-border/50"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 rounded-md bg-primary/10">
                    <Icon className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">
                    {metric.label}
                  </span>
                </div>

                <div className="mb-2">
                  <span className="text-xl font-bold text-foreground">
                    {formatValue(metric.current, metric.format)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    vs {formatValue(metric.previous, metric.format)}
                  </span>
                  <div className={cn(
                    "flex items-center gap-1 text-xs font-medium",
                    trendColor
                  )}>
                    <TrendIcon className="h-3 w-3" />
                    <span>{Math.abs(change).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
