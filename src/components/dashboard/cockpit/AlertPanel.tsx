import { AlertTriangle, DollarSign, TrendingDown, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Alert {
  id: string;
  type: 'money' | 'bottleneck' | 'performance' | 'stale';
  title: string;
  message: string;
  value?: number;
}

interface AlertPanelProps {
  alerts: Alert[];
}

const alertConfig = {
  money: {
    icon: DollarSign,
    bgColor: "bg-[hsl(330_100%_62%/0.08)]",
    borderColor: "border-[hsl(330_100%_62%/0.25)]",
    iconBg: "bg-[hsl(330_100%_62%/0.15)]",
    iconColor: "text-[hsl(330_100%_62%)]",
    valueBg: "bg-[hsl(330_100%_62%)]",
    glow: "shadow-[0_0_20px_hsl(330_100%_62%/0.15)]"
  },
  bottleneck: {
    icon: AlertTriangle,
    bgColor: "bg-[hsl(38_90%_50%/0.08)]",
    borderColor: "border-[hsl(38_90%_50%/0.25)]",
    iconBg: "bg-[hsl(38_90%_50%/0.15)]",
    iconColor: "text-[hsl(38_90%_50%)]",
    valueBg: "bg-[hsl(38_90%_50%)]",
    glow: "shadow-[0_0_20px_hsl(38_90%_50%/0.15)]"
  },
  performance: {
    icon: TrendingDown,
    bgColor: "bg-[hsl(0_75%_55%/0.08)]",
    borderColor: "border-[hsl(0_75%_55%/0.25)]",
    iconBg: "bg-[hsl(0_75%_55%/0.15)]",
    iconColor: "text-[hsl(0_75%_55%)]",
    valueBg: "bg-[hsl(0_75%_55%)]",
    glow: "shadow-[0_0_20px_hsl(0_75%_55%/0.15)]"
  },
  stale: {
    icon: Clock,
    bgColor: "bg-[hsl(0_0%_50%/0.08)]",
    borderColor: "border-[hsl(0_0%_50%/0.25)]",
    iconBg: "bg-[hsl(0_0%_50%/0.15)]",
    iconColor: "text-[hsl(0_0%_50%)]",
    valueBg: "bg-[hsl(0_0%_40%)]",
    glow: "shadow-[0_0_20px_hsl(0_0%_50%/0.15)]"
  }
};

export const AlertPanel = ({ alerts }: AlertPanelProps) => {
  if (!alerts || alerts.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl bg-white dark:bg-[hsl(0_0%_8%)] border border-[hsl(0_0%_90%)] dark:border-[hsl(0_0%_18%)] overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-5 py-3 border-b border-[hsl(0_0%_92%)] dark:border-[hsl(0_0%_15%)] flex items-center gap-2">
        <div className="p-1.5 rounded-md bg-[hsl(330_100%_62%/0.1)]">
          <AlertCircle className="h-4 w-4 text-[hsl(330_100%_62%)]" />
        </div>
        <h3 className="text-sm font-semibold text-[hsl(0_0%_8%)] dark:text-[hsl(0_0%_95%)]">
          Alertas Inteligentes
        </h3>
        <span className="ml-auto px-2 py-0.5 rounded-full bg-[hsl(330_100%_62%/0.1)] text-[hsl(330_100%_62%)] text-xs font-semibold">
          {alerts.length}
        </span>
      </div>

      {/* Alerts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-5">
        {alerts.slice(0, 4).map((alert) => {
          const config = alertConfig[alert.type];
          const Icon = config.icon;
          
          return (
            <div
              key={alert.id}
              className={cn(
                "relative rounded-xl p-4 border transition-all duration-300",
                "hover:translate-y-[-2px] hover:shadow-lg cursor-pointer",
                config.bgColor,
                config.borderColor,
                config.glow
              )}
            >
              {/* Icon */}
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center mb-3",
                config.iconBg
              )}>
                <Icon className={cn("h-5 w-5", config.iconColor)} strokeWidth={1.5} />
              </div>

              {/* Content */}
              <h4 className="text-sm font-semibold text-[hsl(0_0%_15%)] dark:text-[hsl(0_0%_90%)] mb-1">
                {alert.title}
              </h4>
              <p className="text-xs text-[hsl(0_0%_45%)] dark:text-[hsl(0_0%_55%)] leading-relaxed">
                {alert.message}
              </p>

              {/* Value Badge */}
              {alert.value !== undefined && (
                <div className={cn(
                  "absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold text-white",
                  config.valueBg
                )}>
                  {alert.type === 'money' 
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