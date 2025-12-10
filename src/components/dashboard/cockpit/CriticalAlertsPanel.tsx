import { AlertTriangle, Clock, AlertOctagon, Flame, Users, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface CriticalAlert {
  id: string;
  type: 'inactive24h' | 'inactive7d' | 'lowConversion' | 'moneyStuck' | 'noActivity';
  title: string;
  message: string;
  value?: number | string;
  severity: 'critical' | 'warning' | 'info';
}

interface CriticalAlertsPanelProps {
  alerts: CriticalAlert[];
  onAlertClick?: (alertId: string) => void;
}

const alertConfig = {
  inactive24h: {
    icon: AlertOctagon,
    label: "URGENTE"
  },
  inactive7d: {
    icon: Clock,
    label: "ATENÇÃO"
  },
  lowConversion: {
    icon: AlertTriangle,
    label: "ALERTA"
  },
  moneyStuck: {
    icon: DollarSign,
    label: "RECEITA"
  },
  noActivity: {
    icon: Users,
    label: "EQUIPE"
  }
};

const severityConfig = {
  critical: {
    bg: "bg-destructive/10",
    border: "border-destructive/30",
    icon: "text-destructive",
    badge: "bg-destructive text-white",
    glow: "shadow-[0_0_20px_hsl(0_75%_55%/0.2)]",
    pulse: true
  },
  warning: {
    bg: "bg-warning/10",
    border: "border-warning/30",
    icon: "text-warning",
    badge: "bg-warning text-warning-foreground",
    glow: "shadow-[0_0_15px_hsl(38_90%_50%/0.15)]",
    pulse: false
  },
  info: {
    bg: "bg-primary/10",
    border: "border-primary/30",
    icon: "text-primary",
    badge: "bg-primary text-primary-foreground",
    glow: "shadow-[0_0_15px_hsl(229_92%_62%/0.15)]",
    pulse: false
  }
};

export const CriticalAlertsPanel = ({ alerts, onAlertClick }: CriticalAlertsPanelProps) => {
  if (!alerts || alerts.length === 0) {
    return null;
  }

  // Sort by severity
  const sortedAlerts = [...alerts].sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  const criticalCount = alerts.filter(a => a.severity === 'critical').length;

  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden">
      {/* Header with critical count */}
      <div className="px-5 py-3 border-b border-border flex items-center justify-between bg-gradient-to-r from-destructive/5 to-transparent">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-lg",
            criticalCount > 0 ? "bg-destructive/15 animate-pulse" : "bg-warning/15"
          )}>
            <Flame className={cn(
              "h-4 w-4",
              criticalCount > 0 ? "text-destructive" : "text-warning"
            )} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Central de Alertas
            </h3>
            <p className="text-xs text-muted-foreground">
              {criticalCount > 0 
                ? `${criticalCount} ação${criticalCount > 1 ? 'ões' : ''} urgente${criticalCount > 1 ? 's' : ''}`
                : "Monitoramento ativo"
              }
            </p>
          </div>
        </div>
        
        {criticalCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-destructive text-white text-xs font-bold animate-pulse">
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            <span>{criticalCount} CRÍTICO{criticalCount > 1 ? 'S' : ''}</span>
          </div>
        )}
      </div>

      {/* Alerts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 p-4">
        {sortedAlerts.slice(0, 8).map((alert) => {
          const alertType = alertConfig[alert.type];
          const severity = severityConfig[alert.severity];
          const Icon = alertType.icon;
          
          return (
            <button
              key={alert.id}
              onClick={() => onAlertClick?.(alert.id)}
              className={cn(
                "relative text-left rounded-xl p-4 border transition-all duration-300",
                "hover:translate-y-[-2px] hover:shadow-lg",
                severity.bg,
                severity.border,
                severity.glow,
                severity.pulse && "ring-2 ring-destructive/30"
              )}
            >
              {/* Top badge */}
              <div className="flex items-center justify-between mb-3">
                <div className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center",
                  severity.bg
                )}>
                  <Icon className={cn("h-4 w-4", severity.icon)} strokeWidth={1.5} />
                </div>
                
                <span className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                  severity.badge
                )}>
                  {alertType.label}
                </span>
              </div>

              {/* Content */}
              <h4 className="text-sm font-semibold text-foreground mb-1 line-clamp-1">
                {alert.title}
              </h4>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {alert.message}
              </p>

              {/* Value */}
              {alert.value !== undefined && (
                <div className={cn(
                  "mt-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold",
                  severity.badge
                )}>
                  {typeof alert.value === 'number' && alert.type === 'moneyStuck'
                    ? `R$ ${alert.value.toLocaleString('pt-BR')}`
                    : alert.value
                  }
                </div>
              )}

              {/* Pulse indicator for critical */}
              {alert.severity === 'critical' && (
                <div className="absolute top-3 right-3 w-3 h-3">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75 animate-ping" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
