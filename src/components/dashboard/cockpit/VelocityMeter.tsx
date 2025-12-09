import { Timer, Zap } from "lucide-react";
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

export const VelocityMeter = ({ 
  data = [], 
  title = "Velocidade do Funil" 
}: VelocityMeterProps) => {
  
  const getStatusInfo = (ratio: number) => {
    if (ratio <= 1) return {
      color: "bg-[hsl(142_70%_45%)]",
      textColor: "text-[hsl(142_70%_40%)]",
      label: "Rápido",
      glow: "shadow-[0_0_10px_hsl(142_70%_45%/0.3)]"
    };
    if (ratio <= 1.5) return {
      color: "bg-[hsl(38_90%_50%)]",
      textColor: "text-[hsl(38_90%_45%)]",
      label: "Normal",
      glow: ""
    };
    return {
      color: "bg-[hsl(0_75%_55%)]",
      textColor: "text-[hsl(0_75%_50%)]",
      label: "Lento",
      glow: "shadow-[0_0_10px_hsl(0_75%_55%/0.3)]"
    };
  };

  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl bg-white dark:bg-[hsl(0_0%_8%)] border border-[hsl(0_0%_90%)] dark:border-[hsl(0_0%_18%)] overflow-hidden h-full shadow-sm">
        <div className="px-5 py-4 border-b border-[hsl(0_0%_92%)] dark:border-[hsl(0_0%_15%)]">
          <h3 className="text-sm font-semibold text-[hsl(0_0%_8%)] dark:text-[hsl(0_0%_95%)]">
            {title}
          </h3>
        </div>
        <div className="p-8 text-center text-[hsl(0_0%_50%)]">
          <p className="text-sm">Nenhum dado disponível</p>
        </div>
      </div>
    );
  }

  const totalAvgDays = data.reduce((sum, item) => sum + (item?.avgDays || 0), 0);
  const totalIdealDays = data.reduce((sum, item) => sum + (item?.idealDays || 0), 0);
  const overallRatio = totalIdealDays > 0 ? totalAvgDays / totalIdealDays : 1;
  const overallStatus = getStatusInfo(overallRatio);

  return (
    <div className="rounded-xl bg-white dark:bg-[hsl(0_0%_8%)] border border-[hsl(0_0%_90%)] dark:border-[hsl(0_0%_18%)] overflow-hidden h-full shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[hsl(0_0%_92%)] dark:border-[hsl(0_0%_15%)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-[hsl(330_100%_62%/0.1)]">
            <Timer className="h-4 w-4 text-[hsl(330_100%_62%)]" />
          </div>
          <h3 className="text-sm font-semibold text-[hsl(0_0%_8%)] dark:text-[hsl(0_0%_95%)] tracking-wide">
            {title}
          </h3>
        </div>
        <span className={cn(
          "text-xs font-semibold px-2.5 py-1 rounded-full",
          overallStatus.textColor,
          "bg-current/10"
        )}>
          {overallStatus.label}
        </span>
      </div>

      {/* Velocity Items */}
      <div className="p-5 space-y-4">
        {data.map((item, index) => {
          if (!item) return null;
          
          const avgDays = item.avgDays || 0;
          const idealDays = item.idealDays || 1;
          const ratio = avgDays / idealDays;
          const status = getStatusInfo(ratio);
          const progressPercent = Math.min((avgDays / (idealDays * 2)) * 100, 100);

          return (
            <div key={item.stage || index} className="group">
              {/* Stage Header */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[hsl(0_0%_45%)] uppercase tracking-wider">
                  {item.stage}
                </span>
                <div className="flex items-center gap-3">
                  <span className={cn("text-sm font-bold", status.textColor)}>
                    {avgDays} dias
                  </span>
                  <span className="text-xs text-[hsl(0_0%_55%)]">
                    / ideal: {idealDays}d
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative h-3 bg-[hsl(0_0%_96%)] dark:bg-[hsl(0_0%_12%)] rounded-full overflow-hidden">
                {/* Ideal marker */}
                <div 
                  className="absolute top-0 bottom-0 w-0.5 bg-[hsl(0_0%_70%)] dark:bg-[hsl(0_0%_40%)] z-10"
                  style={{ left: '50%' }}
                />
                
                {/* Progress */}
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-700",
                    status.color,
                    status.glow
                  )}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Summary */}
      <div className="px-5 py-4 bg-[hsl(0_0%_98%)] dark:bg-[hsl(0_0%_6%)] border-t border-[hsl(0_0%_92%)] dark:border-[hsl(0_0%_15%)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className={cn("h-4 w-4", overallStatus.textColor)} />
            <span className="text-xs text-[hsl(0_0%_50%)]">Ciclo médio total</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn("text-sm font-bold", overallStatus.textColor)}>
              {totalAvgDays} dias
            </span>
            <span className="text-xs text-[hsl(0_0%_55%)]">
              (ideal: {totalIdealDays}d)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};