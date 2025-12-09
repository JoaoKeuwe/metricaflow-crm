import { AlertTriangle, DollarSign, Clock, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Alert {
  id: string;
  type: "money" | "bottleneck" | "performance" | "stale";
  title: string;
  message: string;
  value?: string | number;
}

interface AlertPanelProps {
  alerts: Alert[];
}

const alertConfig = {
  money: {
    icon: DollarSign,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    pulse: "animate-pulse"
  },
  bottleneck: {
    icon: AlertTriangle,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    pulse: ""
  },
  performance: {
    icon: TrendingDown,
    color: "text-red-500",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    pulse: ""
  },
  stale: {
    icon: Clock,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    pulse: ""
  }
};

export const AlertPanel = ({ alerts }: AlertPanelProps) => {
  if (!alerts || alerts.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl bg-cockpit-card border border-cockpit-border overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-cockpit-border bg-gradient-to-r from-cockpit-accent/5 to-transparent">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cockpit-warning animate-pulse" />
          <h3 className="text-sm font-semibold text-cockpit-foreground tracking-wide">
            Alertas Inteligentes
          </h3>
          <span className="text-xs text-cockpit-muted bg-cockpit-muted/10 px-2 py-0.5 rounded-full">
            {alerts.length}
          </span>
        </div>
      </div>

      {/* Alerts List */}
      <div className="divide-y divide-cockpit-border/50">
        {alerts.slice(0, 4).map((alert) => {
          const config = alertConfig[alert.type];
          const Icon = config.icon;
          
          return (
            <div 
              key={alert.id}
              className={cn(
                "px-5 py-4 flex items-start gap-4 hover:bg-cockpit-muted/5 transition-colors",
                config.pulse
              )}
            >
              {/* Icon */}
              <div className={cn(
                "p-2 rounded-lg flex-shrink-0",
                config.bg,
                config.border,
                "border"
              )}>
                <Icon className={cn("h-4 w-4", config.color)} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-cockpit-foreground">
                  {alert.title}
                </p>
                <p className="text-xs text-cockpit-muted mt-0.5 line-clamp-2">
                  {alert.message}
                </p>
              </div>

              {/* Value Badge */}
              {alert.value && (
                <div className={cn(
                  "text-sm font-semibold px-3 py-1 rounded-lg flex-shrink-0",
                  config.bg,
                  config.color
                )}>
                  {typeof alert.value === 'number' 
                    ? `R$ ${alert.value.toLocaleString('pt-BR')}`
                    : alert.value
                  }
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
