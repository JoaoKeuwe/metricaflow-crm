import { cn } from "@/lib/utils";
import { TrendingDown } from "lucide-react";

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
    <div className="rounded-xl bg-white dark:bg-[hsl(0_0%_8%)] border border-[hsl(0_0%_90%)] dark:border-[hsl(0_0%_18%)] overflow-hidden h-full shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[hsl(0_0%_92%)] dark:border-[hsl(0_0%_15%)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-[hsl(0_75%_55%/0.1)]">
            <TrendingDown className="h-4 w-4 text-[hsl(0_75%_55%)]" />
          </div>
          <h3 className="text-sm font-semibold text-[hsl(0_0%_8%)] dark:text-[hsl(0_0%_95%)] tracking-wide">
            {title}
          </h3>
        </div>
        {totalLost > 0 && (
          <span className="text-sm font-bold text-[hsl(0_75%_50%)]">
            R$ {totalLost.toLocaleString('pt-BR')} perdidos
          </span>
        )}
      </div>

      {/* Loss Reasons */}
      <div className="p-5 space-y-4">
        {data.slice(0, 5).map((item, index) => {
          const barWidth = maxPercentage > 0 ? (item.percentage / maxPercentage) * 100 : 0;
          const hue = 0 + (index * 8);
          const barColor = `hsl(${hue} 70% 55%)`;
          
          return (
            <div key={item.reason} className="group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[hsl(0_0%_15%)] dark:text-[hsl(0_0%_85%)] line-clamp-1 flex-1">
                  {item.reason}
                </span>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs text-[hsl(0_0%_50%)]">{item.count} leads</span>
                  <span className="text-sm font-semibold text-[hsl(0_75%_50%)]">{item.percentage.toFixed(0)}%</span>
                </div>
              </div>

              <div className="relative h-6 bg-[hsl(0_0%_96%)] dark:bg-[hsl(0_0%_12%)] rounded-lg overflow-hidden">
                <div 
                  className="absolute inset-y-0 left-0 rounded-lg transition-all duration-700 group-hover:brightness-110"
                  style={{
                    width: `${barWidth}%`,
                    background: `linear-gradient(90deg, ${barColor}, ${barColor}80)`,
                    boxShadow: `0 0 15px ${barColor}40`
                  }}
                >
                  {barWidth > 30 && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-white">
                      R$ {item.value.toLocaleString('pt-BR')}
                    </span>
                  )}
                </div>
                {barWidth <= 30 && (
                  <span className="absolute top-1/2 -translate-y-1/2 text-xs font-medium text-[hsl(0_0%_50%)]" style={{ left: `calc(${barWidth}% + 8px)` }}>
                    R$ {item.value.toLocaleString('pt-BR')}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {data.length === 0 && (
          <div className="text-center py-8 text-[hsl(0_0%_50%)]">
            <p className="text-sm">Nenhuma perda registrada no período</p>
          </div>
        )}
      </div>

      {data.length > 0 && (
        <div className="px-5 py-4 bg-[hsl(0_75%_55%/0.05)] border-t border-[hsl(0_0%_92%)] dark:border-[hsl(0_0%_15%)]">
          <p className="text-xs text-[hsl(0_0%_50%)]">
            <span className="font-semibold text-[hsl(0_75%_50%)]">{data[0]?.reason}</span> é o principal motivo de perda, 
            representando <span className="font-semibold">{data[0]?.percentage.toFixed(0)}%</span> das perdas
          </p>
        </div>
      )}
    </div>
  );
};