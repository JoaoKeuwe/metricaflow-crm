import { Progress } from "@/components/ui/progress";
import { TrendingUp, Target, Users, Calendar, AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TeamGoalProgressCardProps {
  totalGoal: number;
  totalAchieved: number;
  teamSize: number;
  daysRemaining: number;
}

export const TeamGoalProgressCard = ({
  totalGoal,
  totalAchieved,
  teamSize,
  daysRemaining,
}: TeamGoalProgressCardProps) => {
  const percentage = totalGoal > 0 ? (totalAchieved / totalGoal) * 100 : 0;
  const gap = Math.max(totalGoal - totalAchieved, 0);
  const dailyNeeded = daysRemaining > 0 ? gap / daysRemaining : 0;
  const isOnTrack = percentage >= (100 - (daysRemaining / 30) * 100) + 10;

  const getStatusColor = () => {
    if (percentage >= 100) return "hsl(142 70% 45%)";
    if (percentage >= 70) return "hsl(229 92% 62%)";
    if (percentage >= 50) return "hsl(38 90% 50%)";
    return "hsl(0 75% 55%)";
  };

  const getStatusLabel = () => {
    if (percentage >= 100) return { text: "Meta Batida!", icon: CheckCircle, color: "text-success bg-success/10" };
    if (isOnTrack) return { text: "No Caminho", icon: TrendingUp, color: "text-primary bg-primary/10" };
    return { text: "Atenção Necessária", icon: AlertTriangle, color: "text-warning bg-warning/10" };
  };

  const status = getStatusLabel();
  const StatusIcon = status.icon;

  return (
    <div className="relative rounded-2xl bg-card border border-border overflow-hidden shadow-lg">
      {/* Top accent line */}
      <div 
        className="absolute top-0 left-0 right-0 h-1"
        style={{ background: `linear-gradient(to right, ${getStatusColor()}, hsl(270 70% 68%))` }}
      />
      
      {/* Corner glow */}
      <div 
        className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: getStatusColor() }}
      />

      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Meta Coletiva do Time</h3>
              <p className="text-xs text-muted-foreground">Progresso mensal consolidado</p>
            </div>
          </div>
          <div className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold",
            status.color
          )}>
            <StatusIcon className="h-3 w-3" />
            <span>{status.text}</span>
          </div>
        </div>

        {/* Main Progress */}
        <div className="mb-6">
          <div className="flex items-end justify-between mb-2">
            <span className="text-3xl font-bold" style={{ color: getStatusColor() }}>
              {percentage.toFixed(0)}%
            </span>
            <span className="text-sm text-muted-foreground">
              R$ {totalAchieved.toLocaleString('pt-BR')} de R$ {totalGoal.toLocaleString('pt-BR')}
            </span>
          </div>
          <Progress 
            value={Math.min(percentage, 100)} 
            className="h-3"
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4 pt-4 border-t border-border">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Target className="h-3 w-3" />
              <span className="text-xs">Meta</span>
            </div>
            <p className="text-sm font-bold text-foreground">
              R$ {(totalGoal / 1000).toFixed(0)}k
            </p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Users className="h-3 w-3" />
              <span className="text-xs">Time</span>
            </div>
            <p className="text-sm font-bold text-foreground">
              {teamSize} vendedores
            </p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Calendar className="h-3 w-3" />
              <span className="text-xs">Restam</span>
            </div>
            <p className="text-sm font-bold text-foreground">
              {daysRemaining} dias
            </p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <TrendingUp className="h-3 w-3" />
              <span className="text-xs">Diário</span>
            </div>
            <p className={cn(
              "text-sm font-bold",
              dailyNeeded > 5000 ? "text-warning" : "text-success"
            )}>
              R$ {dailyNeeded.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        {/* Gap Warning */}
        {gap > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-warning/5 border border-warning/20">
            <p className="text-xs text-warning">
              ⚠️ Faltam <span className="font-bold">R$ {gap.toLocaleString('pt-BR')}</span> para bater a meta. 
              Velocidade necessária: <span className="font-bold">R$ {dailyNeeded.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}/dia</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
