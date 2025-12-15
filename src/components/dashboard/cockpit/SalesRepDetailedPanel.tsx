import { Trophy, TrendingUp, TrendingDown, Target, Clock, MessageSquare, Calendar, CheckSquare, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface SalesRepData {
  id: string;
  name: string;
  avatar?: string;
  leads: number;
  convertedLeads: number;
  conversionRate: number;
  revenue: number;
  averageTicket: number;
  avgCloseTime: number;
  meetings: number;
  tasks: number;
  observations: number;
  goalProgress?: number;
  trend?: number;
}

interface SalesRepDetailedPanelProps {
  data: SalesRepData[];
  title?: string;
}

export const SalesRepDetailedPanel = ({ 
  data, 
  title = "Performance Detalhada do Time" 
}: SalesRepDetailedPanelProps) => {
  const sortedData = [...data].sort((a, b) => b.revenue - a.revenue);
  const maxRevenue = sortedData.length > 0 ? sortedData[0].revenue : 0;

  const getMedalStyle = (index: number) => {
    if (index === 0) return {
      bg: "bg-gradient-to-br from-amber-400 to-amber-600",
      text: "text-amber-900",
      ring: "ring-2 ring-amber-300"
    };
    if (index === 1) return {
      bg: "bg-gradient-to-br from-slate-300 to-slate-400",
      text: "text-slate-700",
      ring: "ring-2 ring-slate-200"
    };
    if (index === 2) return {
      bg: "bg-gradient-to-br from-orange-400 to-orange-600",
      text: "text-orange-900",
      ring: "ring-2 ring-orange-300"
    };
    return {
      bg: "bg-muted",
      text: "text-muted-foreground",
      ring: ""
    };
  };

  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl bg-card border border-border overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          </div>
        </div>
        <div className="p-8 text-center text-muted-foreground">
          <p className="text-sm">Nenhum dado de equipe disponível</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-primary/10">
            <Trophy className="h-4 w-4 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground tracking-wide">
            {title}
          </h3>
        </div>
        <span className="text-xs text-muted-foreground">
          {sortedData.length} vendedores
        </span>
      </div>

      {/* Column Headers */}
      <div className="px-5 py-2 bg-muted/50 border-b border-border">
        <div className="grid grid-cols-12 gap-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          <div className="col-span-1">#</div>
          <div className="col-span-2">Vendedor</div>
          <div className="col-span-1 text-center">Leads</div>
          <div className="col-span-1 text-center">Conv.</div>
          <div className="col-span-2 text-center">Receita</div>
          <div className="col-span-1 text-center">Ticket</div>
          <div className="col-span-1 text-center">Ciclo</div>
          <div className="col-span-1 text-center">Reun.</div>
          <div className="col-span-1 text-center">Taref.</div>
          <div className="col-span-1 text-center">Obs.</div>
        </div>
      </div>

      {/* Members List - Show ALL */}
      <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
        {sortedData.map((member, index) => {
          const progressWidth = maxRevenue > 0 ? (member.revenue / maxRevenue) * 100 : 0;
          const medal = getMedalStyle(index);
          
          return (
            <div 
              key={member.id}
              className="px-5 py-4 hover:bg-muted/30 transition-colors group"
            >
              <div className="grid grid-cols-12 gap-2 items-center">
                {/* Rank */}
                <div className="col-span-1">
                  <div className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
                    medal.bg, medal.text, medal.ring
                  )}>
                    {index + 1}
                  </div>
                </div>

                {/* Avatar + Name */}
                <div className="col-span-2 flex items-center gap-2">
                  <Avatar className="h-8 w-8 border-2 border-border">
                    <AvatarImage src={member.avatar} alt={member.name} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {member.name.split(' ').slice(0, 2).join(' ')}
                    </p>
                    {member.trend !== undefined && (
                      <span className={cn(
                        "flex items-center gap-0.5 text-[10px] font-medium",
                        member.trend >= 0 ? "text-success" : "text-destructive"
                      )}>
                        {member.trend >= 0 ? (
                          <TrendingUp className="h-2.5 w-2.5" />
                        ) : (
                          <TrendingDown className="h-2.5 w-2.5" />
                        )}
                        {Math.abs(member.trend)}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Leads */}
                <div className="col-span-1 text-center">
                  <span className="text-sm font-medium text-foreground">
                    {member.leads}
                  </span>
                  <span className="text-xs text-muted-foreground ml-0.5">
                    /{member.convertedLeads}
                  </span>
                </div>

                {/* Conversion Rate */}
                <div className="col-span-1 text-center">
                  <Badge 
                    variant="outline"
                    className={cn(
                      "text-xs font-bold",
                      member.conversionRate >= 20 
                        ? "border-success/50 bg-success/10 text-success" 
                        : member.conversionRate >= 10 
                        ? "border-warning/50 bg-warning/10 text-warning"
                        : "border-destructive/50 bg-destructive/10 text-destructive"
                    )}
                  >
                    {member.conversionRate.toFixed(0)}%
                  </Badge>
                </div>

                {/* Revenue with progress bar */}
                <div className="col-span-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-bold text-foreground">
                      R$ {(member.revenue / 1000).toFixed(1)}k
                    </span>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-700"
                        style={{ width: `${progressWidth}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Average Ticket */}
                <div className="col-span-1 text-center">
                  <span className="text-xs font-medium text-foreground">
                    R$ {(member.averageTicket / 1000).toFixed(1)}k
                  </span>
                </div>

                {/* Avg Close Time */}
                <div className="col-span-1 text-center">
                  <span className={cn(
                    "text-xs font-medium",
                    member.avgCloseTime <= 10 ? "text-success" : 
                    member.avgCloseTime <= 20 ? "text-warning" : "text-destructive"
                  )}>
                    {member.avgCloseTime}d
                  </span>
                </div>

                {/* Meetings */}
                <div className="col-span-1 text-center">
                  <span className="text-xs font-medium text-foreground">
                    {member.meetings}
                  </span>
                </div>

                {/* Tasks */}
                <div className="col-span-1 text-center">
                  <span className="text-xs font-medium text-foreground">
                    {member.tasks}
                  </span>
                </div>

                {/* Observations */}
                <div className="col-span-1 text-center">
                  <span className="text-xs font-medium text-foreground">
                    {member.observations}
                  </span>
                </div>
              </div>

              {/* Goal Progress (if available) */}
              {member.goalProgress !== undefined && (
                <div className="mt-3 pt-3 border-t border-border/50">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      Meta do mês
                    </span>
                    <span className={cn(
                      "font-medium",
                      member.goalProgress >= 100 ? "text-success" :
                      member.goalProgress >= 70 ? "text-primary" : "text-warning"
                    )}>
                      {member.goalProgress.toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={Math.min(member.goalProgress, 100)} className="h-1.5" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
