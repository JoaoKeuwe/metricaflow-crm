import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface VelocityData {
  stage: string;
  avgDays: number;
  idealDays: number;
}

interface VelocityMeterProps {
  data: VelocityData[];
  title?: string;
}

export const VelocityMeter = ({ data, title = "Velocidade do Funil" }: VelocityMeterProps) => {
  const getStatusColor = (avg: number, ideal: number) => {
    const ratio = avg / ideal;
    if (ratio <= 1) return { color: "text-cockpit-success", bg: "bg-cockpit-success" };
    if (ratio <= 1.5) return { color: "text-cockpit-warning", bg: "bg-cockpit-warning" };
    return { color: "text-cockpit-danger", bg: "bg-cockpit-danger" };
  };

  const totalAvg = data.reduce((sum, d) => sum + d.avgDays, 0);
  const totalIdeal = data.reduce((sum, d) => sum + d.idealDays, 0);

  return (
    <div className="rounded-xl bg-cockpit-card border border-cockpit-border overflow-hidden h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-cockpit-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-cockpit-accent" />
          <h3 className="text-sm font-semibold text-cockpit-foreground tracking-wide">
            {title}
          </h3>
        </div>
        <div className="text-xs text-cockpit-muted">
          Tempo médio vs ideal
        </div>
      </div>

      {/* Velocity List */}
      <div className="p-5 space-y-4">
        {data.map((item) => {
          const status = getStatusColor(item.avgDays, item.idealDays);
          const progressPercentage = Math.min((item.avgDays / (item.idealDays * 2)) * 100, 100);
          
          return (
            <div key={item.stage} className="group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-cockpit-muted uppercase tracking-wider">
                  {item.stage}
                </span>
                <div className="flex items-center gap-2">
                  <span className={cn("text-sm font-bold", status.color)}>
                    {item.avgDays.toFixed(1)}d
                  </span>
                  <span className="text-xs text-cockpit-muted">
                    / {item.idealDays}d
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative h-2 bg-cockpit-muted/10 rounded-full overflow-hidden">
                {/* Ideal marker */}
                <div 
                  className="absolute top-0 bottom-0 w-0.5 bg-cockpit-foreground/30 z-10"
                  style={{ left: '50%' }}
                />
                
                {/* Progress fill */}
                <div 
                  className={cn(
                    "absolute inset-y-0 left-0 rounded-full transition-all duration-700",
                    status.bg
                  )}
                  style={{ 
                    width: `${progressPercentage}%`,
                    opacity: 0.8
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Summary */}
      <div className="px-5 py-4 bg-gradient-to-r from-cockpit-accent/5 to-transparent border-t border-cockpit-border">
        <div className="flex items-center justify-between">
          <span className="text-xs text-cockpit-muted">Ciclo total de vendas</span>
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-sm font-bold",
              getStatusColor(totalAvg, totalIdeal).color
            )}>
              {totalAvg.toFixed(0)} dias
            </span>
            <span className="text-xs text-cockpit-muted">
              (ideal: {totalIdeal} dias)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
