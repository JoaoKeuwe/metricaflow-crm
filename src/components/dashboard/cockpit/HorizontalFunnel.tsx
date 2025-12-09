import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

interface FunnelStage {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

interface HorizontalFunnelProps {
  data: FunnelStage[];
  title?: string;
}

export const HorizontalFunnel = ({ data = [], title = "Funil de Vendas" }: HorizontalFunnelProps) => {
  // Safe check for empty or invalid data
  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl bg-white dark:bg-[hsl(0_0%_8%)] border border-[hsl(0_0%_90%)] dark:border-[hsl(0_0%_18%)] overflow-hidden h-full shadow-sm">
        <div className="px-5 py-4 border-b border-[hsl(0_0%_92%)] dark:border-[hsl(0_0%_15%)]">
          <h3 className="text-sm font-semibold text-[hsl(0_0%_8%)] dark:text-[hsl(0_0%_95%)] tracking-wide">
            {title}
          </h3>
        </div>
        <div className="p-8 text-center text-[hsl(0_0%_50%)]">
          <p className="text-sm">Nenhum dado disponível</p>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d?.value || 0), 1);
  const firstValue = data[0]?.value || 0;
  const lastValue = data[data.length - 1]?.value || 0;
  const conversionRate = firstValue > 0 ? ((lastValue / firstValue) * 100).toFixed(1) : '0';

  // Brand colors - magenta gradient for funnel
  const brandColors = [
    'linear-gradient(135deg, hsl(330 100% 62%), hsl(330 80% 52%))',
    'linear-gradient(135deg, hsl(330 70% 55%), hsl(330 60% 45%))',
    'linear-gradient(135deg, hsl(0 0% 35%), hsl(0 0% 25%))',
    'linear-gradient(135deg, hsl(0 0% 50%), hsl(0 0% 40%))',
    'linear-gradient(135deg, hsl(142 70% 45%), hsl(142 60% 35%))'
  ];

  return (
    <div className="rounded-xl bg-white dark:bg-[hsl(0_0%_8%)] border border-[hsl(0_0%_90%)] dark:border-[hsl(0_0%_18%)] overflow-hidden h-full shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[hsl(0_0%_92%)] dark:border-[hsl(0_0%_15%)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-[hsl(330_100%_62%/0.1)]">
            <ArrowRight className="h-4 w-4 text-[hsl(330_100%_62%)]" />
          </div>
          <h3 className="text-sm font-semibold text-[hsl(0_0%_8%)] dark:text-[hsl(0_0%_95%)] tracking-wide">
            {title}
          </h3>
        </div>
        <span className="text-xs font-medium text-[hsl(0_0%_50%)]">
          Conversão: <span className="text-[hsl(330_100%_62%)] font-bold">{conversionRate}%</span>
        </span>
      </div>

      {/* Funnel Stages */}
      <div className="p-5 space-y-4">
        {data.map((stage, index) => {
          if (!stage) return null;
          
          const stageValue = stage.value || 0;
          const widthPercentage = maxValue > 0 ? (stageValue / maxValue) * 100 : 0;
          
          return (
            <div key={stage.name || index} className="group">
              {/* Stage Label */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[hsl(0_0%_45%)] uppercase tracking-wider">
                  {stage.name || 'Etapa'}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-[hsl(0_0%_15%)] dark:text-[hsl(0_0%_90%)]">
                    {stageValue.toLocaleString('pt-BR')}
                  </span>
                  <span className={cn(
                    "text-xs font-semibold px-2.5 py-1 rounded-full",
                    index === 0 ? "bg-[hsl(330_100%_62%/0.1)] text-[hsl(330_100%_55%)]" :
                    index === data.length - 1 ? "bg-[hsl(142_70%_45%/0.1)] text-[hsl(142_70%_35%)]" :
                    "bg-[hsl(0_0%_92%)] text-[hsl(0_0%_40%)]"
                  )}>
                    {(stage.percentage || 0).toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Progress Bar - Glass Effect */}
              <div className="relative h-8 bg-[hsl(0_0%_96%)] dark:bg-[hsl(0_0%_12%)] rounded-lg overflow-hidden">
                <div 
                  className={cn(
                    "absolute inset-y-0 left-0 rounded-lg transition-all duration-700 ease-out",
                    "group-hover:brightness-110"
                  )}
                  style={{
                    width: `${widthPercentage}%`,
                    background: brandColors[index % brandColors.length],
                    boxShadow: index === 0 
                      ? '0 0 20px hsl(330 100% 62% / 0.3)' 
                      : index === data.length - 1 
                      ? '0 0 20px hsl(142 70% 45% / 0.3)'
                      : 'none'
                  }}
                >
                  {/* Inner shine */}
                  <div 
                    className="absolute inset-0 opacity-30"
                    style={{
                      background: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, transparent 50%)'
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Stats */}
      <div className="px-5 py-4 bg-[hsl(0_0%_98%)] dark:bg-[hsl(0_0%_6%)] border-t border-[hsl(0_0%_92%)] dark:border-[hsl(0_0%_15%)]">
        <div className="flex items-center justify-between">
          <span className="text-xs text-[hsl(0_0%_50%)]">Taxa de conversão geral</span>
          <span className="text-sm font-bold text-[hsl(142_70%_40%)]">
            {conversionRate}%
          </span>
        </div>
      </div>
    </div>
  );
};