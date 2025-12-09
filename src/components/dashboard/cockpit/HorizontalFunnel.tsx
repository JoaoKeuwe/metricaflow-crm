import { cn } from "@/lib/utils";

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

export const HorizontalFunnel = ({ data, title = "Funil de Vendas" }: HorizontalFunnelProps) => {
  const maxValue = data.length > 0 ? Math.max(...data.map(d => d.value)) : 0;

  return (
    <div className="rounded-xl bg-cockpit-card border border-cockpit-border overflow-hidden h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-cockpit-border">
        <h3 className="text-sm font-semibold text-cockpit-foreground tracking-wide">
          {title}
        </h3>
      </div>

      {/* Funnel Stages */}
      <div className="p-5 space-y-4">
        {data.map((stage, index) => {
          const widthPercentage = maxValue > 0 ? (stage.value / maxValue) * 100 : 0;
          
          return (
            <div key={stage.name} className="group">
              {/* Stage Label */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-cockpit-muted uppercase tracking-wider">
                  {stage.name}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-cockpit-foreground">
                    {stage.value.toLocaleString('pt-BR')}
                  </span>
                  <span className={cn(
                    "text-xs font-medium px-2 py-0.5 rounded-full",
                    index === 0 ? "bg-cockpit-accent/10 text-cockpit-accent" :
                    index === data.length - 1 ? "bg-cockpit-success/10 text-cockpit-success" :
                    "bg-cockpit-muted/10 text-cockpit-muted"
                  )}>
                    {stage.percentage.toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative h-8 bg-cockpit-muted/10 rounded-lg overflow-hidden">
                {/* Glass effect background */}
                <div className="absolute inset-0 backdrop-blur-sm" />
                
                {/* Progress fill */}
                <div 
                  className={cn(
                    "absolute inset-y-0 left-0 rounded-lg transition-all duration-1000 ease-out",
                    "group-hover:brightness-110"
                  )}
                  style={{
                    width: `${widthPercentage}%`,
                    background: stage.color,
                    boxShadow: `0 0 20px ${stage.color}40`
                  }}
                >
                  {/* Inner shine */}
                  <div 
                    className="absolute inset-0 rounded-lg"
                    style={{
                      background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)'
                    }}
                  />
                </div>

                {/* Connecting arrow between stages */}
                {index < data.length - 1 && (
                  <div 
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0"
                    style={{
                      borderTop: '12px solid transparent',
                      borderBottom: '12px solid transparent',
                      borderLeft: `12px solid ${stage.color}60`
                    }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Stats */}
      <div className="px-5 py-4 bg-gradient-to-r from-cockpit-accent/5 to-transparent border-t border-cockpit-border">
        <div className="flex items-center justify-between">
          <span className="text-xs text-cockpit-muted">Taxa de conversão geral</span>
          <span className="text-sm font-bold text-cockpit-success">
            {data.length >= 2 
              ? `${((data[data.length - 1]?.value || 0) / (data[0]?.value || 1) * 100).toFixed(1)}%`
              : '0%'
            }
          </span>
        </div>
      </div>
    </div>
  );
};
