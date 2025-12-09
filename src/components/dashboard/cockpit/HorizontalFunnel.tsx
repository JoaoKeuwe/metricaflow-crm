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
      <div className="rounded-xl bg-card border border-border overflow-hidden h-full shadow-sm">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground tracking-wide">
            {title}
          </h3>
        </div>
        <div className="p-8 text-center text-muted-foreground">
          <p className="text-sm">Nenhum dado disponível</p>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d?.value || 0), 1);
  const firstValue = data[0]?.value || 0;
  const lastValue = data[data.length - 1]?.value || 0;
  const conversionRate = firstValue > 0 ? ((lastValue / firstValue) * 100).toFixed(1) : '0';

  // Futuristic colors - blue/lilac gradient
  const brandColors = [
    'linear-gradient(135deg, hsl(229 92% 62%), hsl(229 85% 52%))',
    'linear-gradient(135deg, hsl(270 70% 68%), hsl(270 60% 58%))',
    'linear-gradient(135deg, hsl(217 85% 68%), hsl(217 75% 58%))',
    'linear-gradient(135deg, hsl(221 35% 50%), hsl(221 30% 40%))',
    'linear-gradient(135deg, hsl(142 70% 45%), hsl(142 60% 35%))'
  ];

  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden h-full shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-primary/10">
            <ArrowRight className="h-4 w-4 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground tracking-wide">
            {title}
          </h3>
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          Conversão: <span className="text-primary font-bold">{conversionRate}%</span>
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
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {stage.name || 'Etapa'}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-foreground">
                    {stageValue.toLocaleString('pt-BR')}
                  </span>
                  <span className={cn(
                    "text-xs font-semibold px-2.5 py-1 rounded-full",
                    index === 0 ? "bg-primary/10 text-primary" :
                    index === data.length - 1 ? "bg-success/10 text-success" :
                    "bg-muted text-muted-foreground"
                  )}>
                    {(stage.percentage || 0).toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Progress Bar - Glass Effect */}
              <div className="relative h-8 bg-muted rounded-lg overflow-hidden">
                <div 
                  className={cn(
                    "absolute inset-y-0 left-0 rounded-lg transition-all duration-700 ease-out",
                    "group-hover:brightness-110"
                  )}
                  style={{
                    width: `${widthPercentage}%`,
                    background: brandColors[index % brandColors.length],
                    boxShadow: index === 0 
                      ? '0 0 20px hsl(229 92% 62% / 0.3)' 
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
      <div className="px-5 py-4 bg-muted/50 border-t border-border">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Taxa de conversão geral</span>
          <span className="text-sm font-bold text-success">
            {conversionRate}%
          </span>
        </div>
      </div>
    </div>
  );
};