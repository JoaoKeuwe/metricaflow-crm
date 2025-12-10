import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Target, TrendingUp, TrendingDown } from "lucide-react";

interface GoalGaugeProps {
  goal: number;
  achieved: number;
  title?: string;
  subtitle?: string;
}

export const GoalGauge = ({ 
  goal, 
  achieved, 
  title = "Meta vs Realizado",
  subtitle = "Progresso mensal"
}: GoalGaugeProps) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  const [animatedAchieved, setAnimatedAchieved] = useState(0);
  
  const percentage = goal > 0 ? Math.min((achieved / goal) * 100, 150) : 0;
  const gap = goal - achieved;
  const isOnTrack = percentage >= 70;
  const isExceeding = percentage >= 100;

  useEffect(() => {
    const duration = 1500;
    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      
      setAnimatedValue(percentage * easeOutQuart);
      setAnimatedAchieved(achieved * easeOutQuart);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [percentage, achieved]);

  // SVG gauge parameters
  const size = 200;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * Math.PI; // Half circle
  const offset = circumference - (animatedValue / 100) * circumference;

  // Get color based on percentage
  const getGaugeColor = () => {
    if (isExceeding) return "hsl(142 70% 45%)"; // Success green
    if (isOnTrack) return "hsl(229 92% 62%)"; // Primary blue
    if (percentage >= 50) return "hsl(38 90% 50%)"; // Warning yellow
    return "hsl(0 75% 55%)"; // Danger red
  };

  const getStatusLabel = () => {
    if (isExceeding) return { text: "Meta Batida! 🎉", color: "text-success" };
    if (isOnTrack) return { text: "No Caminho", color: "text-primary" };
    if (percentage >= 50) return { text: "Atenção", color: "text-warning" };
    return { text: "Crítico", color: "text-destructive" };
  };

  const status = getStatusLabel();

  return (
    <div className="relative rounded-2xl bg-card border border-border overflow-hidden shadow-lg">
      {/* Top accent line */}
      <div 
        className="absolute top-0 left-0 right-0 h-1"
        style={{ background: `linear-gradient(to right, ${getGaugeColor()}, hsl(270 70% 68%))` }}
      />
      
      {/* Corner glow */}
      <div 
        className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-30 blur-3xl pointer-events-none"
        style={{ background: getGaugeColor() }}
      />

      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <div className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold",
            isOnTrack ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
          )}>
            {isOnTrack ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            <span>{status.text}</span>
          </div>
        </div>

        {/* Gauge */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <svg 
              width={size} 
              height={size / 2 + 20} 
              viewBox={`0 0 ${size} ${size / 2 + 20}`}
              className="transform -rotate-0"
            >
              {/* Background arc */}
              <path
                d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
              />
              
              {/* Progress arc */}
              <path
                d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
                fill="none"
                stroke={getGaugeColor()}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className="transition-all duration-300"
                style={{
                  filter: `drop-shadow(0 0 8px ${getGaugeColor()})`
                }}
              />

              {/* Tick marks */}
              {[0, 25, 50, 75, 100].map((tick, i) => {
                const angle = (tick / 100) * 180 - 180;
                const rad = (angle * Math.PI) / 180;
                const x1 = size / 2 + (radius - 20) * Math.cos(rad);
                const y1 = size / 2 + (radius - 20) * Math.sin(rad);
                const x2 = size / 2 + (radius - 8) * Math.cos(rad);
                const y2 = size / 2 + (radius - 8) * Math.sin(rad);
                
                return (
                  <line
                    key={tick}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth={2}
                    opacity={0.4}
                  />
                );
              })}
            </svg>

            {/* Center value */}
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
              <span 
                className="text-4xl font-bold tracking-tight"
                style={{ color: getGaugeColor() }}
              >
                {animatedValue.toFixed(0)}%
              </span>
              <span className="text-xs text-muted-foreground mt-1">
                da meta
              </span>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-border">
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Meta</p>
            <p className="text-lg font-bold text-foreground">
              R$ {goal.toLocaleString('pt-BR')}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Realizado</p>
            <p className="text-lg font-bold text-success">
              R$ {Math.round(animatedAchieved).toLocaleString('pt-BR')}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Gap</p>
            <p className={cn(
              "text-lg font-bold",
              gap > 0 ? "text-warning" : "text-success"
            )}>
              {gap > 0 ? `-R$ ${gap.toLocaleString('pt-BR')}` : "✓"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
