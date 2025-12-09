import { cn } from "@/lib/utils";

interface LossReason {
  reason: string;
  count: number;
  value: number;
  percentage: number;
}

interface LossWaterfallChartProps {
  data: LossReason[];
  title?: string;
  totalLost?: number;
}

export const LossWaterfallChart = ({ 
  data, 
  title = "Onde o Dinheiro Vaza",
  totalLost = 0
}: LossWaterfallChartProps) => {
  const maxPercentage = data.length > 0 ? Math.max(...data.map(d => d.percentage)) : 0;

  return (
    <div className="rounded-xl bg-cockpit-card border border-cockpit-border overflow-hidden h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-cockpit-border flex items-center justify-between">
        <h3 className="text-sm font-semibold text-cockpit-foreground tracking-wide">
          {title}
        </h3>
        {totalLost > 0 && (
          <span className="text-sm font-bold text-cockpit-danger">
            R$ {totalLost.toLocaleString('pt-BR')} perdidos
          </span>
        )}
      </div>

      {/* Loss Reasons */}
      <div className="p-5 space-y-4">
        {data.slice(0, 5).map((item, index) => {
          const barWidth = maxPercentage > 0 ? (item.percentage / maxPercentage) * 100 : 0;
          
          // Gradient from red to orange based on severity
          const hue = 0 + (index * 8); // Red to orange progression
          const barColor = `hsl(${hue} 70% 55%)`;
          
          return (
            <div key={item.reason} className="group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-cockpit-foreground line-clamp-1 flex-1">
                  {item.reason}
                </span>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs text-cockpit-muted">
                    {item.count} leads
                  </span>
                  <span className="text-sm font-semibold text-cockpit-danger">
                    {item.percentage.toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Bar */}
              <div className="relative h-6 bg-cockpit-muted/10 rounded-lg overflow-hidden">
                <div 
                  className="absolute inset-y-0 left-0 rounded-lg transition-all duration-700 group-hover:brightness-110"
                  style={{
                    width: `${barWidth}%`,
                    background: `linear-gradient(90deg, ${barColor}, ${barColor}80)`,
                    boxShadow: `0 0 15px ${barColor}40`
                  }}
                >
                  {/* Value inside bar */}
                  {barWidth > 30 && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-white">
                      R$ {item.value.toLocaleString('pt-BR')}
                    </span>
                  )}
                </div>
                
                {/* Value outside bar if too small */}
                {barWidth <= 30 && (
                  <span 
                    className="absolute top-1/2 -translate-y-1/2 text-xs font-medium text-cockpit-muted"
                    style={{ left: `calc(${barWidth}% + 8px)` }}
                  >
                    R$ {item.value.toLocaleString('pt-BR')}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {data.length === 0 && (
          <div className="text-center py-8 text-cockpit-muted">
            <p className="text-sm">Nenhuma perda registrada no período</p>
          </div>
        )}
      </div>

      {/* Footer Insight */}
      {data.length > 0 && (
        <div className="px-5 py-4 bg-gradient-to-r from-cockpit-danger/5 to-transparent border-t border-cockpit-border">
          <p className="text-xs text-cockpit-muted">
            <span className="font-semibold text-cockpit-danger">{data[0]?.reason}</span> é o principal motivo de perda, 
            representando <span className="font-semibold">{data[0]?.percentage.toFixed(0)}%</span> das perdas
          </p>
        </div>
      )}
    </div>
  );
};
